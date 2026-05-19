/**
 * Controller integration tests — UC-04, UC-05
 *
 * Approach: NestJS TestingModule + Supertest + mocked PrismaService.
 * Guards are overridden (JwtAuthGuard sets req.user, RolesGuard always passes).
 * ValidationPipe and PrismaExceptionFilter are applied manually as in main.ts.
 *
 * Limitation: No real DB. Business logic tested via service unit tests
 * (patients.service.spec.ts). These tests cover HTTP status codes and response shape.
 */

import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { APP_API_PREFIX } from '../../common/constants/app.constants';
import { PrismaExceptionFilter } from '../../common/filters/prisma-exception.filter';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockJwtGuard: CanActivate = {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user: unknown }>();
    req.user = {
      sub: 'test-user-id',
      email: 'test@clinic.local',
      role: 'RECEPTIONIST',
    };
    return true;
  },
};
const mockRolesGuard: CanActivate = { canActivate: () => true };

type MockPatientRepo = {
  count: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
};

type MockPrisma = { patient: MockPatientRepo; $transaction: jest.Mock };

const buildMockPrisma = (): MockPrisma => ({
  patient: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest
    .fn()
    .mockImplementation(
      async (fn: (tx: MockPrisma) => Promise<unknown>, _opts?: unknown) =>
        fn({ patient: {} } as MockPrisma),
    ),
});

const MOCK_PATIENT = {
  id: 'patient-uuid-1',
  patientCode: 'BN-000001',
  fullName: 'Nguyen Van Test',
  dob: null as null,
  gender: null as null,
  phone: '0901234567',
  citizenId: null as null,
  address: null as null,
  createdAt: new Date('2026-05-18T00:00:00.000Z'),
  updatedAt: new Date('2026-05-18T00:00:00.000Z'),
};

async function buildApp(prisma: MockPrisma): Promise<INestApplication<App>> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [PatientsController],
    providers: [PatientsService, { provide: PrismaService, useValue: prisma }],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue(mockJwtGuard)
    .overrideGuard(RolesGuard)
    .useValue(mockRolesGuard)
    .compile();

  const app = module.createNestApplication<INestApplication<App>>();
  app.setGlobalPrefix(APP_API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.init();
  return app;
}

// ── UC-04: GET /patients ──────────────────────────────────────────────────────

describe('PatientsController — UC-04 GET /patients', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    // $transaction runs callback with prisma as tx
    prisma.$transaction.mockImplementation(
      async (fn: (tx: MockPrisma) => Promise<unknown>) => fn(prisma),
    );
    app = await buildApp(prisma);
  });

  afterEach(() => app.close());

  // PAT-001
  it('PAT-001: no result returns 200 with data [] and meta', async () => {
    prisma.patient.count.mockResolvedValue(0);
    prisma.patient.findMany.mockResolvedValue([]);

    const res = await request(app.getHttpServer())
      .get(`/${APP_API_PREFIX}/patients`)
      .expect(200);

    expect(res.body).toMatchObject({
      data: [],
      meta: { total: 0, page: 1, limit: 20 },
    });
  });

  // PAT-002
  it('PAT-002: keyword match returns all matching patients', async () => {
    const patients = [
      {
        ...MOCK_PATIENT,
        id: 'p1',
        patientCode: 'BN-000001',
        fullName: 'Nguyen Van A',
        phone: null,
      },
      {
        ...MOCK_PATIENT,
        id: 'p2',
        patientCode: 'BN-000002',
        fullName: 'Nguyen Van A',
        phone: null,
      },
    ];
    prisma.patient.count.mockResolvedValue(2);
    prisma.patient.findMany.mockResolvedValue(patients);

    const res = await request(app.getHttpServer())
      .get(`/${APP_API_PREFIX}/patients?keyword=Nguyen+Van+A`)
      .expect(200);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ total: 2, page: 1, limit: 20 });
    expect(
      (res.body.data as Array<{ fullName: string }>).every(
        (p) => p.fullName === 'Nguyen Van A',
      ),
    ).toBe(true);
  });

  // PAT-003 — phone
  it('PAT-003: phone filter returns matching patient', async () => {
    prisma.patient.count.mockResolvedValue(1);
    prisma.patient.findMany.mockResolvedValue([MOCK_PATIENT]);

    const res = await request(app.getHttpServer())
      .get(`/${APP_API_PREFIX}/patients?phone=0901234567`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect((res.body.data as Array<{ phone: string }>)[0].phone).toBe(
      '0901234567',
    );
    expect(res.body.meta.total).toBe(1);
  });

  // PAT-003 — dob
  it('PAT-003: dob filter returns 200 (date range applied)', async () => {
    prisma.patient.count.mockResolvedValue(1);
    prisma.patient.findMany.mockResolvedValue([
      {
        ...MOCK_PATIENT,
        dob: new Date('1990-05-15T00:00:00.000Z'),
      },
    ]);

    const res = await request(app.getHttpServer())
      .get(`/${APP_API_PREFIX}/patients?dob=1990-05-15`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBe(1);
  });

  // PAT-003 — dob invalid format → 400 from DTO validation
  it('PAT-003: invalid dob format returns 400', async () => {
    const res = await request(app.getHttpServer())
      .get(`/${APP_API_PREFIX}/patients?dob=not-a-date`)
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  // Pagination
  it('page and limit params are applied to response meta', async () => {
    prisma.patient.count.mockResolvedValue(50);
    prisma.patient.findMany.mockResolvedValue([MOCK_PATIENT]);

    const res = await request(app.getHttpServer())
      .get(`/${APP_API_PREFIX}/patients?page=2&limit=10`)
      .expect(200);

    expect(res.body.meta).toMatchObject({ total: 50, page: 2, limit: 10 });
  });
});

// ── UC-05: POST /patients ─────────────────────────────────────────────────────

describe('PatientsController — UC-05 POST /patients', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    prisma.$transaction.mockImplementation(
      async (fn: (tx: MockPrisma) => Promise<unknown>) => fn(prisma),
    );
    app = await buildApp(prisma);
  });

  afterEach(() => app.close());

  // PAT-004
  it('PAT-004: create patient success — 201 with patient and empty warnings', async () => {
    // No citizenId, no phone, no dob → no pre-transaction DB calls
    prisma.patient.findFirst.mockResolvedValue(null); // patientCode inside tx
    prisma.patient.create.mockResolvedValue(MOCK_PATIENT);

    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/patients`)
      .send({ fullName: 'Nguyen Van Test' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: MOCK_PATIENT.id,
      patientCode: 'BN-000001',
      fullName: 'Nguyen Van Test',
    });
    expect(Array.isArray(res.body.warnings)).toBe(true);
    expect(res.body.warnings).toHaveLength(0);
  });

  // PAT-005 — missing required field
  it('PAT-005: missing fullName returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/patients`)
      .send({})
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.error).toBe('Bad Request');
  });

  // PAT-005 — empty string fullName (IsNotEmpty)
  it('PAT-005: empty fullName string returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/patients`)
      .send({ fullName: '' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  // PAT-005 — dob in the future (service-level BadRequestException)
  it('PAT-005: dob in future returns 400', async () => {
    // Service throws before any DB calls
    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/patients`)
      .send({ fullName: 'Test Patient', dob: '2099-01-01' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
    expect(res.body.message).toContain('future');
  });

  // PAT-005 — invalid dob format (DTO validation)
  it('PAT-005: invalid dob format returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/patients`)
      .send({ fullName: 'Test Patient', dob: 'not-a-date' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  // PAT-006
  it('PAT-006: duplicate phone returns 201 with warning in warnings array', async () => {
    const existingPatient = {
      id: 'existing',
      fullName: 'Another Patient',
      phone: '0901234567',
    };

    // call 1: phone duplicate check (checkDuplicateWarnings) → found
    // call 2: patientCode inside transaction → null
    prisma.patient.findFirst
      .mockResolvedValueOnce(existingPatient)
      .mockResolvedValueOnce(null);
    prisma.patient.create.mockResolvedValue({
      ...MOCK_PATIENT,
      id: 'new-patient',
    });

    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/patients`)
      .send({ fullName: 'Nguyen Van Test', phone: '0901234567' })
      .expect(201);

    expect(res.body.warnings).toBeDefined();
    expect(Array.isArray(res.body.warnings)).toBe(true);
    expect(res.body.warnings.length).toBeGreaterThan(0);
    expect(
      (res.body.warnings as string[]).some((w) => w.includes('điện thoại')),
    ).toBe(true);
  });

  // citizenId duplicate → 409 (hard block)
  it('duplicate citizenId returns 409', async () => {
    prisma.patient.findUnique.mockResolvedValue(MOCK_PATIENT); // citizenId already exists

    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/patients`)
      .send({ fullName: 'Test', citizenId: '012345678901' })
      .expect(409);

    expect(res.body.statusCode).toBe(409);
    expect(res.body.message).toContain('citizenId');
  });
});
