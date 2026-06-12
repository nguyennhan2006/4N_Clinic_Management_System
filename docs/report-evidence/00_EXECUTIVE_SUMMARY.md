# 00 — Tóm tắt điều hành (Executive Summary)

> Tài liệu bằng chứng kỹ thuật — SE104 Nhập môn Công nghệ phần mềm  
> Dự án: **4N Clinic Management System — Hệ thống quản lý phòng mạch tư nhân**  
> Ngày audit: 2026-06-06

---

## 1. Mô tả hệ thống hiện tại

Hệ thống 4N Clinic Management System là ứng dụng web nội bộ phục vụ vận hành phòng mạch tư nhân. Hệ thống được xây dựng theo kiến trúc Client–Server với:

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend**: NestJS 11 + TypeScript + Passport JWT
- **ORM**: Prisma 6.16 + PostgreSQL
- **Phân quyền**: JWT Access Token + Refresh Token + Role-Based Access Control (RBAC)

---

## 2. Tổng quan theo Phase

### Phase 1 — Nghiệp vụ lõi (CONFIRMED: hoàn thành)

| Nhóm | Module | Trạng thái |
|---|---|---|
| Xác thực & phân quyền | Auth, Users, RBAC | CONFIRMED |
| Quản lý bệnh nhân | Patients | CONFIRMED |
| Tiếp nhận & lượt khám | Visits | CONFIRMED |
| Phiên khám & đơn thuốc | Examinations, Prescriptions | CONFIRMED |
| Danh mục | Diseases, Drugs | CONFIRMED |
| Hóa đơn & thanh toán | Billing (Invoice + Payment) | CONFIRMED |
| Quy định | Regulations | CONFIRMED |
| Báo cáo tháng cơ bản | Reports | CONFIRMED |

**Số lượng Phase 1**: 8 nhóm nghiệp vụ, ~15 module, ~35 endpoint, 20+ frontend pages

### Phase 2 — Mở rộng quy trình phòng khám (CONFIRMED: đã implement)

| Nhóm | Module | Trạng thái |
|---|---|---|
| Lịch hẹn | Appointments | CONFIRMED |
| Hàng đợi | Queue | CONFIRMED |
| Sinh hiệu | Vitals | CONFIRMED |
| Dịch vụ cận lâm sàng | Services (Catalog + Orders) | CONFIRMED |
| Xét nghiệm | Lab | CONFIRMED |
| Kho thuốc | Inventory | CONFIRMED |
| Cấp phát thuốc | Pharmacy | CONFIRMED |
| Tổ chức phòng khám | Organization (Department/Room/Doctor) | CONFIRMED |
| Nhật ký hệ thống | Audit Log | CONFIRMED |
| Báo cáo mở rộng | Reports (Revenue breakdown) | CONFIRMED |

**Số lượng Phase 2**: 10 nhóm nghiệp vụ, ~11 module mới, ~50+ endpoint, 15+ frontend pages mới

---

## 3. Mức độ sẵn sàng để viết báo cáo

| Hạng mục | Mức độ sẵn sàng | Ghi chú |
|---|---|---|
| Chương 1 — Đặc tả yêu cầu | ✅ Cao | 20+ UC có thể truy vết |
| Chương 2 — Thiết kế hệ thống | ✅ Cao | Kiến trúc rõ ràng, có diagram |
| Chương 3 — Thiết kế phần mềm | ✅ Cao | Schema 37 models, 22 controllers |
| Chương 3 — Thiết kế giao diện | ✅ Cao | 70+ frontend files, cần chụp màn hình |
| Chương 4 — Hiện thực | ✅ Cao | Toàn bộ code có thể trình bày |
| Chương 5 — Kiểm thử | ⚠️ Trung bình | Có e2e tests nhưng chưa đầy đủ unit tests |
| Chương 6 — Triển khai | ⚠️ Trung bình | Chưa có Docker/CI, chỉ có hướng dẫn chạy local |

---

## 4. Mười bằng chứng kỹ thuật quan trọng nhất

1. **CONFIRMED**: Schema Prisma đầy đủ 37 models, 9 enums — `backend/prisma/schema.prisma`
2. **CONFIRMED**: 22 controllers với đầy đủ endpoint Phase 1 + Phase 2 — `backend/src/modules/`
3. **CONFIRMED**: JWT Guard + Role Guard bảo vệ toàn bộ endpoint (trừ `/auth/login`, `/auth/refresh`) — `backend/src/common/guards/`
4. **CONFIRMED**: Business rules enforce tại service layer — `visits.service.ts`, `examinations.service.ts`, `billing.service.ts`
5. **CONFIRMED**: E2E test cho auth flow, clinic flow UC-07→UC-11, billing/catalog flow — `backend/test/`
6. **CONFIRMED**: Frontend có 70+ file, ProtectedRoute + RequireRole bảo vệ route — `frontend/src/features/auth/`
7. **CONFIRMED**: Role-based sidebar navigation — `frontend/src/config/navigation.ts`, `frontend/src/components/common/Sidebar.tsx`
8. **CONFIRMED**: Prisma transaction dùng cho tạo Visit (queue number) và Payment (overpayment check) — `visits.service.ts`, `billing.service.ts`
9. **CONFIRMED**: Seed data đầy đủ demo data cho tất cả module — `backend/prisma/seed.ts`
10. **CONFIRMED**: API documented qua Swagger tại `/api/docs` — `backend/src/main.ts`

---

## 5. Mười việc nhóm cần bổ sung thủ công

1. **Chụp màn hình** toàn bộ UI theo checklist (xem file `06_FRONTEND_UI_EVIDENCE.md`) — tối thiểu 25 ảnh
2. **Vẽ ERD** từ schema Prisma (sử dụng draw.io + file `.mmd` trong `docs/software-design-workspace/`)
3. **Viết lời cảm ơn** và trang bìa với thông tin thành viên nhóm
4. **Xác nhận phân công** thành viên — git log chỉ thấy 3 tài khoản, cần bổ sung thông tin thành viên thứ 4
5. **Chạy e2e test** và chụp kết quả để đưa vào Chương 5 — `cd backend && npm run test:e2e`
6. **Viết mô tả khảo sát khách hàng** — không có tài liệu khảo sát thực tế, cần nhóm viết narrative
7. **Bổ sung diagram**: sequence diagram, component diagram, deployment diagram cho Chương 2
8. **Xác nhận README** đầy đủ hướng dẫn cài đặt — hiện README chỉ có nội dung cơ bản
9. **Ghi chú giới hạn** Phase 2 chưa có Docker, chưa có CI/CD pipeline — trình bày trung thực trong Chương 6
10. **Viết kết luận** và đánh giá so sánh mục tiêu ban đầu với kết quả đạt được

---

## 6. Số liệu tổng hợp

| Chỉ số | Giá trị |
|---|---|
| Tổng số Prisma models | 37 |
| Tổng số enums | 9 |
| Tổng số controllers | 22 |
| Tổng số backend services | 23 |
| Tổng số API endpoints (ước tính) | ~85 |
| Tổng số frontend feature files | ~75 |
| Tổng số frontend pages | ~30 |
| Số e2e test files | 3 |
| Số unit test files | 1 (app.controller.spec.ts) |
| Số contributors theo git | 3 tài khoản |
| Số branches | 10 (local + remote) |
