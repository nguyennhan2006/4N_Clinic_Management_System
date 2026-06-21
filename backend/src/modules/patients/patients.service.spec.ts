import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { PatientsService } from './patients.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * White-box unit test cho PatientsService.
 *
 * Phương pháp:
 *  - Đọc source patients.service.ts để xác định tất cả nhánh điều kiện:
 *      (1) create: kiểm tra citizenId trùng trước tx, sinh patientCode
 *          bằng tx.patient.count + 1, padStart(6), conflict exception.
 *      (2) findOne: 404 khi không tìm thấy.
 *      (3) getMedicalHistory: 404 khi không tìm thấy, trả đúng cấu trúc.
 *  - $transaction: callback nhận chính prisma mock làm "tx".
 *  - citizenId undefined → bỏ qua bước check trùng (nhánh guard `if dto.citizenId`).
 *
 * UC coverage: UC-04 (tạo hồ sơ), UC-05 (tra cứu), UC-11 (lịch sử khám).
 */
describe('PatientsService (unit, white-box)', () => {
  let service: PatientsService;
  let prisma: {
    patient: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
    };
    visit: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      patient: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      visit: { findMany: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
    };
    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  // ─── create — UC-04 ────────────────────────────────────────────────────────

  describe('create (UC-04)', () => {
    const baseDto = {
      fullName: 'Nguyen Van A',
      dob: '1990-01-01',
      gender: 'MALE' as const,
      phone: '0901234567',
    };

    it('409 khi citizenId đã tồn tại', async () => {
      prisma.patient.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({ ...baseDto, citizenId: '123456789' }, 'actor-1'),
      ).rejects.toBeInstanceOf(ConflictException);

      // Không gọi transaction
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('không kiểm tra citizenId khi undefined', async () => {
      prisma.patient.count.mockResolvedValue(0);
      prisma.patient.create.mockResolvedValue({
        id: 'p1',
        patientCode: 'BN-000001',
        fullName: 'Nguyen Van A',
      });

      await service.create(baseDto, 'actor-1');

      // findUnique không được gọi vì không có citizenId
      expect(prisma.patient.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('sinh patientCode theo format BN-XXXXXX', async () => {
      prisma.patient.findUnique.mockResolvedValue(null); // citizenId không trùng
      prisma.patient.count.mockResolvedValue(42); // 42 patients hiện tại
      prisma.patient.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'p-new', ...data }),
      );

      const result = await service.create(
        { ...baseDto, citizenId: 'CCCD-001' },
        'actor-1',
      );

      // count = 42 → patientCode = BN-000043
      expect(prisma.patient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ patientCode: 'BN-000043' }),
        }),
      );
      expect(result.patientCode).toBe('BN-000043');
    });

    it('patientCode đầu tiên là BN-000001 (count=0)', async () => {
      prisma.patient.count.mockResolvedValue(0);
      prisma.patient.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'p-first', ...data }),
      );

      const result = await service.create(baseDto, 'actor-1');

      expect(result.patientCode).toBe('BN-000001');
    });

    it('audit được gọi sau khi tạo thành công', async () => {
      prisma.patient.count.mockResolvedValue(0);
      prisma.patient.create.mockResolvedValue({
        id: 'p1',
        patientCode: 'BN-000001',
        fullName: 'Nguyen Van A',
      });

      await service.create(baseDto, 'actor-1');

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE_PATIENT',
          entityType: 'Patient',
        }),
      );
    });

    it('dob undefined → không truyền dob vào create', async () => {
      prisma.patient.count.mockResolvedValue(0);
      prisma.patient.create.mockResolvedValue({
        id: 'p1',
        patientCode: 'BN-000001',
        fullName: 'Nguyen Van B',
        dob: null,
      });

      await service.create({ fullName: 'Nguyen Van B' }, 'actor-1');

      expect(prisma.patient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ dob: undefined }),
        }),
      );
    });
  });

  // ─── findOne — UC-05 ───────────────────────────────────────────────────────

  describe('findOne (UC-05)', () => {
    it('404 khi patient không tồn tại', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);

      await expect(service.findOne('not-exist')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('trả về patient kèm visits', async () => {
      const patient = {
        id: 'p1',
        patientCode: 'BN-000001',
        fullName: 'Nguyen Van A',
        visits: [{ id: 'v1', visitDate: new Date('2026-06-13') }],
      };
      prisma.patient.findUnique.mockResolvedValue(patient);

      const result = await service.findOne('p1');

      expect(prisma.patient.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'p1' },
          include: { visits: expect.any(Object) },
        }),
      );
      expect(result).toEqual(patient);
    });
  });

  // ─── getMedicalHistory — UC-11 ─────────────────────────────────────────────

  describe('getMedicalHistory (UC-11)', () => {
    it('404 khi patient không tồn tại', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);

      await expect(service.getMedicalHistory('not-exist')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('trả về lịch sử chỉ gồm visit có examination', async () => {
      const patientInfo = {
        id: 'p1',
        patientCode: 'BN-000001',
        fullName: 'Nguyen Van A',
        dob: new Date('1990-01-01'),
        gender: 'MALE',
        phone: '0901234567',
      };
      prisma.patient.findUnique.mockResolvedValue(patientInfo);

      const historyVisits = [
        {
          id: 'v1',
          visitDate: new Date('2026-06-01'),
          queueNumber: 3,
          status: 'COMPLETED',
          examination: {
            id: 'e1',
            status: 'COMPLETED',
            diagnoses: [{ id: 'd1', name: 'Viem hong', isPrimary: true }],
          },
          invoice: { id: 'inv-1', status: 'PAID', totalAmount: 150000 },
        },
      ];
      prisma.visit.findMany.mockResolvedValue(historyVisits);

      const result = await service.getMedicalHistory('p1');

      // Verify shape
      expect(result).toHaveProperty('patient');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('histories');
      expect(result.histories).toHaveLength(1);

      // Verify chỉ lấy visit có examination (filter `examination: { isNot: null }`)
      expect(prisma.visit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patientId: 'p1',
            examination: { isNot: null },
          }),
        }),
      );
    });

    it('histories rỗng khi chưa có visit với examination', async () => {
      prisma.patient.findUnique.mockResolvedValue({
        id: 'p1',
        patientCode: 'BN-000001',
        fullName: 'New Patient',
        dob: null,
        gender: 'FEMALE',
        phone: null,
      });
      prisma.visit.findMany.mockResolvedValue([]);

      const result = await service.getMedicalHistory('p1');

      expect(result.total).toBe(0);
      expect(result.histories).toHaveLength(0);
    });
  });

  // ─── findAll — UC-04 search ────────────────────────────────────────────────

  describe('findAll', () => {
    it('gọi findMany với OR filter khi có keyword', async () => {
      prisma.patient.findMany.mockResolvedValue([]);

      await service.findAll('Nguyen');

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
          take: 50,
        }),
      );
    });

    it('gọi findMany không có where khi không có keyword', async () => {
      prisma.patient.findMany.mockResolvedValue([]);

      await service.findAll(undefined);

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: undefined,
          take: 50,
        }),
      );
    });
  });
});
