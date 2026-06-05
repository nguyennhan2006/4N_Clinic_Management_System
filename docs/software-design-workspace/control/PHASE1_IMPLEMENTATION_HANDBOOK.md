# 4N CLINIC MANAGEMENT SYSTEM
## Phase 1 Implementation Alignment & Software Design Handbook

*Bản tổng hợp để thống nhất triển khai Backend, Database, API, Frontend Integration, Testing và Usage Guide*

> Thuộc tính:
> - Project: 4N Clinic Management System
> - Course: SE104 — Nhập môn Công nghệ phần mềm
> - Phase: Phase 1 / Level 1 — Implementation Baseline
> - Version: v1.0 — Implementation handbook
> - Ngày baseline: 15/05/2026 — sau Day 40, chuẩn bị Sprint stabilization
> - Stack: Backend: NestJS + TypeScript + Prisma; Frontend: ReactJS + TypeScript + Tailwind; Database: PostgreSQL 18; API: REST JSON + Swagger/OpenAPI
> - Architecture: Client-Server + Modular Monolith + Layered/Clean Architecture
> - Team size: 4 thành viên: PO/Architect, Backend, Frontend, QA/Tester

*Ghi chú: Tài liệu này được cung cấp qua conversation 2026-05-27 và bị truncate ở phần cuối. Phần đầy đủ từ chương 3 trở đi cần được bổ sung bởi team.*

---

# 1. Baseline, scope và nguyên tắc thống nhất

Phase 1 tập trung vào web application nội bộ cho một phòng mạch tư nhân quy mô nhỏ đến vừa. Luồng chính là walk-in workflow: tiếp nhận bệnh nhân, tạo lượt khám, bác sĩ khám và kê đơn, thu ngân lập hóa đơn và ghi nhận thanh toán, quản lý xem báo cáo tháng và thay đổi quy định cơ bản.

**In-scope Phase 1:** Auth/RBAC/account; patient; reception/visit; examination; prescription; invoice/payment; regulation; disease/medicine catalog; monthly report; audit tối thiểu.

**Out-of-scope Phase 1:** Patient portal; đặt lịch online; SMS/email reminder; inventory nhập-xuất-tồn; multi-branch/multi-tenant; bảo hiểm y tế; lab integration; microservices.

## 1.1. Nguyên tắc ra quyết định trong Phase 1

- **Correctness trước feature:** các rule về trạng thái khám, hóa đơn, thanh toán, phân quyền phải đúng trước khi thêm tính năng đẹp.
- **Backend là nơi quyết định nghiệp vụ:** frontend không tự tính trạng thái hợp lệ, không tự tính tổng tiền hóa đơn, không tự suy luận quyền.
- **Database bảo vệ dữ liệu bằng FK, UNIQUE, CHECK, index và transaction**, nhưng không thay thế service-level business rules.
- **Mọi dữ liệu lịch sử tài chính phải snapshot:** giá thuốc, tên thuốc, phí khám, invoice item không được thay đổi khi catalog/quy định đổi sau này.
- **Một module có owner chính nhưng không có module "của riêng một người":** luôn có reviewer, QA và frontend/backend counterpart.
- **Không mở scope sang Phase 2 nếu chưa pass critical P0 demo flow.**

## 1.2. Kiến trúc baseline

```
Internal Users
→ Browser / React SPA
→ REST JSON / Swagger OpenAPI
→ NestJS Modular Monolith
  → Controller: HTTP endpoints, guards, DTO validation
  → Service: use case orchestration, transaction, business rules
  → Prisma: data access
  → PostgreSQL 18: source of truth, constraints, indexes, snapshots
→ Audit Logs / Reports / Export
```

## 1.3. Module status (corrected)

| Nhóm trạng thái | Module | Ý nghĩa implementation |
|---|---|---|
| 70%+ In Progress | auth, patients, visits, examinations, billing | Đã có skeleton/chức năng chính, cần hardening business rule, transaction, Swagger, tests |
| 20-60% Partial/Stub | users, prescriptions, rbac, regulations | Đã có file cơ bản nhưng cần hoàn thiện DTO, service methods, DB mapping, endpoint và test |
| 0% Not Started | reports, audit | Cần tạo chức năng đọc/tổng hợp và logging tối thiểu, nhưng phụ thuộc dữ liệu từ các module chính |
| Gap so với scope | disease/medicine catalog chưa có module riêng | Khuyến nghị thêm catalogs/ hoặc diseases/ + medicines/. Nếu không kịp, tạm gộp nhưng phải có API/catalog table rõ |

---

# 2. Ma trận thông tin: ai cũng phải biết vs owner cần nắm sâu

## 2.1. Shared vocabulary bắt buộc

| Khái niệm | Định nghĩa thống nhất |
|---|---|
| Patient | Hồ sơ bệnh nhân tĩnh, dùng lại qua nhiều lần đến khám. Không đại diện cho một lần khám cụ thể |
| Visit/Encounter | Một lượt khám trong một ngày, có queue number/status, gắn với patient và tiến trình khám/thanh toán |
| Examination | Phiếu khám chuyên môn của bác sĩ, gắn với một visit. Có draft và complete |
| Prescription | Đơn thuốc gắn với examination, gồm nhiều prescription items từ medicine catalog |
| Invoice | Hóa đơn phát sinh từ visit đã hoàn tất khám, snapshot phí khám/thuốc/dịch vụ |
| Payment | Giao dịch thu tiền cho invoice. Phase 1 khuyến nghị full payment để giảm rủi ro |
| Regulation version | Phiên bản quy định vận hành có effective date. Không sửa ngược dữ liệu cũ |
| Audit log | Log append-only cho hành động nhạy cảm: login, đổi quyền, complete exam, issue invoice, payment, regulation change |

---

# 3. Chia việc 4 người theo module backend và hỗ trợ chéo

| Thành viên/Role | Primary responsibility | Secondary support | Output phải giao |
|---|---|---|---|
| Chơn Nhân — PO/Architect/Coordinator | Scope, requirement, DB baseline, API contract, regulation/report, traceability, review kiến trúc | Review business rules cho visits/exams/billing, hỗ trợ giải quyết conflict FE-BE-QA | docs v1.0, schema review, rule matrix, sprint plan, acceptance criteria |
| Đức Nguyên — Backend Core Owner | Auth, users, RBAC, shared guards, billing/payment transaction, service patterns | Review patients/visits/examinations/prescriptions, hỗ trợ Prisma transaction | Core backend PRs, Swagger, service tests, transaction-safe flow |
| Trọng Nhân — Frontend & Workflow Integration Owner | Frontend workflow, API client, screens cho patients/visits/exam/billing, hỗ trợ patients/visits backend nếu cần | Feedback API shape, allowedActions, UI validation, manual demo flow | UI screens, API integration, query keys, frontend smoke checklist |
| Phan Nhật — QA/Test Owner | Test plan, E2E/integration tests, bug log, regression, audit verification | Hỗ trợ implement audit/report test data, viết test cho all modules | test matrix, Supertest cases, bug report, demo verification |

---

# 4. Workflow nghiệp vụ Phase 1 và use case mapping

## UC Coverage Phase 1 (đã verify từ evaluation report 2026-05-20)

| UC | Tên | Điểm /5 | Ghi chú |
|---|---|---|---|
| UC01 | Đăng nhập | 5 | username field đúng, refresh token rotation, redirect đúng |
| UC02 | Quản lý tài khoản | 4 | List/create/lock đủ. Thiếu edit inline sau create |
| UC03 | Phân quyền | 2→5* | RoleManagementPage đã fix (hardening H-02) |
| UC04 | Tra cứu bệnh nhân | 5 | Search, debounce, table, empty state đầy đủ |
| UC05 | Tạo hồ sơ bệnh nhân | 5 | `dob` field đúng, Zod validation đúng |
| UC06 | Tiếp nhận bệnh nhân | 4 | Merge vào VisitCreate — hợp lý với workflow |
| UC07 | Tạo lượt khám | 5 | `visitDate` field đúng, queue number hiển thị sau tạo |
| UC08 | Xem danh sách khám | 5 | Date filter, status filter, badge trạng thái |
| UC09 | Mở lượt khám | 4 | Button "Mở khám" ở VisitListPage, navigate sang ExaminationPage |
| UC10 | Lập phiếu khám | 4 | symptoms, clinicalNotes, conclusion, diagnoses[] đủ |
| UC11 | Lịch sử khám | 4 | Timeline view, examination + prescription + invoice trong 1 entry |
| UC12 | Kê đơn thuốc | 5 | Drug selector, quantity, dosage, PUT replace-all đúng |
| UC13 | Hoàn tất phiếu khám | 4 | Backend check symptoms+conclusion. Frontend có nút complete + confirm |
| UC14 | Lập hóa đơn | 3→4* | Cashier pending tab đã fix (hardening H-03) |
| UC15 | Ghi nhận thanh toán | 5 | PaymentDialog inline, validate amount ≤ remaining, 3 phương thức |
| UC16 | Tra cứu hóa đơn | 4 | List + detail đủ. Thiếu filter theo date range |
| UC17 | Thay đổi quy định | 4 | Create + activate + warning không hồi tố |
| UC18 | Danh mục bệnh | 4 | List, create, toggle active |
| UC19 | Danh mục thuốc | 4 | List, create, toggle active |
| UC20 | Báo cáo tháng | 4 | Month selector, summary cards thực từ DB |

*Sau hardening H-01..H-04

---

# 5. Business rules, state machines và error conventions

## Visit State Machine

```
REGISTERED → WAITING → IN_EXAMINATION → COMPLETED
                    ↘                 ↘
                    CANCELLED          CANCELLED
```

## Examination State Machine

```
OPEN → COMPLETED
     ↘ CANCELLED
```
- COMPLETED yêu cầu: symptoms + conclusion không rỗng, ít nhất 1 diagnosis

## Invoice State Machine

```
DRAFT → ISSUED → PARTIALLY_PAID → PAID
      ↘        ↘                ↘
      VOID      VOID              VOID (chỉ khi chưa có payment)
```

## Payment Rules

- `amount <= remainingAmount` (remainingAmount = totalAmount - paidAmount)
- Không hoàn tiền trong Phase 1
- Sau mỗi payment: cập nhật paidAmount và status (ISSUED/PARTIALLY_PAID/PAID)

## Key Business Rules Phase 1

| Rule | Mô tả | Service |
|---|---|---|
| BR-01 | Max visits/day từ RegulationVersion (key: MAX_PATIENTS_PER_DAY) | VisitsService |
| BR-02 | Unique visit: (patientId, visitDate) | DB constraint |
| BR-03 | Queue number atomic trong ngày | $transaction |
| BR-04 | Invoice chỉ từ COMPLETED visit | BillingService |
| BR-05 | Unique invoice per visit | DB constraint |
| BR-06 | Payment không vượt remaining | BillingService |
| BR-07 | Examination complete yêu cầu symptoms + conclusion | ExaminationsService |
| BR-08 | Prescription là upsert (replace-all strategy) | ExaminationsService |
| BR-09 | Regulation activate deactivates old version | $transaction |

---

# 6. Software Design tổng quan: layering, dependency, folder rules

## Layering

```
Controller Layer: HTTP routing, guards, DTO validation, no business logic
Service Layer: Business rules, transactions, orchestration, audit logging
Repository Layer (Prisma): Data access, no business logic
Database Layer: Constraints, indexes, referential integrity
```

## Folder structure (Backend)

```
backend/src/
  common/
    constants/roles.constant.ts
    decorators/current-user.decorator.ts, roles.decorator.ts
    guards/jwt-auth.guard.ts, roles.guard.ts
  modules/
    auth/ patients/ visits/ examinations/ prescriptions/
    billing/ diseases/ drugs/ regulations/ reports/ users/ rbac/ audit/
  prisma/
    prisma.module.ts, prisma.service.ts
  app.module.ts, main.ts
```

## Folder structure (Frontend)

```
frontend/src/
  app/ router.tsx, providers.tsx
  components/ ui/ common/ (AppShell, Sidebar, Topbar, DataTable, ...)
  features/ auth/ patients/ visits/ examinations/ invoices/
            regulations/ diseases/ medicines/ reports/ users/
  lib/ api-client.ts, auth.ts, date.ts, money.ts
  pages/ ForbiddenPage.tsx, NotFoundPage.tsx
```

---

# 7. Database Design — Phase 1 Schema Summary

## Phase 1 Models (20)

**Identity & Access:** User, Role, Permission, UserRole, RolePermission, RefreshToken, AuditLog  
**Clinical:** Patient, Visit, Examination, Disease, Diagnosis, Drug, Prescription, PrescriptionItem  
**Financial:** Invoice, InvoiceItem, Payment  
**Operations:** RegulationVersion, RegulationItem

## Key constraints

| Constraint | Model/Field | Type |
|---|---|---|
| Unique visit per patient per day | Visit (patientId, visitDate) | @@unique |
| Unique queue per day | Visit (visitDate, queueNumber) | @@unique |
| Unique invoice per visit | Invoice (visitId) | @unique |
| Unique prescription per exam | Prescription (examinationId) | @unique |
| RefreshToken hash | RefreshToken (tokenHash) | SHA-256 |
| Password hash | User (passwordHash) | bcrypt |

---

# 8. API Contract Design — Phase 1 Endpoints (40 total)

| Module | Count | Key endpoints |
|---|---|---|
| Auth | 4 | POST /auth/login (public), POST /auth/refresh (public), POST /auth/logout, GET /auth/me |
| Patients | 4 | GET, POST /patients; GET /patients/:id; GET /patients/:id/medical-history |
| Visits | 3 | POST, GET /visits; POST /visits/:id/open-examination |
| Examinations | 5 | GET, PATCH /examinations/:id; POST, PUT /examinations/:id/prescription; POST /examinations/:id/complete |
| Billing | 4 | POST /visits/:visitId/invoice; GET, GET/:id /invoices; POST /invoices/:id/payments |
| Users | 6 | GET, GET/:id, POST, PATCH/:id, PATCH/:id/lock, PATCH/:id/roles /users |
| RBAC | 3 | GET /rbac/roles; GET /rbac/permissions; PATCH /rbac/roles/:id/permissions |
| Audit | 1 | GET /audit-logs |
| Diseases | 3 | GET, POST /diseases; PATCH /diseases/:id |
| Drugs | 3 | GET, POST /drugs; PATCH /drugs/:id |
| Regulations | 3 | GET /regulations/current; POST /regulations; PATCH /regulations/:id/activate |
| Reports | 1 | GET /reports/monthly |

## RBAC Matrix Phase 1

| Role | Endpoints |
|---|---|
| ADMIN | All endpoints |
| RECEPTIONIST | GET /visits, POST /visits, GET /patients, POST /patients, GET /patients/:id |
| DOCTOR | GET /visits, POST /visits/:id/open-examination, GET/PATCH/POST /examinations/:id*, GET /drugs, GET /diseases |
| CASHIER | GET /visits, POST /visits/:visitId/invoice, GET /invoices*, POST /invoices/:id/payments |
| MANAGER | GET /visits, GET /patients*, GET /drugs, GET /reports/monthly, GET /audit-logs, GET /regulations/current |

---

# 9. Frontend Integration Guidance

## API Client

```typescript
// lib/api-client.ts
// - VITE_API_BASE_URL from env
// - Bearer token from auth store
// - Normalize 400/401/403/404/409/500 to ApiError
// - Zustand auth store: { user, accessToken, setAuth, clearAuth }
```

## Route guards

- Not logged in → redirect `/login`
- Wrong role → redirect `/403`
- Backend 401 → clearAuth → redirect `/login`
- Backend 403 → show ForbiddenPage

## Required UX states per screen

- Loading skeleton
- Empty state with next action
- Error state with retry
- Success toast (sonner)
- Confirm dialog for irreversible actions

---

# 10. Testing & QA Plan

## Test structure

```
backend/test/          # e2e tests (Supertest)
backend/src/**/*.spec.ts  # unit tests
```

## Critical test scenarios

| Scenario | Expected |
|---|---|
| POST /auth/login wrong password | 401 |
| GET /visits without JWT | 401 |
| GET /patients as CASHIER | 403 |
| POST /visits same patient same day | 409 |
| POST /visits over daily quota | 409 |
| POST /invoices/:id/payments over remaining | 400 |
| POST /examinations/:id/complete without symptoms | 400 |
| GET /auth/me response | No passwordHash field |

---

# 11. Usage Guide

## Setup

```bash
# Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

## Demo flow

1. Login as admin (username: admin, password: Admin@123)
2. Create patient → Create visit → note queue number
3. Doctor login → Open examination → Fill symptoms/conclusion/diagnosis/prescription → Complete
4. Cashier login → Find visit COMPLETED → Create invoice → Record payment
5. Manager login → View monthly report
6. Admin → View audit logs
