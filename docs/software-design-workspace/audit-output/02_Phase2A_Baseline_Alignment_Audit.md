# A2 — Phase 2A Baseline Alignment Audit
## Kiểm tra proposal/schema/code so với Decision Baseline v2.0

**Authority:** `01_PHASE2_DECISION_BASELINE_FORM.md` v2.0  
**Source kiểm tra:** Working tree schema + `docs/phase2-tasks/` proposals

---

## 1. Schema Alignment Checks

Theo checklist bắt buộc trong control file `02_SOURCE_CHECKLIST`:

| Check | Baseline yêu cầu | Schema hiện tại | Status |
|---|---|---|---|
| A-001 Queue uniqueness | `@@unique([departmentId, queueDate, queueNumber])` với `queueDate @db.Date` | ✅ `@@unique([departmentId, queueDate, queueNumber])` và `queueDate DateTime @db.Date` | ✅ ALIGNED |
| A-002 Appointment interval overlap | `scheduledStartAt`, `scheduledEndAt` DateTime | ❌ Schema có `scheduledAt DateTime` + `durationMinutes Int` — không có `scheduledEndAt` | `NEEDS-ALIGNMENT` |
| A-003 Visit delta fields | `appointmentId?`, `departmentId`, `doctorProfileId?`, `visitSource`, `queueTicket?`, `vitalSign?` | ✅ `appointmentId?`, `departmentId?`; ❌ thiếu `doctorProfileId?`, `visitSource` | `NEEDS-ALIGNMENT` |
| A-004 `isRequiredForCompletion` | `ServiceOrder.isRequiredForCompletion Boolean` | ❌ Không có field này trong schema | `NEEDS-ALIGNMENT` — BLOCKER |
| A-005 Lab review fields | `reviewedById`, `reviewedAt` trên LabResult | ❌ Không có; schema có `enteredById`, `enteredAt`, `verifiedById?`, `verifiedAt?` | `NEEDS-ALIGNMENT` — dùng `verifiedById` thay vì `reviewedById` |
| A-006 Dispense không giảm kho khi prescription | N/A — business rule, không phải schema | Chưa có service/controller; schema structure ok | No violation yet |
| A-007 Invoice medicine từ dispense, không từ prescription | N/A — business rule | Chưa có service; cần enforce khi implement | Pending |
| A-008 New roles seeded + RBAC mapped | NURSE, LAB_TECHNICIAN, PHARMACIST có trong seed, guard, nav | ✅ Seeded; ❌ Chưa có route/guard/nav | Partial — seed OK, RBAC TODO |
| A-009 Status values dùng approved enum | Per state machine table | ❌ DispenseStatus có `PENDING`, `CANCELLED` thay vì chỉ `DISPENSED`, `REVERSED`; LabOrderStatus có `VERIFIED` thay vì `REVIEWED` | `NEEDS-ALIGNMENT` |
| A-010 Reports sau khi order/dispense/invoice sources exist | N/A — ordering concern | Reports module exist Phase 1; Phase 2 extension pending | OK |

---

## 2. Module-by-Module Alignment

### 2.1 Organization (Department/Room/DoctorProfile/StaffSchedule)

| Item | Decision Baseline | Current State | Status |
|---|---|---|---|
| Department.code unique | `code @unique` | ✅ Schema: `code String @unique` | ALIGNED |
| Department.name | Baseline: `@unique` within site | Schema: name not @unique | `NEEDS-ALIGNMENT` (low risk) |
| Room unique | `@@unique([departmentId, code])` | ✅ Schema has it | ALIGNED |
| DoctorProfile.specialty field | `specialty` | ✅ Schema: `specialty String?` | ALIGNED |
| DoctorProfile reference | Use `doctorProfileId` FK, not `doctorId` | ✅ Appointment uses `doctorProfileId` | ALIGNED |
| StaffSchedule time storage | `startAt`, `endAt` as `DateTime` | ❌ Schema: `startTime String`, `endTime String` | `NEEDS-ALIGNMENT` |
| StaffSchedule dual FK to User | userId (direct) + doctorProfile.userId | ✅ Schema resolves with `map:` argument | ALIGNED |

### 2.2 Appointment / Queue

| Item | Decision Baseline | Current State | Status |
|---|---|---|---|
| Appointment status | SCHEDULED, CHECKED_IN, CANCELLED, NO_SHOW | ✅ Schema matches | ALIGNED |
| Appointment conflict detection | Interval overlap on scheduledStartAt/scheduledEndAt | ❌ Schema: `scheduledAt + durationMinutes`; no `scheduledEndAt` stored | `NEEDS-ALIGNMENT` |
| Visit.visitSource | enum WALK_IN/APPOINTMENT | ❌ Missing from schema | `NEEDS-ALIGNMENT` |
| Visit.appointmentId | Optional unique | ✅ Schema has `appointmentId String? @unique` | ALIGNED |
| QueueTicket.source | Queue source field | Not in schema; derivable from Visit.visitSource | Acceptable if visitSource added |
| Queue priority | appointment priority=1, walk-in priority=0 | ✅ Schema: `priority Int @default(0)` | ALIGNED |
| Walk-in support | Retained from Phase 1 | ✅ Visit creation still works without appointment | ALIGNED |

### 2.3 VitalSign

| Item | Decision Baseline | Current State | Status |
|---|---|---|---|
| One VitalSign per visit | `visitId @unique` | ✅ Schema: `visitId String @unique` | ALIGNED |
| BMI computed by backend | Server-side calculation | Not yet implemented (no service) | Pending implementation |
| Fields | pulse, systolicBp, diastolicBp, temperature, spo2, heightCm, weightKg, bmi | ✅ All present in schema | ALIGNED |

### 2.4 ServiceOrder / Lab

| Item | Decision Baseline | Current State | Status |
|---|---|---|---|
| ServiceOrder.isRequiredForCompletion | Required boolean | ❌ Missing from schema | `NEEDS-ALIGNMENT` — BLOCKER |
| LabOrderStatus | ORDERED, SAMPLE_COLLECTED, RESULT_ENTERED, REVIEWED, CANCELLED | ❌ Schema has VERIFIED instead of REVIEWED | `NEEDS-ALIGNMENT` |
| Lab result immutability | After RESULT_ENTERED, cannot edit directly | Not yet implemented; schema has no constraint | Enforce at service layer |
| LabResult.reviewedById/reviewedAt | Doctor review fields | ❌ Schema has `verifiedById?`, `verifiedAt?` — wrong naming | `NEEDS-ALIGNMENT` |
| Lab result enteredById/enteredAt | Tech submit fields | ✅ Schema has `enteredById`, `enteredAt` | ALIGNED |

### 2.5 Pharmacy / Inventory

| Item | Decision Baseline | Current State | Status |
|---|---|---|---|
| DispenseStatus | Only DISPENSED, REVERSED | ❌ Schema has PENDING, DISPENSED, CANCELLED | `NEEDS-ALIGNMENT` |
| StockMovementType | IN, OUT, ADJUSTMENT, REVERSAL | ❌ Schema has IN, OUT, ADJUSTMENT (no REVERSAL) | `NEEDS-ALIGNMENT` |
| FEFO selection | System selects lot nearest expiry | Not yet implemented; schema structure supports it | Pending implementation |
| Atomic dispense transaction | Dispense + DispenseItem + StockMovement + quantityOnHand | Not yet implemented | Pending |
| No partial dispense | Reject if insufficient stock | Not yet implemented | Pending |
| Reverse before payment only | REVERSED state + movement | Not yet implemented | Pending |

### 2.6 Invoice / Billing

| Item | Decision Baseline | Current State | Status |
|---|---|---|---|
| Invoice statuses | ISSUED, PARTIALLY_PAID, PAID, VOID | ✅ Phase 1 schema matches | ALIGNED |
| Multi-item invoice | InvoiceItem with itemType, referenceType, referenceId | ✅ Schema has these fields | ALIGNED |
| Medicine billing from dispense | Not from prescription | Not yet implemented; must enforce at service | Pending |
| One active invoice per visit | At most one non-VOID invoice | ✅ `visitId @unique` on Invoice | ALIGNED |
| No VOID if payment exists | Business rule | Not yet implemented | Pending |

---

## 3. Naming Convention Compliance (D-P2-013)

| Canonical name | Schema field | Status |
|---|---|---|
| `visitSource` enum WALK_IN/APPOINTMENT | Missing from Visit | `NEEDS-ALIGNMENT` |
| `scheduledStartAt`, `scheduledEndAt` | Appointment has `scheduledAt + durationMinutes` | `NEEDS-ALIGNMENT` |
| `startAt`, `endAt` DateTime on StaffSchedule | Has `startTime String`, `endTime String` | `NEEDS-ALIGNMENT` |
| `isRequiredForCompletion` on ServiceOrder | Missing | `NEEDS-ALIGNMENT` |
| `reviewedById`, `reviewedAt` on LabResult | Has `verifiedById`, `verifiedAt` | `NEEDS-ALIGNMENT` |
| `StockMovementType.REVERSAL` | Missing | `NEEDS-ALIGNMENT` |
| `DispenseStatus = DISPENSED / REVERSED` | Has PENDING/DISPENSED/CANCELLED | `NEEDS-ALIGNMENT` |
| `doctorProfileId` FK (not `doctorId`) | Appointment: ✅ correct | ALIGNED |
| `specialty` on DoctorProfile | ✅ present | ALIGNED |
| `@@unique([departmentId, queueDate, queueNumber])` | ✅ present | ALIGNED |

---

## 4. Summary — NEEDS-ALIGNMENT Items

| Priority | Item | Impact |
|---|---|---|
| 🔴 BLOCKER | `ServiceOrder.isRequiredForCompletion` missing | Exam cannot enforce required lab rule |
| 🔴 BLOCKER | `LabOrderStatus.VERIFIED` → rename to `REVIEWED` | Doctor action mislabeled as tech verification |
| 🔴 BLOCKER | `LabResult.verifiedById/verifiedAt` → rename to `reviewedById/reviewedAt` | Semantic error in schema |
| 🔴 BLOCKER | `DispenseStatus.PENDING/CANCELLED` → replace with `DISPENSED/REVERSED` | State machine mismatch |
| 🔴 BLOCKER | `StockMovementType` missing `REVERSAL` | Cannot record stock reversal |
| 🟡 HIGH | `StaffSchedule.startTime/endTime String` → `startAt/endAt DateTime` | Scheduling overlap cannot use DB queries |
| 🟡 HIGH | `Appointment.scheduledAt + durationMinutes` → `scheduledStartAt + scheduledEndAt` | Interval conflict query needs stored endAt |
| 🟡 HIGH | `Visit.visitSource` missing | Cannot distinguish walk-in vs appointment |
| 🟡 HIGH | `Visit.doctorProfileId` missing | Doctor assignment to visit not possible |
| 🟢 MEDIUM | `Department.name @unique` | Low risk, easy add |
| 🟢 MEDIUM | NURSE/LAB_TECHNICIAN/PHARMACIST route/guard/nav | Must implement before Phase 2 sprints |
