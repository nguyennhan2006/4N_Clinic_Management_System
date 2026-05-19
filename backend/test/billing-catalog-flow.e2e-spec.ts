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
  admin: { email: 'admin@clinic.local', password: 'Admin@123456' },
  doctor: { email: 'doctor@clinic.local', password: 'Doctor@123456' },
  cashier: { email: 'cashier@clinic.local', password: 'Cashier@123456' },
  manager: { email: 'manager@clinic.local', password: 'Manager@123456' },
  receptionist: {
    email: 'receptionist@clinic.local',
    password: 'Reception@123456',
  },
};

async function login(
  app: INestApplication<App>,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post(`${BASE}/auth/login`)
    .send({ email, password })
    .expect(201);
  return res.body.accessToken as string;
}

describe('Billing & Catalog Flow UC-12 → UC-20 (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let doctorToken: string;
  let cashierToken: string;
  let managerToken: string;
  let receptionToken: string;

  // State shared between tests
  let patientId: string;
  let visitId: string;
  let examId: string;
  let invoiceId: string;
  let diseaseId: string;
  let drugId: string;
  let newDiseaseId: string;
  let newDrugId: string;
  let regulationVersionId: string;

  // Use unique date to avoid conflict with clinic-flow tests
  const visitDate = '2099-06-15';

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

    [adminToken, doctorToken, cashierToken, managerToken, receptionToken] =
      await Promise.all([
        login(app, USERS.admin.email, USERS.admin.password),
        login(app, USERS.doctor.email, USERS.doctor.password),
        login(app, USERS.cashier.email, USERS.cashier.password),
        login(app, USERS.manager.email, USERS.manager.password),
        login(app, USERS.receptionist.email, USERS.receptionist.password),
      ]);

    // Seed test data: patient → visit → examination (COMPLETED) via DB directly
    const prisma = new PrismaClient();
    try {
      const disease = await prisma.disease.findFirst({
        where: { isActive: true },
      });
      if (disease) diseaseId = disease.id;

      const drug = await prisma.drug.findFirst({ where: { isActive: true } });
      if (drug) drugId = drug.id;

      // Create patient
      const patient = await prisma.patient.create({
        data: {
          patientCode: `BN-BILL${Date.now()}`,
          fullName: 'Test Billing Patient',
          phone: `09${Date.now().toString().slice(-8)}`,
        },
      });
      patientId = patient.id;

      // Create receptionist user reference for createdByUserId
      const receptionist = await prisma.user.findFirst({
        where: { email: USERS.receptionist.email },
      });

      // Create visit with a unique queueNumber per run to avoid @@unique([visitDate, queueNumber]) conflict
      const queueNumber = 900 + (Date.now() % 99);
      const visit = await prisma.visit.create({
        data: {
          patientId,
          visitDate: new Date(visitDate),
          queueNumber,
          status: 'WAITING',
          createdByUserId: receptionist!.id,
        },
      });
      visitId = visit.id;

      // Create doctor user reference
      const doctor = await prisma.user.findFirst({
        where: { email: USERS.doctor.email },
      });

      // Create examination and complete it
      const exam = await prisma.examination.create({
        data: {
          visitId,
          doctorUserId: doctor!.id,
          symptoms: 'Test symptoms',
          conclusion: 'Test conclusion',
          status: 'OPEN',
        },
      });
      examId = exam.id;

      // Add primary diagnosis if diseaseId exists
      if (diseaseId) {
        await prisma.diagnosis.create({
          data: {
            examinationId: examId,
            diseaseId,
            name: disease!.name,
            isPrimary: true,
          },
        });
      }

      // Complete the examination + visit
      await prisma.examination.update({
        where: { id: examId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await prisma.visit.update({
        where: { id: visitId },
        data: { status: 'COMPLETED' },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── UC-18: Danh mục bệnh ─────────────────────────────────────────────────────

  describe('UC-18 — GET/POST/PATCH /diseases', () => {
    it('GET /diseases → 200 mảng bệnh', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/diseases`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /diseases?activeOnly=true chỉ trả về isActive=true', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/diseases?activeOnly=true`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const items = res.body as Array<{ isActive: boolean }>;
      expect(items.every((d) => d.isActive === true)).toBe(true);
    });

    it('CASHIER không được xem diseases → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/diseases`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    it('ADMIN tạo disease mới → 201', async () => {
      const code = `D-E2E-${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post(`${BASE}/diseases`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code, name: 'Bệnh test E2E' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.code).toBe(code);
      newDiseaseId = res.body.id as string;
    });

    it('tạo disease trùng code → 400', async () => {
      // Code đã dùng trong test trên
      const res = await request(app.getHttpServer())
        .get(`${BASE}/diseases`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const first = (res.body as Array<{ code: string }>)[0];
      if (!first) return;

      await request(app.getHttpServer())
        .post(`${BASE}/diseases`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: first.code, name: 'Trùng' })
        .expect(400);
    });

    it('DOCTOR không được tạo disease → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/diseases`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ code: 'D-NOPE', name: 'Không được tạo' })
        .expect(403);
    });

    it('ADMIN cập nhật disease → 200', async () => {
      if (!newDiseaseId) return;

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/diseases/${newDiseaseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bệnh test E2E (đã sửa)', isActive: false })
        .expect(200);

      expect(res.body.isActive).toBe(false);
    });

    it('PATCH disease không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .patch(`${BASE}/diseases/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ghost' })
        .expect(404);
    });
  });

  // ─── UC-19: Danh mục thuốc ────────────────────────────────────────────────────

  describe('UC-19 — GET/POST/PATCH /drugs', () => {
    it('GET /drugs → 200 mảng thuốc', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/drugs`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('CASHIER không được xem drugs → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/drugs`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    it('ADMIN tạo thuốc mới → 201', async () => {
      const name = `Thuốc E2E ${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post(`${BASE}/drugs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name, unit: 'viên', price: 5000 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(name);
      newDrugId = res.body.id as string;
    });

    it('tạo drug trùng tên → 400', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/drugs`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const first = (res.body as Array<{ name: string }>)[0];
      if (!first) return;

      await request(app.getHttpServer())
        .post(`${BASE}/drugs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: first.name, unit: 'viên', price: 1000 })
        .expect(400);
    });

    it('DOCTOR không được tạo drug → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/drugs`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ name: 'Không được tạo', unit: 'viên', price: 1000 })
        .expect(403);
    });

    it('ADMIN cập nhật drug → 200', async () => {
      if (!newDrugId) return;

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/drugs/${newDrugId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 6000, isActive: false })
        .expect(200);

      expect(Number(res.body.price)).toBe(6000);
      expect(res.body.isActive).toBe(false);
    });

    it('price âm → 400', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/drugs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Giá âm', unit: 'viên', price: -100 })
        .expect(400);
    });
  });

  // ─── UC-12: PUT /examinations/:id/prescription (replace-all) ──────────────────

  describe('UC-12 — PUT /examinations/:id/prescription', () => {
    it('PUT tạo prescription mới cho examination COMPLETED → 400', async () => {
      if (!drugId) {
        console.warn('Bỏ qua: không có drugId');
        return;
      }
      // examId is already COMPLETED in beforeAll
      await request(app.getHttpServer())
        .put(`${BASE}/examinations/${examId}/prescription`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          items: [{ drugId, quantity: 2, dosage: '1 viên/ngày' }],
        })
        .expect(400);
    });

    it('PUT prescription với items rỗng → 400', async () => {
      await request(app.getHttpServer())
        .put(`${BASE}/examinations/${examId}/prescription`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ items: [] })
        .expect(400);
    });

    it('PUT prescription cho examination không tồn tại → 404', async () => {
      if (!drugId) return;
      await request(app.getHttpServer())
        .put(
          `${BASE}/examinations/00000000-0000-0000-0000-000000000000/prescription`,
        )
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          items: [{ drugId, quantity: 1, dosage: '1 viên' }],
        })
        .expect(404);
    });

    it('RECEPTIONIST không được PUT prescription → 403', async () => {
      if (!drugId) return;
      await request(app.getHttpServer())
        .put(`${BASE}/examinations/${examId}/prescription`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({ items: [{ drugId, quantity: 1, dosage: '1 viên' }] })
        .expect(403);
    });
  });

  // ─── UC-14: POST /visits/:id/invoice ──────────────────────────────────────────

  describe('UC-14 — POST /visits/:visitId/invoice', () => {
    it('CASHIER tạo invoice từ visit COMPLETED → 201', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/visits/${visitId}/invoice`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('ISSUED');
      expect(Number(res.body.totalAmount)).toBeGreaterThan(0);
      expect(res.body.visit.patient.id).toBe(patientId);

      invoiceId = res.body.id as string;
    });

    it('tạo invoice lần 2 cùng visit → trả về invoice cũ (idempotent, 2xx)', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/visits/${visitId}/invoice`)
        .set('Authorization', `Bearer ${cashierToken}`);

      expect([200, 201]).toContain(res.status);
      expect(res.body.id).toBe(invoiceId);
    });

    it('visit không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/visits/00000000-0000-0000-0000-000000000000/invoice`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(404);
    });

    it('DOCTOR không được tạo invoice → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/visits/${visitId}/invoice`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);
    });
  });

  // ─── UC-16: GET /invoices ─────────────────────────────────────────────────────

  describe('UC-16 — GET /invoices', () => {
    it('CASHIER GET /invoices → 200 mảng invoice', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/invoices`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('MANAGER GET /invoices → 200', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/invoices`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });

    it('DOCTOR không được GET /invoices → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/invoices`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);
    });

    it('filter status=ISSUED → chỉ trả về ISSUED', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/invoices?status=ISSUED`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      const items = res.body as Array<{ status: string }>;
      expect(items.every((i) => i.status === 'ISSUED')).toBe(true);
    });

    it('GET /invoices/:id → 200 chi tiết invoice', async () => {
      if (!invoiceId) return;
      const res = await request(app.getHttpServer())
        .get(`${BASE}/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      expect(res.body.id).toBe(invoiceId);
      expect(Array.isArray(res.body.items)).toBe(true);
      expect(Array.isArray(res.body.payments)).toBe(true);
    });

    it('GET /invoices/:id không tồn tại → 404', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/invoices/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(404);
    });
  });

  // ─── UC-15: POST /invoices/:id/payments ───────────────────────────────────────

  describe('UC-15 — POST /invoices/:id/payments', () => {
    it('thanh toán một phần thành công → paidAmount tăng, status PARTIALLY_PAID', async () => {
      if (!invoiceId) return;

      const detail = await request(app.getHttpServer())
        .get(`${BASE}/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      const total = Number(detail.body.totalAmount);
      const partial = Math.floor(total / 2);

      const res = await request(app.getHttpServer())
        .post(`${BASE}/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ amount: partial, method: 'CASH' })
        .expect(201);

      expect(res.body.status).toBe('PARTIALLY_PAID');
      expect(Number(res.body.paidAmount)).toBe(partial);
    });

    it('thanh toán phần còn lại → status PAID', async () => {
      if (!invoiceId) return;

      const detail = await request(app.getHttpServer())
        .get(`${BASE}/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);

      const remaining =
        Number(detail.body.totalAmount) - Number(detail.body.paidAmount);

      const res = await request(app.getHttpServer())
        .post(`${BASE}/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ amount: remaining, method: 'TRANSFER' })
        .expect(201);

      expect(res.body.status).toBe('PAID');
    });

    it('thanh toán invoice đã PAID → 400', async () => {
      if (!invoiceId) return;

      await request(app.getHttpServer())
        .post(`${BASE}/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ amount: 1000, method: 'CASH' })
        .expect(400);
    });

    it('amount <= 0 → 400', async () => {
      if (!invoiceId) return;

      await request(app.getHttpServer())
        .post(`${BASE}/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ amount: 0, method: 'CASH' })
        .expect(400);
    });

    it('amount vượt remaining → 400', async () => {
      // Tạo invoice mới để test case này
      // (invoice cũ đã PAID)
      const prisma = new PrismaClient();
      let testVisitId: string | undefined;
      let testInvoiceId: string | undefined;
      try {
        const receptionist = await prisma.user.findFirst({
          where: { email: USERS.receptionist.email },
        });
        const newPatient = await prisma.patient.create({
          data: {
            patientCode: `BN-OVR${Date.now()}`,
            fullName: 'Overpay Test',
            phone: `08${Date.now().toString().slice(-8)}`,
          },
        });
        const newVisit = await prisma.visit.create({
          data: {
            patientId: newPatient.id,
            visitDate: new Date('2099-07-01'),
            queueNumber: 800 + (Date.now() % 99),
            status: 'COMPLETED',
            createdByUserId: receptionist!.id,
          },
        });
        testVisitId = newVisit.id;
        const invoice = await prisma.invoice.create({
          data: {
            visitId: testVisitId,
            totalAmount: 100000,
            paidAmount: 0,
            status: 'ISSUED',
            items: {
              create: [
                {
                  description: 'Test',
                  quantity: 1,
                  unitPrice: 100000,
                  lineTotal: 100000,
                },
              ],
            },
          },
        });
        testInvoiceId = invoice.id;
      } finally {
        await prisma.$disconnect();
      }

      if (!testInvoiceId) return;

      await request(app.getHttpServer())
        .post(`${BASE}/invoices/${testInvoiceId}/payments`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ amount: 200000, method: 'CASH' })
        .expect(400);
    });

    it('DOCTOR không được ghi nhận payment → 403', async () => {
      if (!invoiceId) return;

      await request(app.getHttpServer())
        .post(`${BASE}/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ amount: 50000, method: 'CASH' })
        .expect(403);
    });
  });

  // ─── UC-17: Regulations ───────────────────────────────────────────────────────

  describe('UC-17 — GET/POST/PATCH /regulations', () => {
    it('GET /regulations/current → 200 với active version', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/regulations/current`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('items');
      expect(res.body.isActive).toBe(true);
    });

    it('DOCTOR có thể xem regulations → 200', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/regulations/current`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);
    });

    it('ADMIN tạo bản quy định mới → 201 isActive=false', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/regulations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          note: 'Bản test E2E',
          items: [
            { key: 'MAX_PATIENTS_PER_DAY', value: '35' },
            { key: 'CONSULTATION_FEE', value: '200000' },
          ],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.isActive).toBe(false);
      expect(res.body.items).toHaveLength(2);
      regulationVersionId = res.body.id as string;
    });

    it('items trùng key → 400', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/regulations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            { key: 'MAX_PATIENTS_PER_DAY', value: '30' },
            { key: 'MAX_PATIENTS_PER_DAY', value: '40' },
          ],
        })
        .expect(400);
    });

    it('key không hợp lệ → 400', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/regulations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ key: 'UNKNOWN_KEY', value: '999' }],
        })
        .expect(400);
    });

    it('MANAGER không được tạo regulation → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/regulations`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ items: [{ key: 'CONSULTATION_FEE', value: '100000' }] })
        .expect(403);
    });

    it('ADMIN activate bản quy định mới → 200 isActive=true', async () => {
      if (!regulationVersionId) return;

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/regulations/${regulationVersionId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.isActive).toBe(true);
      expect(res.body.id).toBe(regulationVersionId);
    });

    it('activate lần 2 → 400 đã active', async () => {
      if (!regulationVersionId) return;

      await request(app.getHttpServer())
        .patch(`${BASE}/regulations/${regulationVersionId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('GET /regulations/current sau activate → trả về bản mới', async () => {
      if (!regulationVersionId) return;

      const res = await request(app.getHttpServer())
        .get(`${BASE}/regulations/current`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body.id).toBe(regulationVersionId);
    });
  });

  // ─── UC-20: Báo cáo tháng ────────────────────────────────────────────────────

  describe('UC-20 — GET /reports/monthly', () => {
    it('MANAGER GET /reports/monthly?month=2099-06 → 200 có visits + revenue', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/reports/monthly?month=2099-06`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('month');
      expect(res.body).toHaveProperty('visits');
      expect(res.body).toHaveProperty('revenue');
      expect(res.body.month).toBe('2099-06');
    });

    it('ADMIN cũng có thể xem report → 200', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/reports/monthly?month=2099-06`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('CASHIER không được xem reports → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/reports/monthly?month=2099-06`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    it('format month sai → 400', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/reports/monthly?month=06-2099`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(400);
    });

    it('thiếu month param → 400', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/reports/monthly`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(400);
    });
  });
});
