/**
 * Full flow integration test — UC-04 → UC-05 → UC-04 → UC-06 → duplicate conflict
 *
 * Tests the complete receptionist workflow in sequence:
 * 1. Search patient → no result (UC-04)
 * 2. Create patient (UC-05)
 * 3. Search patient again → found (UC-04)
 * 4. Create visit for patient (UC-06)
 * 5. Create duplicate visit → 409 Conflict (UC-06 guard)
 *
 * Uses mocked PrismaService with stateful mock sequence (mockResolvedValueOnce).
 * No real DB required.
 *
 * Limitation: This does not cover Prisma transaction isolation or DB constraints.
 * Those require a real PostgreSQL instance (see docs/known-limitations.md KL-01).
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

import { APP_API_PREFIX } from './common/constants/app.constants';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PatientsController } from './modules/patients/patients.controller';
import { PatientsService } from './modules/patients/patients.service';
import { VisitsController } from './modules/visits/visits.controller';
import { VisitsService } from './modules/visits/visits.service';
import { PrismaService } from './prisma/prisma.service';

// ── Guards ────────────────────────────────────────────────────────────────────

const mockJwtGuard: CanActivate = {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user: unknown }>();
    req.user = {
      sub: 'receptionist-id',
      email: 'receptionist@clinic.local',
      role: 'RECEPTIONIST',
    };
    return true;
  },
};
const mockRolesGuard: CanActivate = { canActivate: () => true };

// ── Mock types ────────────────────────────────────────────────────────────────

type MockPrisma = {
  patient: {
    count: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
  };
  visit: {
    findFirst: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  regulationVersion: { findFirst: jest.Mock };
  examination: { create: jest.Mock };
  $transaction: jest.Mock;
};

// ── Test data ─────────────────────────────────────────────────────────────────

const PATIENT = {
  id: 'patient-flow-uuid',
  patientCode: 'BN-000001',
  fullName: 'Le Thi Flow',
  dob: null as null,
  gender: null as null,
  phone: '0909000001',
  citizenId: null as null,
  address: null as null,
  createdAt: new Date('2026-05-18T07:00:00.000Z'),
  updatedAt: new Date('2026-05-18T07:00:00.000Z'),
};

const VISIT = {
  id: 'visit-flow-uuid',
  patientId: PATIENT.id,
  visitDate: new Date('2026-05-18T00:00:00.000Z'),
  queueNumber: 1,
  reason: 'Kiểm tra sức khoẻ',
  status: VisitStatus.WAITING,
  createdByUserId: 'receptionist-id',
  createdAt: new Date('2026-05-18T08:00:00.000Z'),
  updatedAt: new Date('2026-05-18T08:00:00.000Z'),
  patient: {
    id: PATIENT.id,
    patientCode: PATIENT.patientCode,
    fullName: PATIENT.fullName,
    phone: PATIENT.phone,
    dob: null,
  },
};

// ── Full flow suite ───────────────────────────────────────────────────────────

describe('Full flow — UC-04 → UC-05 → UC-04 → UC-06 → duplicate conflict', () => {
  let app: INestApplication<App>;
  let prisma: MockPrisma;

  beforeAll(async () => {
    prisma = {
      patient: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
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
    };

    // $transaction always runs callback with prisma as tx
    prisma.$transaction.mockImplementation(
      async (fn: (tx: MockPrisma) => Promise<unknown>) => fn(prisma),
    );

    // ── Mock sequence for the full flow ─────────────────────────────────────

    // Step 1 — GET /patients (no result)
    prisma.patient.count.mockResolvedValueOnce(0);
    prisma.patient.findMany.mockResolvedValueOnce([]);

    // Step 2 — POST /patients (create)
    // - no citizenId, no phone/dob → no pre-tx DB calls
    // - inside tx: findFirst(patientCode) → null → next code is BN-000001
    // - inside tx: create → PATIENT
    prisma.patient.findFirst.mockResolvedValueOnce(null);
    prisma.patient.create.mockResolvedValueOnce(PATIENT);

    // Step 3 — GET /patients?keyword=Le+Thi+Flow (found)
    prisma.patient.count.mockResolvedValueOnce(1);
    prisma.patient.findMany.mockResolvedValueOnce([PATIENT]);

    // Step 4 — POST /visits (create visit)
    prisma.patient.findUnique.mockResolvedValueOnce(PATIENT);
    prisma.regulationVersion.findFirst.mockResolvedValueOnce(null); // fallback 40
    // inside tx:
    //   findFirst(duplicateActive) → null
    //   count(totalToday) → 0
    //   findFirst(latestVisit) → null (first visit today)
    //   create → VISIT
    prisma.visit.findFirst
      .mockResolvedValueOnce(null) // duplicateActive
      .mockResolvedValueOnce(null); // latestVisit
    prisma.visit.count.mockResolvedValueOnce(0);
    prisma.visit.create.mockResolvedValueOnce(VISIT);

    // Step 5 — POST /visits duplicate (conflict)
    prisma.patient.findUnique.mockResolvedValueOnce(PATIENT);
    prisma.regulationVersion.findFirst.mockResolvedValueOnce(null);
    // inside tx:
    //   findFirst(duplicateActive) → VISIT (active)
    prisma.visit.findFirst.mockResolvedValueOnce({
      id: VISIT.id,
      status: VisitStatus.WAITING,
      patientId: PATIENT.id,
    });

    // ── Build app ────────────────────────────────────────────────────────────

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController, VisitsController],
      providers: [
        PatientsService,
        VisitsService,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = module.createNestApplication<INestApplication<App>>();
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
  });

  afterAll(() => app.close());

  // Step 1
  it('Step 1 — GET /patients returns empty list before any patient created', async () => {
    const res = await request(app.getHttpServer())
      .get(`/${APP_API_PREFIX}/patients`)
      .expect(200);

    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  // Step 2
  it('Step 2 — POST /patients creates patient, returns 201 with patientCode and empty warnings', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/patients`)
      .send({ fullName: 'Le Thi Flow', phone: null })
      .expect(201);

    expect(res.body.id).toBe(PATIENT.id);
    expect(res.body.patientCode).toBe('BN-000001');
    expect(res.body.fullName).toBe('Le Thi Flow');
    expect(res.body.warnings).toEqual([]);
  });

  // Step 3
  it('Step 3 — GET /patients?keyword=Le+Thi+Flow returns the created patient', async () => {
    const res = await request(app.getHttpServer())
      .get(`/${APP_API_PREFIX}/patients?keyword=Le+Thi+Flow`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBe(1);
    expect(
      (res.body.data as Array<{ patientCode: string }>)[0].patientCode,
    ).toBe('BN-000001');
  });

  // Step 4
  it('Step 4 — POST /visits creates visit, returns 201 with queueNumber=1 and WAITING status', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({
        patientId: PATIENT.id,
        visitDate: '2026-05-18',
        reason: 'Kiểm tra sức khoẻ',
      })
      .expect(201);

    expect(res.body.id).toBe(VISIT.id);
    expect(res.body.queueNumber).toBe(1);
    expect(res.body.status).toBe('WAITING');
    expect(res.body.allowedActions).toContain('OPEN_EXAMINATION');
    expect(res.body.allowedActions).toContain('CANCEL_VISIT');
  });

  // Step 5
  it('Step 5 — POST /visits for same patient same day returns 409 Conflict', async () => {
    const res = await request(app.getHttpServer())
      .post(`/${APP_API_PREFIX}/visits`)
      .send({ patientId: PATIENT.id, visitDate: '2026-05-18' })
      .expect(409);

    expect(res.body.statusCode).toBe(409);
    expect(res.body.error).toBe('Conflict');
    expect(res.body.message).toContain('active visit');
  });
});
