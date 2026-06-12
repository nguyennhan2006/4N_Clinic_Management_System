# A6 — Baseline Lock and Audit Correction
## MODE A.1 — Audit Correction and Baseline Lock

**Ngày:** 2026-05-27  
**Mode:** A.1 — AUDIT CORRECTION ONLY (no code change, no schema change, no migration)  
**Trigger:** User-identified errors in A0–A5 from Mode A session  
**Files modified:** A1, A5 (corrections noted below)  
**Files unchanged:** A0, A2, A3, A4 (already correct)

---

## RÀNG BUỘC NGHIÊM NGẶT (đã tuân thủ)

- [x] Không sửa code
- [x] Không sửa schema.prisma
- [x] Không tạo hoặc chạy migration mới
- [x] Không commit working tree
- [x] Không bắt đầu implement Phase 2
- [x] Không tạo Software Design final
- [x] Chỉ đọc, kiểm tra, đối chiếu, cập nhật audit-output

---

## Task 1 — Phase 1 / Phase 2A Boundary Lock

### 1.1 Phase 1 Boundary — LOCKED

Phase 1 gồm tất cả models có **cả schema VÀ service/controller đã implement**:

| # | Model | Controller | Service | Status |
|---|---|---|---|---|
| 1 | User | UsersController | UsersService | PHASE-1 |
| 2 | Role | RbacController | RbacService | PHASE-1 |
| 3 | Permission | RbacController | RbacService | PHASE-1 |
| 4 | UserRole | (via RbacService) | RbacService | PHASE-1 |
| 5 | RolePermission | RbacController | RbacService | PHASE-1 |
| 6 | RefreshToken | AuthController | AuthService | PHASE-1 |
| 7 | AuditLog | AuditController | AuditService | PHASE-1 |
| 8 | Patient | PatientsController | PatientsService | PHASE-1 |
| 9 | Visit | VisitsController | VisitsService | PHASE-1 |
| 10 | Examination | ExaminationsController | ExaminationsService | PHASE-1 |
| 11 | Disease | DiseasesController | DiseasesService | PHASE-1 |
| 12 | Diagnosis | (via ExaminationsService) | ExaminationsService | PHASE-1 |
| 13 | Drug | DrugsController | DrugsService | PHASE-1 |
| 14 | Prescription | (via ExaminationsService) | PrescriptionsService | PHASE-1 |
| 15 | PrescriptionItem | (via ExaminationsService) | PrescriptionsService | PHASE-1 |
| 16 | Invoice | BillingController | BillingService | PHASE-1 |
| 17 | InvoiceItem | (via BillingService) | BillingService | PHASE-1 |
| 18 | Payment | BillingController | BillingService | PHASE-1 |
| 19 | RegulationVersion | RegulationsController | RegulationsService | PHASE-1 |
| 20 | RegulationItem | (via RegulationsService) | RegulationsService | PHASE-1 |

**Phase 1: 20 models, 12 controllers, 11 feature services.** Boundary LOCKED.

### 1.2 Phase 2A Boundary — LOCKED

Phase 2A gồm tất cả models có **schema trong working tree NHƯNG không có service/controller**:

| # | Model | Module | Status |
|---|---|---|---|
| 1 | Department | Organization | SCHEMA-ONLY — no controller |
| 2 | Room | Organization | SCHEMA-ONLY — no controller |
| 3 | DoctorProfile | Organization | SCHEMA-ONLY — no controller |
| 4 | StaffSchedule | Organization | SCHEMA-ONLY — no controller |
| 5 | Appointment | Appointment | SCHEMA-ONLY — no controller |
| 6 | QueueTicket | Queue | SCHEMA-ONLY — no controller |
| 7 | VitalSign | Nursing | SCHEMA-ONLY — no controller |
| 8 | ServiceCatalog | Services/Lab | SCHEMA-ONLY — no controller |
| 9 | LabTestCatalog | Lab | SCHEMA-ONLY — no controller |
| 10 | ServiceOrder | Services | SCHEMA-ONLY — no controller |
| 11 | LabOrder | Lab | SCHEMA-ONLY — no controller |
| 12 | LabSample | Lab | SCHEMA-ONLY — no controller |
| 13 | LabResult | Lab | SCHEMA-ONLY — no controller |
| 14 | StockLot | Pharmacy | SCHEMA-ONLY — no controller |
| 15 | StockMovement | Pharmacy | SCHEMA-ONLY — no controller |
| 16 | Dispense | Pharmacy | SCHEMA-ONLY — no controller |
| 17 | DispenseItem | Pharmacy | SCHEMA-ONLY — no controller |

**Phase 2A: 17 models, 0 controllers, 0 feature services.** Boundary LOCKED.

### 1.3 Boundary Straddle (Phase 1 models với Phase 2A fields)

Hai models Phase 1 đã được extend với Phase 2A fields trong working tree:

| Model | Phase 1 fields | Phase 2A fields added | Status |
|---|---|---|---|
| Visit | patientId, visitDate, queueNumber, reason, status, createdByUserId | `departmentId String?`, `appointmentId String? @unique` | STRADDLE — documented |
| InvoiceItem | invoiceId, description, quantity, unitPrice, lineTotal | `itemType String?`, `referenceType String?`, `referenceId String?` | STRADDLE — documented |

> **Hậu quả:** As-Built Phase 1 document phải ghi rõ `departmentId` và `appointmentId` tồn tại trong schema và DB nhưng không có service logic Phase 1 nào populate chúng. Tương tự với `itemType/referenceType/referenceId` trong InvoiceItem.

---

## Task 2 — Endpoint Recount

### 2.1 Corrected Endpoint Inventory

**Nguồn:** Đọc trực tiếp 12 controller files từ working tree.

| Module | Controller | Endpoints | Count |
|---|---|---|---|
| Auth | auth.controller.ts | POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/me | **4** |
| Patients | patients.controller.ts | GET /patients, POST /patients, GET /patients/:id/medical-history, GET /patients/:id | **4** |
| Visits | visits.controller.ts | POST /visits, GET /visits, POST /visits/:id/open-examination | **3** |
| Examinations | examinations.controller.ts | GET /examinations/:id, PATCH /examinations/:id, POST /examinations/:id/prescription, PUT /examinations/:id/prescription, POST /examinations/:id/complete | **5** |
| Billing | billing.controller.ts | POST /visits/:visitId/invoice, GET /invoices, GET /invoices/:id, POST /invoices/:id/payments | **4** |
| Users | users.controller.ts | GET /users, GET /users/:id, POST /users, PATCH /users/:id, PATCH /users/:id/lock, PATCH /users/:id/roles | **6** |
| RBAC | rbac.controller.ts | GET /rbac/roles, GET /rbac/permissions, PATCH /rbac/roles/:id/permissions | **3** |
| Audit | audit.controller.ts | GET /audit-logs | **1** |
| Diseases | diseases.controller.ts | GET /diseases, POST /diseases, PATCH /diseases/:id | **3** |
| Drugs | drugs.controller.ts | GET /drugs, POST /drugs, PATCH /drugs/:id | **3** |
| Regulations | regulations.controller.ts | GET /regulations/current, POST /regulations, PATCH /regulations/:id/activate | **3** |
| Reports | reports.controller.ts | GET /reports/monthly | **1** |

**Tổng đúng: 40 endpoints** (không phải 37 như A1 ban đầu ghi)

### 2.2 Nguồn lỗi

A1 ban đầu khai báo `UsersModule: GET/POST/PATCH /users, PATCH /users/:id/lock, PATCH /users/:id/roles`. Cách viết `GET/POST/PATCH /users` đã gộp nhầm 3 routes (GET /users, GET /users/:id, POST /users, PATCH /users/:id) thành 3 thay vì 4. Thiếu `GET /users/:id` riêng biệt. Sai 3 endpoints.

**Đã sửa trong A1 §2.2 (xem bên dưới).**

---

## Task 3 — Security Evidence Re-categorization

### 3.1 Claims có đủ bằng chứng CODE REVIEW

| Claim | Evidence source | Trust level |
|---|---|---|
| SHA-256 hash cho refresh token | `auth.service.ts:19-21` — `crypto.createHash('sha256')` | VERIFIED-CODE |
| bcrypt password comparison | `auth.service.ts:74` — `bcrypt.compare()` | VERIFIED-CODE |
| passwordHash không có trong select response | `auth.service.ts` USER_ROLES_SELECT không include passwordHash; `users.service.ts` explicitly exclude | VERIFIED-CODE |
| Token rotation sau refresh | `auth.service.ts` tạo token mới + revoke token cũ | VERIFIED-CODE |
| 8 audit actions logged | Code trace qua 5 services | VERIFIED-CODE |
| JwtAuthGuard + RolesGuard trên 11/12 controllers (trừ auth) | 12 controller files đọc trực tiếp | VERIFIED-CODE |
| AuthController: login public, logout+me guarded | auth.controller.ts lines 33-58 | VERIFIED-CODE |

### 3.2 Claims CHƯA CÓ đủ bằng chứng (cần test runtime)

| Claim trong A1 ban đầu | Tại sao chưa đủ | Evidence cần |
|---|---|---|
| "All security gaps fixed" | Quá rộng — không có test 401/403 | Integration test: unauthenticated → 401, wrong role → 403 |
| Audit log thực sự ghi vào DB | Chỉ confirm code, chưa có DB assertion | e2e test kiểm tra AuditLog record tạo ra |
| passwordHash không lộ trong HTTP response | Code review cho thấy không select, nhưng chưa có HTTP assertion | e2e test GET /auth/me response không có field passwordHash |
| Refresh token vô hiệu sau logout | Code revoke, nhưng chưa test attempt reuse | e2e test: logout → reuse refresh token → 401 |

> **Kết luận đúng cho A1:** Security design là IMPLEMENTED-CODE-REVIEWED, không thể gọi là FULLY-VERIFIED cho đến khi có integration tests. Điều này liên quan đến TD-009 (test coverage minimal).

---

## Task 4 — Phase 2 Decision Authority Verification

### 4.1 Kết quả kiểm tra

| Decision area | Baseline reference | Status |
|---|---|---|
| 8 roles + responsibilities | CTRL-002 D-P2-001 | APPROVED — không có open item |
| Modular Monolith architecture | CTRL-002 ADR-P2A-001 | APPROVED — không có open item |
| Organization model design | CTRL-002 D-P2-007 | APPROVED — CF-005,006 là conflict, không phải open decision |
| Appointment/Queue design | CTRL-002 D-P2-002, D-P2-008 | APPROVED — CF-006,007,008 là conflict |
| Lab REVIEWED state | CTRL-002 D-P2-009, D-P2-010 | APPROVED — CF-001,002 là conflict |
| Dispense DISPENSED/REVERSED only | CTRL-002 D-P2-011 | APPROVED — CF-003,004 là conflict |
| Invoice từ dispense | CTRL-002 D-P2-005, D-P2-012 | APPROVED |
| FEFO pharmacy | CTRL-002 D-P2-004 | APPROVED |
| BMI server-side | CTRL-002 D-P2-013 | APPROVED |

**Kết luận:** Không có OPEN design decision nào tồn tại. OQ-001..006 trong A3 là compatibility/implementation questions, không phải design decisions. Baseline v2.0 là fully APPROVED.

### 4.2 Items phân loại sai trong A3 (đã xác nhận đúng)

Các OQ trong A3 đã được label đúng là "compatibility/implementation" questions — không phải business decisions cần reopen. Không cần sửa A3 về điểm này.

---

## Task 5 — Readiness Gate Correction

### 5.1 Lỗi trong A5 ban đầu

A5 ban đầu sử dụng status `READY-PHASE2-SPRINT` trong Implementation Status section. Đây là **custom status không có trong official gate list** từ control files.

### 5.2 Status đúng

**Design Status:**
```
[x] READY-DRAFT — Draft can be generated with listed evidence limitations.
```
(Không thay đổi — vẫn đúng)

**Implementation Status:**
```
[x] STOP-IMPLEMENTATION — Schema/design blockers exist.
```

**Lý do STOP-IMPLEMENTATION:**
1. CF-001..009 schema corrections chưa được approved trong Software Design document → implementation không thể bắt đầu
2. Software Design document (Mode C) chưa được generated hoặc team-reviewed
3. H-05 (schema freeze) chưa hoàn thành
4. `READY-PHASE2-SPRINT` không phải official status

### 5.3 Đã sửa trong A5 (xem file A5 cập nhật)

---

## Summary of All Changes Made

| File | Thay đổi |
|---|---|
| A1 (01_Phase1...) | §2.2: Endpoint count 37→40; §2.1 guard coverage: rephrase 12→11 controllers guarded (AuthController partially public); §3: Security evidence categories |
| A5 (05_Readiness...) | Implementation Status: `READY-PHASE2-SPRINT` → `STOP-IMPLEMENTATION`; lý do cập nhật |
| A6 (06_Baseline...) | File mới — document tất cả corrections |
| A0, A2, A3, A4 | Không thay đổi |

---

## Phase 1 As-Built Verdict (sau correction)

Phase 1 **có thể** được dùng làm `As-Built Verified (working tree, pre-commit)` với nhãn đầy đủ:

```
IMPLEMENTED-VERIFIED (working tree, pre-commit)
Evidence type: CODE-REVIEW (builds pass, no runtime integration tests)
Phase 2A schema: PRESENT-UNIMPLEMENTED (models exist, no controllers/services)
Endpoint count: 40 (Phase 1 scope)
Security: IMPLEMENTED-CODE-REVIEWED (no integration test coverage)
```

**Tuyệt đối không gọi là "FULLY-VERIFIED" hay "production-ready" cho đến khi có test coverage.**
