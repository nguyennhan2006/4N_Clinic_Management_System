# 4N Clinic Management System

> Hệ thống quản lý phòng mạch tư nhân — Đồ án môn **SE104 – Nhập môn Công nghệ Phần mềm**  
> Trường Đại học Công nghệ Thông tin – ĐHQG TP.HCM

---

## Tổng quan

**4N Clinic Management System** là web application nội bộ hỗ trợ vận hành phòng mạch tư nhân. Hệ thống bao gồm toàn bộ luồng nghiệp vụ từ đặt lịch hẹn, tiếp nhận bệnh nhân, khám bệnh, xét nghiệm, kê đơn, phát thuốc, đến lập hóa đơn và xem báo cáo doanh thu.

---

## Use Cases — Phase 1 (20 UC cơ bản)

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
| UC14 | Lập hóa đơn (tự động từ dịch vụ + thuốc) | Thu ngân |
| UC15 | Ghi nhận thanh toán | Thu ngân |
| UC16 | Tra cứu hóa đơn | Thu ngân, Quản lý |
| UC17 | Thay đổi quy định phòng mạch | Admin |
| UC18 | Quản lý danh mục bệnh | Admin |
| UC19 | Quản lý danh mục thuốc | Admin |
| UC20 | Xem báo cáo tháng cơ bản | Quản lý, Admin |

## Use Cases — Phase 2A (schema sẵn sàng, đang phát triển)

> Schema database và dữ liệu mẫu đã có. Services/controllers đang được implement.

| Module | Tính năng | Trạng thái |
|---|---|---|
| Lịch hẹn | Đặt lịch, kiểm tra trùng, check-in → tự tạo Visit + STT hàng chờ | Schema ✓ |
| Hàng đợi | Dashboard thời gian thực, state machine WAITING → CALLED → IN_SERVICE → DONE | Schema ✓ |
| Chỉ số sinh tồn | Ghi mạch, huyết áp, nhiệt độ, SpO₂, BMI tự tính | Schema ✓ |
| Dịch vụ lâm sàng | Catalog dịch vụ (khám/xét nghiệm/thủ thuật), chỉ định trong phiếu khám | Schema ✓ |
| Xét nghiệm | Luồng đầy đủ: chỉ định → lấy mẫu → nhập kết quả → xác nhận | Schema ✓ |
| Tồn kho thuốc | Nhập lô, theo dõi số lượng, cảnh báo hết hạn / tồn kho thấp | Schema ✓ |
| Phát thuốc | Phát theo đơn, chọn lô FEFO, trừ tồn kho nguyên tử | Schema ✓ |
| Hóa đơn mở rộng | Phân loại theo loại (Khám / Dịch vụ / Thuốc) | Schema ✓ |
| Báo cáo mở rộng | Doanh thu phân theo loại dịch vụ | Schema ✓ |
| Audit Log | Nhật ký thao tác toàn hệ thống, diff old/new | Schema ✓ |

---

## Luồng nghiệp vụ chính

```
[Lễ tân] Tạo/tra cứu bệnh nhân
    → Đặt lịch hẹn (tùy chọn) → Check-in khi đến
    → Tạo lượt khám (cấp STT hàng chờ)
         ↓
[Điều dưỡng] Gọi số thứ tự → Đo chỉ số sinh tồn → Chỉ định dịch vụ / xét nghiệm
         ↓
[Kỹ thuật viên] Lấy mẫu xét nghiệm → Nhập kết quả → Xác nhận
         ↓
[Bác sĩ] Mở lượt khám → Chẩn đoán → Kê đơn thuốc → Hoàn tất phiếu khám
         ↓
[Dược sĩ] Phát thuốc theo đơn (chọn lô FEFO, trừ tồn kho)
         ↓
[Thu ngân] Lập hóa đơn (tự động tổng hợp tiền khám + dịch vụ + thuốc)
    → Ghi nhận thanh toán
         ↓
[Quản lý / Admin] Báo cáo doanh thu tháng theo từng loại
```

---

## Vai trò và phân quyền

| Vai trò | Mô tả |
|---|---|
| **ADMIN** | Toàn quyền: tài khoản, quy định, danh mục, audit log |
| **RECEPTIONIST** | Tiếp nhận bệnh nhân, tạo/quản lý lịch hẹn, lượt khám |
| **DOCTOR** | Mở khám, phiếu khám, đơn thuốc, hoàn tất |
| **NURSE** | Gọi hàng đợi, ghi chỉ số sinh tồn, chỉ định dịch vụ |
| **LAB_TECH** | Lấy mẫu, nhập kết quả, xác nhận xét nghiệm |
| **PHARMACIST** | Phát thuốc, nhập lô tồn kho |
| **CASHIER** | Lập hóa đơn, ghi nhận thanh toán |
| **MANAGER** | Báo cáo, tra cứu hóa đơn, xem danh mục |

---

## Tech Stack

### Backend

| Thành phần | Công nghệ |
|---|---|
| Framework | NestJS 11 + TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL ≥ 14 |
| Auth | JWT Access Token (1 ngày) + Refresh Token (7 ngày) |
| Validation | class-validator + class-transformer |
| API Docs | Swagger / OpenAPI tại `/api/docs` |

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

## Yêu cầu hệ thống

- **Node.js** ≥ 20 — tải tại https://nodejs.org
- **PostgreSQL** ≥ 14 — tải tại https://www.postgresql.org/download
- **npm** ≥ 10 (đi kèm Node.js)

Kiểm tra phiên bản:

```bash
node -v      # >= 20.x.x
npm -v       # >= 10.x.x
psql --version
```

---

## Hướng dẫn cài đặt và chạy

### Bước 1 — Clone repo

```bash
git clone <repo-url>
cd 4N_Clinic_Management_System
```

---

### Bước 2 — Tạo database PostgreSQL

Mở `psql` hoặc pgAdmin và chạy:

```sql
CREATE DATABASE clinic_db;
```

> Nếu bạn dùng user/password khác thì thay vào `DATABASE_URL` ở bước 3.

---

### Bước 3 — Cấu hình Backend

```bash
cd backend
npm install
```

Tạo file `.env` từ mẫu:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Mở file `backend/.env` và chỉnh sửa:

```env
# Thay USER, PASSWORD, và tên database cho đúng với máy bạn
DATABASE_URL="postgresql://postgres:password@localhost:5432/clinic_db?schema=public"

# Đặt bất kỳ chuỗi ngẫu nhiên nào (không để trống)
JWT_ACCESS_SECRET="clinic_access_secret_change_me"
JWT_ACCESS_EXPIRES="1d"

JWT_REFRESH_SECRET="clinic_refresh_secret_change_me"
JWT_REFRESH_EXPIRES="7d"

PORT=3000
```

---

### Bước 4 — Chạy Migration và Seed dữ liệu

```bash
# Trong thư mục backend/

# Tạo các bảng trong database
npx prisma migrate deploy

# Regenerate Prisma Client (bắt buộc sau mỗi lần migrate)
npx prisma generate

# Seed dữ liệu mẫu (tài khoản, danh mục, quy định)
npx prisma db seed
```

> **Lưu ý:** Nếu bạn đang phát triển và muốn reset database:
> ```bash
> npx prisma migrate reset   # Xóa sạch + migrate + generate + seed (tự động)
> ```

---

### Bước 5 — Khởi động Backend

```bash
# Trong thư mục backend/
npm run start:dev
```

Kiểm tra server đã chạy:
- API: http://localhost:3000/api/v1
- Swagger UI: http://localhost:3000/api/docs

---

### Bước 6 — Cấu hình Frontend

Mở terminal mới (giữ terminal backend đang chạy):

```bash
cd frontend
npm install
```

Tạo file `frontend/.env`:

```bash
# Windows
echo VITE_API_BASE_URL=http://localhost:3000/api/v1 > .env

# macOS / Linux
echo "VITE_API_BASE_URL=http://localhost:3000/api/v1" > .env
```

---

### Bước 7 — Khởi động Frontend

```bash
# Trong thư mục frontend/
npm run dev
```

Truy cập: **http://localhost:5173**

---

## Tài khoản demo

Sau khi chạy seed, hệ thống có sẵn các tài khoản (đăng nhập bằng **email**):

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@clinic.local` | `Admin@123456` |
| Bác sĩ | `doctor@clinic.local` | `Doctor@123456` |
| Lễ tân | `receptionist@clinic.local` | `Reception@123456` |
| Thu ngân | `cashier@clinic.local` | `Cashier@123456` |
| Quản lý | `manager@clinic.local` | `Manager@123456` |
| Điều dưỡng | `nurse@clinic.local` | `Nurse@123456` |
| Kỹ thuật viên XN | `labtech@clinic.local` | `Labtech@123456` |
| Dược sĩ | `pharmacist@clinic.local` | `Pharma@123456` |

---

## Xử lý lỗi thường gặp

### `Can't reach database server`

Database chưa chạy hoặc `DATABASE_URL` sai. Kiểm tra:
```bash
# Đảm bảo PostgreSQL đang chạy
# Windows: Services → postgresql
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### `Invalid environment variables`

File `.env` thiếu hoặc sai cú pháp. Kiểm tra lại `backend/.env` theo mẫu ở Bước 3.

### Port 3000 đã bị dùng

Đổi port trong `backend/.env`:
```env
PORT=3001
```
Và cập nhật `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

### Frontend báo lỗi 401 ngay khi vào

Access token hết hạn hoặc không có. Hãy đăng xuất và đăng nhập lại.

---

## Lệnh thường dùng

```bash
# ── Backend ──────────────────────────────────
cd backend

npm run start:dev          # Dev server (hot reload)
npm run build              # Build production
npm run test               # Unit tests
npm run test:e2e           # E2E tests
npm run lint               # Kiểm tra lint
npm run format             # Format code

npx prisma migrate dev     # Tạo migration mới sau khi sửa schema
npx prisma migrate deploy  # Áp dụng migration (production / CI)
npx prisma migrate reset   # Reset DB: xóa sạch + migrate + seed
npx prisma db seed         # Chỉ seed lại dữ liệu mẫu
npx prisma studio          # GUI xem và chỉnh sửa database (http://localhost:5555)

# ── Frontend ─────────────────────────────────
cd frontend

npm run dev                # Dev server
npm run build              # Build production
npm run lint               # Kiểm tra lint
npm run preview            # Preview bản build
```

---

## Cấu trúc repo

```
4N_Clinic_Management_System/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # Đăng nhập, JWT
│   │   │   ├── users/              # Quản lý người dùng
│   │   │   ├── patients/           # Hồ sơ bệnh nhân
│   │   │   ├── visits/             # Lượt khám, hàng chờ
│   │   │   ├── examinations/       # Phiếu khám, đơn thuốc
│   │   │   ├── billing/            # Hóa đơn, thanh toán
│   │   │   ├── appointments/       # Lịch hẹn (Phase 2)
│   │   │   ├── queue/              # Hàng đợi (Phase 2)
│   │   │   ├── vitals/             # Chỉ số sinh tồn (Phase 2)
│   │   │   ├── services/           # Dịch vụ lâm sàng (Phase 2)
│   │   │   ├── lab/                # Xét nghiệm (Phase 2)
│   │   │   ├── inventory/          # Tồn kho thuốc (Phase 2)
│   │   │   ├── pharmacy/           # Phát thuốc (Phase 2)
│   │   │   ├── diseases/           # Danh mục bệnh
│   │   │   ├── drugs/              # Danh mục thuốc
│   │   │   ├── regulations/        # Quy định phòng mạch
│   │   │   ├── reports/            # Báo cáo tháng
│   │   │   └── organization/       # Khoa, hồ sơ bác sĩ
│   │   └── common/                 # Guards, decorators, constants
│   └── prisma/
│       ├── schema.prisma           # Nguồn chốt dữ liệu
│       └── seed.ts
│
├── frontend/
│   └── src/
│       ├── features/               # Mỗi feature = 1 module độc lập
│       │   ├── auth/
│       │   ├── patients/
│       │   ├── visits/
│       │   ├── examinations/
│       │   ├── appointments/       # Phase 2
│       │   ├── queue/              # Phase 2
│       │   ├── vitals/             # Phase 2
│       │   ├── services/           # Phase 2
│       │   ├── lab/                # Phase 2
│       │   ├── inventory/          # Phase 2
│       │   ├── pharmacy/           # Phase 2
│       │   ├── invoices/
│       │   ├── reports/
│       │   ├── regulations/
│       │   ├── diseases/
│       │   ├── medicines/
│       │   ├── users/
│       │   ├── organization/
│       │   └── audit/              # Phase 2
│       ├── components/common/      # Sidebar, Topbar, PageHeader, ...
│       ├── lib/                    # api-client, date, money, errors
│       └── config/                 # navigation, permissions
│
├── docs/                           # Tài liệu thiết kế
└── frontend-docs/                  # API inventory, RBAC matrix
```

---

## API Reference (tóm tắt)

Tất cả endpoint có prefix `/api/v1`. Xác thực: `Authorization: Bearer <access_token>`.

### Phase 1

| Nhóm | Endpoint |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| Users | `GET /users`, `POST /users`, `PATCH /users/:id` |
| Patients | `GET /patients`, `POST /patients`, `GET /patients/:id` |
| Visits | `GET /visits`, `POST /visits`, `PATCH /visits/:id/status` |
| Examinations | `GET /examinations/:id`, `PATCH /examinations/:id`, `POST /examinations/:id/complete` |
| Billing | `POST /visits/:id/invoice`, `GET /invoices`, `POST /invoices/:id/payments` |
| Diseases | `GET /diseases`, `POST /diseases`, `PATCH /diseases/:id` |
| Drugs | `GET /drugs`, `POST /drugs`, `PATCH /drugs/:id` |
| Regulations | `GET /regulations/current`, `POST /regulations`, `PATCH /regulations/:id/activate` |
| Reports | `GET /reports/monthly` |

### Phase 2

| Nhóm | Endpoint |
|---|---|
| Appointments | `GET /appointments`, `POST /appointments`, `POST /appointments/:id/checkin` |
| Queue | `GET /queue`, `PATCH /queue/:id/status` |
| Vitals | `GET /vitals/visit/:id`, `POST /vitals` |
| Service Catalog | `GET /service-catalog`, `POST /service-catalog`, `PATCH /service-catalog/:id` |
| Service Orders | `GET /service-orders`, `POST /service-orders`, `PATCH /service-orders/:id/status` |
| Lab | `GET /lab`, `PATCH /lab/:id/collect-sample`, `PATCH /lab/:id/result`, `PATCH /lab/:id/verify` |
| Inventory | `GET /inventory/lots`, `POST /inventory/lots`, `GET /inventory/summary` |
| Pharmacy | `GET /pharmacy/dispenses`, `POST /pharmacy/dispenses`, `PATCH /pharmacy/dispenses/:id/cancel` |
| Audit Log | `GET /audit-logs` |
| Reports | `GET /reports/revenue-breakdown` |

Chi tiết đầy đủ tại Swagger: **http://localhost:3000/api/docs**

---

## Kiến trúc hệ thống

```
Browser — React SPA (Vite :5173)
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
- Frontend chỉ gọi API — không chứa business logic
- Backend là nguồn chốt cho mọi validation và phân quyền
- Mọi transaction quan trọng (tạo lượt khám, phát thuốc, thanh toán) dùng `prisma.$transaction()`
- Snapshot pattern: giá dịch vụ và thuốc được snapshot tại thời điểm tạo để đảm bảo tính bất biến của hóa đơn cũ

---

## Thông tin đồ án

- **Môn học:** SE104 – Nhập môn Công nghệ Phần mềm
- **Trường:** Đại học Công nghệ Thông tin – ĐHQG TP.HCM
- **Phiên bản:** Phase 1 hoàn thành · Phase 2A schema sẵn sàng (đang implement)
