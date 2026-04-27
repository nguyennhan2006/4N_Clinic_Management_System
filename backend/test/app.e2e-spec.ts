import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { APP_API_PREFIX } from './../src/common/constants/app.constants';

describe('Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(APP_API_PREFIX);
    await app.init();
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/${APP_API_PREFIX}/health`)
      .expect(200);
    const responseBody = response.body as Record<string, unknown>;

    expect(responseBody).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: '4N_Clinic_Management_System Backend',
      }),
    );
    expect(typeof responseBody.timestamp).toBe('string');
  });

  afterEach(async () => {
    await app.close();
  });
});
