# 02 — Tech Stack và Kiến trúc

> Audit date: 2026-06-07 | Version lấy từ package.json thật

---

## 1. Tech Stack (version từ package files)

### Backend — `backend/package.json`

| Công nghệ | Package | Version | Vai trò |
|---|---|---|---|
| Runtime | Node.js | 20+ (LTS) | JavaScript runtime |
| Framework | NestJS | ^11.0.1 (`@nestjs/core`) | Web framework, DI, module system |
| Language | TypeScript | ^5.7.3 | Type-safe backend |
| ORM | Prisma Client | 6.16.2 | DB access, migrations |
| Database | PostgreSQL | 15+ | Relational persistence |
| Auth | Passport.js | ^0.7.0 | Auth strategy framework |
| Auth | JWT | `@nestjs/jwt` | Token generation/validation |
| Auth | passport-jwt | via `@nestjs/passport` | JWT strategy |
| Validation | class-validator + class-transformer | via NestJS | DTO validation pipeline |
| API Docs | @nestjs/swagger | via NestJS | Swagger/OpenAPI |
| Testing | Jest | ^30.0.0 | Unit + E2E test runner |
| Testing | supertest | via `@nestjs/testing` | HTTP E2E assertions |
| Linting | ESLint + prettier | NestJS defaults | Code quality |

### Frontend — `frontend/package.json`

| Công nghệ | Package | Version | Vai trò |
|---|---|---|---|
| Framework | React | ^19.2.0 | UI library |
| Build tool | Vite | ^7.2.2 | Dev server + build |
| Language | TypeScript | ~5.9.3 | Type-safe frontend |
| Styling | Tailwind CSS | ^4.3.0 | Utility CSS (dùng @theme directive) |
| Component library | shadcn/ui | via Radix + Tailwind | Accessible UI components |
| Server state | TanStack Query | ^5.100.10 | Data fetching, caching |
| Data table | TanStack Table | ^8.21.3 | Headless table logic |
| Client state | Zustand | ^5.0.13 | Auth store, global state |
| Forms | React Hook Form | ^7.76.0 | Form management |
| Validation | Zod | ^4.4.3 | Schema validation |
| Icons | lucide-react | via shadcn | Icon library |
| Routing | react-router-dom | via app/router.tsx | Client-side routing |
| HTTP client | Fetch API (custom) | `frontend/src/lib/api-client.ts` | REST calls với Bearer token |

---

## 2. Bằng chứng kiến trúc

### 2.1 Client–Server Architecture

```text
Browser (React SPA)  ←──HTTPS REST/JSON──→  NestJS API Server  ←──Prisma──→  PostgreSQL
   port 5173                                     port 3000                   port 5432
```

- Frontend tại `http://localhost:5173` (Vite dev server)
- Backend tại `http://localhost:3000`, prefix `/api/v1`
- Swagger UI tại `http://localhost:3000/api/docs`
- **CONFIRMED**: `backend/src/main.ts:10` — `app.setGlobalPrefix('api/v1')`
- **CONFIRMED**: `backend/src/main.ts:34` — `SwaggerModule.setup('api/docs', app, document)`
- **CONFIRMED**: `frontend/src/lib/api-client.ts` — HTTP client với `VITE_API_BASE_URL`

### 2.2 Modular Monolith (Backend)

Backend là một NestJS monolith với 21 feature modules được tổ chức theo domain:

```text
AppModule
├── PrismaModule (shared)
├── AuthModule
├── UsersModule
├── RbacModule
├── PatientsModule
├── VisitsModule
├── ExaminationsModule
├── PrescriptionsModule  ← service-only, no controller
├── DiseasesModule
├── DrugsModule
├── BillingModule
├── RegulationsModule
├── ReportsModule
├── AppointmentsModule   ← Phase 2
├── QueueModule          ← Phase 2
├── VitalsModule         ← Phase 2
├── ServicesModule       ← Phase 2
├── LabModule            ← Phase 2
├── InventoryModule      ← Phase 2
├── PharmacyModule       ← Phase 2
├── OrganizationModule   ← Phase 2
└── AuditModule          ← Phase 2
```

**CONFIRMED**: `backend/src/app.module.ts`

### 2.3 Layered Architecture (3 tầng)

```text
Controller (HTTP layer)
    ↓  parse request, call service, return response
Service (Business logic layer)
    ↓  enforce business rules, call Prisma
PrismaService (Data access layer)
    ↓  Prisma Client → PostgreSQL
```

**CONFIRMED**: Pattern nhất quán trong tất cả 20 module có controller.

### 2.4 Feature-based Frontend

```text
frontend/src/features/
├── auth/       (LoginPage, ProtectedRoute, RequireRole, store)
├── dashboard/  (DashboardPage)
├── patients/   (List, Create, Detail, MedicalHistory)
├── visits/     (List, Create)
├── examinations/ (ExaminationPage)
├── invoices/   (List, Detail)
├── reports/    (MonthlyReport)
├── regulations/(RegulationPage)
├── diseases/   (DiseaseCatalog)
├── medicines/  (MedicineCatalog)
├── users/      (UserManagement, RoleManagement)
├── appointments/(List, Create)
├── queue/      (QueueDashboard)
├── lab/        (LabWorklist)
├── inventory/  (StockList)
├── pharmacy/   (PharmacyWorklist)
├── services/   (ServiceCatalog, ServiceOrderSection)
├── organization/(DepartmentList, DoctorProfile)
├── vitals/     (VitalSignSection — embedded component)
└── audit/      (AuditLog)
```

**CONFIRMED**: `frontend/src/features/` — 20 feature folders

### 2.5 JWT Stateless Authentication

Luồng xác thực:

```text
1. POST /api/v1/auth/login → {accessToken, refreshToken}
2. Frontend lưu token (Zustand store)
3. Mỗi request: Authorization: Bearer <accessToken>
4. JwtAuthGuard validate token
5. POST /api/v1/auth/refresh → new accessToken (dùng refreshToken)
6. POST /api/v1/auth/logout → revoke refreshToken
```

- Access token expire: `JWT_ACCESS_EXPIRES=1d` (từ `.env.example`)
- Refresh token expire: `JWT_REFRESH_EXPIRES=7d` (từ `.env.example`)
- Refresh token hash lưu trong DB: `RefreshToken` model trong schema
- **CONFIRMED**: `backend/src/modules/auth/auth.controller.ts`, `auth.service.ts`

### 2.6 RBAC (Role-Based Access Control)

```text
Backend:
  JwtAuthGuard → xác thực JWT
  RolesGuard   → kiểm tra @Roles() decorator
  @Roles(...)  → khai báo trên controller method

Frontend:
  ProtectedRoute   → redirect /login nếu chưa auth
  RequireRole      → redirect /403 nếu thiếu role
  navigationConfig → ẩn sidebar item theo role
```

Roles: `ADMIN`, `RECEPTIONIST`, `DOCTOR`, `CASHIER`, `MANAGER`, `NURSE`, `LAB_TECHNICIAN`, `PHARMACIST`

**CONFIRMED**: `backend/src/common/guards/`, `frontend/src/features/auth/ProtectedRoute.tsx`, `RequireRole.tsx`, `frontend/src/config/navigation.ts`

---

## 3. Luồng dữ liệu tổng quát

```text
User (Browser)
  → React UI (Tailwind + shadcn/ui)
  → API client (fetch + Bearer token)
  → NestJS Controller (validate DTO, check guard)
  → NestJS Service (business rules, prisma.$transaction())
  → Prisma Client
  → PostgreSQL Database
```

---

## 4. Gợi ý diagram cho báo cáo

| Diagram | Mô tả | Công cụ gợi ý |
|---|---|---|
| System Context (C4 L1) | Actor → Browser → API → DB | draw.io |
| Container (C4 L2) | React SPA + NestJS API + PostgreSQL | draw.io |
| Component (C4 L3) | 21 backend modules + dependencies | draw.io |
| JWT Auth Sequence | Login → token → request flow | draw.io / Mermaid |
| Layered Architecture | Controller → Service → Prisma | draw.io |

> **Lưu ý:** Không được gọi kiến trúc này là "microservices". Đây là Modular Monolith — tất cả module chạy trong cùng một process NestJS.
