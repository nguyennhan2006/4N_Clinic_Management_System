import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { PatientsService } from './patients.service';

type MockPatient = {
  count: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
};

type MockPrisma = {
  patient: MockPatient;
  $transaction: jest.Mock;
};

const makePrisma = (): MockPrisma => ({
  patient: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
});

describe('PatientsService — UC-04 search', () => {
  let service: PatientsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PatientsService);
  });

  // PAT-001: không tìm thấy kết quả → trả data: []
  it('PAT-001: search no result returns data []', async () => {
    prisma.patient.count.mockResolvedValue(0);
    prisma.patient.findMany.mockResolvedValue([]);

    const query: QueryPatientsDto = {
      keyword: 'nonexistent',
      page: 1,
      limit: 20,
    };
    const result = await service.findAll(query);

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  // PAT-002: nhiều bệnh nhân cùng họ tên → trả đủ danh sách
  it('PAT-002: search multiple same name returns list', async () => {
    const patients = [
      { id: '1', fullName: 'Nguyen Van A', patientCode: 'BN-000001' },
      { id: '2', fullName: 'Nguyen Van A', patientCode: 'BN-000002' },
    ];
    prisma.patient.count.mockResolvedValue(2);
    prisma.patient.findMany.mockResolvedValue(patients);

    const query: QueryPatientsDto = {
      keyword: 'Nguyen Van A',
      page: 1,
      limit: 20,
    };
    const result = await service.findAll(query);

    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
  });

  // PAT-003: tìm theo phone, dob, keyword → trả đúng bệnh nhân
  it('PAT-003: search by phone returns correct patient', async () => {
    type FindManyArg = { where: { phone?: unknown } };
    let capturedArg: FindManyArg | undefined;

    const patient = { id: '3', fullName: 'Tran Thi B', phone: '0901234567' };
    prisma.patient.count.mockResolvedValue(1);
    prisma.patient.findMany.mockImplementation((arg: FindManyArg) => {
      capturedArg = arg;
      return Promise.resolve([patient]);
    });

    const query: QueryPatientsDto = { phone: '0901234567', page: 1, limit: 20 };
    const result = await service.findAll(query);

    expect(result.data).toHaveLength(1);
    expect((result.data[0] as { phone: string }).phone).toBe('0901234567');
    expect(capturedArg?.where.phone).toBeDefined();
  });

  it('PAT-003: search by dob builds correct date range', async () => {
    type FindManyArg = { where: { dob?: { gte: Date; lte: Date } } };
    let capturedArg: FindManyArg | undefined;

    prisma.patient.count.mockResolvedValue(0);
    prisma.patient.findMany.mockImplementation((arg: FindManyArg) => {
      capturedArg = arg;
      return Promise.resolve([]);
    });

    const query: QueryPatientsDto = { dob: '1990-05-15', page: 1, limit: 20 };
    await service.findAll(query);

    expect(capturedArg?.where.dob?.gte).toEqual(
      new Date('1990-05-15T00:00:00.000Z'),
    );
    expect(capturedArg?.where.dob?.lte).toEqual(
      new Date('1990-05-15T23:59:59.999Z'),
    );
  });

  it('PAT-003: search by keyword targets fullName and patientCode', async () => {
    type FindManyArg = {
      where: { OR?: Array<{ fullName?: unknown; patientCode?: unknown }> };
    };
    let capturedArg: FindManyArg | undefined;

    prisma.patient.count.mockResolvedValue(0);
    prisma.patient.findMany.mockImplementation((arg: FindManyArg) => {
      capturedArg = arg;
      return Promise.resolve([]);
    });

    const query: QueryPatientsDto = { keyword: 'BN-000', page: 1, limit: 20 };
    await service.findAll(query);

    const orFields = capturedArg?.where.OR ?? [];
    expect(orFields.some((c) => c.fullName !== undefined)).toBe(true);
    expect(orFields.some((c) => c.patientCode !== undefined)).toBe(true);
  });
});

describe('PatientsService — UC-05 create', () => {
  let service: PatientsService;
  let prisma: MockPrisma;

  // Hàm helper: mock $transaction thực thi callback với cùng mock prisma làm tx
  const setupTransaction = (p: MockPrisma) => {
    p.$transaction.mockImplementation(
      async (fn: (tx: MockPrisma) => Promise<unknown>) => fn(p),
    );
  };

  beforeEach(async () => {
    prisma = makePrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PatientsService);
  });

  // PAT-004: tạo bệnh nhân thành công, không có duplicate
  it('PAT-004: create patient success — returns patient with empty warnings', async () => {
    const mockPatient = {
      id: 'uuid-1',
      patientCode: 'BN-000001',
      fullName: 'Tran Thi C',
      dob: null,
      gender: null,
      phone: null,
      citizenId: null,
      address: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setupTransaction(prisma);
    // Không có citizenId check, không có duplicate check (phone/dob undefined)
    prisma.patient.findFirst.mockResolvedValue(null); // patientCode inside tx
    prisma.patient.create.mockResolvedValue(mockPatient);

    const result = await service.create({ fullName: '  Tran Thi C  ' });

    expect(result.patientCode).toBe('BN-000001');
    expect(result.fullName).toBe('Tran Thi C'); // trimmed inside create data
    expect(result.warnings).toEqual([]);
    expect(prisma.patient.create).toHaveBeenCalledTimes(1);
  });

  // PAT-005: dob là ngày tương lai → BadRequestException
  it('PAT-005: dob in future throws BadRequestException', async () => {
    await expect(
      service.create({ fullName: 'Test', dob: '2099-01-01' }),
    ).rejects.toThrow(BadRequestException);

    // Không có DB call nào
    expect(prisma.patient.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  // PAT-006: phone đã tồn tại → tạo thành công nhưng có warning
  it('PAT-006: duplicate phone returns patient with warning', async () => {
    const existingPatient = {
      id: 'existing',
      fullName: 'Nguyen Van X',
      phone: '0901234567',
    };
    const newPatient = {
      id: 'uuid-2',
      patientCode: 'BN-000002',
      fullName: 'Nguyen Van Y',
      phone: '0901234567',
      dob: null,
      gender: null,
      citizenId: null,
      address: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setupTransaction(prisma);
    // Duplicate check by phone → trả bệnh nhân đã tồn tại
    prisma.patient.findFirst
      .mockResolvedValueOnce(existingPatient) // phone duplicate check
      .mockResolvedValueOnce(null); // patientCode inside tx
    prisma.patient.create.mockResolvedValue(newPatient);

    const result = await service.create({
      fullName: 'Nguyen Van Y',
      phone: '0901234567',
    });

    expect(result.id).toBe('uuid-2');
    expect(result.warnings).toContain(
      'Số điện thoại đã được dùng bởi bệnh nhân khác',
    );
    expect(prisma.patient.create).toHaveBeenCalledTimes(1);
  });
});

describe('PatientsService — findOne', () => {
  let service: PatientsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = makePrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(PatientsService);
  });

  it('throws NotFoundException when patient not found', async () => {
    prisma.patient.findUnique.mockResolvedValue(null);
    await expect(service.findOne('nonexistent-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
