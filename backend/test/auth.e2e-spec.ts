/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { APP_API_PREFIX } from '../src/common/constants/app.constants';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { AppModule } from '../src/app.module';

const BASE = `/${APP_API_PREFIX}`;

const USERS = {
  admin: {
    email: 'admin@clinic.local',
    password: 'Admin@123456',
    role: 'ADMIN',
  },
  doctor: {
    email: 'doctor@clinic.local',
    password: 'Doctor@123456',
    role: 'DOCTOR',
  },
  receptionist: {
    email: 'receptionist@clinic.local',
    password: 'Reception@123456',
    role: 'RECEPTIONIST',
  },
  cashier: {
    email: 'cashier@clinic.local',
    password: 'Cashier@123456',
    role: 'CASHIER',
  },
  manager: {
    email: 'manager@clinic.local',
    password: 'Manager@123456',
    role: 'MANAGER',
  },
};

describe('Auth & RBAC (e2e)', () => {
  let app: INestApplication<App>;
  const tokens: Record<string, string> = {};

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
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Login ───────────────────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it.each(Object.entries(USERS))(
      'login %s trả về accessToken và role đúng',
      async (key, { email, password, role }) => {
        const res = await request(app.getHttpServer())
          .post(`${BASE}/auth/login`)
          .send({ email, password })
          .expect(201);

        expect(res.body).toHaveProperty('accessToken');
        expect(res.body.user.role).toBe(role);
        expect(res.body.user.email).toBe(email);

        tokens[key] = res.body.accessToken as string;
      },
    );

    it('sai password → 401', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: USERS.admin.email, password: 'WrongPass' })
        .expect(401);
    });

    it('email không tồn tại → 401', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: 'nobody@clinic.local', password: 'Whatever123' })
        .expect(401);
    });

    it('thiếu email → 400', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ password: 'Admin@123456' })
        .expect(400);
    });
  });

  // ─── GET /auth/me ─────────────────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('token hợp lệ → trả về thông tin user', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/auth/me`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      expect(res.body.email).toBe(USERS.admin.email);
      expect(res.body.role).toBe('ADMIN');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('không có token → 401', async () => {
      await request(app.getHttpServer()).get(`${BASE}/auth/me`).expect(401);
    });

    it('token sai → 401', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/auth/me`)
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });

  // ─── RBAC: POST /patients ─────────────────────────────────────────────────────

  describe('RBAC — POST /patients', () => {
    const payload = {
      fullName: 'Nguyễn Test RBAC',
      phone: '0900000001',
    };

    it('RECEPTIONIST được phép tạo patient', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/patients`)
        .set('Authorization', `Bearer ${tokens.receptionist}`)
        .send(payload)
        .expect(201);
    });

    it('ADMIN được phép tạo patient', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/patients`)
        .set('Authorization', `Bearer ${tokens.admin}`)
        .send({ ...payload, phone: '0900000002' })
        .expect(201);
    });

    it('DOCTOR không được tạo patient → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/patients`)
        .set('Authorization', `Bearer ${tokens.doctor}`)
        .send(payload)
        .expect(403);
    });

    it('CASHIER không được tạo patient → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/patients`)
        .set('Authorization', `Bearer ${tokens.cashier}`)
        .send(payload)
        .expect(403);
    });

    it('MANAGER không được tạo patient → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/patients`)
        .set('Authorization', `Bearer ${tokens.manager}`)
        .send(payload)
        .expect(403);
    });
  });

  // ─── RBAC: GET /visits ────────────────────────────────────────────────────────

  describe('RBAC — GET /visits', () => {
    it('RECEPTIONIST được xem danh sách visit', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/visits`)
        .set('Authorization', `Bearer ${tokens.receptionist}`)
        .expect(200);
    });

    it('DOCTOR được xem danh sách visit', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/visits`)
        .set('Authorization', `Bearer ${tokens.doctor}`)
        .expect(200);
    });

    it('CASHIER không được xem visit → 403', async () => {
      await request(app.getHttpServer())
        .get(`${BASE}/visits`)
        .set('Authorization', `Bearer ${tokens.cashier}`)
        .expect(403);
    });
  });

  // ─── RBAC: POST /visits/:id/open-examination ──────────────────────────────────

  describe('RBAC — POST /visits/:id/open-examination', () => {
    it('RECEPTIONIST không được mở khám → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/visits/nonexistent-id/open-examination`)
        .set('Authorization', `Bearer ${tokens.receptionist}`)
        .expect(403);
    });

    it('CASHIER không được mở khám → 403', async () => {
      await request(app.getHttpServer())
        .post(`${BASE}/visits/nonexistent-id/open-examination`)
        .set('Authorization', `Bearer ${tokens.cashier}`)
        .expect(403);
    });
  });
});
