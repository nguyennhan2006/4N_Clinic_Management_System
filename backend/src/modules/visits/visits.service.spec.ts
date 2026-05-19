import { ConflictException, NotFoundException } from '@nestjs/common';
import { VisitStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { VisitsService } from './visits.service';

// ──────────────────────────────────────────────
// Mock types
// ──────────────────────────────────────────────

type MockVisit = {
  findFirst: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
};

type MockPrisma = {
  patient: { findUnique: jest.Mock };
  visit: MockVisit;
  regulationVersion: { findFirst: jest.Mock };
  examination: { create: jest.Mock };
  $transaction: jest.Mock;
};

const makePrisma = (): MockPrisma => ({
  patient: { findUnique: jest.fn() },
  visit: {
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  regulationVersion: { findFirst: jest.fn() },
  examination: { create: jest.fn() },
  $transaction: jest.fn(),
});

// Chạy callback transaction với cùng mock prisma làm tx (pragmatic unit test pattern)
const setupTransaction = (p: MockPrisma) => {
  p.$transaction.mockImplementation(
    async (fn: (tx: MockPrisma) => Promise<unknown>) => fn(p),
  );
};

// Visit mẫu trả về từ create
const buildMockVisit = (overrides: Partial<{ queueNumber: number }> = {}) => ({
  id: 'visit-uuid-1',
  patientId: 'patient-uuid-1',
  visitDate: new Date('2026-05-18T00:00:00.000Z'),
  queueNumber: overrides.queueNumber ?? 1,
  reason: 'Đau đầu',
  status: VisitStatus.WAITING,
  createdByUserId: 'user-uuid-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  patient: {
    id: 'patient-uuid-1',
    patientCode: 'BN-000001',
    fullName: 'Nguyen Van A',
    phone: '0901234567',
    dob: null,
  },
});

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────

describe('VisitsService — UC-06 create', () => {
  let service: VisitsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [VisitsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(VisitsService);
  });

  // VIS-001: tiếp nhận thành công → trả visit với queueNumber và allowedActions
  it('VIS-001: receive patient success — returns visit with queueNumber and allowedActions', async () => {
    const mockVisit = buildMockVisit({ queueNumber: 4 });

    prisma.patient.findUnique.mockResolvedValue({
      id: 'patient-uuid-1',
      fullName: 'Nguyen Van A',
    });
    prisma.regulationVersion.findFirst.mockResolvedValue(null); // fallback 40

    setupTransaction(prisma);
    prisma.visit.findFirst
      .mockResolvedValueOnce(null) // duplicateActive check → không có
      .mockResolvedValueOnce({ queueNumber: 3 }); // latestVisit → queue hiện tại là 3
    prisma.visit.count.mockResolvedValue(3); // totalToday < 40
    prisma.visit.create.mockResolvedValue(mockVisit);

    const result = await service.create(
      {
        patientId: 'patient-uuid-1',
        visitDate: '2026-05-18',
        reason: 'Đau đầu',
      },
      'user-uuid-1',
    );

    expect(result.queueNumber).toBe(4);
    expect(result.status).toBe(VisitStatus.WAITING);
    expect(result.allowedActions).toContain('OPEN_EXAMINATION');
    expect(result.allowedActions).toContain('CANCEL_VISIT');
    expect(result.patient.patientCode).toBe('BN-000001');
    expect(prisma.visit.create).toHaveBeenCalledTimes(1);
  });

  // VIS-001 bổ sung: bệnh nhân đầu tiên trong ngày → queueNumber = 1
  it('VIS-001: first patient of the day gets queueNumber 1', async () => {
    type CreateArg = { data: { queueNumber: number } };
    let capturedCreate: CreateArg | undefined;

    const mockVisit = buildMockVisit({ queueNumber: 1 });

    prisma.patient.findUnique.mockResolvedValue({ id: 'patient-uuid-1' });
    prisma.regulationVersion.findFirst.mockResolvedValue(null);

    setupTransaction(prisma);
    prisma.visit.findFirst
      .mockResolvedValueOnce(null) // duplicateActive
      .mockResolvedValueOnce(null); // latestVisit → chưa có visit nào
    prisma.visit.count.mockResolvedValue(0);
    prisma.visit.create.mockImplementation((arg: CreateArg) => {
      capturedCreate = arg;
      return Promise.resolve(mockVisit);
    });

    const result = await service.create(
      { patientId: 'patient-uuid-1' },
      'user-uuid-1',
    );

    expect(capturedCreate?.data.queueNumber).toBe(1);
    expect(result.queueNumber).toBe(1);
  });

  // VIS-002: đã đủ quota ngày → ConflictException
  it('VIS-002: daily quota exceeded throws ConflictException', async () => {
    prisma.patient.findUnique.mockResolvedValue({ id: 'patient-uuid-1' });
    prisma.regulationVersion.findFirst.mockResolvedValue(null); // fallback 40

    setupTransaction(prisma);
    prisma.visit.findFirst.mockResolvedValueOnce(null); // không duplicate
    prisma.visit.count.mockResolvedValue(40); // đúng bằng limit

    await expect(
      service.create({ patientId: 'patient-uuid-1' }, 'user-uuid-1'),
    ).rejects.toThrow(ConflictException);

    expect(prisma.visit.create).not.toHaveBeenCalled();
  });

  // VIS-002 bổ sung: limit lấy từ regulation version khi có
  it('VIS-002: uses regulation limit when active version exists', async () => {
    prisma.patient.findUnique.mockResolvedValue({ id: 'patient-uuid-1' });
    // Regulation version trả limit = 20
    prisma.regulationVersion.findFirst.mockResolvedValue({
      isActive: true,
      items: [{ key: 'MAX_PATIENTS_PER_DAY', value: '20' }],
    });

    setupTransaction(prisma);
    prisma.visit.findFirst.mockResolvedValueOnce(null);
    prisma.visit.count.mockResolvedValue(20); // đúng bằng limit tuỳ chỉnh

    await expect(
      service.create({ patientId: 'patient-uuid-1' }, 'user-uuid-1'),
    ).rejects.toThrow(ConflictException);
  });

  // VIS-003: bệnh nhân đã có visit active hôm nay → ConflictException
  it('VIS-003: duplicate active visit today throws ConflictException', async () => {
    const existingVisit = {
      id: 'existing-visit',
      status: VisitStatus.WAITING,
      patientId: 'patient-uuid-1',
    };

    prisma.patient.findUnique.mockResolvedValue({ id: 'patient-uuid-1' });
    prisma.regulationVersion.findFirst.mockResolvedValue(null);

    setupTransaction(prisma);
    prisma.visit.findFirst.mockResolvedValueOnce(existingVisit); // duplicate active

    await expect(
      service.create({ patientId: 'patient-uuid-1' }, 'user-uuid-1'),
    ).rejects.toThrow(ConflictException);

    // Không đếm quota và không tạo visit mới
    expect(prisma.visit.count).not.toHaveBeenCalled();
    expect(prisma.visit.create).not.toHaveBeenCalled();
  });

  // VIS-003 bổ sung: visit IN_EXAMINATION cũng bị chặn
  it('VIS-003: IN_EXAMINATION visit also blocks re-registration', async () => {
    prisma.patient.findUnique.mockResolvedValue({ id: 'patient-uuid-1' });
    prisma.regulationVersion.findFirst.mockResolvedValue(null);

    setupTransaction(prisma);
    prisma.visit.findFirst.mockResolvedValueOnce({
      id: 'existing-visit',
      status: VisitStatus.IN_EXAMINATION,
    });

    await expect(
      service.create({ patientId: 'patient-uuid-1' }, 'user-uuid-1'),
    ).rejects.toThrow(ConflictException);
  });

  // Patient không tồn tại → NotFoundException trước khi vào transaction
  it('throws NotFoundException when patient does not exist', async () => {
    prisma.patient.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ patientId: 'ghost-id' }, 'user-uuid-1'),
    ).rejects.toThrow(NotFoundException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
