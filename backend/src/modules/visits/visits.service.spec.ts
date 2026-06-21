import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { VisitStatus } from '@prisma/client';

import { VisitsService } from './visits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * White-box unit test cho VisitsService.
 *
 * Phương pháp:
 *  - Kiểm thử từng nhánh logic trong service layer mà không cần DB thật.
 *  - PrismaService và AuditService được mock hoàn toàn bằng jest.fn().
 *  - $transaction được giả lập bằng cách nhận callback và truyền chính
 *    prisma mock làm "tx" — đảm bảo cùng mock set được dùng trong và ngoài tx.
 *  - Mỗi test case độc lập (beforeEach reset mock).
 *  - Test cases dẫn xuất từ đọc source trực tiếp (white-box):
 *      - getMaxPatientsPerDay: fallback khi regulation không tồn tại
 *      - create: 404 patient, duplicate visit, quota exceeded, happy path
 *      - openExamination: doctor inactive, visit not found, exam exists,
 *        wrong status, happy path
 *
 * UC coverage: UC-07 (create visit), UC-09 (open examination).
 */
describe('VisitsService (unit, white-box)', () => {
  let service: VisitsService;
  let prisma: {
    regulationVersion: { findFirst: jest.Mock };
    patient: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    visit: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    examination: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      regulationVersion: { findFirst: jest.fn() },
      patient: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      visit: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      examination: { create: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<VisitsService>(VisitsService);
  });

  // ─── getMaxPatientsPerDay (private, tested indirectly via create) ──────────

  describe('getMaxPatientsPerDay — fallback khi không có regulation', () => {
    it('dùng default 40 khi regulationVersion null', async () => {
      prisma.regulationVersion.findFirst.mockResolvedValue(null);
      prisma.patient.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.visit.findFirst.mockResolvedValue(null); // no duplicate
      prisma.visit.count.mockResolvedValue(39); // 39 visits today < 40
      prisma.visit.create.mockResolvedValue({
        id: 'v1',
        patientId: 'p1',
        visitDate: new Date('2026-06-13'),
        queueNumber: 40,
        status: VisitStatus.WAITING,
        patient: { id: 'p1', patientCode: 'BN-000001', fullName: 'Test' },
      });

      const result = await service.create(
        { patientId: 'p1', visitDate: '2026-06-13' },
        'user1',
      );

      expect(result.queueNumber).toBe(40);
      expect(prisma.visit.count).toHaveBeenCalled();
    });

    it('dùng MAX_PATIENTS_PER_DAY từ regulation khi có', async () => {
      prisma.regulationVersion.findFirst.mockResolvedValue({
        items: [{ key: 'MAX_PATIENTS_PER_DAY', value: '20' }],
      });
      prisma.patient.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.visit.findFirst.mockResolvedValue(null);
      prisma.visit.count.mockResolvedValue(20); // reached limit of 20
      prisma.visit.create.mockResolvedValue({});

      await expect(
        service.create({ patientId: 'p1', visitDate: '2026-06-13' }, 'user1'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.regulationVersion.findFirst).toHaveBeenCalled();
    });
  });

  // ─── create — UC-07 ────────────────────────────────────────────────────────

  describe('create (UC-07)', () => {
    const dto = { patientId: 'patient-1', visitDate: '2026-06-13' };

    beforeEach(() => {
      // Default: regulation không tồn tại (fallback to 40)
      prisma.regulationVersion.findFirst.mockResolvedValue(null);
    });

    it('404 khi patient không tồn tại', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('409 khi patient đã có lượt khám trong ngày', async () => {
      prisma.patient.findUnique.mockResolvedValue({ id: 'patient-1' });
      // findFirst trong transaction trả về duplicate
      prisma.visit.findFirst.mockResolvedValue({ id: 'existing-visit' });

      await expect(service.create(dto, 'u1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      // Transaction được gọi nhưng không tạo visit
      expect(prisma.visit.create).not.toHaveBeenCalled();
    });

    it('409 khi đã đạt giới hạn bệnh nhân trong ngày', async () => {
      prisma.patient.findUnique.mockResolvedValue({ id: 'patient-1' });
      // Không có duplicate
      prisma.visit.findFirst
        .mockResolvedValueOnce(null) // duplicate check → null
        .mockResolvedValueOnce(null); // latest visit for queue number
      prisma.visit.count.mockResolvedValue(40); // đạt giới hạn 40

      await expect(service.create(dto, 'u1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.visit.create).not.toHaveBeenCalled();
    });

    it('tạo thành công với queueNumber = số thứ tự tiếp theo', async () => {
      const createdVisit = {
        id: 'new-visit',
        patientId: 'patient-1',
        visitDate: new Date('2026-06-13'),
        queueNumber: 5,
        status: VisitStatus.WAITING,
        patient: {
          id: 'patient-1',
          patientCode: 'BN-000001',
          fullName: 'Nguyen Van A',
          phone: '0901234567',
          dob: null,
        },
      };

      prisma.patient.findUnique.mockResolvedValue({ id: 'patient-1' });
      prisma.visit.findFirst
        .mockResolvedValueOnce(null) // không trùng ngày
        .mockResolvedValueOnce({ queueNumber: 4 }); // latest queue = 4
      prisma.visit.count.mockResolvedValue(4); // 4 visits today, < 40
      prisma.visit.create.mockResolvedValue(createdVisit);

      const result = await service.create(dto, 'u1');

      expect(prisma.visit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            patientId: 'patient-1',
            status: VisitStatus.WAITING,
            queueNumber: 5,
          }),
        }),
      );
      expect(result.status).toBe(VisitStatus.WAITING);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE_VISIT' }),
      );
    });

    it('queueNumber = 1 khi chưa có lượt khám nào trong ngày', async () => {
      prisma.patient.findUnique.mockResolvedValue({ id: 'patient-1' });
      prisma.visit.findFirst
        .mockResolvedValueOnce(null) // no duplicate
        .mockResolvedValueOnce(null); // no latest visit
      prisma.visit.count.mockResolvedValue(0);
      prisma.visit.create.mockResolvedValue({
        id: 'v-first',
        queueNumber: 1,
        status: VisitStatus.WAITING,
        patient: { id: 'patient-1', patientCode: 'BN-000001', fullName: 'A' },
      });

      const result = await service.create(dto, 'u1');

      // queueNumber = (null?.queueNumber ?? 0) + 1 = 1
      expect(prisma.visit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ queueNumber: 1 }),
        }),
      );
      expect(result.queueNumber).toBe(1);
    });
  });

  // ─── openExamination — UC-09 ──────────────────────────────────────────────

  describe('openExamination (UC-09)', () => {
    const visitId = 'visit-1';
    const doctorId = 'doctor-1';

    it('400 khi tài khoản bác sĩ không active', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: doctorId,
        status: 'INACTIVE',
      });

      await expect(
        service.openExamination(visitId, doctorId),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('404 khi bác sĩ không tìm thấy', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.openExamination(visitId, doctorId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('404 khi visit không tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: doctorId,
        status: 'ACTIVE',
      });
      prisma.visit.findUnique.mockResolvedValue(null);

      await expect(
        service.openExamination(visitId, doctorId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('409 khi examination đã tồn tại cho visit này', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: doctorId,
        status: 'ACTIVE',
      });
      prisma.visit.findUnique.mockResolvedValue({
        id: visitId,
        status: VisitStatus.IN_EXAMINATION,
        examination: { id: 'existing-exam' },
      });

      await expect(
        service.openExamination(visitId, doctorId),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('400 khi visit không ở trạng thái WAITING', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: doctorId,
        status: 'ACTIVE',
      });
      prisma.visit.findUnique.mockResolvedValue({
        id: visitId,
        status: VisitStatus.COMPLETED,
        examination: null,
      });

      await expect(
        service.openExamination(visitId, doctorId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('tạo examination thành công → visit chuyển sang IN_EXAMINATION', async () => {
      const newExam = { id: 'exam-1', visitId };

      prisma.user.findUnique.mockResolvedValue({
        id: doctorId,
        status: 'ACTIVE',
      });
      prisma.visit.findUnique.mockResolvedValue({
        id: visitId,
        status: VisitStatus.WAITING,
        examination: null,
      });
      prisma.examination.create.mockResolvedValue(newExam);
      prisma.visit.update.mockResolvedValue({
        id: visitId,
        status: VisitStatus.IN_EXAMINATION,
      });

      const result = await service.openExamination(visitId, doctorId);

      expect(prisma.examination.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { visitId, doctorUserId: doctorId },
        }),
      );
      expect(prisma.visit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: VisitStatus.IN_EXAMINATION },
        }),
      );
      expect(result).toEqual(newExam);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'OPEN_EXAMINATION' }),
      );
    });
  });
});
