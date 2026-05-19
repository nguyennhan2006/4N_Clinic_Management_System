# 🧪 Hướng Dẫn Chạy Test - 4N Clinic Management System

## 📋 Tổng Quan

Dự án sử dụng **Jest** để chạy unit tests và e2e tests. Cấu hình đã sẵn trong `package.json` và `test/jest-e2e.json`.

---

## 🚀 Lệnh Test Khả Dụng

### 1. **Chạy tất cả unit tests**
```bash
cd backend
npm test
```
**Hoặc:**
```bash
npm run test
```

### 2. **Chạy tests ở chế độ watch** (tự động chạy lại khi file thay đổi)
```bash
npm run test:watch
```

### 3. **Chạy tests và hiển thị coverage report**
```bash
npm run test:cov
```
Kết quả coverage sẽ hiển thị trong console.

### 4. **Debug tests**
```bash
npm run test:debug
```
Sau đó mở Chrome DevTools: `chrome://inspect`

### 5. **Chạy E2E tests** (End-to-End)
```bash
npm run test:e2e
```

### 6. **Chạy test cụ thể**
```bash
npm test -- app.controller.spec
```

### 7. **Chạy test với pattern**
```bash
npm test -- --testPathPattern="auth"
```

---

## 📁 Cấu Trúc Test

```
backend/
├── src/
│   ├── app.controller.spec.ts       (Unit test hiện tại)
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.service.spec.ts (cần tạo)
│   │   ├── users/
│   │   │   └── users.service.spec.ts (cần tạo)
│   │   └── ...
├── test/
│   ├── app.e2e-spec.ts              (E2E tests)
│   └── jest-e2e.json                (Jest config cho E2E)
└── package.json                     (Jest config)
```

---

## 🔧 Jest Configuration

**Trong `package.json`:**
```json
"jest": {
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": [
    "**/*.(t|j)s"
  ],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

**Sự nghĩa:**
- `testRegex`: Tìm tất cả file kết thúc bằng `.spec.ts`
- `rootDir`: Tìm tests trong thư mục `src`
- `transform`: Biến TypeScript thành JavaScript với ts-jest
- `coverageDirectory`: Tạo coverage report trong thư mục `coverage`

---

## 📝 Viết Test Đơn Giản

### Ví dụ 1: Unit Test cho Service

Tạo file `backend/src/modules/auth/auth.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate user password', async () => {
    const password = 'Test@123456';
    const hashed = await bcrypt.hash(password, 10);
    
    const result = await bcrypt.compare(password, hashed);
    expect(result).toBe(true);
  });
});
```

### Ví dụ 2: Unit Test cho Controller

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call login method', async () => {
    await controller.login({ email: 'test@clinic.local', password: 'Test@123' });
    expect(service.login).toHaveBeenCalled();
  });
});
```

### Ví dụ 3: E2E Test

Tạo file `backend/test/auth.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Auth API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/login - should login user', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@clinic.local',
        password: 'Admin@123456',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
      });
  });

  it('POST /api/v1/auth/login - should fail with wrong password', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@clinic.local',
        password: 'WrongPassword',
      })
      .expect(401);
  });
});
```

---

## 📊 Coverage Report

Chạy:
```bash
npm run test:cov
```

Kết quả:
```
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        3.456 s

------- Coverage summary -------
Statements   : 25.5% ( 50/196 )
Branches     : 12.3% ( 24/195 )
Functions    : 33.3% ( 10/30 )
Lines        : 24.6% ( 48/195 )
```

---

## 🎯 Best Practices

1. **Mỗi module nên có test file:**
   - `auth.service.spec.ts` - test logic
   - `auth.controller.spec.ts` - test API endpoints

2. **Sử dụng mocks cho dependencies:**
   ```typescript
   const mockPrisma = {
     user: {
       findUnique: jest.fn(),
     },
   };
   ```

3. **Test error cases:**
   ```typescript
   it('should throw error on invalid input', async () => {
     await expect(service.login(null)).rejects.toThrow();
   });
   ```

4. **Sử dụng describe blocks để organize:**
   ```typescript
   describe('AuthService', () => {
     describe('login', () => {
       it('should login successfully', () => { ... });
       it('should reject invalid password', () => { ... });
     });
   });
   ```

---

## 🔗 Tài Liệu Tham Khảo

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest (HTTP testing)](https://github.com/visionmedia/supertest)

---

## ⚡ Mẹo Nhanh

| Lệnh | Mục đích |
|------|---------|
| `npm test` | Chạy tất cả tests |
| `npm test -- --watch` | Chạy tests ở chế độ watch |
| `npm run test:cov` | Xem coverage |
| `npm test -- app.controller` | Chạy test cụ thể |
| `npm test -- --verbose` | Chi tiết output |
| `npm test -- --bail` | Dừng ngay khi test thất bại |

---

**Tiếp theo:** Hãy viết unit tests cho các modules auth, users, patients để tăng code coverage lên 80%!
