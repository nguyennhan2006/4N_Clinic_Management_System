# 00 — Tóm tắt điều hành (Executive Summary)

> Audit date: 2026-06-07 | Auditor: Claude Code (automated codebase audit)

---

## 1. Mô tả hệ thống

**4N Clinic Management System** là ứng dụng web nội bộ quản lý phòng mạch tư nhân, xây dựng cho môn học **SE104 — Nhập môn Công nghệ phần mềm**.

Hệ thống hỗ trợ 8 vai trò người dùng (ADMIN, RECEPTIONIST, DOCTOR, CASHIER, MANAGER, NURSE, LAB_TECHNICIAN, PHARMACIST) trong quy trình vận hành phòng khám: tiếp nhận bệnh nhân → khám bệnh → kê đơn → thanh toán → báo cáo.

> **Ghi chú trung thực:** Đây là đồ án môn học. Phần khảo sát khách hàng được mô phỏng dựa trên nghiệp vụ phòng mạch tư nhân quy mô nhỏ đến trung bình (khách hàng giả định, không có phỏng vấn thực tế). Hệ thống chạy trên môi trường development local, chưa có Docker hoặc CI/CD. Kiểm thử E2E có cho Phase 1; Phase 2 dùng manual test.

---

## 2. Canonical Facts — Số liệu chốt (thống nhất toàn bộ 16 file)

| Mục | Giá trị | Nguồn |
|---|---|---|
| Project name | 4N Clinic Management System | `CLAUDE.md` |
| Course | SE104 — Nhập môn Công nghệ phần mềm | `CLAUDE.md` |
| Audit date | 2026-06-07 | Phiên làm việc hiện tại |
| Backend stack | NestJS 11, TypeScript 5.7.3, Prisma 6.16.2, PostgreSQL | `backend/package.json` |
| Frontend stack | React 19.2, Vite 7.2, TypeScript 5.9.3, Tailwind 4.3, TanStack Query 5, Zustand 5, React Hook Form 7, Zod 4 | `frontend/package.json` |
| Database | PostgreSQL 15+ | `backend/.env.example` |
| ORM | Prisma 6.16.2 | `backend/package.json` |
| Architecture | Client-Server, Modular Monolith, Layered (Controller→Service→Prisma), Feature-based Frontend, JWT Stateless Auth, RBAC | `backend/src/main.ts`, module structure |
| API prefix | `/api/v1` | `backend/src/main.ts` line 10 |
| Swagger URL | `http://localhost:3000/api/docs` | `backend/src/main.ts` line 34 |
| Database models | **37** | `backend/prisma/schema.prisma` (đếm chính xác) |
| Enums | **12** | `backend/prisma/schema.prisma` (đếm chính xác) |
| Backend feature folders | **21** | `backend/src/modules/` |
| Controllers (có API route) | **20** | `backend/src/modules/**/*.controller.ts` (prescriptions = service-only) |
| Service files | **21** | `backend/src/modules/**/*.service.ts` |
| API endpoints | **92** (đếm từ HTTP decorator) | Controller scan |
| — Phase 1 endpoints | **41** | auth+users+rbac+patients+visits+examinations+billing+diseases+drugs+regulations+reports(monthly) |
| — Phase 2 endpoints | **51** | appointments+audit+inventory+lab+organization+pharmacy+queue+services+vitals+reports(revenue) |
| Frontend routes (named) | **36** | `frontend/src/app/router.tsx` |
| Frontend page files | **33** | `frontend/src/features/**/*.tsx` (31 feature pages + 2 error pages) |
| E2E test files (meaningful) | **3** | `backend/test/auth.e2e-spec.ts`, `clinic-flow.e2e-spec.ts`, `billing-catalog-flow.e2e-spec.ts` |
| E2E test files (total) | **4** | + `app.e2e-spec.ts` (boilerplate) |
| Unit test files | **1** | `backend/src/app.controller.spec.ts` (boilerplate) |
| Migrations | **3** | `backend/prisma/migrations/` (baseline + identity + phase2a) |
| Git contributors (accounts) | **2** | `git shortlog`: nguyennhan2006, Nguyễn Trọng Phan Nhật |
| Deployment status | Local development only | Không có `Dockerfile`, `.github/workflows/` |
| Testing status | E2E Phase 1; manual plan Phase 2 | `backend/test/` |
| Customer status | Khách hàng giả định / phân tích nghiệp vụ giả định | Đồ án môn học |

---

## 3. Tổng quan Phase 1 — Nghiệp vụ lõi (UC01–UC20)

Phase 1 triển khai 20 use case cốt lõi của phòng mạch tư, bao gồm:

| Nhóm | UC | Modules backend |
|---|---|---|
| Xác thực & phân quyền | UC01–UC03 | auth, users, rbac |
| Quản lý bệnh nhân | UC04–UC05 | patients |
| Tiếp nhận & lượt khám | UC06–UC09 | visits |
| Phiếu khám & kê đơn | UC10–UC13 | examinations, prescriptions |
| Hóa đơn & thanh toán | UC14–UC16 | billing |
| Quy định & danh mục | UC17–UC19 | regulations, diseases, drugs |
| Báo cáo tháng | UC20 | reports |

**Evidence:** `backend/src/modules/` — 11 module Phase 1. `backend/test/` — 3 e2e files covering UC01 → UC16.

---

## 4. Tổng quan Phase 2 — Mở rộng vận hành (UC21–UC30)

Phase 2 mở rộng hệ thống với 10 use case và 10 module mới:

| Nhóm | UC | Modules backend |
|---|---|---|
| Lịch hẹn & hàng đợi | UC21–UC23 | appointments, queue |
| Sinh hiệu & dịch vụ | UC24–UC25 | vitals, services |
| Xét nghiệm | UC26 | lab |
| Kho thuốc & cấp phát | UC27–UC28 | inventory, pharmacy |
| Tổ chức & audit | UC29–UC30 | organization, audit |

**Evidence:** `backend/src/modules/` — 10 module Phase 2 thêm vào. `backend/prisma/migrations/20260520192733_phase2a_foundation/` — migration schema P2.

---

## 5. Mức độ sẵn sàng cho từng chương báo cáo

| Chương | Mức sẵn sàng | Ghi chú |
|---|---|---|
| Mở đầu | CAO | Đủ context từ CLAUDE.md + codebase |
| Ch.1: Đặc tả yêu cầu | TRUNG BÌNH | UC list có, khảo sát khách hàng cần narrative thêm |
| Ch.2: Thiết kế hệ thống | CAO | Kiến trúc rõ, cần vẽ diagram |
| Ch.3: Thiết kế dữ liệu | CAO | 37 model đủ, cần render ERD |
| Ch.3: Thiết kế xử lý | CAO | 92 API documented, business rules có file path |
| Ch.3: Thiết kế giao diện | TRUNG BÌNH | Cần chụp screenshots thực tế |
| Ch.4: Hiện thực | CAO | Codebase đầy đủ |
| Ch.5: Kiểm thử | TRUNG BÌNH | E2E Phase 1 có, cần chạy và copy log; Phase 2 manual |
| Ch.6: Triển khai | CAO | Có hướng dẫn đầy đủ, deployment chỉ local |
| Kết luận | CAO | Có đủ thông tin self-assessment |

---

## 6. 10 bằng chứng kỹ thuật quan trọng nhất

| # | Bằng chứng | File | Status |
|---|---|---|---|
| 1 | 37 database models, 12 enums, 3 migrations | `backend/prisma/schema.prisma` | CONFIRMED |
| 2 | 92 API endpoints với JWT Guard trên toàn bộ route (trừ `/auth/login`) | `backend/src/modules/**/*.controller.ts` | CONFIRMED |
| 3 | API prefix `/api/v1`, Swagger tại `/api/docs` | `backend/src/main.ts:10,34` | CONFIRMED |
| 4 | RBAC: JwtAuthGuard + RolesGuard + @Roles() decorator | `backend/src/common/guards/` | CONFIRMED |
| 5 | Business rules tại service layer — không ở controller | `backend/src/modules/**/*.service.ts` | CONFIRMED |
| 6 | Prisma transaction cho Visit creation, Payment, Regulation activation | `visits.service.ts`, `billing.service.ts`, `regulations.service.ts` | CONFIRMED |
| 7 | 3 e2e test files covering auth flow, clinic flow (UC07–UC13), billing+catalog flow | `backend/test/` | CONFIRMED |
| 8 | Frontend 33 page files, 36 routes, RequireRole guard trên mỗi route | `frontend/src/app/router.tsx` | CONFIRMED |
| 9 | Dark/light mode toggle với theme.ts + globals.css | `frontend/src/lib/theme.ts`, `frontend/src/styles/globals.css` | CONFIRMED |
| 10 | Seed data comprehensive cho demo tất cả module P1+P2 | `backend/prisma/seed.ts` — commit `04b65be` | CONFIRMED |

---

## 7. 10 việc nhóm cần bổ sung thủ công

| # | Việc cần làm | Mức độ cần thiết |
|---|---|---|
| 1 | Chụp screenshots UI (≥25 màn hình) theo checklist file 06 | Bắt buộc cho Chương 3 |
| 2 | Chạy `npm run test:e2e` và copy kết quả vào bảng file 12 | Bắt buộc cho Chương 5 |
| 3 | Render ERD từ `.mmd` files (draw.io, Mermaid Live) | Bắt buộc cho Chương 3 |
| 4 | Vẽ sequence diagrams: login, visit-exam, payment, lab FEFO | Cần thiết cho Chương 3 |
| 5 | Viết narrative khảo sát khách hàng (1–2 trang) | Cần thiết cho Chương 1 |
| 6 | Xác nhận phân công thành viên thứ 3, 4 (git chỉ thấy 2 account) | Cần thiết cho Chương quản lý nhóm |
| 7 | Tạo Gantt chart từ git history | Bổ sung cho Chương 2/4 |
| 8 | Screenshot Swagger UI | Bổ sung cho Chương 4/6 |
| 9 | Viết lời cảm ơn và trang bìa | Bắt buộc cho báo cáo |
| 10 | Manual test report Phase 2 với screenshots | Bắt buộc cho Chương 5 |
