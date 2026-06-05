# MODE C — Software Design Generation Context
## 4N Clinic Management System — Complete Input Package

**Ngày chuẩn bị:** 2026-05-27  
**Chuẩn bị bởi:** Mode A + A.1 audit + manual context assembly  
**Sử dụng cho:** Mode C — Generate Software Design Package (Phase 1 As-Built + Phase 2A Target Design)  
**Design Gate:** `READY-DRAFT`  
**Implementation Gate:** `STOP-IMPLEMENTATION` (pending SDD approval + schema correction migration)

---

## PHẦN 1 — IDENTITY & AUTHORITY

### 1.1 Project

- **Tên:** 4N Clinic Management System
- **Môn học:** SE104 — Nhập môn Công nghệ phần mềm
- **Team:** 4 người (Chơn Nhân, Đức Nguyên, Trọng Nhân, Phan Nhật)
- **Stack:** NestJS + TypeScript + Prisma + PostgreSQL / React + Vite + TypeScript + Tailwind + shadcn/ui
- **Architecture:** Client-Server + Modular Monolith + Layered Architecture

### 1.2 Design Authority

| Document | Authority | Version |
|---|---|---|
| `01_PHASE2_DECISION_BASELINE_FORM.md` | HIGHEST — Phase 2A canonical design | v2.0 APPROVED |
| `working tree schema.prisma` | Phase 1 As-Built schema (with Phase 2A foundation) | pre-commit |
| `evaluation-report-2026-05-20.md` | Phase 1 assessment | verified |
| `docs/phase2-tasks/` (00–07) | Phase 2A implementation specs | planning |
| `04_PHASE2A_TEAM_EXECUTION_AND_CLAUDE_CODE_GUIDE.md` | Team execution | v1.0 |
| `PHASE1_IMPLEMENTATION_HANDBOOK.md` | Phase 1 design handbook | v1.0 |

### 1.3 Audit Evidence (Mode A + A.1)

| File | Content |
|---|---|
| A0 | Source register + working tree status |
| A1 | Phase 1 as-built evidence (CORRECTED: 40 endpoints, code-reviewed security) |
| A2 | Phase 2A baseline alignment (9 NEEDS-ALIGNMENT items) |
| A3 | Conflict/Debt/OQ log (CF-001..009, TD-001..009, OQ-001..006, RK-001..005) |
| A4 | Document outline + 18 diagram plan |
| A5 | Readiness gate (READY-DRAFT / STOP-IMPLEMENTATION) |
| A6 | Baseline lock + correction register |

---

## PHẦN 2 — PHASE 1 AS-BUILT

### 2.1 Tổng quan

| Item | Value |
|---|---|
| Branch | `feature/UC07-20-with-frontend` |
| Commit | `a71aa99` (working tree dirty — hardening + Phase 2A schema uncommitted) |
| Evidence type | IMPLEMENTED-CODE-REVIEWED (builds pass; no integration tests) |
| Phase 1 models | 20 |
| Phase 2A models (schema only) | 17 |
| Controllers | 12 |
| Endpoints | **40** |
| Roles seeded | 8 (ADMIN, DOCTOR, RECEPTIONIST, CASHIER, MANAGER, NURSE, LAB_TECHNICIAN, PHARMACIST) |
| Active roles with RBAC/nav | 5 (ADMIN, DOCTOR, RECEPTIONIST, CASHIER, MANAGER) |
| Audit actions logged | 8 / ~20 needed |
| Build | ✅ Backend `nest build` + Frontend `vite build` PASS |

### 2.2 Backend Modules (12 controllers, 11 feature services)

| Module | Controller prefix | Key operations |
|---|---|---|
| AuthModule | /auth | JWT issue/refresh/revoke, SHA-256 token hash, login audit |
| PatientsModule | /patients | Search, create, detail, medical history |
| VisitsModule | /visits | Queue number via $transaction, daily cap from Regulation |
| ExaminationsModule | /examinations | OPEN→COMPLETED state, prescription upsert |
| BillingModule | /visits/:id/invoice, /invoices | Invoice from COMPLETED visit, multi-payment |
| DiseasesModule | /diseases | Active/inactive toggle |
| DrugsModule | /drugs | Catalog, active/inactive |
| RegulationsModule | /regulations | Version-controlled, activate $transaction |
| UsersModule | /users | Create, lock, assign roles; excludes passwordHash |
| RbacModule | /rbac | Role-permission management |
| AuditModule | /audit-logs | Append-only log |
| ReportsModule | /reports | Monthly summary |

**Note:** PrescriptionsController đã bị XÓA (hardening H-01). PrescriptionsService còn và được export cho ExaminationsModule.

### 2.3 Phase 1 Endpoints — Complete List (40)

```
Auth (4):
  POST /auth/login          PUBLIC
  POST /auth/refresh        PUBLIC
  POST /auth/logout         ADMIN, RECEPTIONIST, DOCTOR, CASHIER, MANAGER
  GET  /auth/me             ADMIN, RECEPTIONIST, DOCTOR, CASHIER, MANAGER

Patients (4):
  GET  /patients            RECEPTIONIST, DOCTOR, MANAGER, ADMIN
  POST /patients            RECEPTIONIST, ADMIN
  GET  /patients/:id        RECEPTIONIST, DOCTOR, MANAGER, ADMIN
  GET  /patients/:id/medical-history  DOCTOR, MANAGER, ADMIN

Visits (3):
  POST /visits              RECEPTIONIST, ADMIN
  GET  /visits              RECEPTIONIST, DOCTOR, MANAGER, CASHIER, ADMIN
  POST /visits/:id/open-examination  DOCTOR, ADMIN

Examinations (5):
  GET   /examinations/:id   DOCTOR, MANAGER, ADMIN
  PATCH /examinations/:id   DOCTOR, ADMIN
  POST  /examinations/:id/prescription  DOCTOR, ADMIN
  PUT   /examinations/:id/prescription  DOCTOR, ADMIN
  POST  /examinations/:id/complete      DOCTOR, ADMIN

Billing (4):
  POST /visits/:visitId/invoice   CASHIER, ADMIN
  GET  /invoices                  CASHIER, MANAGER, ADMIN
  GET  /invoices/:id              CASHIER, MANAGER, ADMIN
  POST /invoices/:id/payments     CASHIER, ADMIN

Users (6):
  GET   /users              ADMIN
  GET   /users/:id          ADMIN
  POST  /users              ADMIN
  PATCH /users/:id          ADMIN
  PATCH /users/:id/lock     ADMIN
  PATCH /users/:id/roles    ADMIN

RBAC (3):
  GET   /rbac/roles                    ADMIN
  GET   /rbac/permissions              ADMIN
  PATCH /rbac/roles/:id/permissions    ADMIN

Audit (1):
  GET /audit-logs           ADMIN, MANAGER

Diseases (3):
  GET   /diseases           ADMIN, MANAGER, DOCTOR, RECEPTIONIST
  POST  /diseases           ADMIN
  PATCH /diseases/:id       ADMIN

Drugs (3):
  GET   /drugs              ADMIN, MANAGER, DOCTOR
  POST  /drugs              ADMIN
  PATCH /drugs/:id          ADMIN

Regulations (3):
  GET   /regulations/current   ADMIN, MANAGER, DOCTOR, CASHIER, RECEPTIONIST
  POST  /regulations           ADMIN
  PATCH /regulations/:id/activate  ADMIN

Reports (1):
  GET /reports/monthly      ADMIN, MANAGER
```

### 2.4 Phase 1 State Machines

**Visit:**
```
REGISTERED → WAITING → IN_EXAMINATION → COMPLETED
                     ↘ CANCELLED        ↘ CANCELLED
```

**Examination:**
```
OPEN → COMPLETED (requires: symptoms + conclusion + ≥1 diagnosis)
     ↘ CANCELLED
```

**Invoice:**
```
DRAFT → ISSUED → PARTIALLY_PAID → PAID
       ↘        ↘               ↘
       VOID      VOID             VOID
```

### 2.5 Phase 1 Business Rules

| Rule | Description | Implementation |
|---|---|---|
| BR-01 | MAX_PATIENTS_PER_DAY từ RegulationVersion (fallback: 40) | VisitsService |
| BR-02 | Unique visit: (patientId, visitDate) | DB @@unique |
| BR-03 | Queue number atomic trong ngày | $transaction |
| BR-04 | Invoice chỉ từ COMPLETED visit | BillingService check |
| BR-05 | Unique invoice per visit | DB @unique |
| BR-06 | Payment amount ≤ remaining | BillingService check |
| BR-07 | Complete exam: symptoms + conclusion required | ExaminationsService |
| BR-08 | Prescription: replace-all upsert strategy | ExaminationsService |
| BR-09 | Activate regulation: deactivate all others | $transaction |

### 2.6 Phase 1 Transactions

| Operation | $transaction | File |
|---|---|---|
| Visit creation + queue number | ✅ | visits.service.ts |
| Prescription upsert | ✅ | examinations.service.ts |
| Examination complete + status | ✅ | examinations.service.ts |
| Invoice creation + InvoiceItems | ✅ | billing.service.ts |
| Payment + status update | ✅ | billing.service.ts |
| Regulation activate | ✅ | regulations.service.ts |

### 2.7 Phase 1 Audit Events (8 logged)

LOGIN_SUCCESS, LOGIN_FAILED, CREATE_PATIENT, CREATE_VISIT, OPEN_EXAMINATION, COMPLETE_EXAMINATION, CREATE_INVOICE, CREATE_PAYMENT

**Missing audit** (Phase 2 cần bổ sung): PATIENT_UPDATE, VISIT_CANCEL, REGULATION_ACTIVATE, USER_LOCK, ROLE_PERMISSION_CHANGE, DISPENSE, STOCK_MOVEMENT, LAB_RESULT_ENTERED

### 2.8 Phase 1 Security (Code-Reviewed)

- 11 feature controllers: class-level `@UseGuards(JwtAuthGuard, RolesGuard)` + method-level `@Roles`
- AuthController: login + refresh public; logout + me guarded
- Refresh token: SHA-256 hash trước khi lưu DB
- Password: bcrypt comparison
- passwordHash: không có trong select queries hay response
- Token rotation sau mỗi refresh

### 2.9 Phase 1 Technical Debt

| ID | Issue | Status |
|---|---|---|
| TD-001 | PrescriptionsController unguarded | ✅ FIXED — deleted |
| TD-002 | RoleManagement UI static | ✅ FIXED — real API calls |
| TD-003 | Cashier no invoice entry flow | ✅ FIXED — pending tab |
| TD-004 | Audit coverage incomplete | ⚠️ PARTIAL — 8/~20 actions |
| TD-005 | GET /visits/:id missing | ⚠️ OPEN — NURSE/LAB cần |
| TD-006 | NURSE/LAB_TECHNICIAN/PHARMACIST seeded but no RBAC/nav | ⚠️ OPEN — Phase 2A scope |
| TD-007 | Patient update UI absent | Low priority |
| TD-008 | Regulation history view absent | Low priority |
| TD-009 | Test coverage minimal (1 backend test) | Medium — migration risk |

### 2.10 Phase 1 Frontend

| Route | RequireRole | Page |
|---|---|---|
| /app/patients | ADMIN, RECEPTIONIST, DOCTOR, MANAGER | PatientListPage |
| /app/patients/new | ADMIN, RECEPTIONIST | PatientCreatePage |
| /app/patients/:id | ADMIN, RECEPTIONIST, DOCTOR, MANAGER | PatientDetailPage |
| /app/patients/:id/history | ADMIN, DOCTOR, MANAGER | MedicalHistoryPage |
| /app/visits | ADMIN, RECEPTIONIST, DOCTOR, MANAGER | VisitListPage |
| /app/visits/new | ADMIN, RECEPTIONIST | VisitCreatePage |
| /app/examinations/:id | ADMIN, DOCTOR | ExaminationPage |
| /app/invoices | ADMIN, CASHIER, MANAGER | InvoiceListPage |
| /app/invoices/:id | ADMIN, CASHIER, MANAGER | InvoiceDetailPage |
| /app/reports/monthly | ADMIN, MANAGER | MonthlyReportPage |
| /app/catalog/diseases | ADMIN, MANAGER | DiseaseCatalogPage |
| /app/catalog/medicines | ADMIN, MANAGER | MedicineCatalogPage |
| /app/settings/regulations | ADMIN, MANAGER | RegulationPage |
| /app/admin/users | ADMIN | UserManagementPage |
| /app/admin/roles | ADMIN | RoleManagementPage |

### 2.11 Evidence Limitations

1. Working tree (không phải HEAD commit `a71aa99`)
2. Security: code-reviewed, không có 401/403 integration tests
3. 1 backend test only — không có frontend tests
4. No Swagger static export — reconstructed từ controllers
5. NURSE/LAB_TECHNICIAN/PHARMACIST: seeded but no route/guard/nav
6. Phase 2A schema fields on Phase 1 models (Visit.departmentId, Visit.appointmentId, InvoiceItem.itemType/referenceType/referenceId) — present but no Phase 1 business logic

---

## PHẦN 3 — PHASE 2A TARGET DESIGN

### 3.1 Design Authority

**Nguồn duy nhất:** `01_PHASE2_DECISION_BASELINE_FORM.md` v2.0 — APPROVED. Không reopen.

### 3.2 Phase 2A Scope

**In-scope:**
- Organization: Department, Room, DoctorProfile, StaffSchedule
- Appointment & Queue: Appointment, QueueTicket
- Nursing: VitalSign
- Clinical Services: ServiceCatalog, ServiceOrder
- Laboratory: LabTestCatalog, LabOrder, LabSample, LabResult
- Pharmacy & Inventory: StockLot, StockMovement, Dispense, DispenseItem
- Billing Extension: InvoiceItem multi-source
- Reports Phase 2 extension
- Audit UI

**Out-of-scope:**
- Patient portal, mobile app
- SMS/email thật
- BHYT/insurance
- Telemedicine
- LIS/PACS/máy xét nghiệm thật
- Multi-branch/multi-tenant
- Purchase order/supplier đầy đủ
- AI diagnosis

### 3.3 Phase 2A Roles (8)

| Role | Vietnamese | Responsibilities |
|---|---|---|
| ADMIN | Quản trị viên | System config, users, roles, catalogs, regulations, full access |
| DOCTOR | Bác sĩ | Examinations, prescriptions, service orders, lab review |
| RECEPTIONIST | Lễ tân | Patients, visits, appointments, check-in |
| CASHIER | Thu ngân | Invoices, payments |
| MANAGER | Quản lý | Reports, oversight, read-only clinical |
| NURSE | Y tá | VitalSigns, queue management |
| LAB_TECHNICIAN | Kỹ thuật viên XN | Lab sample collection, result entry |
| PHARMACIST | Dược sĩ | Dispense, stock management |

### 3.4 Phase 2A Models (17 — schema present, no services/controllers)

| # | Model | Module | Phase 2A Design Baseline |
|---|---|---|---|
| 1 | Department | Organization | code @unique, name, isActive |
| 2 | Room | Organization | @@unique([departmentId, code]), roomType |
| 3 | DoctorProfile | Organization | userId @unique, departmentId, specialty |
| 4 | StaffSchedule | Organization | **CF-005**: startAt/endAt DateTime (not String) |
| 5 | Appointment | Appointment | **CF-006**: scheduledStartAt + scheduledEndAt (not scheduledAt + durationMinutes) |
| 6 | QueueTicket | Queue | @@unique([departmentId, queueDate, queueNumber]) — ALIGNED |
| 7 | VitalSign | Nursing | visitId @unique, BMI server-side — ALIGNED |
| 8 | ServiceCatalog | Services | code @unique, ServiceType enum |
| 9 | LabTestCatalog | Lab | serviceId @unique, sampleType |
| 10 | ServiceOrder | Services | **CF-009**: isRequiredForCompletion Boolean @default(false) |
| 11 | LabOrder | Lab | **CF-001**: LabOrderStatus.REVIEWED (not VERIFIED) |
| 12 | LabSample | Lab | collectedById, sampleType |
| 13 | LabResult | Lab | **CF-002**: reviewedById/reviewedAt (not verifiedById/verifiedAt) |
| 14 | StockLot | Pharmacy | @@unique([drugId, lotNumber]), expiryDate @db.Date |
| 15 | StockMovement | Pharmacy | **CF-004**: StockMovementType includes REVERSAL |
| 16 | Dispense | Pharmacy | **CF-003**: DispenseStatus = DISPENSED/REVERSED only (no PENDING/CANCELLED) |
| 17 | DispenseItem | Pharmacy | prescriptionItemId @unique, lotId (FEFO) |

### 3.5 Phase 2A Schema Conflicts — MUST RESOLVE BEFORE IMPLEMENTATION

These 9 conflicts exist in current schema vs Decision Baseline v2.0. A single correction migration `phase2a_schema_corrections` must be created AFTER SDD is approved.

| CF | Description | Current | Canonical |
|---|---|---|---|
| CF-001 | LabOrderStatus enum | `VERIFIED` | `REVIEWED` |
| CF-002 | LabResult review fields | `verifiedById`, `verifiedAt` | `reviewedById`, `reviewedAt` |
| CF-003 | DispenseStatus enum | `PENDING`, `DISPENSED`, `CANCELLED` | `DISPENSED`, `REVERSED` |
| CF-004 | StockMovementType missing | No `REVERSAL` | `IN`, `OUT`, `ADJUSTMENT`, `REVERSAL` |
| CF-005 | StaffSchedule time type | `startTime String`, `endTime String` | `startAt DateTime`, `endAt DateTime` |
| CF-006 | Appointment time fields | `scheduledAt DateTime` + `durationMinutes Int` | `scheduledStartAt DateTime` + `scheduledEndAt DateTime` |
| CF-007 | Visit missing visitSource | Field absent | `visitSource VisitSource` enum (WALK_IN/APPOINTMENT) |
| CF-008 | Visit missing doctorProfileId | Field absent | `doctorProfileId String?` |
| CF-009 | ServiceOrder missing isRequiredForCompletion | Field absent | `isRequiredForCompletion Boolean @default(false)` |

### 3.6 Phase 2A State Machines (canonical per baseline)

**Appointment:**
```
SCHEDULED → CHECKED_IN → (creates Visit + QueueTicket)
           ↘ CANCELLED
           ↘ NO_SHOW
```

**QueueTicket:**
```
WAITING → CALLED → IN_SERVICE → DONE
        ↘ SKIPPED
        ↘ CANCELLED
CALLED → CANCELLED
```

**ServiceOrder:**
```
ORDERED → IN_PROGRESS → COMPLETED
         ↘ CANCELLED
```

**LabOrder:**
```
ORDERED → SAMPLE_COLLECTED → RESULT_ENTERED → REVIEWED
                                              ↘ CANCELLED
```

**Dispense:**
```
DISPENSED → REVERSED (only before payment)
```

**Invoice Phase 2A:**
```
ISSUED → PARTIALLY_PAID → PAID
       ↘               ↘
       VOID             VOID
```

### 3.7 Phase 2A Business Rules (from baseline + phase2-tasks)

| Rule | Description | Critical notes |
|---|---|---|
| BR-P2-01 | Walk-in: create Visit + QueueTicket (priority=0), no Appointment | Must work without appointmentId |
| BR-P2-02 | Appointment check-in: create Visit (appointmentId, departmentId, doctorProfileId) + QueueTicket (priority=1) in $transaction | Atomic |
| BR-P2-03 | QueueNumber: unique per (departmentId, queueDate), reset daily | $transaction + @@unique |
| BR-P2-04 | Appointment conflict: interval overlap check (newStart < existingEnd AND newEnd > existingStart) | Raw query for computed endAt |
| BR-P2-05 | VitalSign: one per visit, second create = update; BMI computed server-side | @unique visitId |
| BR-P2-06 | ServiceOrder: priceSnapshot from ServiceCatalog at time of order | Snapshot required |
| BR-P2-07 | LabOrder: if ServiceType=LAB_TEST, create LabOrder; states sync | ServiceOrder → LabOrder |
| BR-P2-08 | Lab result: immutable after RESULT_ENTERED; review by different user than who entered | Service-level enforcement |
| BR-P2-09 | Dispense: FEFO lot selection (nearest expiryDate first) | Stock query order |
| BR-P2-10 | Dispense atomic: DispenseItem + StockMovement OUT + quantityOnHand decrement in $transaction | Critical |
| BR-P2-11 | Stock deduction: ONLY on pharmacist dispense, not on prescription or exam complete | Critical rule |
| BR-P2-12 | Reversal: only before payment; creates StockMovement REVERSAL, increments quantityOnHand | Atomic |
| BR-P2-13 | Invoice multi-item: collects exam fee + completed ServiceOrders + DispenseItems with snapshots | No future price changes |
| BR-P2-14 | No duplicate InvoiceItem for same referenceId | referenceType + referenceId check |
| BR-P2-15 | No VOID if payment exists | BillingService check |
| BR-P2-16 | ServiceOrder.isRequiredForCompletion: Examination cannot complete if required ServiceOrder not COMPLETED | ExaminationsService check |

### 3.8 Phase 2A API Contract (new endpoints, from phase2-tasks)

**Organization Module:**
| Method | Path | Roles |
|---|---|---|
| GET | /departments | ALL |
| POST | /departments | ADMIN |
| GET | /departments/:id/schedule | ALL |
| GET | /doctors | ALL |
| POST | /doctors | ADMIN |

**Appointments Module:**
| Method | Path | Roles |
|---|---|---|
| GET | /appointments | ALL |
| POST | /appointments | RECEPTIONIST, ADMIN |
| GET | /appointments/:id | ALL |
| PATCH | /appointments/:id | RECEPTIONIST, ADMIN |
| PATCH | /appointments/:id/cancel | RECEPTIONIST, ADMIN |
| POST | /appointments/:id/checkin | RECEPTIONIST, NURSE |

**Queue Module:**
| Method | Path | Roles |
|---|---|---|
| GET | /queue | ALL |
| GET | /queue/:id | ALL |
| PATCH | /queue/:id/status | NURSE, DOCTOR, ADMIN |
| GET | /queue/next | DOCTOR, NURSE |

**VitalSigns Module:**
| Method | Path | Roles |
|---|---|---|
| POST | /visits/:id/vitals | NURSE, ADMIN |
| GET | /visits/:id/vitals | NURSE, DOCTOR, ADMIN |

**Services Module:**
| Method | Path | Roles |
|---|---|---|
| GET | /services | ALL |
| POST | /services | ADMIN |
| POST | /examinations/:id/service-orders | DOCTOR, ADMIN |
| GET | /visits/:id/service-orders | DOCTOR, NURSE, ADMIN |

**Lab Module:**
| Method | Path | Roles |
|---|---|---|
| GET | /lab/orders | LAB_TECHNICIAN, DOCTOR, ADMIN |
| POST | /lab/orders/:id/collect | LAB_TECHNICIAN |
| POST | /lab/orders/:id/result | LAB_TECHNICIAN |
| PATCH | /lab/orders/:id/review | DOCTOR, ADMIN |

**Pharmacy Module:**
| Method | Path | Roles |
|---|---|---|
| GET | /pharmacy/pending | PHARMACIST, ADMIN |
| POST | /pharmacy/dispense | PHARMACIST, ADMIN |
| PATCH | /pharmacy/dispense/:id/reverse | PHARMACIST, ADMIN |
| GET | /inventory/stock | PHARMACIST, MANAGER, ADMIN |
| POST | /inventory/stock/receive | PHARMACIST, ADMIN |

### 3.9 Phase 2A Interface Contracts

| Flow | Contract |
|---|---|
| Appointment → Visit | Check-in creates Visit{appointmentId, departmentId, doctorProfileId} + QueueTicket{priority=1} in $transaction |
| Walk-in → Visit | Creates Visit{no appointmentId} + QueueTicket{priority=0} |
| Visit → VitalSign | visitId @unique; second create = update |
| Examination → ServiceOrder | priceSnapshot from ServiceCatalog at order time |
| ServiceOrder → LabOrder | If ServiceType=LAB_TEST: create LabOrder, states sync |
| Prescription → Dispense | Only for COMPLETED examination; stock deducted only at dispense |
| Dispense → StockMovement | Each DispenseItem → StockMovement OUT + quantityOnHand decrement in $transaction |
| Visit → Invoice | Gathers exam fee + completed service orders + dispense items; all prices snapshot |

---

## PHẦN 4 — DOCUMENT STRUCTURE FOR MODE C

### 4.1 Package Structure

```
docs/software-design-workspace/final-output/
├── 00_READ_FIRST/
│   ├── HUONG_DAN_DOC_VA_DOI_CHIEU.md
│   ├── Source_Register_and_Trust_Level.md
│   ├── Conflict_Debt_OpenQuestion_Log.md        ← từ A3
│   └── Glossary.md
├── 01_PHASE1_AS_BUILT/
│   ├── 4N_Clinic_SDD_Phase1_AsBuilt_Verified.md    ← main doc
│   ├── P1_Data_Module_API_RBAC.md
│   └── P1_Test_Traceability_and_Debt.md
├── 02_PHASE2A_TARGET_DESIGN/
│   ├── 4N_Clinic_SDD_Phase2A_Target_Design.md      ← main doc
│   ├── P2A_Data_Design_and_Migration.md
│   ├── P2A_Module_API_RBAC_and_UI.md
│   ├── P2A_State_Workflow_Transaction.md
│   └── P2A_Test_Acceptance_and_Roadmap.md
├── 03_GOVERNANCE/
│   ├── Security_Privacy_Audit_Backup.md
│   ├── ADR_Register.md
│   └── Master_Traceability_Matrix.csv
└── 04_DIAGRAM_SOURCES/
    ├── P1_C4_and_ERD.mmd
    └── P2A_C4_ERD_State_Sequences.mmd
```

### 4.2 Phase 1 Main Document — Required Sections

| Section | Content | Key facts |
|---|---|---|
| 1. Document Control | Branch, commit, scope, label, caveats | As-Built (working tree pre-commit; 40 endpoints; code-reviewed) |
| 2. System Context (C4-L1) | Browser → SPA → NestJS → PostgreSQL | Internal users only |
| 3. Container Architecture (C4-L2) | React SPA, NestJS API, PostgreSQL | JWT, Swagger at /api/docs |
| 4. Module Overview | 12 controllers, 11 services | PrescriptionsController deleted |
| 5. UC Coverage | UC01-UC20 status | All 20 pass after hardening |
| 6. API Inventory | 40 endpoints, method/path/roles | See section 2.3 above |
| 7. RBAC Matrix | Role × Route | See section 2.3 above |
| 8. Data Model | 20 Phase 1 entities + boundary straddle | Visit/InvoiceItem have Phase 2A fields |
| 9. State Machines | Visit, Examination, Invoice, Payment | See section 2.4 |
| 10. Transaction Boundaries | 6 atomic operations | See section 2.6 |
| 11. Audit Coverage | 8/~20 logged | See section 2.7 |
| 12. Security Design | JWT, SHA-256, bcrypt, RBAC | Code-reviewed, not test-verified |
| 13. Frontend Architecture | 15 routes, RBAC guards | GET /visits/:id missing (TD-005) |
| 14. Technical Debt | TD-001..009 | All visible, TD-001..003 fixed |
| 15. Build Evidence | Build/lint/test results | 1 backend test, 0 frontend tests |

### 4.3 Phase 2A Main Document — Required Sections

| Section | Content | Key facts |
|---|---|---|
| 1. Document Control | Authority, scope, Phase 1 relationship | PROPOSED-APPROVED per Baseline v2.0 |
| 2. Business Motivation | Large clinic workflow | Why Phase 2A needed |
| 3. Phase 1→2A Delta | What changes, what stays | 17 new models, extended roles |
| 4. Scope In/Out | B.1 / B.2 tables | See section 3.2 |
| 5. Actors & Roles | 8 roles | See section 3.3 |
| 6. Architecture | Modular Monolith, single site | ADR-P2A-001 |
| 7. Organization Design | Department, Room, DoctorProfile, StaffSchedule | CF-005 correction needed |
| 8. Appointment & Queue | Appointment → Check-in → Visit + QueueTicket | CF-006,007,008 corrections needed |
| 9. Nursing / VitalSign | One per visit, BMI server-side | Aligned |
| 10. Clinical Extension | ServiceOrder, isRequiredForCompletion | CF-009 correction needed |
| 11. Laboratory | LabOrder/Sample/Result, REVIEWED state | CF-001,002 corrections needed |
| 12. Pharmacy & Inventory | StockLot, FEFO, Dispense, Reversal | CF-003,004 corrections needed |
| 13. Billing Extension | Multi-item invoice from dispense | No conflicts |
| 14. State Machines | 7 canonical state machines | See section 3.6 |
| 15. Data Design & Migration | Schema corrections, backfill, rollback | CF-001..009 single migration |
| 16. API Contract | New endpoints per module | See section 3.8 |
| 17. RBAC Matrix Phase 2A | 8 roles | See sections 3.3 + 3.8 |
| 18. Security & Privacy | Access rules, audit events, no hard-delete | 8 new audit events needed |
| 19. Test & Acceptance | E2E scenarios, RBAC tests, concurrency | From phase2-tasks |
| 20. Roadmap | Sprint 0-4 (4 people, 1 month) | See section 4 above |
| 21. Gate I0 Inherited Debt | CF-001..009 + TD-005/006 | Must resolve |
| 22. Traceability | Goal→UC→Rule→Module→API→Table→UI→Test | Cross-reference |

---

## PHẦN 5 — DIAGRAMS REQUIRED (18 total)

### Phase 1 Diagrams (9)

| ID | Type | Content |
|---|---|---|
| C4-P1-01 | System Context | Browser → SPA → NestJS → PostgreSQL; JWT auth |
| C4-P1-02 | Container | React SPA, NestJS API, PostgreSQL DB |
| C4-P1-03 | Component (Backend) | 12 modules + PrismaModule |
| ERD-P1-01 | Phase 1 ERD | 20 entities, key relations |
| SM-P1-01 | Visit state machine | REGISTERED→WAITING→IN_EXAMINATION→COMPLETED/CANCELLED |
| SM-P1-02 | Examination state machine | OPEN→COMPLETED/CANCELLED |
| SM-P1-03 | Invoice state machine | DRAFT→ISSUED→PARTIALLY_PAID→PAID / VOID |
| SEQ-P1-01 | Visit creation sequence | Receptionist → API → DB → Queue number |
| SEQ-P1-02 | Exam + Invoice sequence | Doctor → complete → cashier → invoice → payment |

### Phase 2A Diagrams (9)

| ID | Type | Content |
|---|---|---|
| C4-P2-01 | System Context | Same topology + new roles (NURSE, LAB, PHARMACIST) |
| ERD-P2-01 | Phase 2A ERD delta | 17 new entities + Visit delta |
| SM-P2-01 | Appointment state machine | SCHEDULED→CHECKED_IN/CANCELLED/NO_SHOW |
| SM-P2-02 | QueueTicket state machine | WAITING→CALLED→IN_SERVICE→DONE / SKIPPED / CANCELLED |
| SM-P2-03 | ServiceOrder state machine | ORDERED→IN_PROGRESS→COMPLETED / CANCELLED |
| SM-P2-04 | LabOrder state machine | ORDERED→SAMPLE_COLLECTED→RESULT_ENTERED→REVIEWED / CANCELLED |
| SM-P2-05 | Dispense state machine | DISPENSED→REVERSED |
| SEQ-P2-01 | Appointment → Exam flow | Receptionist→Check-in→Queue→Nurse→Doctor |
| SEQ-P2-02 | Dispense + Stock | Pharmacist→Dispense→FEFO→Stock OUT atomic |

---

## PHẦN 6 — TRACEABILITY MATRIX COLUMNS

```csv
Goal, UC/FR, Business Rule, Module, API Endpoint, DB Table, Frontend Page/Component, Test Scenario, Status
```

**Phase 1 rows:** UC01-UC20  
**Phase 2A rows:** Organization, Appointment, Queue, VitalSign, ServiceOrder, Lab, Dispense, Inventory, MultiInvoice, AuditUI, Reports

---

## PHẦN 7 — OPEN QUESTIONS (OQ-001..006)

| ID | Question | Who answers | Action |
|---|---|---|---|
| OQ-001 | `durationMinutes` field on Appointment: keep after adding `scheduledEndAt`? | Backend/DB | Quyết định trước migration |
| OQ-002 | Appointment check-in idempotency: enforce at service or DB? | Backend | Enforce với `@unique` trên `Visit.appointmentId` (đã có); service must check |
| OQ-003 | GET /visits/:id cần add không? | Sprint planning | Sprint 1 scope |
| OQ-004 | `Appointment.checkedInVisitId` hay `Visit.appointmentId`? | Backend/DB | Giữ `Visit.appointmentId` — FK ownership đúng; ghi ADR |
| OQ-005 | Seed StockLot PENDING conflict? | Seed.ts review | Seed không tạo Dispense record — no conflict |
| OQ-006 | Walk-in QueueTicket creation service logic? | Backend | walk-in → Visit + QueueTicket directly; no Appointment needed |

---

## PHẦN 8 — PRE-MODE-C GATE CHECKLIST

| # | Condition | Status |
|---|---|---|
| 1 | Audit files A0-A6 complete | ✅ |
| 2 | Control files copied to workspace/control/ | ✅ (04_PHASE2A and PHASE1_HANDBOOK saved) |
| 3 | Baseline v2.0 authority confirmed | ✅ |
| 4 | Phase 1/Phase 2A boundary locked | ✅ (A6 Task 1) |
| 5 | Endpoint count corrected (37→40) | ✅ (A6 Task 2) |
| 6 | Security evidence categorized | ✅ (A6 Task 3) |
| 7 | Gate status corrected (STOP-IMPLEMENTATION) | ✅ (A6 Task 5) |
| 8 | Document outline planned (A4) | ✅ |
| 9 | 18 diagrams planned (A4) | ✅ |
| 10 | CF-001..009 conflicts documented | ✅ |
| 11 | Uncommitted changes committed | ❌ PENDING (team action) |
| 12 | Schema correction migration created | ❌ PENDING (after SDD approved) |

**Điều kiện để Mode C output là READY-FINAL-DESIGN:**
- Items 11 + 12 phải hoàn thành sau khi SDD draft được team review và approve.
- Hiện tại: Mode C sẽ tạo `READY-DRAFT` documents với evidence limitations rõ ràng.

---

## PHẦN 9 — IMPLEMENTATION ORDER (Post-SDD-Approval)

```
Sprint 0:
  - Commit working tree (hardening)
  - Schema correction migration (CF-001..009)
  - Seed Phase 2A roles/demo-users

Sprint 1: Organization (Department, Room, DoctorProfile, StaffSchedule)
Sprint 2: Appointment + Queue + VitalSign
Sprint 3: ServiceCatalog + ServiceOrder + Lab (parallel)
          Inventory + Pharmacy (parallel)
Sprint 4: Billing Extended + Reports + Audit UI + Integration QA
```

**Design → Approve → Commit → Migration → Implement. Thứ tự này là bất biến.**
