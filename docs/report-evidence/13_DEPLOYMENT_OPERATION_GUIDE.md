# 13 — Hướng dẫn Triển khai và Vận hành

---

## 1. Yêu cầu môi trường

| Phần mềm | Phiên bản | Mục đích |
|---|---|---|
| Node.js | 20+ (LTS) | Chạy backend + frontend |
| npm | 10+ | Package manager |
| PostgreSQL | 15+ | Database |
| Git | 2.x | Source control |

---

## 2. Biến môi trường

**File**: `backend/.env.example` (copy thành `backend/.env`)

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/clinic_db?schema=public"

# JWT — thay bằng chuỗi ngẫu nhiên dài khi deploy
JWT_ACCESS_SECRET="change_me_to_a_random_secret"
JWT_ACCESS_EXPIRES="1d"

JWT_REFRESH_SECRET="change_me_to_another_random_secret"
JWT_REFRESH_EXPIRES="7d"

# App
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

# 4. Tạo database và apply migrations
npx prisma migrate dev

# 5. Seed dữ liệu demo
npx prisma db seed

# 6. Chạy server
npm run start:dev
# Server chạy tại: http://localhost:3000
# Swagger UI: http://localhost:3000/api/docs
```

---

## 4. Cài đặt và chạy Frontend

```bash
# (Từ root repo)
cd frontend
npm install

# Tạo file .env.local (nếu cần cấu hình API URL khác)
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env.local

npm run dev
# Frontend chạy tại: http://localhost:5173
```

---

## 5. Tài khoản Demo (từ seed data)

> Bằng chứng: `backend/prisma/seed.ts`

| Role | Email | Password | Chức năng |
|---|---|---|---|
| ADMIN | admin@clinic.local | Admin@123456 | Toàn quyền hệ thống |
| DOCTOR | doctor@clinic.local | Doctor@123456 | Khám bệnh, đơn thuốc |
| RECEPTIONIST | receptionist@clinic.local | Reception@123456 | Tiếp nhận, lượt khám |
| CASHIER | cashier@clinic.local | Cashier@123456 | Hóa đơn, thanh toán |
| MANAGER | manager@clinic.local | Manager@123456 | Báo cáo |
| NURSE | nurse@clinic.local | Nurse@123456 | Sinh hiệu |
| LAB_TECHNICIAN | lab@clinic.local | Lab@123456 | Xét nghiệm |
| PHARMACIST | pharmacist@clinic.local | Pharma@123456 | Kho thuốc, cấp phát |

---

## 6. API Documentation

- **Swagger UI**: `http://localhost:3000/api/docs`
- **API prefix**: `/api`
- **Auth**: Bearer Token (nhận từ POST /api/auth/login)

---

## 7. Database Management

```bash
cd backend

# Xem database qua GUI
npx prisma studio
# Mở tại: http://localhost:5555

# Chạy migration mới (sau khi sửa schema)
npx prisma migrate dev --name <migration-name>

# Validate schema
npx prisma validate

# Reset database (xóa sạch + migrate + seed lại)
npx prisma migrate reset
```

---

## 8. Lệnh kiểm tra chất lượng code

```bash
# Backend
cd backend
npm run build          # Kiểm tra build TypeScript
npm run lint           # ESLint check
npm run test           # Unit tests
npm run test:e2e       # E2E tests (cần DB thật)

# Frontend
cd frontend
npm run build          # Kiểm tra build TypeScript + Vite
npm run lint           # ESLint check
```

---

## 9. Ghi chú triển khai Production

> **Chú ý**: Dự án hiện chỉ hỗ trợ chạy local. Chưa có Docker hoặc CI/CD pipeline.

Nếu cần triển khai production:
- Thay đổi `JWT_ACCESS_SECRET` và `JWT_REFRESH_SECRET` thành chuỗi ngẫu nhiên đủ dài
- Cấu hình HTTPS cho backend
- Cấu hình CORS để chỉ cho phép domain frontend
- Set `JWT_ACCESS_EXPIRES` và `JWT_REFRESH_EXPIRES` phù hợp
- Dùng connection pool cho PostgreSQL trong production
- Build frontend: `npm run build` → serve static files

---

## 10. Suggested Operation Guide for Report (Chương 6)

```
Để vận hành hệ thống 4N Clinic Management System:

1. Chuẩn bị:
   - Cài PostgreSQL, tạo database "clinic_db"
   - Clone repository
   - Cấu hình backend/.env với database credentials

2. Khởi động:
   - Terminal 1: cd backend && npm run start:dev
   - Terminal 2: cd frontend && npm run dev

3. Truy cập:
   - Ứng dụng: http://localhost:5173
   - API docs: http://localhost:3000/api/docs

4. Tài khoản demo:
   - Admin: admin@clinic.local / Admin@123456
   - Doctor: doctor@clinic.local / Doctor@123456
   - (các tài khoản khác xem bảng trên)

5. Hệ thống đã được seed sẵn dữ liệu demo bao gồm:
   - Danh sách thuốc, bệnh, dịch vụ
   - Bệnh nhân mẫu
   - Lượt khám và hóa đơn mẫu
   - Lô thuốc trong kho
```
