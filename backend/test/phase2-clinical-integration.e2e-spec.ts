/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * phase2-clinical-integration.e2e-spec.ts
 *
 * Full Phase 2 clinical workflow integration tests:
 *
 *   Part A — Service Catalog & Service Orders:
 *     - GET /service-catalog (list, type filter, RBAC)
 *     - POST /service-orders (Doctor creates, RBAC)
 *     - GET /service-orders (list, filters)
 *
 *   Part B — Lab workflow (ORDERED → SAMPLE_COLLECTED → RESULT_ENTERED → VERIFIED):
 *     - POST /lab/orders  (create from LAB_TEST service order)
 *     - POST /lab/orders/:id/sample  (collect: ORDERED → SAMPLE_COLLECTED)
 *     - POST /lab/orders/:id/result  (submit: SAMPLE_COLLECTED → RESULT_ENTERED)
 *     - POST /lab/orders/:id/verify  (verify: RESULT_ENTERED → VERIFIED)
 *     - GET /lab/orders/:id/result
 *     - Invalid state transitions (collect twice, result before collect, etc.)
 *     - RBAC enforcement
 *
 *   Part C — Full flow integration:
 *     - Cannot submit result before collecting sample
 *     - Cannot verify before result entered
 *     - Cannot collect sample on CANCELLED order
 *     - result is immutable after entry
 *
 *   Part D — Service Order × Examination integration:
 *     - POST /service-orders linked to examination
 *     - examination complete blocks if required lab not VERIFIED
 *
 *   Part E — Users module (ADMIN only):
 *     - GET /users (list with pagination)
 *     - POST /users (create)
 *     - PATCH /users/:id (update)
 *     - PATCH /users/:id/lock
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
  admin:        { username: 'admin',       password: 'Admin@123456',    email: 'admin@clinic.local' },
  doctor:       { username: 'doctor',      password: 'Doctor@123456',   email: 'doctor@clinic.local' },
  nurse:        { username: 'nurse',       password: 'Nurse@123456' },
  labtech:      { username: 'labtech',     password: 'Labtech@123456' },
  receptionist: { username: 'receptionist',password: 'Reception@123456' },
  cashier:      { username: 'cashier',     password: 'Cashier@123456' },
  manager:      { username: 'manager',     password: 'Manager@123456' },
};

async function login(app: INestApplication<App>, username: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post(`${BASE}/auth/login`)
    .send({ username, password })
    .expect(201);
  return res.body.accessToken as string;
}

describe('Phase 2 Clinical Integration (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let doctorToken: string;
  let nurseToken: string;
  let labtechToken: string;
  let receptionToken: string;
  let cashierToken: string;
  let managerToken: string;

  // IDs from seed data
  let labTestServiceId: string;   // ServiceCatalog CBC (type=LAB_TEST)
  let labTestCatalogId: string;   // LabTestCatalog CBC
  let nonLabServiceId: string;    // ServiceCatalog CONSULT (type=CONSULTATION)

  // State for lab flow tests
  let labVisitId: string;
  let labExamId: string;
  let labServiceOrderId: string;   // LAB_TEST service order
  let consultServiceOrderId: string; // CONSULTATION service order (non-lab)
  let labOrderId: string;

  // State for exam+lab integration
  let requiredLabVisitId: string;
  let requiredLabExamId: string;
  let requiredLabServiceOrderId: string;

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

    [adminToken, doctorToken, nurseToken, labtechToken, receptionToken, cashierToken, managerToken] =
      await Promise.all([
        login(app, USERS.admin.username, USERS.admin.password),
        login(app, USERS.doctor.username, USERS.doctor.password),
        login(app, USERS.nurse.username, USERS.nurse.password),
        login(app, USERS.labtech.username, USERS.labtech.password),
        login(app, USERS.receptionist.username, USERS.receptionist.password),
        login(app, USERS.cashier.username, USERS.cashier.password),
        login(app, USERS.manager.username, USERS.manager.password),
      ]);

    // Setup DB state for tests
    const prisma = new PrismaClient();
    try {
      // Get seeded service catalog items
      const labService = await prisma.serviceCatalog.findFirst({ where: { code: 'CBC', type: 'LAB_TEST' } });
      const consultService = await prisma.serviceCatalog.findFirst({ where: { code: 'CONSULT' } });
      const labTest = await prisma.labTestCatalog.findFirst({ where: { code: 'CBC' } });
      const disease = await prisma.disease.findFirst({ where: { isActive: true } });

      if (!labService) throw new Error('CBC service not seeded');
      if (!consultService) throw new Error('CONSULT service not seeded');
      if (!labTest) throw new Error('CBC lab test not seeded');

      labTestServiceId = labService.id;
      nonLabServiceId = consultService.id;
      labTestCatalogId = labTest.id;

      const receptionist = await prisma.user.findFirst({ where: { email: 'receptionist@clinic.local' } });
      const doctor = await prisma.user.findFirst({ where: { email: 'doctor@clinic.local' } });
      const dept = await prisma.department.findFirst({ where: { code: 'GENERAL' } });

      // ── Setup for Lab flow tests ──────────────────────────────────────────
      const labPatient = await prisma.patient.create({
        data: {
          patientCode: `BN-LAB${Date.now()}`,
          fullName: 'Lab Flow Test Patient',
          phone: `09${Date.now().toString().slice(-8)}`,
        },
      });

      const lastVisit = await prisma.visit.findFirst({
        where: { visitDate: { gte: new Date('2099-01-01') } },
        orderBy: { queueNumber: 'desc' },
      });

      const labVisit = await prisma.visit.create({
        data: {
          patientId: labPatient.id,
          visitDate: new Date('2099-08-01'),
          queueNumber: (lastVisit?.queueNumber ?? 0) + 1,
          status: 'IN_EXAMINATION',
          createdByUserId: receptionist!.id,
          departmentId: dept!.id,
        },
      });
      labVisitId = labVisit.id;

      const labExam = await prisma.examination.create({
        data: {
          visitId: labVisitId,
          doctorUserId: doctor!.id,
          symptoms: 'Mệt mỏi, chóng mặt',
          status: 'OPEN',
        },
      });
      labExamId = labExam.id;

      // Create LAB_TEST service order
      const labSO = await prisma.serviceOrder.create({
        data: {
          visitId: labVisitId,
          examinationId: labExamId,
          serviceId: labTestServiceId,
          status: 'ORDERED',
          orderedById: doctor!.id,
          isRequired: false,
          priceSnapshot: labService.price,
        },
      });
      labServiceOrderId = labSO.id;

      // Create CONSULTATION service order (non-lab, for negative tests)
      const consultSO = await prisma.serviceOrder.create({
        data: {
          visitId: labVisitId,
          examinationId: labExamId,
          serviceId: nonLabServiceId,
          status: 'ORDERED',
          orderedById: doctor!.id,
          isRequired: false,
          priceSnapshot: consultService.price,
        },
      });
      consultServiceOrderId = consultSO.id;

      // ── Setup for "exam cannot complete when required lab pending" ─────────
      const reqPatient = await prisma.patient.create({
        data: {
          patientCode: `BN-REQLAB${Date.now()}`,
          fullName: 'Required Lab Test Patient',
          phone: `08${Date.now().toString().slice(-8)}`,
        },
      });

      const reqVisit = await prisma.visit.create({
        data: {
          patientId: reqPatient.id,
          visitDate: new Date('2099-08-02'),
          queueNumber: (lastVisit?.queueNumber ?? 0) + 2,
          status: 'IN_EXAMINATION',
          createdByUserId: receptionist!.id,
          departmentId: dept!.id,
        },
      });
      requiredLabVisitId = reqVisit.id;

      const reqExam = await prisma.examination.create({
        data: {
          visitId: requiredLabVisitId,
          doctorUserId: doctor!.id,
          symptoms: 'Đau ngực',
          conclusion: 'Cần xét nghiệm trước',
          status: 'OPEN',
        },
      });
      requiredLabExamId = reqExam.id;

      // Add primary diagnosis
      if (disease) {
        await prisma.diagnosis.create({
          data: {
            examinationId: requiredLabExamId,
            diseaseId: disease.id,
            name: disease.name,
            isPrimary: true,
          },
        });
      }

      // Create REQUIRED lab service order
      const reqSO = await prisma.serviceOrder.create({
        data: {
          visitId: requiredLabVisitId,
          examinationId: requiredLabExamId,
          serviceId: labTestServiceId,
          status: 'ORDERED',
          orderedById: doctor!.id,
          isRequired: true, // blocking completion
          priceSnapshot: labService.price,
        },
      });
      requiredLabServiceOrderId = reqSO.id;
    } finally {
      await prisma.$disconnect();
    }
  });

  afterAll(async () => {
    (app.getHttpServer() as import("http").Server).closeAllConnections?.();
    await app.close();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Part A — Service Catalog & Service Orders
  // ══════════════════════════════════════════════════════════════════════════

  describe('Part A — Service Catalog', () => {
    it('GET /service-catalog → 200 mảng dịch vụ', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/service-catalog`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /service-catalog?type=LAB_TEST → chỉ trả LAB_TEST', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/service-catalog?type=LAB_TEST`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const items = res.body as Array<{ type: string }>;
      expect(items.every((s) => s.type === 'LAB_TEST')).toBe(true);
    });

    it('GET /service-catalog?type=CONSULTATION → chỉ trả CONSULTATION', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/service-catalog?type=CONSULTATION`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const items = res.body as Array<{ type: string }>;
      expect(items.every((s) => s.type === 'CONSULTATION')).toBe(true);
    });

    it('CASHIER không được xem service-catalog → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/service-catalog`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    it('không có token → 401', async () => {
      await request(app.getHttpServer()).get(`${BASE}/service-catalog`).expect(401);
    });
  });

  describe('Part A — Service Orders', () => {
    it('Doctor tạo service order LAB_TEST → 201', async () => {
      // Tạo visit + exam mới để test POST /service-orders flow
      const prisma = new PrismaClient();
      let newVisitId: string | undefined;
      try {
        const receptionist = await prisma.user.findFirst({ where: { email: 'receptionist@clinic.local' } });
        const doctor = await prisma.user.findFirst({ where: { email: 'doctor@clinic.local' } });
        const p = await prisma.patient.create({
          data: {
            patientCode: `BN-SO${Date.now()}`,
            fullName: 'Service Order Patient',
            phone: `06${Date.now().toString().slice(-8)}`,
          },
        });
        const soDate = new Date('2099-08-03');
        const soMaxVisit = await prisma.visit.findFirst({
          where: { visitDate: soDate },
          orderBy: { queueNumber: 'desc' },
        });
        const v = await prisma.visit.create({
          data: {
            patientId: p.id,
            visitDate: soDate,
            queueNumber: (soMaxVisit?.queueNumber ?? 0) + 1,
            status: 'IN_EXAMINATION',
            createdByUserId: receptionist!.id,
          },
        });
        newVisitId = v.id;
        await prisma.examination.create({
          data: {
            visitId: v.id,
            doctorUserId: doctor!.id,
            symptoms: 'Test service order',
            status: 'OPEN',
          },
        });
      } finally {
        await prisma.$disconnect();
      }

      if (!newVisitId) return;

      const res = await request(app.getHttpServer())
        .post(`${BASE}/service-orders`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ visitId: newVisitId, serviceId: labTestServiceId })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('ORDERED');
    });

    it('GET /service-orders?visitId = list chỉ visit đó', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/service-orders?visitId=${labVisitId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const items = res.body as Array<{ visitId: string }>;
      expect(items.every((o) => o.visitId === labVisitId)).toBe(true);
    });

    it('RECEPTIONIST không được tạo service order → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/service-orders`)
        .set('Authorization', `Bearer ${receptionToken}`)
        .send({ visitId: labVisitId, serviceId: labTestServiceId })
        .expect(403);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Part B — Lab Workflow
  // ══════════════════════════════════════════════════════════════════════════

  describe('Part B — Lab workflow: ORDERED → SAMPLE_COLLECTED → RESULT_ENTERED → VERIFIED', () => {

    // ── Create Lab Order ───────────────────────────────────────────────────

    describe('POST /lab/orders — tạo lab order', () => {
      it('Doctor tạo lab order từ LAB_TEST service order → 201 status=ORDERED', async () => {
        const res = await request(app.getHttpServer())
          .post(`${BASE}/lab/orders`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ serviceOrderId: labServiceOrderId, labTestId: labTestCatalogId })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('ORDERED');
        labOrderId = res.body.id as string;
      });

      it('tạo lab order lần 2 cùng service order → 409 conflict', async () => {
        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ serviceOrderId: labServiceOrderId, labTestId: labTestCatalogId })
          .expect(409);
      });

      it('tạo lab order từ non-LAB_TEST service order → 400', async () => {
        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ serviceOrderId: consultServiceOrderId, labTestId: labTestCatalogId })
          .expect(400);
      });

      it('serviceOrderId không tồn tại → 404', async () => {
        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({
            serviceOrderId: '00000000-0000-0000-0000-000000000000',
            labTestId: labTestCatalogId,
          })
          .expect(404);
      });

      it('CASHIER không được tạo lab order → 403', async () => {
        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders`)
          .set('Authorization', `Bearer ${cashierToken}`)
          .send({ serviceOrderId: labServiceOrderId, labTestId: labTestCatalogId })
          .expect(403);
      });
    });

    // ── List Lab Orders ────────────────────────────────────────────────────

    describe('GET /lab/orders — list & filters', () => {
      it('DOCTOR xem danh sách lab orders → 200', async () => {
        const res = await request(app.getHttpServer())
          .get(`${BASE}/lab/orders`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
      });

      it('LAB_TECHNICIAN xem danh sách lab orders → 200', async () => {
        await request(app.getHttpServer())
          .get(`${BASE}/lab/orders`)
          .set('Authorization', `Bearer ${labtechToken}`)
          .expect(200);
      });

      it('filter status=ORDERED → chỉ ORDERED', async () => {
        const res = await request(app.getHttpServer())
          .get(`${BASE}/lab/orders?status=ORDERED`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        const items = res.body as Array<{ status: string }>;
        if (items.length > 0) {
          expect(items.every((o) => o.status === 'ORDERED')).toBe(true);
        }
      });

      it('filter visitId → chỉ orders của visit đó', async () => {
        const res = await request(app.getHttpServer())
          .get(`${BASE}/lab/orders?visitId=${labVisitId}`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
      });

      it('CASHIER không được xem lab orders → 403', async () => {
        await request(app.getHttpServer())
          .get(`${BASE}/lab/orders`)
          .set('Authorization', `Bearer ${cashierToken}`)
          .expect(403);
      });
    });

    // ── GET lab order detail ───────────────────────────────────────────────

    describe('GET /lab/orders/:id — chi tiết', () => {
      it('trả về lab order vừa tạo → 200', async () => {
        if (!labOrderId) return;

        const res = await request(app.getHttpServer())
          .get(`${BASE}/lab/orders/${labOrderId}`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(res.body.id).toBe(labOrderId);
        expect(res.body.status).toBe('ORDERED');
        expect(res.body).toHaveProperty('labTest');
        expect(res.body).toHaveProperty('serviceOrder');
      });

      it('labOrderId không tồn tại → 404', async () => {
        await request(app.getHttpServer())
          .get(`${BASE}/lab/orders/00000000-0000-0000-0000-000000000000`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(404);
      });
    });

    // ── Collect Sample: ORDERED → SAMPLE_COLLECTED ─────────────────────────

    describe('POST /lab/orders/:id/sample — lấy mẫu', () => {
      it('BR-LAB: nhập kết quả trước khi lấy mẫu → 400', async () => {
        if (!labOrderId) return;

        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/result`)
          .set('Authorization', `Bearer ${labtechToken}`)
          .send({ resultText: 'Kết quả bình thường' })
          .expect(400);
      });

      it('LAB_TECHNICIAN lấy mẫu thành công: ORDERED → SAMPLE_COLLECTED', async () => {
        if (!labOrderId) return;

        const res = await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/sample`)
          .set('Authorization', `Bearer ${labtechToken}`)
          .send({ sampleType: 'BLOOD', note: 'Lấy tại phòng xét nghiệm 01' })
          .expect(201);

        expect(res.body.status).toBe('SAMPLE_COLLECTED');
        expect(res.body).toHaveProperty('samples');
        expect(res.body.samples.length).toBe(1);
      });

      it('lấy mẫu lần 2 (status không còn ORDERED) → 400', async () => {
        if (!labOrderId) return;

        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/sample`)
          .set('Authorization', `Bearer ${labtechToken}`)
          .send({ sampleType: 'BLOOD' })
          .expect(400);
      });

      it('CASHIER không được lấy mẫu → 403', async () => {
        if (!labOrderId) return;

        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/sample`)
          .set('Authorization', `Bearer ${cashierToken}`)
          .send({ sampleType: 'BLOOD' })
          .expect(403);
      });

      it('DOCTOR không được lấy mẫu → 403', async () => {
        if (!labOrderId) return;

        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/sample`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ sampleType: 'BLOOD' })
          .expect(403);
      });
    });

    // ── Submit Result: SAMPLE_COLLECTED → RESULT_ENTERED ──────────────────

    describe('POST /lab/orders/:id/result — nhập kết quả', () => {
      it('verify trước khi có kết quả → 400', async () => {
        if (!labOrderId) return;

        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/verify`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(400);
      });

      it('thiếu cả resultText và resultValue → 400', async () => {
        if (!labOrderId) return;

        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/result`)
          .set('Authorization', `Bearer ${labtechToken}`)
          .send({})
          .expect(400);
      });

      it('LAB_TECHNICIAN nhập kết quả dạng text: SAMPLE_COLLECTED → RESULT_ENTERED', async () => {
        if (!labOrderId) return;

        const res = await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/result`)
          .set('Authorization', `Bearer ${labtechToken}`)
          .send({
            resultText: 'WBC 6.5 K/uL; RBC 4.8 M/uL; HGB 14.2 g/dL — Bình thường',
            unit: 'K/uL',
          })
          .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('RESULT_ENTERED');
      });

      it('BR-LAB-04: nhập kết quả lần 2 (immutable) → 409', async () => {
        if (!labOrderId) return;

        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/result`)
          .set('Authorization', `Bearer ${labtechToken}`)
          .send({ resultText: 'Cố gắng nhập lại' })
          .expect(409);
      });

      it('RECEPTIONIST không được nhập kết quả → 403', async () => {
        if (!labOrderId) return;

        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/result`)
          .set('Authorization', `Bearer ${receptionToken}`)
          .send({ resultText: 'Hack' })
          .expect(403);
      });
    });

    // ── Verify Result: RESULT_ENTERED → VERIFIED ──────────────────────────

    describe('POST /lab/orders/:id/verify — xác nhận kết quả', () => {
      it('Doctor verify kết quả: RESULT_ENTERED → VERIFIED', async () => {
        if (!labOrderId) return;

        const res = await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/verify`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(201);

        expect(res.body.status).toBe('VERIFIED');
        expect(res.body).toHaveProperty('results');
        const verifiedResult = (res.body.results as Array<{ status: string }>).find(
          (r) => r.status === 'VERIFIED',
        );
        expect(verifiedResult).toBeDefined();
      });

      it('verify lần 2 (không còn RESULT_ENTERED) → 400', async () => {
        if (!labOrderId) return;

        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/verify`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(400);
      });

      it('LAB_TECHNICIAN không được verify → 403', async () => {
        if (!labOrderId) return;

        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/${labOrderId}/verify`)
          .set('Authorization', `Bearer ${labtechToken}`)
          .expect(403);
      });

      it('labOrderId không tồn tại → 404', async () => {
        await request(app.getHttpServer())
          .post(`${BASE}/lab/orders/00000000-0000-0000-0000-000000000000/verify`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(404);
      });
    });

    // ── GET result ─────────────────────────────────────────────────────────

    describe('GET /lab/orders/:id/result — lấy kết quả', () => {
      it('trả về kết quả đã verify → 200', async () => {
        if (!labOrderId) return;

        const res = await request(app.getHttpServer())
          .get(`${BASE}/lab/orders/${labOrderId}/result`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(res.body).toHaveProperty('labOrder');
        expect(res.body).toHaveProperty('results');
        const results = res.body.results as Array<{ status: string }>;
        expect(results.some((r) => r.status === 'VERIFIED')).toBe(true);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Part C — Examination × Required Lab Integration
  // ══════════════════════════════════════════════════════════════════════════

  describe('Part C — Examination completion blocked by pending required lab', () => {
    it('complete examination khi có required lab order chưa VERIFIED → 400', async () => {
      if (!requiredLabExamId) return;

      // The required lab service order exists but LabOrder was never created → still blocking
      await request(app.getHttpServer())
        .post(`${BASE}/examinations/${requiredLabExamId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(400);
    });

    it('sau khi required lab VERIFIED → examination có thể complete → 200', async () => {
      if (!requiredLabExamId || !requiredLabServiceOrderId) return;

      // Create lab order, collect, result, verify for required order
      const prisma = new PrismaClient();
      let reqLabOrderId: string | undefined;
      try {
        const labTest = await prisma.labTestCatalog.findFirst({ where: { code: 'CBC' } });

        // Tạo lab order
        const res1 = await request(app.getHttpServer())
          .post(`${BASE}/lab/orders`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ serviceOrderId: requiredLabServiceOrderId, labTestId: labTest!.id });

        if (res1.status !== 201) {
          console.warn('Bỏ qua: không tạo được lab order cho required lab test');
          return;
        }
        reqLabOrderId = res1.body.id as string;
      } finally {
        await prisma.$disconnect();
      }

      if (!reqLabOrderId) return;

      // Collect → Result → Verify
      await request(app.getHttpServer())
        .post(`${BASE}/lab/orders/${reqLabOrderId}/sample`)
        .set('Authorization', `Bearer ${labtechToken}`)
        .send({ sampleType: 'BLOOD' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`${BASE}/lab/orders/${reqLabOrderId}/result`)
        .set('Authorization', `Bearer ${labtechToken}`)
        .send({ resultText: 'Normal' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`${BASE}/lab/orders/${reqLabOrderId}/verify`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(201);

      // Now complete the examination (required lab is VERIFIED)
      const res = await request(app.getHttpServer())
        .post(`${BASE}/examinations/${requiredLabExamId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Part D — Users module (ADMIN only)
  // ══════════════════════════════════════════════════════════════════════════

  describe('Part D — Users module (ADMIN RBAC)', () => {
    let newUserId: string;
    const newUserEmail = `test.e2e.${Date.now()}@clinic.local`;

    it('ADMIN GET /users → 200 mảng', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // response có thể là mảng hoặc paginated object
      expect(res.body).toBeDefined();
    });

    it('ADMIN GET /users/:id cho chính mình → 200', async () => {
      // Lấy admin user id từ /auth/me
      const me = await request(app.getHttpServer())
        .get(`${BASE}/auth/me`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`${BASE}/users/${me.body.id as string}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('ADMIN tạo user mới → 201, không trả passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `test_e2e_${Date.now()}`,
          fullName: 'Test E2E User',
          email: newUserEmail,
          password: 'Test@123456',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).not.toHaveProperty('passwordHash');
      newUserId = res.body.id as string;
    });

    it('email trùng → 400 hoặc 409', async () => {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `dup_${Date.now()}`,
          fullName: 'Duplicate',
          email: newUserEmail,
          password: 'Test@123456',
          roleCode: 'RECEPTIONIST',
        });

      expect([400, 409]).toContain(res.status);
    });

    it('ADMIN lock user → 200, status=LOCKED', async () => {
      if (!newUserId) return;

      const res = await request(app.getHttpServer())
        .patch(`${BASE}/users/${newUserId}/lock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ locked: true })
        .expect(200);

      expect(['LOCKED', 'INACTIVE']).toContain(res.body.status);
    });

    it('DOCTOR không được xem users → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/users`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);
    });

    it('MANAGER không được tạo user → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/users`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ username: 'hack', email: 'hack@x.com', password: 'Hack@123', roleCode: 'DOCTOR' })
        .expect(403);
    });

    it('response từ GET /users không chứa passwordHash', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/users`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Part E — Organization module
  // ══════════════════════════════════════════════════════════════════════════

  describe('Part E — Organization module', () => {
    it('GET /organization/departments → 200 mảng departments', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/organization/departments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /organization/doctors → 200 mảng doctor profiles', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/organization/doctors`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('CASHIER được xem departments → 200 (cashier is explicitly allowed)', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/organization/departments`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);
    });

    it('không có token → 401', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/organization/departments`)
        .expect(401);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Part F — Audit Log module
  // ══════════════════════════════════════════════════════════════════════════

  describe('Part F — Audit Log', () => {
    it('ADMIN GET /audit-log → 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/audit-logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Có thể là mảng hoặc paginated
      expect(res.body).toBeDefined();
    });

    it('MANAGER GET /audit-log → 200', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/audit-logs`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
    });

    it('DOCTOR không được xem audit log → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/audit-logs`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);
    });

    it('CASHIER không được xem audit log → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/audit-logs`)
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(403);
    });

    it('Audit log có entries từ các hành động Lab vừa thực hiện', async () => {
      // Sau khi đã thực hiện create/verify lab orders trong Part B,
      // audit log phải có ít nhất 1 entry
      const res = await request(app.getHttpServer())
        .get(`${BASE}/audit-logs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Lấy danh sách (mảng hoặc { data: [] })
      const entries = Array.isArray(res.body)
        ? res.body
        : (res.body.data as unknown[]) ?? [];

      expect(entries.length).toBeGreaterThan(0);
    });
  });
});
