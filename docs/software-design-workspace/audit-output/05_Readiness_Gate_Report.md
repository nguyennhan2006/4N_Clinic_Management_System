# A5 — Readiness Gate Report
## 4N Clinic Management System — Pre-Writing Audit Final

**Ngày:** 2026-05-27  
**Auditor:** Claude Code (Mode A — PRE-WRITING AUDIT ONLY)  
**Branch:** `feature/UC07-20-with-frontend` @ `a71aa99` (working tree dirty)

---

## Gate Checklist

| Gate | Điều kiện | Kết quả | Blocking items |
|---|---|---|---|
| G0 | Required control/source files readable | ✅ PASS | 5 control files nhận qua conversation; chưa copy vào workspace/control/ |
| G1 | Phase 1 implementation baseline identified | ✅ PASS | Working tree readable; 14 modules, **40 endpoints** (corrected per A6), schema, migrations confirmed |
| G2 | Phase 2A design complies with Decision Baseline v2.0 | ⚠️ PARTIAL | 9 schema conflicts (CF-001..009) cần migration correction |
| G3 | Unresolved code/proposal conflicts listed | ✅ PASS | A3 liệt kê đầy đủ CF-001..009, TD-001..009, OQ-001..006, RK-001..005 |
| G4 | Diagram/document plan traceable | ✅ PASS | A4 có outline đầy đủ + 18 diagrams planned |
| GI0 | Phase 1 hardening ready before feature coding | ✅ PASS | H-01..04 completed; H-05 (schema freeze) cần action |

---

## Design Status

```
[ ] STOP-P1 — Phase 1 cannot yet be described as As-Built Verified.
[ ] STOP-P2-ALIGNMENT — Target proposal conflicts with approved baseline.
[x] READY-DRAFT — Draft can be generated with listed evidence limitations.
[ ] READY-FINAL-DESIGN — Software Design package can be generated.
```

**Lý do chọn READY-DRAFT:**
- Phase 1 có đủ evidence (code, schema, migrations, build proof) để tạo As-Built document
- Phase 2A có Decision Baseline v2.0 đủ để tạo Target Design
- Tuy nhiên **9 schema conflicts** (CF-001..009) chưa được resolve → không thể gọi Phase 2A target design là "Final" cho đến khi migration correction được merge
- Working tree chưa commit → ghi rõ trong document: "As-Built reflects working tree, not HEAD commit"

---

## Implementation Status

> **[A6 CORRECTION]** `READY-PHASE2-SPRINT` đã bị xóa — không phải official status. Thay bằng status đúng.

```
[x] STOP-IMPLEMENTATION — Schema/design blockers exist; feature sprint CANNOT start.
[ ] READY-HARDENING — Implement Gate I0 fixes only (H-01..H-04 done; H-05 open).
[ ] READY-PHASE2-SPRINT — (not an official status — do not use)
```

**Trạng thái hardening:**
- ✅ H-01 (security): PrescriptionsController deleted
- ✅ H-02 (RBAC UI): RoleManagementPage calls real API
- ✅ H-03 (cashier flow): Invoice pending tab implemented
- ✅ H-04 (audit core): 8 core actions logged
- ❌ H-05 (schema freeze): **9 schema conflicts (CF-001..009) chưa được resolve**

**Lý do STOP-IMPLEMENTATION:**
1. Software Design document (Phase 2A Target Design) chưa được generate (Mode C chưa chạy)
2. CF-001..009 schema corrections chưa được approved trong design document
3. Uncommitted hardening changes chưa commit (RK-001)
4. Control files chưa copy vào `workspace/control/` (Gate D0)

**Implementation may begin ONLY after:**
1. Mode C (Generate Software Design) completed và team reviewed
2. CF-001..009 schema corrections approved trong SDD → merged via migration
3. Uncommitted hardening changes committed
4. Control files copied to `docs/software-design-workspace/control/`

---

## Critical Actions Before Sprint 1

> **[A6 CORRECTION]** Thứ tự đã sửa: Design trước, migration sau. CF-001..009 corrections phải được document trong SDD trước khi tạo migration.

| # | Action | Owner | Blocking |
|---|---|---|---|
| 1 | Commit all hardening changes (working tree) | Any | RK-001 |
| 2 | Copy 5 control files to workspace/control/ | Member D | Gate D0 |
| 3 | Generate Software Design (Mode C) | Claude Code | Gate D0+1+2 |
|   | • SDD sẽ document CF-001..009 corrections cần thiết | | |
|   | • Team review + approve SDD | | |
| 4 | Create migration: CF-001..009 corrections **SAU KHI SDD approved** | Member A/B | Sprint 1 |
|   | • Rename `LabOrderStatus.VERIFIED` → `REVIEWED` | | |
|   | • Rename `LabResult.verifiedById/At` → `reviewedById/At` | | |
|   | • Replace `DispenseStatus` values (PENDING/CANCELLED → DISPENSED/REVERSED) | | |
|   | • Add `StockMovementType.REVERSAL` | | |
|   | • Rename `StaffSchedule.startTime/endTime String` → `startAt/endAt DateTime` | | |
|   | • Rename `Appointment.scheduledAt` → `scheduledStartAt`; add `scheduledEndAt` | | |
|   | • Add `Visit.visitSource` + `VisitSource` enum (WALK_IN/APPOINTMENT) | | |
|   | • Add `Visit.doctorProfileId String?` | | |
|   | • Add `ServiceOrder.isRequiredForCompletion Boolean @default(false)` | | |

**Đúng thứ tự: Design → Approve → Commit → Migration → Implement. Không bao giờ Migration trước Design.**

---

## Evidence Limitations for As-Built Document

Những điều phải ghi rõ trong Phase 1 document:

1. **Uncommitted state**: As-Built phản ánh working tree, không phải HEAD commit `a71aa99`
2. **Phase 2A schema present**: `schema.prisma` chứa Phase 2A models nhưng không có service/controller implement
3. **Minimal test coverage**: 1 backend test; không có frontend tests
4. **No Swagger export**: API contract reconstructed từ controllers, không từ runtime OpenAPI
5. **New roles unseeded in RBAC/nav**: NURSE/LAB_TECHNICIAN/PHARMACIST seeded nhưng không có route protection hay frontend navigation

---

## Audit Summary

> **[A6 CORRECTION]** Security claim đã được sửa. Endpoint count đã được sửa.

| Area | Status | Evidence level |
|---|---|---|
| Phase 1 security design | ✅ Guards correct, SHA-256 hash, bcrypt | CODE-REVIEWED |
| Phase 1 security runtime | ⚠️ No 401/403 integration tests | UNTESTED |
| Phase 1 business logic | ✅ 6 transactions, key rules implemented | CODE-REVIEWED |
| Phase 1 RBAC | ✅ 8 roles seeded; 5 roles active; route-level enforcement | CODE-REVIEWED |
| Phase 1 audit trail | ⚠️ 8/~20 needed actions logged | CODE-REVIEWED (partial) |
| Phase 1 API surface | ✅ **40 endpoints** (corrected from 37) | CODE-REVIEWED |
| Phase 2A schema structure | ⚠️ 9 naming/enum conflicts with baseline | CODE-REVIEWED |
| Phase 2A services | ❌ Not implemented (schema only) | N/A |
| Build quality | ✅ Backend + frontend build pass | BUILD-EVIDENCE |
| Test coverage | ❌ 1 backend test only | INSUFFICIENT |

**Recommendation:** Proceed to Mode C (Generate Software Design) after completing critical actions 1–3 (commit → copy control files → run Mode C). Migration CF-001..009 được thực hiện SAU KHI SDD approved, không phải trước.
