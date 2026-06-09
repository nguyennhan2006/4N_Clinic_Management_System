# 02 — Tech Stack và Kiến trúc Hệ thống

---

## 1. Bảng Tech Stack

| Lớp | Công nghệ/Thư viện | Phiên bản | Bằng chứng file path | Vai trò | Trạng thái |
|---|---|---|---|---|---|
| **Frontend Framework** | React | 19.2.0 | `frontend/package.json` | UI framework chính | CONFIRMED |
| **Build Tool** | Vite | 7.2.2 | `frontend/package.json` | Build + dev server | CONFIRMED |
| **Language** | TypeScript | 5.9.3 | `frontend/tsconfig.json` | Type safety | CONFIRMED |
| **Styling** | Tailwind CSS | 4.3.0 | `frontend/package.json` | Utility-first CSS | CONFIRMED |
| **Component** | shadcn/ui (Radix-based) | — | `frontend/src/components/ui/` | Accessible components | CONFIRMED |
| **Routing** | React Router | 7.15.1 | `frontend/src/app/router.tsx` | Client-side routing | CONFIRMED |
| **Server State** | TanStack Query | 5.100.10 | `frontend/package.json` | Data fetching + caching | CONFIRMED |
| **Local State** | Zustand | 5.0.13 | `frontend/src/features/auth/store.ts` | Auth state management | CONFIRMED |
| **Forms** | React Hook Form | 7.76.0 | `frontend/package.json` | Form management | CONFIRMED |
| **Validation** | Zod | 4.4.3 | `frontend/package.json` | Schema validation | CONFIRMED |
| **Table** | TanStack Table | 8.21.3 | `frontend/package.json` | Data tables | CONFIRMED |
| **Icons** | Lucide React | 1.16.0 | `frontend/package.json` | Icon library | CONFIRMED |
| **Dates** | date-fns | 4.2.0 | `frontend/package.json` | Date formatting | CONFIRMED |
| **Toast** | Sonner | 2.0.7 | `frontend/package.json` | Notifications | CONFIRMED |
| **Backend Framework** | NestJS | 11.0.1 | `backend/package.json` | REST API framework | CONFIRMED |
| **ORM** | Prisma | 6.16.2 | `backend/package.json` | Database access | CONFIRMED |
| **Database** | PostgreSQL | (external) | `backend/.env.example` | Relational DB | CONFIRMED |
| **Authentication** | Passport JWT | 4.0.1 | `backend/package.json` | JWT strategy | CONFIRMED |
| **JWT** | @nestjs/jwt | 11.0.2 | `backend/package.json` | Token issue/verify | CONFIRMED |
| **Password** | bcrypt | 6.0.0 | `backend/package.json` | Password hashing | CONFIRMED |
| **Validation (BE)** | class-validator + class-transformer | 0.15.1 | `backend/package.json` | DTO validation | CONFIRMED |
| **API Docs** | @nestjs/swagger | 11.4.1 | `backend/package.json` | OpenAPI/Swagger UI | CONFIRMED |
| **Testing** | Jest + Supertest | 30.0 | `backend/package.json` | E2E + Unit testing | CONFIRMED |
| **Linting** | ESLint + typescript-eslint | 9.x | `frontend/package.json`, `backend/package.json` | Code quality | CONFIRMED |

---

## 2. Bằng chứng kiến trúc hệ thống

### Architecture Evidence

| Kiến trúc/Pattern | Phù hợp không? | Bằng chứng | Cách trình bày trong báo cáo | Rủi ro |
|---|---|---|---|---|
| **Client–Server** | Có | Frontend SPA tách riêng, gọi backend qua REST API. File: `frontend/src/lib/api-client.ts` | Vẽ diagram: Browser → React SPA → REST/JSON → NestJS API → PostgreSQL | Không |
| **Modular Monolith** | Có | Backend chia 20 feature modules trong `src/modules/`, mỗi module có controller+service+dto riêng | Trình bày: mỗi module là một "bounded context" nhỏ | Không |
| **Layered Architecture** | Có | Controller → Service → Prisma (Repository). Không có controller nào gọi Prisma trực tiếp | Vẽ layer diagram: Controller Layer → Service Layer → Data Access Layer | PARTIAL: một số service có logic lẫn lộn |
| **REST API** | Có | Tất cả endpoint theo chuẩn HTTP verbs GET/POST/PATCH/PUT/DELETE | Trình bày URL pattern trong Chương 3 | Không |
| **Feature-based Frontend** | Có | `frontend/src/features/` chia theo nghiệp vụ, mỗi feature có api.ts + types.ts + page | Phù hợp báo cáo về thiết kế giao diện | Không |
| **JWT Stateless Auth** | Có | Access token (1d) + Refresh token (7d), không có session server-side | Trình bày trong Chương 3 | Không |
| **RBAC** | Có | Role enum trong schema, RolesGuard trong common/guards, @Roles() decorator | Ma trận phân quyền trong Chương 1/3 | NEED_MANUAL_CONFIRMATION: một số endpoint thiếu role decorator cụ thể |

---

## 3. Chi tiết kiến trúc hệ thống

### 3.1. Luồng giao tiếp Frontend → Backend

```
Người dùng
    ↓ HTTP Request (HTTPS)
React SPA (Vite, port 5173)
    ↓ fetch với Bearer Token
    lib/api-client.ts (centralized HTTP client)
    ↓ REST/JSON
NestJS API Server (port 3000)
    ↓ JwtAuthGuard → RolesGuard → Controller
    ↓ Service (business logic)
    ↓ PrismaService
PostgreSQL Database
```

**Bằng chứng**: `frontend/src/lib/api-client.ts` — apiClient tự động đính kèm `Authorization: Bearer <token>` từ Zustand store

### 3.2. Backend Module Structure

```
AppModule (app.module.ts)
├── PrismaModule          → PrismaService (database connection)
├── AuthModule            → login, refresh, logout, /me
├── UsersModule           → user CRUD
├── RbacModule            → roles/permissions
├── PatientsModule        → patient management
├── VisitsModule          → visit intake, open examination
├── ExaminationsModule    → examination + prescription
├── PrescriptionsModule   → shared prescription service
├── DiseasesModule        → disease catalog
├── DrugsModule           → drug catalog
├── BillingModule         → invoice + payment + items
├── RegulationsModule     → regulation versions
├── ReportsModule         → monthly + revenue breakdown
├── AppointmentsModule    → scheduling (Phase 2)
├── QueueModule           → queue tickets (Phase 2)
├── VitalsModule          → vital signs (Phase 2)
├── ServicesModule        → service catalog + orders (Phase 2)
├── LabModule             → lab orders/samples/results (Phase 2)
├── InventoryModule       → stock lots + movements (Phase 2)
├── PharmacyModule        → dispense (Phase 2)
├── OrganizationModule    → dept/room/doctor/schedule (Phase 2)
└── AuditModule           → audit logs (Phase 2)
```

**Bằng chứng**: `backend/src/app.module.ts`

### 3.3. Controller → Service → Database pattern

Mỗi module theo pattern:
1. **Controller**: nhận request, validate DTO, gọi service, trả response
2. **Service**: chứa toàn bộ business logic, gọi PrismaService
3. **PrismaService**: Prisma Client instance (singleton), gọi database

**Bằng chứng không tìm thấy vi phạm**: Không có controller nào dùng `this.prisma.*` trực tiếp — tất cả đều qua service

### 3.4. Authentication flow

```
POST /api/auth/login
  ↓ AuthService.login() — validate bcrypt hash
  ↓ JwtService.sign() — tạo access token (1d) + refresh token (7d)
  ↓ Lưu refreshToken hash vào DB (model RefreshToken)
  ← { accessToken, refreshToken }

Các request tiếp theo:
  Authorization: Bearer <accessToken>
  ↓ JwtAuthGuard → passport-jwt verify
  ↓ RolesGuard → kiểm tra @Roles() decorator với role từ DB
  ↓ Controller
```

**Bằng chứng**: `backend/src/modules/auth/auth.service.ts`, `backend/src/common/guards/`

---

## 4. Gợi ý viết Chương 2 — Thiết kế hệ thống

- Vẽ **System Context Diagram**: Actor (5 roles) → Browser → React SPA → REST API → PostgreSQL
- Vẽ **Container Diagram**: Frontend SPA, API Server, Database (3 containers)
- Vẽ **Component Diagram** cho backend: 20 modules + PrismaModule + Common
- Ghi rõ: kiến trúc là **Modular Monolith** + **Layered Architecture** — không phải microservices
- Đề cập: stateless JWT auth, không có session store
- Đề cập: Swagger UI tại `http://localhost:3000/api/docs` là bằng chứng API documentation
