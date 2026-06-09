# 11 — Thiết kế Quy trình Phát triển Phase 1 & Phase 2

> Audit date: 2026-06-07

---

## Định nghĩa

```
Phase 1 = nghiệp vụ lõi: quy trình cơ bản của phòng mạch (tiếp nhận → khám → kê đơn → thanh toán → báo cáo)
Phase 2 = mở rộng quy trình vận hành phòng khám (lịch hẹn, hàng đợi, xét nghiệm, kho thuốc, tổ chức)
```

---

## 1. Phase 1 — Process Design (Nghiệp vụ lõi)

| Bước | Mục tiêu | Input | Hoạt động chính | Output | Bằng chứng | Tiêu chí hoàn thành |
|---|---|---|---|---|---|---|
| 1. Phân tích nghiệp vụ | Hiểu quy trình phòng mạch tư | Nghiệp vụ giả định | Phân tích quy trình: tiếp nhận – khám – kê đơn – thanh toán | Danh sách actor + pain points | `docs/`, `CLAUDE.md` | Có actor list, có pain point matrix |
| 2. Đặc tả yêu cầu P1 | Xác định 20 UC Phase 1 | Nghiệp vụ phân tích | Viết UC, phân role, ưu tiên | UC01–UC20 list | `docs/adr/`, `docs/business-rules-v1` branch | 20 UC được xác định |
| 3. Thiết kế database P1 | Schema Phase 1 (20 models lõi) | UC specs | ERD: Patient, Visit, Examination, Prescription, Invoice, Drug, Disease... | Prisma schema (phần P1) | `backend/prisma/schema.prisma` — Phase 1 models | Schema validate, migration thành công |
| 4. Thiết kế backend P1 | 11 modules, 41 endpoints | Schema | Controller, service, DTO, guards, business rules | API inventory P1 | `backend/src/modules/` — 11 P1 modules | Swagger docs hiển thị đủ |
| 5. Thiết kế giao diện P1 | Wireframe/mockup 20 màn hình | UC + role matrix | Chọn design system, wireframe | UI mockup | `docs/template-UI/` | Mockup được nhóm approve |
| 6. Implement Auth/RBAC | UC01–UC03 | Design | auth module, users module, rbac module, JWT guards | Auth + RBAC API + LoginPage | `auth.controller.ts`, `LoginPage.tsx`, `UserManagementPage.tsx` | Login hoạt động, role guard active |
| 7. Implement Patient/Visit/Exam | UC04–UC13 | Auth done | patients, visits, examinations, prescriptions, diseases, drugs | Core clinical API + Frontend | Commit `373ff92`, `0e3c231` | E2E clinic-flow pass |
| 8. Implement Billing/Report | UC14–UC20 | Core done | billing, regulations, reports + frontend | Billing + Report API + Frontend | Commit `0e3c231` | E2E billing-catalog pass |
| 9. Kiểm thử Phase 1 | Xác nhận UC đúng yêu cầu | Code done | Chạy e2e test, manual test, seed demo | Test report + screenshots | `backend/test/` 3 files | E2E pass, screenshots đủ |
| 10. Chốt baseline P1 | Tag version ổn định | Test pass | Code review, merge to main, tag v1 | Git tag, README | Commit `a71aa99 new readme for version 1` | Build pass, lint pass |

---

## 2. Phase 2 — Process Design (Mở rộng vận hành)

| Bước | Mục tiêu | Input | Hoạt động chính | Output | Bằng chứng | Tiêu chí hoàn thành |
|---|---|---|---|---|---|---|
| 1. Đánh giá baseline P1 | P1 ổn định | v1 tag | Review, run e2e | P1 baseline report | `docs/evaluation-report-2026-05-20.md` | E2E pass |
| 2. Xác định yêu cầu P2 | 10 UC mới | Nhu cầu mở rộng | Phân tích: Appointment, Queue, Vitals, Services, Lab, Inventory, Pharmacy, Org, Audit | UC21–UC30 list | `docs/phase2-tasks/` | UC list approved |
| 3. Phân tích tác động | DB/API/UI impact | P1 schema | Xác định model mới, endpoint mới, page mới | Impact analysis | `docs/software-design-workspace/` | Impact doc done |
| 4. Mở rộng database | 17 models mới | Impact analysis | Migration: Appointment, QueueTicket, VitalSign, ServiceCatalog, LabOrder, StockLot, Dispense, Department, Room, DoctorProfile, StaffSchedule, LabTestCatalog, LabSample, LabResult, StockMovement, DispenseItem | Migration + updated schema (37 models) | `backend/prisma/migrations/20260520192733_phase2a_foundation/` | `npx prisma validate` pass |
| 5. Thiết kế workflow P2 | State machines, business rules P2 | UC specs | Appointment flow, Queue state machine, Lab flow, FEFO | Workflow + BR-21→BR-29 | File 07 này | Rules documented |
| 6. Implement Appointment + Queue | UC21–UC23 | DB migrated | appointments, queue modules | API + AppointmentListPage, QueueDashboardPage | `appointments.controller.ts`, `queue.controller.ts` | Checkin flow working |
| 7. Implement Vitals + Services + Lab | UC24–UC26 | Above done | vitals, services, lab modules | API + VitalSignSection, ServiceOrderSection, LabWorklist | `vitals.controller.ts`, `lab.controller.ts`, `LabWorklist.tsx` | Lab flow: order→sample→result→verify |
| 8. Implement Inventory + Pharmacy | UC27–UC28 | Drug catalog exists | inventory, pharmacy modules + FEFO logic | API + StockListPage, PharmacyWorklist | `inventory.controller.ts`, `pharmacy.controller.ts` | FEFO dispense working |
| 9. Extend Billing/Report | Revenue breakdown | P1 billing | Extend InvoiceItem, revenue-breakdown endpoint | Extended billing + MonthlyReportPage revenue section | `billing.service.ts` InvoiceItem, `reports.controller.ts` | Revenue data correct |
| 10. Organization + Audit | UC29–UC30 | User system | organization, audit modules | API + DepartmentListPage, DoctorProfilePage, AuditLogPage | `organization.controller.ts`, `audit.controller.ts` | Admin xem audit log được |
| 11. Kiểm thử hồi quy + tích hợp | P1 + P2 không regression | Code done | Chạy e2e P1 lại, manual test P2, seed comprehensive | Test report P2 + screenshots | Commit `04b65be feat(seed)` | E2E P1 vẫn pass, P2 manual tested |

---

## 3. Phase 2 Dependency và Impact Analysis

| Module P2 | Phụ thuộc P1 | DB models thêm | API endpoints thêm | UI thêm | Rủi ro |
|---|---|---|---|---|---|
| appointments | patients, users, organization | Appointment | 6 | 2 pages | PARTIAL: doctor availability check |
| queue | visits | QueueTicket | 4 | 1 page | — |
| vitals | visits, users | VitalSign | 2 | 1 embedded section | — |
| services | visits, examinations | ServiceCatalog, LabTestCatalog, ServiceOrder | 7 | 1 page + 1 section | PARTIAL: InvoiceItem integration |
| lab | services | LabOrder, LabSample, LabResult | 7 | 1 page | — |
| inventory | drugs | StockLot, StockMovement | 6 | 1 page | — |
| pharmacy | prescriptions, drugs, inventory | Dispense, DispenseItem | 5 | 1 page | — |
| organization | users | Department, Room, DoctorProfile, StaffSchedule | 12 | 2 pages | — |
| audit | users | AuditLog | 1 | 1 page | — |
| reports (P2) | billing, pharmacy, services | — | 1 | extended existing page | — |

---

## 4. Tiêu chí chuyển từ Phase 1 sang Phase 2

| Tiêu chí | Mô tả | Bằng chứng |
|---|---|---|
| Schema P1 stable | Không breaking change cho Phase 1 models | Migration history — 3 migrations |
| E2E P1 pass | auth, clinic-flow, billing-catalog tests pass | `backend/test/` — 3 files |
| Frontend P1 build | `npm run build` pass | NEED_MANUAL_CONFIRMATION |
| Seed data P1 OK | Demo data cho P1 đủ | `prisma/seed.ts` |
| Docs P1 approved | Evaluation report tồn tại | `docs/evaluation-report-2026-05-20.md` |

---

## 5. Diagram đề xuất

| Diagram | Nội dung | Công cụ |
|---|---|---|
| VisitStatus state machine | REGISTERED → WAITING → IN_EXAMINATION → COMPLETED/CANCELLED | draw.io / Mermaid |
| ExaminationStatus state machine | OPEN → COMPLETED/CANCELLED | draw.io |
| InvoiceStatus state machine | DRAFT → ISSUED → PARTIALLY_PAID → PAID/VOID | draw.io |
| Lab flow sequence | Doctor order → Nurse sample → Lab enter result → Doctor verify | draw.io |
| Pharmacy FEFO flow | Prescription → FEFO lot selection → Dispense → Stock deduct | draw.io |
| Phase 1 → Phase 2 Gantt | Timeline từ git commit history | Spreadsheet / draw.io |
| Module dependency | P1 modules + P2 modules + dependencies | draw.io |
