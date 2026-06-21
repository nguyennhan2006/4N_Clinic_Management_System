import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExaminationStatus, VisitStatus } from '@prisma/client';

import { ExaminationsService } from './examinations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

/**
 * White-box unit test cho ExaminationsService.
 *
 * Phương pháp:
 *  - Đọc trực tiếp source (examinations.service.ts) để xác định từng nhánh
 *    điều kiện cần test, kể cả nhánh guard trước và trong transaction.
 *  - $transaction được giả lập: callback nhận chính prisma mock làm "tx".
 *  - Tách riêng describe cho từng method để dễ đọc và maintain.
 *
 * UC coverage:
 *  UC-10 update (lập phiếu khám + diagnoses)
 *  UC-12 createPrescription / upsertPrescription / deletePrescription
 *  UC-13 complete (hoàn tất phiếu khám)
 */
describe('ExaminationsService (unit, white-box)', () => {
  let service: ExaminationsService;
  let prisma: {
    examination: {
      findUnique: jest.Mock;
      update: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    disease: { findMany: jest.Mock };
    diagnosis: { deleteMany: jest.Mock; createMany: jest.Mock };
    drug: { findMany: jest.Mock };
    prescription: { create: jest.Mock; delete: jest.Mock };
    serviceOrder: { count: jest.Mock };
    visit: { update: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };

  beforeEach(async () => {
    prisma = {
      examination: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      disease: { findMany: jest.fn() },
      diagnosis: { deleteMany: jest.fn(), createMany: jest.fn() },
      drug: { findMany: jest.fn() },
      prescription: { create: jest.fn(), delete: jest.fn() },
      serviceOrder: { count: jest.fn() },
      visit: { update: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
    };

    audit = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExaminationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<ExaminationsService>(ExaminationsService);
  });

  // ─── update — UC-10 ────────────────────────────────────────────────────────

  describe('update (UC-10)', () => {
    const id = 'exam-1';

    it('404 khi examination không tồn tại', async () => {
      prisma.examination.findUnique.mockResolvedValue(null);

      await expect(
        service.update(id, { symptoms: 'ho' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('400 khi cố sửa examination COMPLETED', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.COMPLETED,
      });

      await expect(
        service.update(id, { symptoms: 'ho' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('400 khi cố sửa examination CANCELLED', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.CANCELLED,
      });

      await expect(
        service.update(id, { symptoms: 'ho' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('400 khi có hơn 1 primary diagnosis', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
      });

      await expect(
        service.update(id, {
          diagnoses: [
            { diseaseId: 'd1', isPrimary: true },
            { diseaseId: 'd2', isPrimary: true },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('400 khi disease không active hoặc không tồn tại', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
      });
      // Chỉ trả về 1 trong khi request 2 → một cái inactive
      prisma.disease.findMany.mockResolvedValue([
        { id: 'd1', name: 'Benh A', isActive: true },
      ]);

      await expect(
        service.update(id, {
          diagnoses: [
            { diseaseId: 'd1', isPrimary: true },
            { diseaseId: 'd2', isPrimary: false },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cập nhật thành công với diagnosis hợp lệ', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
      });
      prisma.disease.findMany.mockResolvedValue([
        { id: 'd1', name: 'Viem hong', isActive: true },
      ]);
      prisma.examination.update.mockResolvedValue({});
      prisma.diagnosis.deleteMany.mockResolvedValue({ count: 0 });
      prisma.diagnosis.createMany.mockResolvedValue({ count: 1 });
      const expected = {
        id,
        status: ExaminationStatus.IN_PROGRESS,
        diagnoses: [{ id: 'diag-1', name: 'Viem hong', isPrimary: true }],
      };
      prisma.examination.findUniqueOrThrow.mockResolvedValue(expected);

      const result = await service.update(id, {
        symptoms: 'dau hong',
        diagnoses: [{ diseaseId: 'd1', isPrimary: true }],
      });

      expect(prisma.diagnosis.deleteMany).toHaveBeenCalledWith({
        where: { examinationId: id },
      });
      expect(prisma.diagnosis.createMany).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it('cập nhật chỉ symptoms (không truyền diagnoses) không xóa diagnoses', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
      });
      prisma.examination.update.mockResolvedValue({});
      prisma.examination.findUniqueOrThrow.mockResolvedValue({ id });

      await service.update(id, { symptoms: 'ho' });

      // diagnoses undefined → không gọi deleteMany
      expect(prisma.diagnosis.deleteMany).not.toHaveBeenCalled();
    });
  });

  // ─── createPrescription — UC-12 ────────────────────────────────────────────

  describe('createPrescription (UC-12)', () => {
    const id = 'exam-1';

    it('404 khi examination không tồn tại', async () => {
      prisma.examination.findUnique.mockResolvedValue(null);

      await expect(
        service.createPrescription(id, {
          items: [{ drugId: 'd1', quantity: 1, dosage: '1 vien/ngay' }],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('400 khi examination đã COMPLETED', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.COMPLETED,
        prescription: null,
      });

      await expect(
        service.createPrescription(id, {
          items: [{ drugId: 'd1', quantity: 1, dosage: '1 vien/ngay' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('400 khi prescription đã tồn tại', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
        prescription: { id: 'rx-1' },
      });

      await expect(
        service.createPrescription(id, {
          items: [{ drugId: 'd1', quantity: 1, dosage: '1 vien/ngay' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('400 khi items rỗng', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
        prescription: null,
      });

      await expect(
        service.createPrescription(id, { items: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('400 khi drug không active hoặc không tồn tại', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
        prescription: null,
      });
      prisma.drug.findMany.mockResolvedValue([]); // 0 drug found vs 1 requested

      await expect(
        service.createPrescription(id, {
          items: [{ drugId: 'bad-drug', quantity: 1, dosage: '1/ngay' }],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('tạo prescription thành công với price snapshot', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
        prescription: null,
      });
      prisma.drug.findMany.mockResolvedValue([
        { id: 'd1', name: 'Paracetamol', price: '5000', isActive: true },
      ]);
      const createdPrescription = {
        id: 'rx-new',
        examinationId: id,
        items: [
          {
            id: 'item-1',
            drugId: 'd1',
            quantity: 2,
            unitPrice: 5000,
            lineTotal: 10000,
          },
        ],
      };
      prisma.prescription.create.mockResolvedValue(createdPrescription);

      const result = await service.createPrescription(id, {
        items: [{ drugId: 'd1', quantity: 2, dosage: '2 vien/ngay' }],
      });

      expect(prisma.prescription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            examinationId: id,
            items: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  drugId: 'd1',
                  quantity: 2,
                  unitPrice: 5000,
                  lineTotal: 10000,
                }),
              ]),
            },
          }),
        }),
      );
      expect(result).toEqual(createdPrescription);
    });
  });

  // ─── deletePrescription — UC-12 ────────────────────────────────────────────

  describe('deletePrescription (UC-12)', () => {
    const id = 'exam-1';

    it('404 khi examination không tồn tại', async () => {
      prisma.examination.findUnique.mockResolvedValue(null);

      await expect(service.deletePrescription(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('400 khi examination COMPLETED', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.COMPLETED,
        prescription: { id: 'rx-1' },
      });

      await expect(service.deletePrescription(id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('idempotent khi không có prescription', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
        prescription: null,
      });

      // Không throw, không gọi delete
      await expect(service.deletePrescription(id)).resolves.toBeUndefined();
      expect(prisma.prescription.delete).not.toHaveBeenCalled();
    });

    it('xóa prescription thành công', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
        prescription: { id: 'rx-1' },
      });
      prisma.prescription.delete.mockResolvedValue({ id: 'rx-1' });

      await service.deletePrescription(id);

      expect(prisma.prescription.delete).toHaveBeenCalledWith({
        where: { examinationId: id },
      });
    });
  });

  // ─── complete — UC-13 ──────────────────────────────────────────────────────

  describe('complete (UC-13)', () => {
    const id = 'exam-1';
    const actorId = 'doctor-1';

    it('404 khi examination không tồn tại', async () => {
      prisma.examination.findUnique.mockResolvedValue(null);

      await expect(service.complete(id, actorId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('400 khi examination đã CANCELLED', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.CANCELLED,
        diagnoses: [],
        visitId: 'v1',
        symptoms: 'ho',
        conclusion: 'binh',
      });

      await expect(service.complete(id, actorId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('400 khi thiếu symptoms hoặc conclusion', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
        diagnoses: [{ id: 'd1', isPrimary: true }],
        visitId: 'v1',
        symptoms: null,    // thiếu
        conclusion: null,  // thiếu
      });

      await expect(service.complete(id, actorId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('400 khi thiếu primary diagnosis', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
        diagnoses: [{ id: 'diag-1', isPrimary: false }], // không có primary
        visitId: 'v1',
        symptoms: 'ho',
        conclusion: 'viem hong',
      });
      prisma.serviceOrder.count.mockResolvedValue(0);

      await expect(service.complete(id, actorId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('400 khi còn required service order chưa hoàn tất (BR-LAB-05)', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
        diagnoses: [{ id: 'diag-1', isPrimary: true }],
        visitId: 'v1',
        symptoms: 'ho',
        conclusion: 'viem hong',
      });
      prisma.serviceOrder.count.mockResolvedValue(2); // 2 pending required orders

      await expect(service.complete(id, actorId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('idempotent khi examination đã COMPLETED trước đó', async () => {
      const alreadyCompleted = {
        id,
        status: ExaminationStatus.COMPLETED,
        diagnoses: [{ id: 'diag-1', isPrimary: true }],
        visitId: 'v1',
        symptoms: 'ho',
        conclusion: 'viem hong',
        completedAt: new Date(),
      };
      prisma.examination.findUnique.mockResolvedValue(alreadyCompleted);

      const result = await service.complete(id, actorId);

      // Trả về examination hiện tại mà không gọi update
      expect(prisma.examination.update).not.toHaveBeenCalled();
      expect(result).toEqual(alreadyCompleted);
    });

    it('hoàn tất thành công → COMPLETED + visit COMPLETED', async () => {
      prisma.examination.findUnique.mockResolvedValue({
        id,
        status: ExaminationStatus.IN_PROGRESS,
        diagnoses: [{ id: 'diag-1', isPrimary: true }],
        visitId: 'visit-1',
        symptoms: 'ho, sot',
        conclusion: 'viem hong cap',
      });
      prisma.serviceOrder.count.mockResolvedValue(0);

      const completedExam = {
        id,
        status: ExaminationStatus.COMPLETED,
        visitId: 'visit-1',
        completedAt: new Date(),
        diagnoses: [{ id: 'diag-1', isPrimary: true }],
        prescription: null,
      };
      prisma.examination.update.mockResolvedValue(completedExam);
      prisma.visit.update.mockResolvedValue({
        id: 'visit-1',
        status: VisitStatus.COMPLETED,
      });

      const result = await service.complete(id, actorId);

      expect(prisma.examination.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ExaminationStatus.COMPLETED,
            completedAt: expect.any(Date),
          }),
        }),
      );
      expect(prisma.visit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'visit-1' },
          data: { status: VisitStatus.COMPLETED },
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COMPLETE_EXAMINATION' }),
      );
      expect(result.status).toBe(ExaminationStatus.COMPLETED);
    });
  });
});
