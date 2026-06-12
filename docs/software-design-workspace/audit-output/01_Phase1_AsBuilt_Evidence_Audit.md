# A1 — Phase 1 As-Built Evidence Audit
## 4N Clinic Management System

**Nguồn:** Working tree `feature/UC07-20-with-frontend` (có uncommitted hardening changes)  
**Label policy:** Mọi claim đều được gán nhãn; không có claim không nguồn.

---

## 1. Backend Module Inventory

### 1.1 Modules đã triển khai `IMPLEMENTED-VERIFIED`

| Module | Controller prefix | Service | Key operations |
|---|---|---|---|
| AuthModule | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | `auth.service.ts` | JWT issue/refresh/revoke, SHA-256 token hash, LoginSuccess/Failed audit |
| PatientsModule | `GET/POST /patients`, `GET /patients/:id`, `GET /patients/:id/medical-history` | `patients.service.ts` | Search, create, detail, history; AuditService injected |
| VisitsModule | `POST /visits`, `GET /visits`, `POST /visits/:id/open-examination` | `visits.service.ts` | Queue number via `$transaction`, daily cap from Regulation, hasInvoice filter |
| ExaminationsModule | `GET/PATCH /examinations/:id`, `POST/PUT /examinations/:id/prescription`, `POST /examinations/:id/complete` | `examinations.service.ts` | OPEN→COMPLETED state, symptoms+conclusion required, prescription upsert atomic |
| BillingModule | `POST /visits/:visitId/invoice`, `GET /invoices`, `GET /invoices/:id`, `POST /invoices/:id/payments` | `billing.service.ts` | Invoice from COMPLETED visit, multi-payment, overpayment check |
| DiseasesModule | `GET /diseases`, `POST /diseases`, `PATCH /diseases/:id` | `diseases.service.ts` | Active/inactive toggle |
| DrugsModule | `GET /drugs`, `POST /drugs`, `PATCH /drugs/:id` | `drugs.service.ts` | Catalog, active/inactive |
| RegulationsModule | `GET /regulations/current`, `POST /regulations`, `PATCH /regulations/:id/activate` | `regulations.service.ts` | Version-controlled, activate deactivates old, `$transaction` |
| UsersModule | `GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/lock`, `PATCH /users/:id/roles` | `users.service.ts` | Create, lock, assign roles; excludes passwordHash |
| RbacModule | `GET /rbac/roles`, `GET /rbac/permissions`, `PATCH /rbac/roles/:id/permissions` | `rbac.service.ts` | Role-permission management |
| AuditModule | `GET /audit-logs` | `audit.service.ts` | log() pattern: actorId, action, entityType, entityId, after |
| ReportsModule | `GET /reports/monthly` | `reports.service.ts` | Monthly summary from DB |
| PrismaModule | shared | `prisma.service.ts` | Global DB client |
| HealthModule | health check | `health.service.ts` | Infrastructure |

**Prescriptions:** `PrescriptionsController` đã bị XÓA (hardening H-01). `PrescriptionsModule` chỉ còn `PrescriptionsService` được export cho `ExaminationsModule`.

### 1.2 Migrations `IMPLEMENTED-VERIFIED`

| Migration | Nội dung |
|---|---|
| `20250519000000_baseline` | Schema Phase 1 gốc |
| `20260518102948_add_identity_access_system` | Identity/access system |
| `20260520192733_phase2a_foundation` | Phase 2A models (untracked, applied to DB) |

---

## 2. Security & RBAC `IMPLEMENTED-CODE-REVIEWED`

> **[A6 CORRECTION]** Label thay đổi từ `IMPLEMENTED-VERIFIED` → `IMPLEMENTED-CODE-REVIEWED`. Không có integration test xác nhận 401/403 responses, audit log DB writes, hay passwordHash exclusion ở HTTP level. Xem A6 Task 3 để biết chi tiết.

### 2.1 Guard coverage

**11 feature controllers (trừ AuthController) đều có class-level `@UseGuards(JwtAuthGuard, RolesGuard)`** — xác nhận từ đọc trực tiếp 12 controller files. AuthController có guards chỉ trên `@Post('logout')` và `@Get('me')`, còn `@Post('login')` và `@Post('refresh')` là public (đúng thiết kế).

Guard placement:
- `AuthController`: method-level guard trên logout + me; login + refresh là **public** (intentional)
- `RbacController`: class-level `@UseGuards` + `@Roles(ADMIN)` — ADMIN-only
- `UsersController`: class-level `@UseGuards` + `@Roles(ADMIN)` — ADMIN-only
- 8 controllers còn lại: class-level `@UseGuards`, method-level `@Roles` với các roles phù hợp

### 2.2 Role matrix (working tree) `IMPLEMENTED-CODE-REVIEWED`

> **[A6 CORRECTION]** Tổng số endpoints: **40** (không phải 37 như khai báo trước). Lỗi: UsersModule thiếu `GET /users/:id` riêng biệt. Xem A6 Task 2 để biết đầy đủ phân tích.

| Route | Roles allowed |
|---|---|
| `GET /visits` | RECEPTIONIST, DOCTOR, MANAGER, CASHIER, ADMIN |
| `POST /visits` | RECEPTIONIST, ADMIN |
| `POST /visits/:id/open-examination` | DOCTOR, ADMIN |
| `GET /patients` | RECEPTIONIST, DOCTOR, MANAGER, ADMIN |
| `POST /patients` | RECEPTIONIST, ADMIN |
| `GET /patients/:id/medical-history` | DOCTOR, MANAGER, ADMIN |
| `GET/POST/PATCH /examinations/:id*` | DOCTOR, ADMIN |
| `POST /visits/:visitId/invoice` | CASHIER, ADMIN |
| `GET /invoices*` | CASHIER, MANAGER, ADMIN |
| `POST /invoices/:id/payments` | CASHIER, ADMIN |
| `GET /drugs` | ADMIN, MANAGER, DOCTOR |
| `POST/PATCH /drugs` | ADMIN |
| `GET /diseases` | ADMIN, MANAGER, DOCTOR, RECEPTIONIST |
| `GET/POST/PATCH /regulations` | ADMIN (write), ADMIN+MANAGER+others (read) |
| `GET /reports/monthly` | ADMIN, MANAGER |
| `GET /audit-logs` | ADMIN, MANAGER |
| `GET/POST /rbac/*` | ADMIN |
| `GET/POST/PATCH /users*` | ADMIN (write), ADMIN (read most) |

### 2.3 Roles seeded `IMPLEMENTED-VERIFIED`

8 roles: ADMIN, DOCTOR, RECEPTIONIST, CASHIER, MANAGER, **NURSE**, **LAB_TECHNICIAN**, **PHARMACIST**

> `NURSE`, `LAB_TECHNICIAN`, `PHARMACIST` đã có trong seed và `roles.constant.ts` nhưng **chưa có route/service/frontend** nào phân biệt quyền 3 role này. Đây là `TECHNICAL-DEBT` cho Phase 2A.

### 2.4 JWT security `IMPLEMENTED-CODE-REVIEWED`

- Refresh token được hash SHA-256 trước khi lưu DB — xác nhận từ `auth.service.ts:19-21`
- Token rotation sau mỗi lần refresh — xác nhận từ code
- Login failure → `LOGIN_FAILED` audit log (4 cases: user_not_found, account_locked, account_inactive, invalid_credentials) — xác nhận từ code
- Login success → `LOGIN_SUCCESS` audit log — xác nhận từ code
- `passwordHash` không có trong response — xác nhận từ code (USER_ROLES_SELECT không include field này)

> **Chưa test:** 401 khi không có JWT, 403 khi sai role, audit log record thực sự ghi DB, passwordHash không xuất hiện trong HTTP response body. Cần integration test (TD-009).

---

## 3. Business Logic `IMPLEMENTED-VERIFIED`

### 3.1 Transaction boundaries

| Operation | Transaction | File |
|---|---|---|
| Visit creation + queue number | `$transaction` | `visits.service.ts` |
| Prescription upsert | `$transaction` | `examinations.service.ts` |
| Examination complete + status change | `$transaction` | `examinations.service.ts` |
| Invoice creation + InvoiceItems | `$transaction` | `billing.service.ts` |
| Payment + status update | `$transaction` | `billing.service.ts` |
| Regulation activate (deactivate old) | `$transaction` | `regulations.service.ts` |

### 3.2 Business rules verified

| Rule | Status | Evidence |
|---|---|---|
| MAX_PATIENTS_PER_DAY từ RegulationVersion | ✅ | `visits.service.ts` đọc regulation, fallback 40 |
| Unique visit per patient per day | ✅ | `@@unique([patientId, visitDate])` in schema |
| Visit COMPLETED để tạo invoice | ✅ | `billing.service.ts` check status |
| Invoice chỉ 1 per visit | ✅ | `@@unique([visitId])` on Invoice |
| Payment ≤ remaining amount | ✅ | Check `amount > remaining` → throw |
| Examination complete yêu cầu symptoms + conclusion | ✅ | `examinations.service.ts` validation |
| Queue number atomic | ✅ | `$transaction` với max query |

### 3.3 Audit coverage (sau hardening) `IMPLEMENTED-VERIFIED`

| Action | Logged | Module |
|---|---|---|
| LOGIN_SUCCESS | ✅ | auth.service |
| LOGIN_FAILED | ✅ | auth.service |
| CREATE_PATIENT | ✅ | patients.service |
| CREATE_VISIT | ✅ | visits.service |
| OPEN_EXAMINATION | ✅ | visits.service |
| COMPLETE_EXAMINATION | ✅ | examinations.service |
| CREATE_INVOICE | ✅ | billing.service |
| CREATE_PAYMENT | ✅ | billing.service |

**Missing audit** (Phase 2A cần bổ sung): PATIENT_UPDATE, VISIT_CANCEL, REGULATION_ACTIVATE, USER_LOCK, ROLE_PERMISSION_CHANGE, DISPENSE, STOCK_MOVEMENT, LAB_RESULT_ENTERED

---

## 4. Database Schema `IMPLEMENTED-VERIFIED`

### 4.0 Phase 1 / Phase 2A Boundary (LOCKED per A6 Task 1)

> **Phase 1 boundary** = 20 models có cả schema VÀ service/controller đã implement.  
> **Phase 2A boundary** = 17 models có schema nhưng không có service/controller.  
> **Boundary straddle**: `Visit.departmentId`, `Visit.appointmentId`, `InvoiceItem.itemType/referenceType/referenceId` là Phase 2A fields trên Phase 1 models — tồn tại trong schema/DB nhưng không có Phase 1 business logic nào dùng chúng.

### 4.1 Phase 1 models (trong working tree schema)

`User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `RefreshToken`, `AuditLog`, `Patient`, `Visit`, `Examination`, `Disease`, `Diagnosis`, `Drug`, `Prescription`, `PrescriptionItem`, `Invoice`, `InvoiceItem`, `Payment`, `RegulationVersion`, `RegulationItem`

### 4.2 Phase 2A models (migration applied, schema present) `IMPLEMENTED-UNVERIFIED`

`Department`, `Room`, `DoctorProfile`, `StaffSchedule`, `Appointment`, `QueueTicket`, `VitalSign`, `ServiceCatalog`, `LabTestCatalog`, `ServiceOrder`, `LabOrder`, `LabSample`, `LabResult`, `StockLot`, `StockMovement`, `Dispense`, `DispenseItem`

> `IMPLEMENTED-UNVERIFIED`: migration SQL đã chạy (confirmed bởi seed pass), nhưng chưa có service/controller nào implement. Schema tồn tại trong DB nhưng chưa có business logic.

### 4.3 Schema conflicts với Decision Baseline

| Issue | Schema hiện tại | Baseline yêu cầu | Status |
|---|---|---|---|
| DispenseStatus enum | `PENDING`, `DISPENSED`, `CANCELLED` | Chỉ `DISPENSED`, `REVERSED` | `NEEDS-ALIGNMENT` |
| StockMovementType enum | `IN`, `OUT`, `ADJUSTMENT` | `IN`, `OUT`, `ADJUSTMENT`, `REVERSAL` | `NEEDS-ALIGNMENT` |
| LabOrderStatus enum | `ORDERED`, `SAMPLE_COLLECTED`, `RESULT_ENTERED`, **`VERIFIED`**, `CANCELLED` | `ORDERED`, `SAMPLE_COLLECTED`, `RESULT_ENTERED`, **`REVIEWED`**, `CANCELLED` | `NEEDS-ALIGNMENT` — dùng `VERIFIED` thay vì `REVIEWED` |
| StaffSchedule.startTime | `String` | `startAt DateTime` | `NEEDS-ALIGNMENT` |
| StaffSchedule.endTime | `String` | `endAt DateTime` | `NEEDS-ALIGNMENT` |
| Visit.visitSource | Không có | `visitSource enum WALK_IN/APPOINTMENT` | `NEEDS-ALIGNMENT` |
| Visit.doctorProfileId | Không có | Optional FK | `NEEDS-ALIGNMENT` |
| ServiceOrder.isRequiredForCompletion | Không có | Boolean field bắt buộc | `NEEDS-ALIGNMENT` |
| LabResult.reviewedById | Không có | `reviewedById`, `reviewedAt` | `NEEDS-ALIGNMENT` |
| Appointment.scheduledStartAt | `scheduledAt DateTime` | `scheduledStartAt`, `scheduledEndAt` | `NEEDS-ALIGNMENT` |

---

## 5. Frontend `IMPLEMENTED-VERIFIED`

### 5.1 Routes & RBAC guards

| Route | RequireRole | Page |
|---|---|---|
| `/app/patients` | ADMIN, RECEPTIONIST, DOCTOR, MANAGER | PatientListPage |
| `/app/patients/new` | ADMIN, RECEPTIONIST | PatientCreatePage |
| `/app/patients/:id` | ADMIN, RECEPTIONIST, DOCTOR, MANAGER | PatientDetailPage |
| `/app/patients/:id/history` | ADMIN, DOCTOR, MANAGER | MedicalHistoryPage |
| `/app/visits` | ADMIN, RECEPTIONIST, DOCTOR, MANAGER | VisitListPage |
| `/app/visits/new` | ADMIN, RECEPTIONIST | VisitCreatePage |
| `/app/examinations/:id` | ADMIN, DOCTOR | ExaminationPage |
| `/app/invoices` | ADMIN, CASHIER, MANAGER | InvoiceListPage |
| `/app/invoices/:id` | ADMIN, CASHIER, MANAGER | InvoiceDetailPage |
| `/app/reports/monthly` | ADMIN, MANAGER | MonthlyReportPage |
| `/app/catalog/diseases` | ADMIN, MANAGER | DiseaseCatalogPage |
| `/app/catalog/medicines` | ADMIN, MANAGER | MedicineCatalogPage |
| `/app/settings/regulations` | ADMIN, MANAGER | RegulationPage |
| `/app/admin/users` | ADMIN | UserManagementPage |
| `/app/admin/roles` | ADMIN | RoleManagementPage |

> **NOTE từ router.tsx:** `/app/visits/:id` intentionally omitted — `GET /visits/:id` không có trong backend. `TECHNICAL-DEBT`

### 5.2 UC coverage

| UC | Trạng thái | Ghi chú |
|---|---|---|
| UC01 Login | ✅ COMPLETE | |
| UC02 Users | ✅ COMPLETE | |
| UC03 RBAC | ✅ FIXED (hardening) | RoleManagementPage gọi API thật |
| UC04 Patient search | ✅ COMPLETE | |
| UC05 Patient create | ✅ COMPLETE | |
| UC06 Reception/visit | ✅ COMPLETE | |
| UC07 Create visit | ✅ COMPLETE | |
| UC08 Visit list | ✅ COMPLETE | |
| UC09 Open examination | ✅ COMPLETE | |
| UC10 Examination form | ✅ COMPLETE | |
| UC11 Medical history | ✅ COMPLETE | |
| UC12 Prescription | ✅ COMPLETE | |
| UC13 Complete exam | ✅ COMPLETE | |
| UC14 Invoice create | ✅ FIXED (hardening) | Cashier có tab "Chờ lập hóa đơn" |
| UC15 Payment | ✅ COMPLETE | |
| UC16 Invoice search | ✅ COMPLETE | |
| UC17 Regulations | ✅ COMPLETE | |
| UC18 Disease catalog | ✅ COMPLETE | |
| UC19 Medicine catalog | ✅ COMPLETE | |
| UC20 Monthly report | ✅ COMPLETE | |

---

## 6. Technical Debt Register (Phase 1)

| ID | Issue | Severity | For Phase 2 |
|---|---|---|---|
| TD-001 | `PrescriptionsController` unguarded/duplicate | ✅ FIXED (deleted) | Resolved |
| TD-002 | RoleManagement UI static | ✅ FIXED | Resolved |
| TD-003 | Cashier no invoice entry flow | ✅ FIXED | Resolved |
| TD-004 | Audit coverage incomplete | ✅ PARTIALLY FIXED | 8 core actions covered; Phase 2 entities not yet |
| TD-005 | `GET /visits/:id` missing | Medium | NURSE/LAB roles will need visit detail |
| TD-006 | NURSE/LAB_TECHNICIAN/PHARMACIST roles seeded but no RBAC/frontend | High | Must implement in Phase 2A |
| TD-007 | Patient update endpoint missing from frontend | Low | PatientDetailPage is read-only |
| TD-008 | Regulation history view absent | Low | RegulationPage shows current only |

---

## 7. Build Evidence

| Check | Result | Notes |
|---|---|---|
| `npm run build` (backend) | ✅ PASS | `nest build` clean, no errors |
| `npm run build` (frontend) | ✅ PASS | `vite build` 3.60s; chunk size warning only (non-breaking) |
| ESLint (backend) | ✅ PASS | Confirmed in prior session |
| ESLint (frontend) | ✅ PASS | Confirmed in prior session |
| Jest (backend) | ✅ PASS (1 test) | Minimal test coverage |

---

## 8. Phase 1 As-Built Verdict

**[CORRECTED per A6]**

**Kết luận:** Phase 1 **có thể** được dùng làm nguồn cho draft As-Built document với các điều kiện sau **phải được ghi rõ trong document**:

1. Evidence type: `IMPLEMENTED-CODE-REVIEWED` (builds pass, không có integration test coverage)
2. Working tree (không phải HEAD commit `a71aa99`) được dùng làm source — Phase 2A schema present
3. Endpoint count: **40 endpoints** (phiên bản sửa từ 37 sai ban đầu)
4. Security: design và code đúng nhưng chưa có runtime test — không thể gọi là FULLY-VERIFIED
5. Phase 2A boundary: 17 models có schema không có business logic — phải label `SCHEMA-PRESENT-UNIMPLEMENTED`
6. Boundary straddle: Visit và InvoiceItem có Phase 2A fields chưa được dùng
7. Audit coverage: 8/~20 needed actions — partial, không phải complete
8. Technical Debt TD-001..009 tất cả phải visible trong document (xem A3)

**→ Status: `READY-DRAFT`**  
**Label đầy đủ: "Phase 1 As-Built (working tree, pre-commit; code-reviewed evidence; 40 endpoints; Phase 2A schema present unimplemented)"**
