# 13 — Hướng dẫn Triển khai và Vận hành

> Audit date: 2026-06-07 | Nguồn: `backend/.env.example`, `backend/package.json`, `frontend/package.json`

---

> **Phiên bản hiện tại hỗ trợ triển khai local/development. Chưa có bằng chứng Docker, CI/CD hoặc production deployment.**

---

## 1. Yêu cầu môi trường

| Phần mềm | Phiên bản | Mục đích |
|---|---|---|
| Node.js | 20+ (LTS) | Chạy backend + frontend |
| npm | 10+ | Package manager |
| PostgreSQL | 15+ | Database |
| Git | 2.x+ | Source control |

---

## 2. Biến môi trường Backend

**File:** `backend/.env.example` → copy thành `backend/.env`

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/clinic_db?schema=public"

# JWT — thay bằng chuỗi ngẫu nhiên đủ dài
JWT_ACCESS_SECRET="change_me_to_a_random_secret"
JWT_ACCESS_EXPIRES="1d"

JWT_REFRESH_SECRET="change_me_to_another_random_secret"
JWT_REFRESH_EXPIRES="7d"

# Port
PORT=3000
```

---

## 3. Cài đặt và chạy Backend

```bash
# 1. Clone repo
git clone <repository-url>
cd 4N_Clinic_Management_System

# 2. Cài đặt dependencies
cd backend
npm install

# 3. Cấu hình môi trường
cp .env.example .env
# Điền DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# 4. Tạo database và apply migrations (3 migrations)
npx prisma migrate dev

# 5. Seed dữ liệu demo
npx prisma db seed

# 6. Chạy server
npm run start:dev
```

Sau bước 6:
- Backend: `http://localhost:3000`
- API prefix: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`

---

## 4. Cài đặt và chạy Frontend

```bash
# (Từ root repo)
cd frontend
npm install

# Tạo .env.local nếu API URL khác default
echo "VITE_API_BASE_URL=http://localhost:3000/api/v1" > .env.local

npm run dev
# Frontend: http://localhost:5173
```

---

## 5. Tài khoản Demo (từ `backend/prisma/seed.ts`)

| Role | Email | Password | Chức năng chính |
|---|---|---|---|
| ADMIN | admin@clinic.local | Admin@123456 | Toàn quyền hệ thống |
| DOCTOR | doctor@clinic.local | Doctor@123456 | Khám bệnh, kê đơn |
| RECEPTIONIST | receptionist@clinic.local | Reception@123456 | Tiếp nhận, lượt khám |
| CASHIER | cashier@clinic.local | Cashier@123456 | Hóa đơn, thanh toán |
| MANAGER | manager@clinic.local | Manager@123456 | Báo cáo, quản lý |
| NURSE | nurse@clinic.local | Nurse@123456 | Sinh hiệu, hàng đợi |
| LAB_TECHNICIAN | lab@clinic.local | Lab@123456 | Xét nghiệm |
| PHARMACIST | pharma@clinic.local | Pharma@123456 | Kho thuốc, cấp phát |

> **CONFIRMED:** `backend/prisma/seed.ts` — commit `04b65be feat(seed): comprehensive evaluation data`

---

## 6. API Documentation

- **Swagger UI:** `http://localhost:3000/api/docs`
- **API prefix:** `/api/v1`
- **Auth:** Bearer Token (nhận từ `POST /api/v1/auth/login`)

---

## 7. Database Management

```bash
cd backend

# Xem database qua GUI
npx prisma studio
# → http://localhost:5555

# Chạy migration mới (sau sửa schema)
npx prisma migrate dev --name <migration-name>

# Validate schema
npx prisma validate

# Reset database (xóa + migrate + seed lại)
npx prisma migrate reset
```

---

## 8. Lệnh kiểm tra chất lượng code

```bash
# Backend
cd backend
npm run build          # Compile TypeScript
npm run lint           # ESLint check
npm run test           # Unit tests (1 boilerplate file)
npm run test:e2e       # E2E tests (cần DB thật)

# Frontend
cd frontend
npm run build          # Vite production build
npm run lint           # ESLint check
```

---

## 9. Ghi chú Production

> Dự án **CHƯA** có cấu hình production. Không có `Dockerfile`, không có `docker-compose.yml`, không có `.github/workflows/`.

Nếu cần deploy production trong tương lai:
- Thay `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` bằng chuỗi random đủ dài
- Cấu hình HTTPS cho backend
- Cấu hình CORS chỉ cho phép domain frontend
- Build frontend: `npm run build` → serve static files từ CDN hoặc Nginx
- Dùng connection pool cho PostgreSQL

---

## 10. Quick Start Guide (cho Chương 6 báo cáo)

```
Để vận hành 4N Clinic Management System:

Bước 1: Chuẩn bị
  - Cài PostgreSQL 15+, tạo database "clinic_db"
  - Clone repository
  - cd backend && cp .env.example .env → điền credentials

Bước 2: Khởi động hệ thống
  - Terminal 1: cd backend && npx prisma migrate dev && npx prisma db seed && npm run start:dev
  - Terminal 2: cd frontend && npm install && npm run dev

Bước 3: Truy cập
  - Ứng dụng: http://localhost:5173
  - API docs: http://localhost:3000/api/docs
  - Prisma Studio: npx prisma studio (port 5555)

Bước 4: Đăng nhập demo
  - Admin: admin@clinic.local / Admin@123456
  - Doctor: doctor@clinic.local / Doctor@123456
  - Xem bảng tài khoản đầy đủ ở mục 5

Seed data có sẵn:
  - Danh mục thuốc, bệnh, dịch vụ
  - Bệnh nhân mẫu, lượt khám, hóa đơn mẫu
  - Lô thuốc trong kho
  - Lịch sử xét nghiệm, sinh hiệu
```
