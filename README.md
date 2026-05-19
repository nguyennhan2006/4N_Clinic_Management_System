# 4N Clinic Management System

> Hệ thống quản lý phòng mạch tư nhân — Đồ án môn **SE104 – Nhập môn Công nghệ Phần mềm**  
> Trường Đại học Công nghệ Thông tin – ĐHQG TP.HCM

---

## Giới thiệu

**4N Clinic Management System** là web application nội bộ hỗ trợ vận hành phòng mạch tư nhân. Hệ thống bao gồm toàn bộ luồng nghiệp vụ từ tiếp nhận bệnh nhân, khám bệnh, kê đơn thuốc, đến lập hóa đơn và xem báo cáo doanh thu — phục vụ 5 vai trò nhân viên khác nhau với phân quyền riêng biệt.

Dự án được xây dựng theo hướng **backend-first, modular monolith**, REST API, với frontend React kết nối hoàn toàn vào API thực — không dùng dữ liệu giả.

---

## Tính năng chính (Phase 1 — 20 Use Cases)

| UC | Tính năng | Vai trò |
|---|---|---|
| UC01 | Đăng nhập | Tất cả |
| UC02 | Quản lý tài khoản người dùng | Admin |
| UC03 | Phân quyền theo vai trò | Admin |
| UC04 | Tra cứu bệnh nhân | Lễ tân, Bác sĩ |
| UC05 | Tạo hồ sơ bệnh nhân | Lễ tân |
| UC06 | Tiếp nhận bệnh nhân | Lễ tân |
| UC07 | Tạo lượt khám (cấp số thứ tự hàng chờ) | Lễ tân |
| UC08 | Xem danh sách lượt khám theo ngày/trạng thái | Lễ tân, Bác sĩ, Quản lý |
| UC09 | Bác sĩ mở lượt khám | Bác sĩ |
| UC10 | Lập phiếu khám (triệu chứng, chẩn đoán) | Bác sĩ |
| UC11 | Xem lịch sử khám bệnh của bệnh nhân | Bác sĩ |
| UC12 | Kê đơn thuốc | Bác sĩ |
| UC13 | Hoàn tất phiếu khám | Bác sĩ |
| UC14 | Lập hóa đơn | Thu ngân |
| UC15 | Ghi nhận thanh toán | Thu ngân |
| UC16 | Tra cứu hóa đơn | Thu ngân, Quản lý |
| UC17 | Thay đổi quy định phòng mạch | Admin |
| UC18 | Quản lý danh mục bệnh | Admin |
| UC19 | Quản lý danh mục thuốc | Admin |
| UC20 | Xem báo cáo tháng cơ bản | Quản lý, Admin |

---

## Luồng nghiệp vụ chính

```
[Lễ tân] Tạo/tra cứu bệnh nhân → Tạo lượt khám (cấp STT hàng chờ)
    ↓
[Bác sĩ] Mở lượt khám → Nhập triệu chứng & chẩn đoán → Kê đơn thuốc → Hoàn tất
    ↓
[Thu ngân] Lập hóa đơn → Ghi nhận thanh toán (tiền mặt / chuyển khoản / thẻ)
    ↓
[Quản lý / Admin] Xem báo cáo doanh thu tháng
```

---

## Vai trò và phân quyền

| Vai trò | Mô tả chức trách |
|---|---|
| **ADMIN** | Quản trị hệ thống, tài khoản người dùng, quy định, danh mục |
| **RECEPTIONIST** | Tiếp nhận bệnh nhân, tạo lượt khám, quản lý hàng chờ |
| **DOCTOR** | Mở khám, lập phiếu khám, kê đơn thuốc, hoàn tất phiếu khám |
| **CASHIER** | Lập hóa đơn, ghi nhận thanh toán, tra cứu hóa đơn |
| **MANAGER** | Xem báo cáo doanh thu, tra cứu hóa đơn, xem danh sách khám |

---

## Tech Stack

### Backend

| Thành phần | Công nghệ |
|---|---|
| Framework | NestJS 11 + TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Auth | JWT Access Token (1 ngày) + Refresh Token (7 ngày) |
| Validation | class-validator + class-transformer |
| API Docs | Swagger / OpenAPI |
| Test | Jest + Supertest |

### Frontend

| Thành phần | Công nghệ |
|---|---|
| Framework | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Server State | TanStack Query v5 |
| Auth State | Zustand |
| Forms | React Hook Form + Zod |
| Icons | lucide-react |

---

## Cấu trúc repo

```
4N_Clinic_Management_System/
├── backend/                    # NestJS API server
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Đăng nhập, JWT, refresh token
│   │   │   ├── users/          # Quản lý người dùng
│   │   │   ├── rbac/           # Vai trò và quyền hạn
│   │   │   ├── patients/       # Hồ sơ bệnh nhân
│   │   │   ├── visits/         # Lượt khám, hàng chờ
│   │   │   ├── examinations/   # Phiếu khám, đơn thuốc
│   │   │   ├── billing/        # Hóa đơn, thanh toán
│   │   │   ├── diseases/       # Danh mục bệnh
│   │   │   ├── drugs/          # Danh mục thuốc
│   │   │   ├── regulations/    # Quy định phòng mạch
│   │   │   ├── reports/        # Báo cáo tháng
│   │   │   └── audit/          # Nhật ký thao tác
│   │   └── common/             # Guards, decorators, constants
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
│
├── frontend/                   # React SPA
│   └── src/
│       ├── features/           # Mỗi feature là 1 module độc lập
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── patients/
│       │   ├── visits/
│       │   ├── examinations/
│       │   ├── invoices/
│       │   ├── regulations/
│       │   ├── diseases/
│       │   ├── reports/
│       │   └── users/
│       ├── components/
│       │   ├── common/         # Sidebar, Topbar, PageHeader, ...
│       │   └── ui/             # shadcn/ui components
│       ├── lib/                # api-client, date, money, errors
│       └── config/             # navigation, permissions
│
├── docs/                       # Tài liệu thiết kế
│   ├── business/               # Business rules, role matrix
│   ├── architecture/           # Architecture overview
│   ├── api/                    # API scope, error codes
│   └── agile/                  # Backlog, sprint plan
│
├── database/                   # SQL scripts, ERD
├── frontend-docs/              # API inventory, RBAC matrix
└── scripts/                    # Dev utilities
```

---

## Hướng dẫn cài đặt

### Yêu cầu hệ thống

- Node.js ≥ 20
- PostgreSQL ≥ 14
- npm ≥ 10

### 1. Clone repo

```bash
git clone <repo-url>
cd 4N_Clinic_Management_System
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` từ mẫu:

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với thông tin database của bạn:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/clinic_management_db?schema=public"

JWT_ACCESS_SECRET="your_random_secret_here"
JWT_ACCESS_EXPIRES="1d"

JWT_REFRESH_SECRET="your_another_random_secret_here"
JWT_REFRESH_EXPIRES="7d"

PORT=3000
```

Chạy migration và seed dữ liệu mẫu:

```bash
npx prisma migrate deploy
npx prisma db seed
```

Khởi động backend:

```bash
npm run start:dev
```

- API: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
```

Tạo file `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Khởi động frontend:

```bash
npm run dev
```

- Truy cập: `http://localhost:5173`

---

## Tài khoản demo

Sau khi chạy `npx prisma db seed`, hệ thống tạo sẵn 5 tài khoản:

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Admin | `admin` | `Admin@123456` |
| Bác sĩ | `doctor` | `Doctor@123456` |
| Lễ tân | `receptionist` | `Reception@123456` |
| Thu ngân | `cashier` | `Cashier@123456` |
| Quản lý | `manager` | `Manager@123456` |

---

## API Reference

Tất cả endpoint đều có prefix `/api/v1`. Xác thực bằng `Authorization: Bearer <access_token>`.

| Nhóm | Phương thức | Endpoint |
|---|---|---|
| Auth | POST | `/auth/login` |
| Auth | POST | `/auth/refresh` |
| Auth | POST | `/auth/logout` |
| Auth | GET | `/auth/me` |
| Users | GET / POST | `/users` |
| Users | GET / PATCH | `/users/:id` |
| Users | PATCH | `/users/:id/roles` |
| Users | PATCH | `/users/:id/lock` |
| RBAC | GET | `/rbac/roles` |
| RBAC | GET | `/rbac/permissions` |
| RBAC | PATCH | `/rbac/roles/:id/permissions` |
| Patients | GET / POST | `/patients` |
| Patients | GET | `/patients/:id` |
| Patients | GET | `/patients/:id/medical-history` |
| Visits | GET / POST | `/visits` |
| Visits | POST | `/visits/:id/open-examination` |
| Examinations | GET / PATCH | `/examinations/:id` |
| Examinations | PUT | `/examinations/:id/prescription` |
| Examinations | POST | `/examinations/:id/complete` |
| Billing | POST | `/visits/:id/invoice` |
| Billing | GET | `/invoices` |
| Billing | GET | `/invoices/:id` |
| Billing | POST | `/invoices/:id/payments` |
| Diseases | GET / POST | `/diseases` |
| Diseases | PATCH | `/diseases/:id` |
| Drugs | GET / POST | `/drugs` |
| Drugs | PATCH | `/drugs/:id` |
| Regulations | GET | `/regulations/current` |
| Regulations | POST | `/regulations` |
| Regulations | PATCH | `/regulations/:id/activate` |
| Reports | GET | `/reports/monthly?month=YYYY-MM` |

Chi tiết request/response xem đầy đủ tại Swagger: `http://localhost:3000/api/docs`

---

## Lệnh thường dùng

```bash
# Backend
cd backend
npm run start:dev          # Dev server (hot reload)
npm run build              # Build production
npm run test               # Unit tests
npm run test:e2e           # E2E tests
npx prisma migrate dev     # Tạo migration mới sau khi sửa schema
npx prisma studio          # GUI xem và chỉnh sửa database
npx prisma db seed         # Seed dữ liệu mẫu

# Frontend
cd frontend
npm run dev                # Dev server
npm run build              # Build production
npm run lint               # Kiểm tra lint
```

---

## Kiến trúc hệ thống

```
Browser — React SPA (Vite)
        │
        │  HTTPS REST + Bearer Token
        ▼
NestJS API Server  :3000/api/v1
  ├── JwtAuthGuard      ← xác thực access token
  ├── RolesGuard        ← kiểm tra vai trò trên từng route
  ├── Feature Modules   ← toàn bộ business logic ở service layer
  └── Prisma Client
        │
        ▼
PostgreSQL Database
```

**Nguyên tắc thiết kế:**

- Frontend chỉ gọi API — không chứa business logic.
- Backend là nguồn chốt cho mọi validation và phân quyền.
- JWT stateless: access token ngắn hạn (1 ngày), refresh token rotation (7 ngày).
- RBAC enforce ở backend bằng `RolesGuard` + `@Roles()` decorator trên từng route.
- Mọi transaction quan trọng (tạo lượt khám, ghi nhận thanh toán) dùng `prisma.$transaction()`.

---

## Tài liệu kỹ thuật

| Tài liệu | Đường dẫn |
|---|---|
| Business Rules | `docs/business/business-rules.md` |
| Role Matrix | `docs/business/role-matrix.md` |
| Architecture Overview | `docs/architecture/architecture-overview.md` |
| API Scope | `docs/api/api-scope.md` |
| Error Codes | `docs/api/error-codes.md` |
| Sprint Plan | `docs/agile/sprint-plan.md` |
| API Endpoint Inventory | `frontend-docs/api-endpoint-inventory.md` |
| RBAC Matrix (Frontend) | `frontend-docs/rbac-matrix.md` |

---

## Ngoài phạm vi Phase 1

Những tính năng sau được xác định là **Phase 2** và chưa triển khai:

- Đặt lịch hẹn online
- Portal bệnh nhân (self-service)
- SMS / Email nhắc nhở tự động
- Quản lý tồn kho thuốc (nhập / xuất / tồn kho)
- Hệ thống bảo hiểm y tế
- Multi-branch / multi-tenant
- Analytics nâng cao / BI dashboard
- Telemedicine
- Xét nghiệm / chẩn đoán hình ảnh

---

## Đồ án SE104

- **Môn học:** SE104 – Nhập môn Công nghệ Phần mềm
- **Trường:** Đại học Công nghệ Thông tin – ĐHQG TP.HCM
- **Phiên bản hiện tại:** Phase 1 (ver1)
