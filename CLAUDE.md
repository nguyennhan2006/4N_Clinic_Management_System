# CLAUDE.md — 4N Clinic Management System

Hướng dẫn cho Claude Code khi làm việc trong project này.

## Tổng quan project

Web app quản lý phòng mạch tư nhân, phase 1. Backend NestJS + Prisma + PostgreSQL. Frontend React + Vite (chưa bắt đầu).

**Bản kế hoạch chính:** [`PLAN.md`](PLAN.md) — đọc trước khi làm bất cứ thứ gì.
**Business rules:** [`docs/business/business-rules.md`](docs/business/business-rules.md) — nguồn chốt logic nghiệp vụ.

## Cấu trúc quan trọng

```
backend/src/modules/   # 11 feature modules
backend/prisma/        # schema.prisma + seed.ts
docs/business/         # business-rules.md, role-matrix.md
docs/agile/            # backlog.md, sprint-plan.md
docs/api/              # api-scope.md, error-codes.md
docs/architecture/     # architecture-overview.md, module-boundaries.md
```

## Quy tắc khi code

### Trước khi tạo/sửa bất kỳ file nào
1. Đọc `PLAN.md` phần liên quan
2. Kiểm tra business rules trong `docs/business/business-rules.md`
3. Liệt kê rõ: file nào tạo mới, file nào sửa, file nào là core

### Về schema
- **Schema là nguồn chốt dữ liệu.** Không code service trước khi schema đã được migrate.
- Có 6 schema mismatch cần sửa trước (xem `PLAN.md` mục 2).
- Sau mỗi thay đổi schema: chạy `cd backend && npx prisma migrate dev`.

### Về business logic
- Mọi business rule (BR-01 đến BR-20) phải implement ở **service layer**, không ở controller.
- Không dùng guard/middleware để thay thế business validation.
- Các operation quan trọng phải dùng `prisma.$transaction()`: tạo visit (queue number), record payment (check overpayment), activate regulation.

### Về RBAC
- Mọi route phải có `@UseGuards(JwtAuthGuard)` trừ `/auth/login`.
- RBAC check phải ở backend, không dựa vào UI ẩn nút.
- Role matrix: [`docs/business/role-matrix.md`](docs/business/role-matrix.md).

### Về code style
- Không tạo file tên mơ hồ (`test2.ts`, `fix_temp.ts`).
- Tên file theo NestJS convention: `patients.service.ts`, `create-patient.dto.ts`.
- Không comment giải thích WHAT (tên hàm đã nói rõ). Chỉ comment WHY khi logic không hiển nhiên.
- Không thêm error handling cho case không thể xảy ra.

### Về test
- Test chính thức: `backend/test/` hoặc `*.spec.ts` cạnh file source.
- Test tạm thời debug: `scripts/debug/` — xóa sau khi fix xong.

## Lệnh hay dùng

```bash
# Backend
cd backend
npm run start:dev          # dev server
npm run test               # unit tests
npm run test:e2e           # e2e tests
npx prisma migrate dev     # apply schema changes
npx prisma studio          # GUI xem DB
npx prisma db seed         # chạy seed

# Format + lint
npm run format
npm run lint
```

## Môi trường

- Backend port: 3000
- Swagger UI: http://localhost:3000/api/docs
- Database: PostgreSQL, xem `backend/.env`
- `.env.example` có tại `backend/.env.example`

## Những thứ CHƯA làm ở ver1

- Đặt lịch online
- Quản lý tồn kho thuốc đầy đủ
- Multi-branch
- Patient portal
- Inventory
- Refund / credit note phức tạp

Nếu ai hỏi hoặc suggest thêm những thứ này — đánh dấu rõ là ver2.
