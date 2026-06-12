# 11 — Thiết kế Quy trình Phát triển Phase 1 & Phase 2

---

## 1. Phase 1 — Process Design (Nghiệp vụ lõi)

| Bước | Mục tiêu | Input | Hoạt động | Output | Người phụ trách | Bằng chứng | Tiêu chí hoàn thành |
|---|---|---|---|---|---|---|---|
| 1. Khảo sát nghiệp vụ | Hiểu luồng vận hành phòng mạch | Thực tế phòng mạch tư | Phỏng vấn "khách hàng" (giả định), phân tích quy trình tiếp nhận–khám–thanh toán | Tài liệu yêu cầu | Project Lead | `docs/`, `CLAUDE.md` context | Có danh sách actor + nhu cầu |
| 2. Đặc tả yêu cầu P1 | Xác định 20 UC Phase 1 | Khảo sát nghiệp vụ | Viết UC, phân loại độ ưu tiên, phân vai trò | UC list + role matrix | Project Lead / BA | `docs/adr/`, `docs/business-rules-v1` | 20 UC được approve |
| 3. Thiết kế dữ liệu lõi | Schema database Phase 1 | UC specs | Thiết kế ERD: Patient, Visit, Examination, Prescription, Invoice, Drug, Disease... | Prisma schema Phase 1 | Backend Lead | `backend/prisma/schema.prisma` (Phase 1 models) | Schema validate, migrate thành công |
| 4. Thiết kế backend module | API + business rules | Schema + UC | Thiết kế 12 modules, endpoint, DTO, guard, business rules | API Inventory Phase 1 | Backend Lead | `backend/src/modules/` Phase 1 modules | Swagger docs đầy đủ |
| 5. Thiết kế giao diện lõi | Wireframe/mockup Phase 1 | UC specs + role matrix | Wireframe 20 màn hình, chọn design system | UI mockup / design spec | Frontend Lead | `docs/template-UI/` | Mockup được approve |
| 6. Hiện thực Auth/RBAC | UC01–UC03 working | Design | Implement Auth module, Users module, RBAC module, JWT guards | Auth + RBAC API + Frontend | Backend + Frontend Lead | `auth.controller.ts`, `LoginPage.tsx`, `UserManagementPage.tsx` | Login hoạt động, role guard active |
| 7. Hiện thực Patient/Visit/Exam | UC04–UC13 working | Auth done, Schema | Implement 5 modules: patients, visits, examinations, prescriptions, diseases/drugs | Core clinical API + Frontend | Backend + Frontend Lead | Tất cả module Phase 1 core | E2E clinic-flow pass |
| 8. Hiện thực Billing/Report | UC14–UC20 working | Core done | Implement billing, regulations, reports modules + frontend | Billing + Report API + Frontend | Backend + Frontend Lead | `billing.controller.ts`, `reports.controller.ts` | E2E billing-catalog pass |
| 9. Kiểm thử Phase 1 | Xác nhận đúng yêu cầu | Code done | Chạy e2e test, manual test từng UC, chụp screenshot | Test report + screenshots | QA Lead | `backend/test/` 3 files | Tất cả TC pass, screenshots đủ |
| 10. Chốt baseline Phase 1 | Tag version ổn định | Test pass | Code review, merge to main, viết README, tag v1.0 | Git tag v1.0, README | Project Lead | `a71aa99 new readme for version 1` | Build pass, lint pass |

---

## 2. Phase 2 — Process Design (Mở rộng phòng khám)

| Bước | Mục tiêu | Input | Hoạt động | Output | Người phụ trách | Bằng chứng | Tiêu chí hoàn thành |
|---|---|---|---|---|---|---|---|
| 1. Đánh giá baseline Phase 1 | Xác nhận P1 ổn định | Git tag v1.0 | Code review, run e2e, đo coverage | P1 baseline report | QA Lead | `docs/evaluation-report-2026-05-20.md` | Tất cả e2e pass |
| 2. Xác định yêu cầu mở rộng | Xác định 10 UC Phase 2 | Nhu cầu mở rộng | Phân tích: Appointment, Queue, Vitals, Services, Lab, Inventory, Pharmacy, Org, Audit, Report++ | UC list Phase 2 | Project Lead | `docs/phase2-tasks/`, `CLAUDE_PHASE2.md` | UC list được approve |
| 3. Phân tích tác động | DB/API/UI/Test impact | P1 schema + UC P2 | Phân tích: model mới nào, endpoint nào, page nào | Impact analysis | Backend + Frontend Lead | `docs/software-design-workspace/` | Impact doc approved |
| 4. Mở rộng database | 22 models mới | Impact analysis | Migration: Appointment, Queue, Vitals, ServiceCatalog, LabOrder, StockLot, Dispense, Department... | Migration file + updated schema | Backend Lead | `backend/prisma/migrations/20260520192733_phase2a_foundation/` | `npx prisma validate` pass |
| 5. Thiết kế workflow nâng cao | State machines, business rules P2 | UC specs P2 | Thiết kế: Appointment flow, Queue state machine, Lab flow, Inventory FEFO | Workflow diagrams + BR list P2 | Backend Lead | BR-21 → BR-29 | Rules documented |
| 6. Hiện thực Appointment + Queue | UC21-UC23 | DB migrated | Implement appointments.module, queue.module | Appointment + Queue API + Frontend | Backend + Frontend Lead | `appointments.controller.ts`, `queue.controller.ts`, `AppointmentListPage.tsx`, `QueueDashboardPage.tsx` | Checkin flow working |
| 7. Hiện thực Vitals + Services + Lab | UC24-UC26 | Above done | Implement vitals, services, lab modules | Vitals/Services/Lab API + Frontend | Backend + Frontend Lead | `vitals.controller.ts`, `lab.controller.ts`, `LabWorklist.tsx` | Lab flow: order→sample→result→verify |
| 8. Hiện thực Inventory + Pharmacy | UC27-UC28 | Drug catalog exists | Implement inventory, pharmacy modules + FEFO logic | Stock + Dispense API + Frontend | Backend + Frontend Lead | `inventory.controller.ts`, `pharmacy.controller.ts`, `StockListPage.tsx`, `PharmacyWorklist.tsx` | Dispense với FEFO working |
| 9. Mở rộng Billing/Report | UC29 + revenue breakdown | P1 billing exists | Extend InvoiceItem, reports revenue-breakdown | Extended billing API + Report UI | Backend + Frontend Lead | `billing.service.ts` InvoiceItem, `reports.controller.ts` revenue-breakdown | Revenue breakdown correct |
| 10. Organization + Audit | UC30 | User system exists | Implement organization, audit modules | Org + Audit API + Frontend | Backend Lead | `organization.controller.ts`, `audit.controller.ts`, `DepartmentListPage.tsx`, `AuditLogPage.tsx` | Admin có thể xem audit log |
| 11. Kiểm thử hồi quy và tích hợp | P1 + P2 không regression | Code done | Chạy e2e P1 lại, manual test P2, seed comprehensive | Test report P2 + screenshots | QA Lead | `04b65be feat(seed): comprehensive evaluation data` | E2E P1 vẫn pass, screenshots P2 đủ |

---

## 3. Phase 2 Dependency và Impact Analysis

| Module P2 | Phụ thuộc P1 | DB impact | API impact | UI impact | Test impact | Rủi ro |
|---|---|---|---|---|---|---|
| appointments | patients, users, organization | 3 models mới (Appointment, DoctorProfile, Department, Room) | 6 endpoints mới | 2 trang mới | E2E mới | PARTIAL: Doctor availability check chưa có |
| queue | visits | 1 model mới (QueueTicket) | 4 endpoints mới | 1 trang mới | E2E mới | — |
| vitals | visits, users | 1 model mới (VitalSign) | 2 endpoints mới | Section trong ExaminationPage | — | — |
| services | visits, examinations, billing | 3 models mới (ServiceCatalog, ServiceOrder, LabTestCatalog) | 7 endpoints mới | 1 trang + section | — | PARTIAL: InvoiceItem tích hợp service |
| lab | services | 3 models mới (LabOrder, LabSample, LabResult) | 7 endpoints mới | 1 trang (LabWorklist) | — | — |
| inventory | drugs | 2 models mới (StockLot, StockMovement) | 6 endpoints mới | 1 trang | — | — |
| pharmacy | prescriptions, drugs, inventory | 2 models mới (Dispense, DispenseItem) | 5 endpoints mới | 1 trang | — | — |
| organization | users | 4 models (Department, Room, DoctorProfile, StaffSchedule) | 11 endpoints mới | 2 trang | — | — |
| audit | users | 1 model (AuditLog) | 1 endpoint | 1 trang | — | — |
| reports (P2) | billing, pharmacy, services | Không thêm model | 1 endpoint mới | Mở rộng MonthlyReportPage | — | — |

---

## 4. Tiêu chí chuyển từ Phase 1 sang Phase 2

| Tiêu chí | Mô tả | Bằng chứng |
|---|---|---|
| Schema P1 stable | Không có breaking change | Migration history |
| E2E P1 pass | auth, clinic-flow, billing tests pass | `backend/test/` |
| Frontend P1 build | `npm run build` pass | Build output |
| Seed data P1 OK | Có đủ demo data | `prisma/seed.ts` |
| Design approved | SDD cho P2 approved | `docs/software-design-workspace/` |

---

## 5. Diagram đề xuất cho báo cáo

| Diagram | Nội dung | Công cụ |
|---|---|---|
| VisitStatus state machine | REGISTERED → WAITING → IN_EXAMINATION → COMPLETED/CANCELLED | draw.io |
| Lab flow sequence | Doctor order → Nurse sample → Lab enter result → Doctor verify | draw.io |
| Pharmacy FEFO flow | Prescription → FEFO lot selection → Dispense → Stock update | draw.io |
| Phase 1 → Phase 2 Gantt | Timeline theo git branches | spreadsheet |
| Component dependency | Module dependency diagram P1 + P2 | draw.io |
