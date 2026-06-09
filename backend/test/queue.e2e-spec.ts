/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * queue.e2e-spec.ts
 * Tests for Phase 2 Queue module:
 *   - State machine: WAITING → CALLED → IN_SERVICE → DONE
 *   - Invalid transitions (WAITING→DONE, DONE→*, CANCELLED→*)
 *   - Timestamps: calledAt set on CALLED, completedAt set on DONE
 *   - GET /queue (list with filters)
 *   - GET /queue/next (next WAITING ticket)
 *   - GET /queue/:id
 *   - PATCH /queue/:id/status (state machine)
 *   - RBAC: DOCTOR/NURSE/ADMIN update; CASHIER/RECEPTIONIST denied update
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';

import { APP_API_PREFIX } from '../src/common/constants/app.constants';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { AppModule } from '../src/app.module';

const BASE = `/${APP_API_PREFIX}`;

const USERS = {
  admin:        { username: 'admin',        password: 'Admin@123456' },
  doctor:       { username: 'doctor',       password: 'Doctor@123456' },
  nurse:        { username: 'nurse',        password: 'Nurse@123456' },
  receptionist: { username: 'receptionist', password: 'Reception@123456' },
  cashier:      { username: 'cashier',      password: 'Cashier@123456' },
};

async function login(app: INestApplication<App>, username: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post(`${BASE}/auth/login`)
    .send({ username, password })
    .expect(201);
  return res.body.accessToken as string;
}

/**
 * Create a QueueTicket directly via Prisma for isolated state-machine testing.
 * This avoids dependency on the appointment/checkin flow being correct.
 */
// Use a far-future date to avoid scanning accumulated test records (fast queries)
const QUEUE_TEST_DATE = new Date('2099-07-01T00:00:00.000Z');

async function createTestQueueTicket(
  prisma: PrismaClient,
  departmentId: string,
  status: 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'DONE' | 'CANCELLED',
): Promise<string> {
  const patient = await prisma.patient.create({
    data: {
      patientCode: `BN-Q${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
      fullName: `Queue Test Patient ${Date.now()}`,
      phone: `05${Date.now().toString().slice(-8)}`,
    },
  });

  const receptionist = await prisma.user.findFirst({ where: { email: 'receptionist@clinic.local' } });

  // Use max+1 on the isolated test date to avoid full-table scans on today's records
  const lastVisit = await prisma.visit.findFirst({
    where: { visitDate: QUEUE_TEST_DATE },
    orderBy: { queueNumber: 'desc' },
  });
  const queueNumber = (lastVisit?.queueNumber ?? 0) + 1;

  const visit = await prisma.visit.create({
    data: {
      patientId: patient.id,
      visitDate: QUEUE_TEST_DATE,
      queueNumber,
      status: 'REGISTERED',
      createdByUserId: receptionist!.id,
      departmentId,
    },
  });

  const lastTicket = await prisma.queueTicket.findFirst({
    where: { departmentId, queueDate: QUEUE_TEST_DATE },
    orderBy: { queueNumber: 'desc' },
  });
  const ticketNumber = (lastTicket?.queueNumber ?? 0) + 1;

  const ticket = await prisma.queueTicket.create({
    data: {
      visitId: visit.id,
      departmentId,
      queueDate: QUEUE_TEST_DATE,
      queueNumber: ticketNumber,
      priority: 0,
      status,
    },
  });

  return ticket.id;
}

describe('Queue — Phase 2 state machine (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let doctorToken: string;
  let nurseToken: string;
  let receptionToken: string;
  let cashierToken: string;

  let departmentId: string;

  // Ticket IDs for state machine tests (each test uses a dedicated ticket)
  let waitingTicketId: string;          // WAITING → CALLED → IN_SERVICE → DONE
  let skipTicketId: string;             // WAITING → SKIPPED
  let cancelTicketId: string;           // WAITING → CANCELLED
  let alreadyDoneTicketId: string;      // DONE (cannot transition further)
  let alreadyCancelledTicketId: string; // CANCELLED (cannot transition further)

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(APP_API_PREFIX);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new PrismaExceptionFilter());
    await app.init();
    (app.getHttpServer() as import("http").Server).keepAliveTimeout = 120_000;

    [adminToken, doctorToken, nurseToken, receptionToken, cashierToken] =
      await Promise.all([
        login(app, USERS.admin.username, USERS.admin.password),
        login(app, USERS.doctor.username, USERS.doctor.password),
        login(app, USERS.nurse.username, USERS.nurse.password),
        login(app, USERS.receptionist.username, USERS.receptionist.password),
        login(app, USERS.cashier.username, USERS.cashier.password),
      ]);

    const prisma = new PrismaClient();
    try {
      const dept = await prisma.department.findFirst({ where: { code: 'GENERAL' } });
      if (!dept) throw new Error('Department GENERAL not seeded');
      departmentId = dept.id;

      // Create test tickets for each scenario — sequentially to avoid visitDate+queueNumber race
      waitingTicketId        = await createTestQueueTicket(prisma, departmentId, 'WAITING');
      skipTicketId           = await createTestQueueTicket(prisma, departmentId, 'WAITING');
      cancelTicketId         = await createTestQueueTicket(prisma, departmentId, 'WAITING');
      alreadyDoneTicketId      = await createTestQueueTicket(prisma, departmentId, 'DONE');
      alreadyCancelledTicketId = await createTestQueueTicket(prisma, departmentId, 'CANCELLED');
    } finally {
      await prisma.$disconnect();
    }
  });

  afterAll(async () => {
    // Clean up ALL BN-Q test data (any date) so repeated runs stay fast
    const prisma = new PrismaClient();
    try {
      const testPatients = await prisma.patient.findMany({
        where: { patientCode: { startsWith: 'BN-Q' } },
        select: { id: true },
      });
      if (testPatients.length > 0) {
        const patientIds = testPatients.map((p) => p.id);
        // Find all visits for these patients
        const visits = await prisma.visit.findMany({
          where: { patientId: { in: patientIds } },
          select: { id: true },
        });
        const visitIds = visits.map((v) => v.id);
        if (visitIds.length > 0) {
          // Delete queue tickets (FK: visitId)
          await prisma.queueTicket.deleteMany({ where: { visitId: { in: visitIds } } });
        }
        await prisma.visit.deleteMany({ where: { patientId: { in: patientIds } } });
        await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
      }
    } finally {
      await prisma.$disconnect();
    }
    (app.getHttpServer() as import("http").Server).closeAllConnections?.();
    await app.close();
  });

  // ─── GET /queue ────────────────────────────────────────────────────────────

  describe('GET /queue — list', () => {
    it('DOCTOR xem queue hôm nay → 200 mảng', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/queue`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('NURSE xem queue → 200', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/queue`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .expect(200);
    });

    it('ADMIN xem queue → 200', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/queue`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('RECEPTIONIST xem queue → 200', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/queue`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);
    });

    it('CASHIER không được xem queue → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/queue`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    it('không có token → 401', async () => {
      await request(app.getHttpServer()).get(`${BASE}/queue`).expect(401);
    });

    it('filter status=WAITING → chỉ trả WAITING tickets', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/queue?status=WAITING`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const items = res.body as Array<{ status: string }>;
      if (items.length > 0) {
        expect(items.every((t) => t.status === 'WAITING')).toBe(true);
      }
    });

    it('filter theo departmentId → chỉ trả tickets của department đó', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/queue?departmentId=${departmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const items = res.body as Array<{ department: { id: string } }>;
      if (items.length > 0) {
        expect(items.every((t) => t.department.id === departmentId)).toBe(true);
      }
    });

    it('items được sort: priority DESC, queueNumber ASC', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/queue?status=WAITING`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const items = res.body as Array<{ priority: number; queueNumber: number }>;
      for (let i = 1; i < items.length; i++) {
        if (items[i].priority === items[i - 1].priority) {
          expect(items[i].queueNumber).toBeGreaterThanOrEqual(items[i - 1].queueNumber);
        } else {
          expect(items[i].priority).toBeLessThanOrEqual(items[i - 1].priority);
        }
      }
    });
  });

  // ─── GET /queue/next ───────────────────────────────────────────────────────

  describe('GET /queue/next — ticket tiếp theo', () => {
    it('DOCTOR lấy next WAITING ticket → 200 hoặc null', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/queue/next`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Có thể null (không có ticket WAITING) hoặc ticket object
      if (res.body !== null) {
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('WAITING');
      }
    });

    it('NURSE lấy next → 200', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/queue/next`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .expect(200);
    });

    it('CASHIER không được xem next → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/queue/next`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    it('filter theo departmentId hợp lệ → 200', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/queue/next?departmentId=${departmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);
    });
  });

  // ─── GET /queue/:id ────────────────────────────────────────────────────────

  describe('GET /queue/:id — chi tiết ticket', () => {
    it('lấy chi tiết ticket WAITING vừa tạo → 200', async () => {
      if (!waitingTicketId) return;

      const res = await request(app.getHttpServer())
        .get(`${BASE}/queue/${waitingTicketId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body.id).toBe(waitingTicketId);
      expect(res.body.status).toBe('WAITING');
      expect(res.body).toHaveProperty('visit');
      expect(res.body).toHaveProperty('department');
    });

    it('ticketId không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/queue/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(404);
    });

    it('response không chứa passwordHash', async () => {
      if (!waitingTicketId) return;

      const res = await request(app.getHttpServer())
        .get(`${BASE}/queue/${waitingTicketId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });
  });

  // ─── PATCH /queue/:id/status — State Machine ───────────────────────────────

  describe('PATCH /queue/:id/status — state machine transitions', () => {
    // ── Happy path: WAITING → CALLED → IN_SERVICE → DONE ──────────────────

    it('WAITING → CALLED → 200, calledAt được set', async () => {
      if (!waitingTicketId) return;

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/queue/${waitingTicketId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'CALLED' })
        .expect(200);

      expect(res.body.status).toBe('CALLED');
      expect(res.body.calledAt).toBeTruthy();
    });

    it('CALLED → IN_SERVICE → 200', async () => {
      if (!waitingTicketId) return;

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/queue/${waitingTicketId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'IN_SERVICE' })
        .expect(200);

      expect(res.body.status).toBe('IN_SERVICE');
    });

    it('IN_SERVICE → DONE → 200, completedAt được set', async () => {
      if (!waitingTicketId) return;

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/queue/${waitingTicketId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'DONE' })
        .expect(200);

      expect(res.body.status).toBe('DONE');
      expect(res.body.completedAt).toBeTruthy();
    });

    // ── WAITING → SKIPPED ──────────────────────────────────────────────────

    it('WAITING → SKIPPED → 200', async () => {
      if (!skipTicketId) return;

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/queue/${skipTicketId}/status`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ status: 'SKIPPED' })
        .expect(200);

      expect(res.body.status).toBe('SKIPPED');
    });

    // ── WAITING → CANCELLED ────────────────────────────────────────────────

    it('WAITING → CANCELLED → 200', async () => {
      if (!cancelTicketId) return;

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/queue/${cancelTicketId}/status`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ status: 'CANCELLED' })
        .expect(200);

      expect(res.body.status).toBe('CANCELLED');
    });

    // ── Invalid transitions ────────────────────────────────────────────────

    it('DONE → bất kỳ trạng thái → 400 (không có transition từ DONE)', async () => {
      if (!alreadyDoneTicketId) return;

      for (const target of ['WAITING', 'CALLED', 'IN_SERVICE', 'CANCELLED']) {
        await request(app.getHttpServer())
          .patch(`${BASE}/queue/${alreadyDoneTicketId}/status`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ status: target })
          .expect(400);
      }
    });

    it('CANCELLED → bất kỳ trạng thái → 400 (không có transition từ CANCELLED)', async () => {
      if (!alreadyCancelledTicketId) return;

      for (const target of ['WAITING', 'CALLED', 'IN_SERVICE', 'DONE']) {
        await request(app.getHttpServer())
          .patch(`${BASE}/queue/${alreadyCancelledTicketId}/status`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ status: target })
          .expect(400);
      }
    });

    it('WAITING → DONE trực tiếp (bỏ qua CALLED, IN_SERVICE) → 400', async () => {
      // Tạo ticket WAITING mới để test
      const prisma = new PrismaClient();
      let freshId: string | undefined;
      try {
        freshId = await createTestQueueTicket(prisma, departmentId, 'WAITING');
      } finally {
        await prisma.$disconnect();
      }

      if (!freshId) return;

      await request(app.getHttpServer())
        .patch(`${BASE}/queue/${freshId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'DONE' })
        .expect(400);
    });

    it('WAITING → IN_SERVICE trực tiếp (bỏ qua CALLED) → 400', async () => {
      const prisma = new PrismaClient();
      let freshId: string | undefined;
      try {
        freshId = await createTestQueueTicket(prisma, departmentId, 'WAITING');
      } finally {
        await prisma.$disconnect();
      }

      if (!freshId) return;

      await request(app.getHttpServer())
        .patch(`${BASE}/queue/${freshId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'IN_SERVICE' })
        .expect(400);
    });

    it('enum status không hợp lệ → 400', async () => {
      if (!waitingTicketId) return;

      await request(app.getHttpServer())
        .patch(`${BASE}/queue/${waitingTicketId}/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('ticketId không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE}/queue/00000000-0000-0000-0000-000000000000/status`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ status: 'CALLED' })
        .expect(404);
    });

    // ── RBAC cho updateStatus ──────────────────────────────────────────────

    it('CASHIER không được update queue status → 403', async () => {
      const prisma = new PrismaClient();
      let freshId: string | undefined;
      try {
        freshId = await createTestQueueTicket(prisma, departmentId, 'WAITING');
      } finally {
        await prisma.$disconnect();
      }

      if (!freshId) return;

      await request(app.getHttpServer())
        .patch(`${BASE}/queue/${freshId}/status`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ status: 'CALLED' })
        .expect(403);
    });

    it('RECEPTIONIST không được update queue status → 403', async () => {
      const prisma = new PrismaClient();
      let freshId: string | undefined;
      try {
        freshId = await createTestQueueTicket(prisma, departmentId, 'WAITING');
      } finally {
        await prisma.$disconnect();
      }

      if (!freshId) return;

      await request(app.getHttpServer())
        .patch(`${BASE}/queue/${freshId}/status`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({ status: 'CALLED' })
        .expect(403);
    });

    it('NURSE được update queue status (WAITING → CALLED) → 200', async () => {
      const prisma = new PrismaClient();
      let freshId: string | undefined;
      try {
        freshId = await createTestQueueTicket(prisma, departmentId, 'WAITING');
      } finally {
        await prisma.$disconnect();
      }

      if (!freshId) return;

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/queue/${freshId}/status`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ status: 'CALLED' })
        .expect(200);

      expect(res.body.status).toBe('CALLED');
    });
  });
});
