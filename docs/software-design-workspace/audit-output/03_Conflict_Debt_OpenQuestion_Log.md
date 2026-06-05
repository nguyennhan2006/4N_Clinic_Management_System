# A3 — Conflict, Debt and Open Question Log

**Authority:** `01_PHASE2_DECISION_BASELINE_FORM.md` v2.0 — không được reopen  
**Scope:** Những gì tìm thấy trong audit cần action trước khi implement

---

## 1. Schema / Code Conflicts với Approved Baseline

Các item sau là CONFLICT giữa implementation hiện tại và Decision Baseline v2.0. Phải sửa schema trước khi implement service/controller.

| ID | Conflict | Schema hiện tại | Baseline canonical | Action required | Owner |
|---|---|---|---|---|---|
| CF-001 | LabOrderStatus dùng VERIFIED thay REVIEWED | `VERIFIED` in enum | `REVIEWED` | Rename enum value + migration | Backend/DB |
| CF-002 | LabResult fields `verifiedById/verifiedAt` | `verifiedById?`, `verifiedAt?` | `reviewedById?`, `reviewedAt?` | Rename fields + migration | Backend/DB |
| CF-003 | DispenseStatus có PENDING + CANCELLED | `PENDING`, `DISPENSED`, `CANCELLED` | `DISPENSED`, `REVERSED` | Replace enum values + migration | Backend/DB |
| CF-004 | StockMovementType thiếu REVERSAL | `IN`, `OUT`, `ADJUSTMENT` | `IN`, `OUT`, `ADJUSTMENT`, `REVERSAL` | Add enum value + migration | Backend/DB |
| CF-005 | StaffSchedule thời gian là String | `startTime String`, `endTime String` | `startAt DateTime`, `endAt DateTime` | Rename + change type + migration | Backend/DB |
| CF-006 | Appointment dùng scheduledAt + durationMinutes | `scheduledAt DateTime`, `durationMinutes Int` | `scheduledStartAt DateTime`, `scheduledEndAt DateTime` | Rename/add field + migration | Backend/DB |
| CF-007 | Visit thiếu visitSource | Không có field | `visitSource VisitSource` (enum WALK_IN/APPOINTMENT) | Add field + enum + migration | Backend/DB |
| CF-008 | Visit thiếu doctorProfileId | Không có field | `doctorProfileId String?` | Add field + FK + migration | Backend/DB |
| CF-009 | ServiceOrder thiếu isRequiredForCompletion | Không có field | `isRequiredForCompletion Boolean @default(false)` | Add field + migration | Backend/DB |

> **Tất cả CF-001 đến CF-009 phải được resolve trong một migration mới trước Sprint 1.** Đây là phần bắt buộc của Sprint 0 / Gate H-05.

---

## 2. Phase 1 Technical Debt

| ID | Issue | Status sau hardening | Còn ảnh hưởng Phase 2? |
|---|---|---|---|
| TD-001 | PrescriptionsController unguarded | ✅ FIXED — controller deleted | Không |
| TD-002 | RoleManagement UI static | ✅ FIXED — real API calls | Không |
| TD-003 | Cashier no invoice entry | ✅ FIXED — pending tab | Không |
| TD-004 | Audit incomplete | ⚠️ PARTIAL — 8 actions; Phase 2 entities chưa | Cần bổ sung khi implement module mới |
| TD-005 | GET /visits/:id missing | ⚠️ OPEN | NURSE, LAB role cần endpoint này để xem visit detail |
| TD-006 | NURSE/LAB/PHARMACIST seeded but no RBAC/nav | ⚠️ OPEN — in scope Phase 2A | Sprint 0 H-05 |
| TD-007 | Patient update UI absent | Low | Không blocking Phase 2 |
| TD-008 | Regulation history view absent | Low | Không blocking Phase 2 |
| TD-009 | Test coverage minimal (1 test) | Medium | Migration risk — must add targeted tests per sprint |

---

## 3. Implementation Ordering Risks

| ID | Risk | Description | Mitigation |
|---|---|---|---|
| OR-001 | CF-001..009 schema sửa tạo migration conflict | Nếu sửa lần lượt, nhiều migration files phức tạp | Gộp TẤT CẢ CF-001..009 vào một migration duy nhất `phase2a_schema_corrections` trước Sprint 1 |
| OR-002 | Dispense service implement trước enum fix | Sẽ compile với sai state | Chặn bởi Gate I0 — không implement trước khi schema aligned |
| OR-003 | Invoice service dùng prescription thay dispense | TD nếu implement sai | Enforce trong code review checklist: `BILL-01` |
| OR-004 | Appointment service dùng `scheduledAt` cũ | Conflict detection sai | Fix CF-006 trước APT-01 |
| OR-005 | VitalSign BMI tính ở frontend | Baseline yêu cầu server-side | Review `VIT-01` — backend must compute BMI |

---

## 4. Open Questions (mới phát sinh, chưa có trong Baseline)

Đây là câu hỏi **compatibility/implementation**, không phải business decision mới. Không được reopens baseline.

| ID | Question | Why it matters | Who answers | Action |
|---|---|---|---|---|
| OQ-001 | `durationMinutes` field trên Appointment có giữ không sau khi thêm `scheduledEndAt`? | Redundant với stored end time | Backend/DB owner | Giữ computed hoặc xóa; quyết định trước migration |
| OQ-002 | Appointment check-in có được thực hiện nhiều lần không (idempotency)? | Baseline: "không check-in lần hai" — cần enforce ở service hay DB constraint? | Backend owner | Enforce với `@unique` trên `Visit.appointmentId` (đã có); service phải check |
| OQ-003 | GET /visits/:id cần add không? | NURSE, LAB_TECHNICIAN cần xem visit detail | Sprint planning | Thêm vào Sprint 1 scope hoặc Sprint 0 |
| OQ-004 | `Appointment.checkedInVisitId` hay `Visit.appointmentId` làm link? | Baseline nói `Appointment.checkedInVisitId optional unique` nhưng schema hiện tại dùng `Visit.appointmentId` | Backend/DB | Giữ `Visit.appointmentId` — cách hiện tại đúng về FK ownership; ghi ADR |
| OQ-005 | Seed StockLot `PENDING` trong Phase 2A foundation seed có conflict với DispenseStatus fix? | Nếu seed có PENDING status trong Dispense record | Confirm trong seed.ts | Seed hiện tại không tạo Dispense record — không conflict |
| OQ-006 | Walk-in vẫn tạo QueueTicket không cần appointment — service logic thế nào? | Cần rõ trong APT-03 và QUE-01 | Backend owner | Document trong service spec; baseline rõ: walk-in tạo Visit + QueueTicket trực tiếp |

---

## 5. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-001 | Migration phase2a_foundation chưa commit — nếu reset/rebase mất work | High | High | Commit ngay sau audit |
| RK-002 | Schema corrections (CF-001..009) yêu cầu data migration nếu DB có data test | Medium | Medium | Chạy trên clean dev DB; backup trước migrate |
| RK-003 | Parallel sprints (pharmacy + lab) sửa cùng Visit/Examination | Medium | Medium | Member A điều phối migration order |
| RK-004 | Invoice multi-item sai nếu service lấy từ prescription thay dispense | High | High | Code review gate: `BILL-01` checklist item |
| RK-005 | Test coverage quá thấp để phát hiện regression sau migration | High | Medium | Thêm targeted test mỗi sprint |
