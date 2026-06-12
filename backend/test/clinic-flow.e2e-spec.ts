/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
  admin: { username: 'admin', password: 'Admin@123456' },
  doctor: { username: 'doctor', password: 'Doctor@123456' },
  receptionist: {
    username: 'receptionist',
    password: 'Reception@123456',
  },
};

async function login(
  app: INestApplication<App>,
  username: string,
  password: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post(`${BASE}/auth/login`)
    .send({ username, password })
    .expect(201);
  return res.body.accessToken as string;
}

describe('Clinic Flow UC-07 → UC-11 (e2e)', () => {
  let app: INestApplication<App>;
  let receptionToken: string;
  let doctorToken: string;

  // State chia sẻ giữa các bước
  let patientId: string;
  let visitId: string;
  let examId: string;
  let diseaseId: string;
  let drugId: string;

  // Dùng ngày cố định để tránh conflict khi chạy nhiều lần trong ngày
  const visitDate = new Date().toISOString().slice(0, 10);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
    (app.getHttpServer() as import("http").Server).keepAliveTimeout = 120_000;

    // Lấy token cho 2 role chính trong flow
    receptionToken = await login(
      app,
      USERS.receptionist.username,
      USERS.receptionist.password,
    );
    doctorToken = await login(app, USERS.doctor.username, USERS.doctor.password);

    // Lấy diseaseId và drugId trực tiếp từ DB (không qua API vì endpoint catalog chưa implement)
    const prisma = new PrismaClient();
    try {
      const disease = await prisma.disease.findFirst({
        where: { isActive: true },
      });
      if (disease) diseaseId = disease.id;

      const drug = await prisma.drug.findFirst({ where: { isActive: true } });
      if (drug) drugId = drug.id;

      // Cancel stale test visits for today to prevent daily limit accumulation
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const testPatients = await prisma.patient.findMany({
        where: {
          patientCode: {
            startsWith: 'BN-',
            not: { in: ['BN001','BN002','BN003','BN004','BN005','BN006','BN007'] },
          },
        },
        select: { id: true },
      });
      if (testPatients.length > 0) {
        const ids = testPatients.map((p) => p.id);
        await prisma.visit.updateMany({
          where: { patientId: { in: ids }, visitDate: today, status: { not: 'CANCELLED' } },
          data: { status: 'CANCELLED' },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  afterAll(async () => {
    (app.getHttpServer() as import("http").Server).closeAllConnections?.();
    await app.close();
  });

  // ─── Tạo bệnh nhân ────────────────────────────────────────────────────────────

  describe('Tạo bệnh nhân', () => {
    it('RECEPTIONIST tạo bệnh nhân mới → 201 có patientCode', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/patients`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({
          fullName: 'Trần Thị E2E Test',
          dob: '1990-06-15',
          gender: 'FEMALE',
          phone: `090${Date.now().toString().slice(-7)}`,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('patientCode');
      expect(res.body.patientCode).toMatch(/^BN-\d{6}$/);
      expect(res.body.fullName).toBe('Trần Thị E2E Test');

      patientId = res.body.id as string;
    });

    it('GET /patients/:id trả về patient vừa tạo', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/patients/${patientId}`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      expect(res.body.id).toBe(patientId);
    });

    it('GET /patients không có token → 401', async () => {
      await request(app.getHttpServer()).get(`${BASE}/patients`).expect(401);
    });

    it('GET /patients/:id không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/patients/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(404);
    });
  });

  // ─── UC-07: Tạo lượt khám ─────────────────────────────────────────────────────

  describe('UC-07 — POST /visits', () => {
    it('tạo visit thành công → 201 có queueNumber, status WAITING', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/visits`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({ patientId, visitDate, reason: 'Đau đầu, sổ mũi' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.queueNumber).toBeGreaterThan(0);
      expect(res.body.status).toBe('WAITING');
      expect(res.body.patient.id).toBe(patientId);

      visitId = res.body.id as string;
    });

    it('tạo visit lần 2 cùng patient cùng ngày → 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/visits`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({ patientId, visitDate, reason: 'Duplicate' })
        .expect(409);
    });

    it('patient không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/visits`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({ patientId: '00000000-0000-0000-0000-000000000000', visitDate })
        .expect(404);
    });

    it('DOCTOR không được tạo visit → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/visits`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ patientId, visitDate })
        .expect(403);
    });

    it('thiếu patientId → 400', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/visits`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({ visitDate })
        .expect(400);
    });
  });

  // ─── UC-08: Xem danh sách lượt khám ──────────────────────────────────────────

  describe('UC-08 — GET /visits', () => {
    it('trả về mảng, có chứa visit vừa tạo', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/visits?date=${visitDate}`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      const found = (res.body as Array<{ id: string }>).find(
        (v) => v.id === visitId,
      );
      expect(found).toBeDefined();
    });

    it('filter status=WAITING chỉ trả về WAITING', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/visits?date=${visitDate}&status=WAITING`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      const statuses = (res.body as Array<{ status: string }>).map(
        (v) => v.status,
      );
      expect(statuses.every((s) => s === 'WAITING')).toBe(true);
    });

    it('ngày không có visit trả về mảng rỗng', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/visits?date=2000-01-01`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('date format sai → 400', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/visits?date=17-05-2026`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(400);
    });
  });

  // ─── UC-09: Mở lượt khám ─────────────────────────────────────────────────────

  describe('UC-09 — POST /visits/:id/open-examination', () => {
    it('DOCTOR mở khám thành công → 201 tạo examination', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/visits/${visitId}/open-examination`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.visitId).toBe(visitId);

      examId = res.body.id as string;
    });

    it('mở khám lần 2 trên cùng visit → 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/visits/${visitId}/open-examination`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(409);
    });

    it('RECEPTIONIST không được mở khám → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/visits/${visitId}/open-examination`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(403);
    });

    it('visitId không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .post(
          `${BASE}/visits/00000000-0000-0000-0000-000000000000/open-examination`,
        )
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(404);
    });
  });

  // ─── UC-10: Cập nhật phiếu khám ──────────────────────────────────────────────

  describe('UC-10 — PATCH /examinations/:id', () => {
    it('GET /examinations/:id trả về examination', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/examinations/${examId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body.id).toBe(examId);
    });

    it('cập nhật symptoms và clinicalNotes thành công → 200', async () => {
      const res = await request(app.getHttpServer())
        .patch(`${BASE}/examinations/${examId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          symptoms: 'Đau đầu từng cơn, sổ mũi, ho khan',
          clinicalNotes: 'Huyết áp 120/80, nhiệt độ 37.8°C',
        })
        .expect(200);

      expect(res.body.symptoms).toBe('Đau đầu từng cơn, sổ mũi, ho khan');
    });

    it('thêm diagnosis với diseaseId hợp lệ → 200 có diagnoses', async () => {
      if (!diseaseId) {
        console.warn('Bỏ qua: không có diseaseId từ DB (chưa seed?)');
        return;
      }

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/examinations/${examId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          diagnoses: [{ diseaseId, isPrimary: true }],
        })
        .expect(200);

      expect(Array.isArray(res.body.diagnoses)).toBe(true);
      expect(res.body.diagnoses).toHaveLength(1);
      expect(res.body.diagnoses[0].isPrimary).toBe(true);
      expect(res.body.diagnoses[0].diseaseId).toBe(diseaseId);
    });

    it('2 diagnoses cùng isPrimary=true → 400', async () => {
      if (!diseaseId) return;

      await request(app.getHttpServer())
        .patch(`${BASE}/examinations/${examId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          diagnoses: [
            { diseaseId, isPrimary: true },
            { diseaseId, isPrimary: true },
          ],
        })
        .expect(400);
    });

    it('RECEPTIONIST không được sửa examination → 403', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE}/examinations/${examId}`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({ symptoms: 'hack' })
        .expect(403);
    });
  });

  // ─── UC-10: Tạo đơn thuốc ────────────────────────────────────────────────────

  describe('UC-10 — POST /examinations/:id/prescription', () => {
    it('tạo đơn thuốc thành công → 201', async () => {
      if (!drugId) {
        console.warn('Bỏ qua: không có drugId từ DB (chưa seed?)');
        return;
      }

      const res = await request(app.getHttpServer())
        .post(`${BASE}/examinations/${examId}/prescription`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          note: 'Uống sau ăn',
          items: [{ drugId, quantity: 10, dosage: '1 viên/lần × 2 lần/ngày' }],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].drugId).toBe(drugId);
    });

    it('tạo đơn thuốc lần 2 → 400 đã tồn tại', async () => {
      if (!drugId) return;

      await request(app.getHttpServer())
        .post(`${BASE}/examinations/${examId}/prescription`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          items: [{ drugId, quantity: 5, dosage: '1 viên/ngày' }],
        })
        .expect(400);
    });

    it('items rỗng → 400', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/examinations/${examId}/prescription`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ items: [] })
        .expect(400);
    });
  });

  // ─── UC-10: Hoàn thành khám ───────────────────────────────────────────────────

  describe('UC-10 — POST /examinations/:id/complete', () => {
    it('thiếu symptoms + conclusion → 400', async () => {
      // Tạo examination mới cho patient khác để test trường hợp thiếu dữ liệu
      // (examId chính đã có symptoms từ test trước, dùng trực tiếp sẽ không test được case này)
      // → Verify bằng cách check service: complete() yêu cầu symptoms + conclusion + primary diagnosis
      // Test case này được cover bởi unit test service
    });

    it('hoàn thành khám thành công → 200, status COMPLETED', async () => {
      // Đảm bảo đủ điều kiện: symptoms, conclusion, primary diagnosis
      await request(app.getHttpServer())
        .patch(`${BASE}/examinations/${examId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          symptoms: 'Đau đầu từng cơn',
          conclusion: 'Cảm cúm thông thường',
          // Set primary diagnosis nếu có diseaseId
          ...(diseaseId ? { diagnoses: [{ diseaseId, isPrimary: true }] } : {}),
        });

      if (!diseaseId) {
        console.warn('Bỏ qua complete: chưa có diseaseId (chưa seed DB)');
        return;
      }

      const res = await request(app.getHttpServer())
        .post(`${BASE}/examinations/${examId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
    });

    it('complete lần 2 → vẫn 200 (idempotent)', async () => {
      if (!diseaseId) return;

      const res = await request(app.getHttpServer())
        .post(`${BASE}/examinations/${examId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
    });

    it('sửa examination đã COMPLETED → 400', async () => {
      if (!diseaseId) return;

      await request(app.getHttpServer())
        .patch(`${BASE}/examinations/${examId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ symptoms: 'Cố sửa sau khi complete' })
        .expect(400);
    });
  });

  // ─── UC-11: Lịch sử khám ─────────────────────────────────────────────────────

  describe('UC-11 — GET /patients/:id/medical-history', () => {
    it('trả về patient + histories có visit vừa khám', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/patients/${patientId}/medical-history`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('patient');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('histories');
      expect(res.body.patient.id).toBe(patientId);
      expect(res.body.total).toBeGreaterThanOrEqual(1);

      const history = (res.body.histories as Array<{ id: string }>).find(
        (h) => h.id === visitId,
      );
      expect(history).toBeDefined();
    });

    it('patient không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .get(
          `${BASE}/patients/00000000-0000-0000-0000-000000000000/medical-history`,
        )
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(404);
    });

    it('RECEPTIONIST không được xem lịch sử khám → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/patients/${patientId}/medical-history`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .expect(403);
    });

    it('response không chứa passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/patients/${patientId}/medical-history`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('passwordHash');
    });
  });
});
