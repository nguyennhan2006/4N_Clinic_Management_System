/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * appointments.e2e-spec.ts
 * Tests for Phase 2 Appointment module:
 *   - Create (BR-APT-01..04: future time, doctor active, patient exists, no overlap)
 *   - FindAll with filters
 *   - FindOne
 *   - Update (only SCHEDULED)
 *   - Cancel (only SCHEDULED → CANCELLED)
 *   - Checkin (SCHEDULED → CHECKED_IN + creates Visit + QueueTicket atomically)
 *   - RBAC: RECEPTIONIST/ADMIN create; CASHIER denied; etc.
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
  receptionist: { username: 'receptionist', password: 'Reception@123456' },
  doctor:       { username: 'doctor',       password: 'Doctor@123456' },
  cashier:      { username: 'cashier',      password: 'Cashier@123456' },
  manager:      { username: 'manager',      password: 'Manager@123456' },
  nurse:        { username: 'nurse',        password: 'Nurse@123456' },
};

async function login(app: INestApplication<App>, username: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post(`${BASE}/auth/login`)
    .send({ username, password })
    .expect(201);
  return res.body.accessToken as string;
}

/** Returns an ISO datetime string N minutes from now */
function futureISO(offsetMinutes = 60): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

describe('Appointments — Phase 2 (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let receptionToken: string;
  let doctorToken: string;
  let cashierToken: string;
  let managerToken: string;
  let nurseToken: string;

  // Seeded IDs fetched from DB
  let doctorProfileId: string;
  let departmentId: string;
  let patientId: string;

  // State shared across tests
  let appointmentId: string;
  let cancelAppointmentId: string;
  let checkinAppointmentId: string;

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

    // Login all roles in parallel
    [adminToken, receptionToken, doctorToken, cashierToken, managerToken, nurseToken] =
      await Promise.all([
        login(app, USERS.admin.username, USERS.admin.password),
        login(app, USERS.receptionist.username, USERS.receptionist.password),
        login(app, USERS.doctor.username, USERS.doctor.password),
        login(app, USERS.cashier.username, USERS.cashier.password),
        login(app, USERS.manager.username, USERS.manager.password),
        login(app, USERS.nurse.username, USERS.nurse.password),
      ]);

    // Fetch seeded DoctorProfile, Department, and create a test patient
    const prisma = new PrismaClient();
    try {
      const doctorUser = await prisma.user.findFirst({
        where: { email: 'doctor@clinic.local' },
        include: { doctorProfile: true },
      });
      if (!doctorUser?.doctorProfile) throw new Error('DoctorProfile not seeded');
      doctorProfileId = doctorUser.doctorProfile.id;
      departmentId = doctorUser.doctorProfile.departmentId;

      // Cancel stale SCHEDULED test appointments from previous runs to avoid conflict detection interference
      // (test patients use patientCode prefix BN-APT/BN-CHK/BN-CONF)
      const stalePatients = await prisma.patient.findMany({
        where: {
          patientCode: {
            startsWith: 'BN-',
            not: { in: ['BN001','BN002','BN003','BN004','BN005','BN006','BN007'] },
          },
        },
        select: { id: true },
      });
      if (stalePatients.length > 0) {
        const staleIds = stalePatients.map((p) => p.id);
        await prisma.appointment.updateMany({
          where: { patientId: { in: staleIds }, status: { notIn: ['CANCELLED', 'NO_SHOW', 'CHECKED_IN'] } },
          data: { status: 'CANCELLED' },
        });
      }

      // Create a fresh patient for appointment tests
      const patient = await prisma.patient.create({
        data: {
          patientCode: `BN-APT${Date.now()}`,
          fullName: 'Test Appointment Patient',
          phone: `09${Date.now().toString().slice(-8)}`,
        },
      });
      patientId = patient.id;
    } finally {
      await prisma.$disconnect();
    }
  });

  afterAll(async () => {
    // Cancel test appointments to avoid cross-run conflict detection interference
    const prisma = new PrismaClient();
    try {
      if (patientId) {
        await prisma.appointment.updateMany({
          where: { patientId, status: { notIn: ['CANCELLED', 'NO_SHOW', 'CHECKED_IN'] } },
          data: { status: 'CANCELLED' },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
    (app.getHttpServer() as import("http").Server).closeAllConnections?.();
    await app.close();
  });

  // ─── GET /appointments ─────────────────────────────────────────────────────

  describe('GET /appointments — list & RBAC', () => {
    it('RECEPTIONIST có thể xem danh sách appointments → 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('DOCTOR có thể xem danh sách appointments → 200', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);
    });

    it('MANAGER có thể xem danh sách appointments → 200', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });

    it('không có token → 401', async () => {
      await request(app.getHttpServer()).get(`${BASE}/appointments`).expect(401);
    });
  });

  // ─── POST /appointments — Create ──────────────────────────────────────────

  describe('POST /appointments — tạo lịch hẹn', () => {
    it('RECEPTIONIST tạo lịch hẹn hợp lệ → 201 status=SCHEDULED', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({
          patientId,
          doctorProfileId,
          departmentId,
          scheduledAt: futureISO(120),
          reason: 'Khám định kỳ',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('SCHEDULED');
      expect(res.body.patient.id).toBe(patientId);
      appointmentId = res.body.id as string;
    });

    it('ADMIN tạo lịch hẹn hợp lệ → 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          patientId,
          doctorProfileId,
          departmentId,
          scheduledAt: futureISO(240),
          reason: 'Tái khám',
        })
        .expect(201);

      expect(res.body.status).toBe('SCHEDULED');
      cancelAppointmentId = res.body.id as string;
    });

    it('BR-APT-01: scheduledAt trong quá khứ → 400', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({
          patientId,
          doctorProfileId,
          departmentId,
          scheduledAt: new Date(Date.now() - 3_600_000).toISOString(),
        })
        .expect(400);
    });

    it('BR-APT-04: trùng slot bác sĩ → 409 Conflict', async () => {
      // Dùng cùng scheduledAt với appointment vừa tạo (appointmentId)
      const detail = await request(app.getHttpServer())
        .get(`${BASE}/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      // Tạo patient khác để không bị trùng patient-date
      const prisma = new PrismaClient();
      let conflictPatientId: string;
      try {
        const p = await prisma.patient.create({
          data: {
            patientCode: `BN-CONF${Date.now()}`,
            fullName: 'Conflict Patient',
            phone: `08${Date.now().toString().slice(-8)}`,
          },
        });
        conflictPatientId = p.id;
      } finally {
        await prisma.$disconnect();
      }

      await request(app.getHttpServer())
        .post(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({
          patientId: conflictPatientId,
          doctorProfileId,
          departmentId,
          scheduledAt: detail.body.scheduledAt as string,
        })
        .expect(409);
    });

    it('BR-APT-03: patientId không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({
          patientId: '00000000-0000-0000-0000-000000000000',
          doctorProfileId,
          departmentId,
          scheduledAt: futureISO(360),
        })
        .expect(404);
    });

    it('BR-APT-02: doctorProfileId không tồn tại → 400', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({
          patientId,
          doctorProfileId: '00000000-0000-0000-0000-000000000000',
          departmentId,
          scheduledAt: futureISO(480),
        })
        .expect(400);
    });

    it('thiếu scheduledAt → 400', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({ patientId, doctorProfileId, departmentId })
        .expect(400);
    });

    it('thiếu patientId → 400', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({ doctorProfileId, departmentId, scheduledAt: futureISO(600) })
        .expect(400);
    });

    it('CASHIER không được tạo appointment → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ patientId, doctorProfileId, departmentId, scheduledAt: futureISO(720) })
        .expect(403);
    });

    it('DOCTOR không được tạo appointment → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/appointments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ patientId, doctorProfileId, departmentId, scheduledAt: futureISO(840) })
        .expect(403);
    });
  });

  // ─── GET /appointments/:id ─────────────────────────────────────────────────

  describe('GET /appointments/:id — chi tiết', () => {
    it('trả về appointment vừa tạo → 200', async () => {
      if (!appointmentId) return;
      const res = await request(app.getHttpServer())
        .get(`${BASE}/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      expect(res.body.id).toBe(appointmentId);
      expect(res.body.status).toBe('SCHEDULED');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('appointmentId không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/appointments/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(404);
    });
  });

  // ─── PATCH /appointments/:id — Update ─────────────────────────────────────

  describe('PATCH /appointments/:id — cập nhật (chỉ SCHEDULED)', () => {
    it('cập nhật reason của appointment SCHEDULED → 200', async () => {
      if (!appointmentId) return;
      const res = await request(app.getHttpServer())
        .patch(`${BASE}/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({ reason: 'Khám lại sau điều trị' })
        .expect(200);

      expect(res.body.reason).toBe('Khám lại sau điều trị');
    });

    it('CASHIER không được update → 403', async () => {
      if (!appointmentId) return;
      await request(app.getHttpServer())
        .patch(`${BASE}/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ reason: 'Hack' })
        .expect(403);
    });
  });

  // ─── PATCH /appointments/:id/cancel ───────────────────────────────────────

  describe('PATCH /appointments/:id/cancel — hủy lịch hẹn', () => {
    it('hủy appointment SCHEDULED → 200 status=CANCELLED', async () => {
      if (!cancelAppointmentId) return;
      const res = await request(app.getHttpServer())
        .patch(`${BASE}/appointments/${cancelAppointmentId}/cancel`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      expect(res.body.status).toBe('CANCELLED');
    });

    it('BR-APT-05: hủy appointment đã CANCELLED → 400', async () => {
      if (!cancelAppointmentId) return;
      await request(app.getHttpServer())
        .patch(`${BASE}/appointments/${cancelAppointmentId}/cancel`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(400);
    });

    it('DOCTOR không được hủy appointment → 403', async () => {
      if (!appointmentId) return;
      await request(app.getHttpServer())
        .patch(`${BASE}/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);
    });

    it('appointment không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE}/appointments/00000000-0000-0000-0000-000000000000/cancel`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(404);
    });
  });

  // ─── POST /appointments/:id/checkin ───────────────────────────────────────

  describe('POST /appointments/:id/checkin — check-in bệnh nhân', () => {
    beforeAll(async () => {
      // Tạo patient riêng cho checkin test (tránh conflict cùng ngày)
      const prisma = new PrismaClient();
      try {
        const p = await prisma.patient.create({
          data: {
            patientCode: `BN-CHK${Date.now()}`,
            fullName: 'Checkin Test Patient',
            phone: `07${Date.now().toString().slice(-8)}`,
          },
        });

        // Tạo appointment cho patient mới này
        const res = await request(app.getHttpServer())
          .post(`${BASE}/appointments`)
          .set('Authorization', `Bearer ${receptionToken}`)
          .send({
            patientId: p.id,
            doctorProfileId,
            departmentId,
            scheduledAt: futureISO(30),
            reason: 'Checkin test',
          });

        if (res.status === 201) {
          checkinAppointmentId = res.body.id as string;
        }
      } finally {
        await prisma.$disconnect();
      }
    });

    it('RECEPTIONIST check-in SCHEDULED appointment → 200 có visit + ticket', async () => {
      if (!checkinAppointmentId) {
        console.warn('Bỏ qua checkin test: không tạo được appointment');
        return;
      }

      const res = await request(app.getHttpServer())
        .post(`${BASE}/appointments/${checkinAppointmentId}/checkin`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({})
        .expect(201);

      expect(res.body).toHaveProperty('visit');
      expect(res.body).toHaveProperty('ticket');
      expect(res.body.visit.status).toBe('REGISTERED');
      expect(res.body.ticket.status).toBe('WAITING');
      expect(res.body.ticket.queueNumber).toBeGreaterThan(0);
    });

    it('BR-APT-06: check-in lần 2 cùng appointment → 409 đã check-in', async () => {
      if (!checkinAppointmentId) return;

      await request(app.getHttpServer())
        .post(`${BASE}/appointments/${checkinAppointmentId}/checkin`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({})
        .expect(409);
    });

    it('check-in appointment đã CANCELLED → 400', async () => {
      if (!cancelAppointmentId) return;

      await request(app.getHttpServer())
        .post(`${BASE}/appointments/${cancelAppointmentId}/checkin`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({})
        .expect(400);
    });

    it('CASHIER không được check-in → 403', async () => {
      if (!appointmentId) return;

      await request(app.getHttpServer())
        .post(`${BASE}/appointments/${appointmentId}/checkin`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({})
        .expect(403);
    });

    it('appointment không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/appointments/00000000-0000-0000-0000-000000000000/checkin`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({})
        .expect(404);
    });

    it('NURSE cũng được check-in → 201 hoặc 400/409 nếu đã check-in', async () => {
      // Tạo appointment mới để nurse check-in
      const prisma = new PrismaClient();
      let nurseCheckinApptId: string | undefined;
      try {
        const p = await prisma.patient.create({
          data: {
            patientCode: `BN-NRS${Date.now()}`,
            fullName: 'Nurse Checkin Patient',
            phone: `06${Date.now().toString().slice(-8)}`,
          },
        });
        const res2 = await request(app.getHttpServer())
          .post(`${BASE}/appointments`)
          .set('Authorization', `Bearer ${receptionToken}`)
          .send({
            patientId: p.id,
            doctorProfileId,
            departmentId,
            scheduledAt: futureISO(15),
          });
        if (res2.status === 201) nurseCheckinApptId = res2.body.id as string;
      } finally {
        await prisma.$disconnect();
      }

      if (!nurseCheckinApptId) return;

      const res = await request(app.getHttpServer())
        .post(`${BASE}/appointments/${nurseCheckinApptId}/checkin`)
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({});

      // 201 thành công hoặc 409 nếu patient đã có visit hôm nay
      expect([201, 409]).toContain(res.status);
    });
  });

  // ─── Filter tests ──────────────────────────────────────────────────────────

  describe('GET /appointments — filters', () => {
    it('filter theo doctorProfileId → chỉ trả appointment của doctor đó', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/appointments?doctorProfileId=${doctorProfileId}`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      const items = res.body as Array<{ doctorProfile: { id: string } }>;
      // Mọi item trả về phải có đúng doctorProfileId
      if (items.length > 0) {
        expect(items.every((a) => a.doctorProfile.id === doctorProfileId)).toBe(true);
      }
    });

    it('filter status=CANCELLED → chỉ trả CANCELLED', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/appointments?status=CANCELLED`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      const items = res.body as Array<{ status: string }>;
      if (items.length > 0) {
        expect(items.every((a) => a.status === 'CANCELLED')).toBe(true);
      }
    });

    it('filter patientId → chỉ trả appointment của patient đó', async () => {
      if (!patientId) return;

      const res = await request(app.getHttpServer())
        .get(`${BASE}/appointments?patientId=${patientId}`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      const items = res.body as Array<{ patient: { id: string } }>;
      if (items.length > 0) {
        expect(items.every((a) => a.patient.id === patientId)).toBe(true);
      }
    });
  });

  // ─── Security checks ───────────────────────────────────────────────────────

  describe('Security — response không chứa dữ liệu nhạy cảm', () => {
    it('appointment detail không có passwordHash', async () => {
      if (!appointmentId) return;
      const res = await request(app.getHttpServer())
        .get(`${BASE}/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });
  });
});
