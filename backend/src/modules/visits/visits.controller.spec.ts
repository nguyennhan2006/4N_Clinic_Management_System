/**
 * Controller integration tests — UC-06
 *
 * Same approach as patients.controller.spec.ts:
 * NestJS TestingModule + Supertest + mocked PrismaService + override guards.
 *
 * Limitation: No real DB. Business logic covered by visits.service.spec.ts.
 * These tests verify HTTP status codes and response shape.
 */

import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VisitStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';

import { APP_API_PREFIX } from '../../common/constants/app.constants';
import { PrismaExceptionFilter } from '../../common/filters/prisma-exception.filter';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';

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

type MockVisitRepo = {
  findFirst: jest.Mock;
  count: jest.Mock;
  create: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
};

type MockPrisma = {
  patient: { findUnique: jest.Mock };
  visit: MockVisitRepo;
  regulationVersion: { findFirst: jest.Mock };
  examination: { create: jest.Mock };
  $transaction: jest.Mock;
};

const buildMockPrisma = (): MockPrisma => ({
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

const MOCK_PATIENT = {
  id: 'patient-uuid-1',
  patientCode: 'BN-000001',
  fullName: 'Nguyen Van Test',
  phone: '0901234567',
  dob: null as null,
};

const buildMockVisit = (overrides: Partial<{ queueNumber: number }> = {}) => ({
  id: 'visit-uuid-1',
  patientId: 'patient-uuid-1',
  visitDate: new Date('2026-05-18T00:00:00.000Z'),
  queueNumber: overrides.queueNumber ?? 1,
  reason: 'Đau đầu',
  status: VisitStatus.WAITING,
  createdByUserId: 'test-user-id',
  createdAt: new Date('2026-05-18T08:00:00.000Z'),
  updatedAt: new Date('2026-05-18T08:00:00.000Z'),
  patient: MOCK_PATIENT,
});

async function buildApp(prisma: MockPrisma): Promise<INestApplication<App>> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [VisitsController],
    providers: [VisitsService, { provide: PrismaService, useValue: prisma }],
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

// ── UC-06: POST /visits ───────────────────────────────────────────────────────

describe('VisitsController — UC-06 POST /visits', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = buildMockPrisma();
    // Run transaction callback with prisma as tx
    prisma.$transaction.mockImplementation(
      async (fn: (tx: MockPrisma) => Promise<unknown>) => fn(prisma),
    );
    app = await buildApp(prisma);
  });

  afterEach(() => app.close());

  // VIS-001
  it('VIS-001: create visit success — 201 with queueNumber, status WAITING, allowedActions', async () => {
    const mockVisit = buildMockVisit({ queueNumber: 3 });

    prisma.patient.findUnique.mockResolvedValue(MOCK_PATIENT);
    prisma.regulationVersion.findFirst.mockResolvedValue(null); // fallback 40

    // Transaction calls:
    // 1. visit.findFirst (duplicateActive check) → null
    // 2. visit.count (totalToday) → 2
    // 3. visit.findFirst (latestVisit) → { queueNumber: 2 }
    prisma.visit.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ queueNumber: 2 });
    prisma.visit.count.mockResolvedValue(2);
    prisma.visit.create.mockResolvedValue(mockVisit);

    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({
        patientId: 'patient-uuid-1',
        visitDate: '2026-05-18',
        reason: 'Đau đầu',
      })
      .expect(201);

    expect(res.body.queueNumber).toBe(3);
    expect(res.body.status).toBe('WAITING');
    expect(res.body.allowedActions).toContain('OPEN_EXAMINATION');
    expect(res.body.allowedActions).toContain('CANCEL_VISIT');
    expect(res.body.patient).toMatchObject({ patientCode: 'BN-000001' });
  });

  // VIS-001 — first patient of the day
  it('VIS-001: first patient of day gets queueNumber 1', async () => {
    const mockVisit = buildMockVisit({ queueNumber: 1 });

    prisma.patient.findUnique.mockResolvedValue(MOCK_PATIENT);
    prisma.regulationVersion.findFirst.mockResolvedValue(null);

    prisma.visit.findFirst
      .mockResolvedValueOnce(null) // duplicateActive
      .mockResolvedValueOnce(null); // latestVisit → no visits today
    prisma.visit.count.mockResolvedValue(0);
    prisma.visit.create.mockResolvedValue(mockVisit);

    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({ patientId: 'patient-uuid-1' })
      .expect(201);

    expect(res.body.queueNumber).toBe(1);
  });

  // VIS-002
  it('VIS-002: daily quota exceeded returns 409', async () => {
    prisma.patient.findUnique.mockResolvedValue(MOCK_PATIENT);
    prisma.regulationVersion.findFirst.mockResolvedValue(null); // fallback 40

    prisma.visit.findFirst.mockResolvedValueOnce(null); // no duplicate
    prisma.visit.count.mockResolvedValue(40); // at limit

    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({ patientId: 'patient-uuid-1' })
      .expect(409);

    expect(res.body.statusCode).toBe(409);
    expect(res.body.message).toContain('limit reached');
  });

  // VIS-002 — regulation-based limit
  it('VIS-002: custom regulation limit is respected', async () => {
    prisma.patient.findUnique.mockResolvedValue(MOCK_PATIENT);
    prisma.regulationVersion.findFirst.mockResolvedValue({
      isActive: true,
      items: [{ key: 'MAX_PATIENTS_PER_DAY', value: '10' }],
    });

    prisma.visit.findFirst.mockResolvedValueOnce(null);
    prisma.visit.count.mockResolvedValue(10); // at custom limit

    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({ patientId: 'patient-uuid-1' })
      .expect(409);

    expect(res.body.statusCode).toBe(409);
  });

  // VIS-003
  it('VIS-003: duplicate active visit today returns 409', async () => {
    prisma.patient.findUnique.mockResolvedValue(MOCK_PATIENT);
    prisma.regulationVersion.findFirst.mockResolvedValue(null);

    // duplicateActive check finds existing WAITING visit
    prisma.visit.findFirst.mockResolvedValueOnce({
      id: 'existing-visit',
      status: VisitStatus.WAITING,
      patientId: 'patient-uuid-1',
    });

    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({ patientId: 'patient-uuid-1' })
      .expect(409);

    expect(res.body.statusCode).toBe(409);
    expect(res.body.message).toContain('active visit');
  });

  // VIS-003 — IN_EXAMINATION also blocked
  it('VIS-003: IN_EXAMINATION visit also blocks re-registration with 409', async () => {
    prisma.patient.findUnique.mockResolvedValue(MOCK_PATIENT);
    prisma.regulationVersion.findFirst.mockResolvedValue(null);

    prisma.visit.findFirst.mockResolvedValueOnce({
      id: 'existing-visit',
      status: VisitStatus.IN_EXAMINATION,
    });

    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({ patientId: 'patient-uuid-1' })
      .expect(409);

    expect(res.body.statusCode).toBe(409);
  });

  // Patient not found
  it('patient not found returns 404', async () => {
    prisma.patient.findUnique.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({ patientId: 'ghost-id' })
      .expect(404);

    expect(res.body.statusCode).toBe(404);
    expect(res.body.message).toContain('Patient not found');
  });

  // DTO validation — missing patientId
  it('missing patientId returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({})
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  // DTO validation — empty patientId string
  it('empty patientId string returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({ patientId: '' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });

  // DTO validation — invalid visitDate format
  it('invalid visitDate format returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({ patientId: 'patient-uuid-1', visitDate: 'not-a-date' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });
});
