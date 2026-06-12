# Traceability Matrix — Sequence Diagrams
## 4N Clinic Management System — SE104

> Ánh xạ: **UC → Endpoint → Controller → Service → DB → Diagram → Test**.
> Cột "Trust" = AS-BUILT (đối chiếu code) hoặc PLANNED (thiết kế Phase 2A, chưa có code).
> Nguồn: `backend/src/modules/**` (đọc trực tiếp), `MODE_C_CONTEXT.md`, `backend/prisma/schema.prisma`.

---

## 1. Bảng truy vết chính

| Diagram | UC | Endpoint | Controller | Service::method | DB chính (ghi) | Transaction | Audit | Trust |
|---|---|---|---|---|---|---|---|---|
| SEQ_P1_01_CreateVisit | UC07 | POST /visits | VisitsController | VisitsService::create | Visit | ✅ Serializable | CREATE_VISIT | AS-BUILT |
| SEQ_P1_02_OpenExamination | UC09 | POST /visits/:id/open-examination | VisitsController | VisitsService::openExamination | Examination, Visit | ✅ | OPEN_EXAMINATION | AS-BUILT |
| SEQ_P1_03_UpdateExamination | UC10 | PATCH /examinations/:id | ExaminationsController | ExaminationsService::update | Examination, Diagnosis | ✅ | — | AS-BUILT |
| SEQ_P1_04_UpsertPrescription | UC12 | PUT /examinations/:id/prescription | ExaminationsController | ExaminationsService::upsertPrescription | Prescription, PrescriptionItem | ✅ | — | AS-BUILT |
| SEQ_P1_05_CompleteExamination | UC13 | POST /examinations/:id/complete | ExaminationsController | ExaminationsService::complete | Examination, Visit | ✅ (validation inside) | COMPLETE_EXAMINATION | AS-BUILT |
| SEQ_P1_06_CreateInvoice | UC14 | POST /visits/:visitId/invoice | BillingController | BillingService::createInvoiceFromVisit | Invoice, InvoiceItem | ❌ nested create (no explicit $tx) | CREATE_INVOICE | AS-BUILT |
| SEQ_P1_07_RecordPayment | UC15 | POST /invoices/:id/payments | BillingController | BillingService::createPayment | Payment, Invoice | ✅ | CREATE_PAYMENT | AS-BUILT |
| SEQ_P1_08_Login | UC01 | POST /auth/login (PUBLIC) | AuthController | AuthService::login | RefreshToken | ❌ single create | LOGIN_SUCCESS / LOGIN_FAILED | AS-BUILT |
| SEQ_P1_09_ActivateRegulation | UC17 | PATCH /regulations/:id/activate | RegulationsController | RegulationsService::activate | RegulationVersion | ✅ | — (none in code) | AS-BUILT |
| SEQ_P1_OV_DoctorToCashierOverview | UC09–15 | (multi) | (multi) | (multi) | (multi) | — | — | AS-BUILT (overview) |
| SEQ_P2_01_AppointmentCheckinQueue | — | POST /appointments/:id/checkin | AppointmentsController* | AppointmentsService::checkIn* | Visit, QueueTicket, Appointment | ✅ | CHECKIN* | PLANNED |
| SEQ_P2_02_DispenseFEFO | — | POST /pharmacy/dispense | PharmacyController* | PharmacyService::dispense* | Dispense, DispenseItem, StockMovement, StockLot | ✅ | DISPENSE*, STOCK_MOVEMENT* | PLANNED |
| SEQ_P2_03_LabOrderResultReview | — | POST /examinations/:id/service-orders; /lab/orders/:id/* | Lab/ServiceOrders* | LabService::*  | ServiceOrder, LabOrder, LabSample, LabResult | ✅ (order) | LAB_RESULT_ENTERED* | PLANNED |
| SEQ_P2_04_DispenseReversal | — | PATCH /pharmacy/dispense/:id/reverse | PharmacyController* | PharmacyService::reverse* | StockMovement, StockLot, Dispense | ✅ | STOCK_MOVEMENT* | PLANNED |
| SEQ_P2_05_MultiSourceInvoice | — | POST /visits/:visitId/invoice (ext) | BillingController | BillingService::createInvoiceFromVisit (ext)* | Invoice, InvoiceItem | ✅ | CREATE_INVOICE | PLANNED |

\* Controller/Service/audit-action chưa tồn tại trong code (gate STOP-IMPLEMENTATION). Tên theo `MODE_C_CONTEXT §3.8`.

---

## 2. UC Rule Matrix — Phase 1 (AS-BUILT, đủ 13 mục theo §3 rule)

### UC07 — Tạo lượt khám (SEQ_P1_01)
| Mục | Giá trị |
|---|---|
| Actor / RBAC | RECEPTIONIST, ADMIN |
| Input DTO | CreateVisitDto {patientId, visitDate, reason?} |
| DTO validation | patientId, visitDate bắt buộc → 400 |
| Business validation | patient tồn tại (404); duplicate ngày (409); quota (409) |
| Business rules | BR-01 (cap từ regulation, fallback 40), BR-02 (unique/ngày), BR-03 (queueNumber atomic) |
| State transition | none → WAITING |
| DB read/write | read patient, regulationVersion; write visit |
| Transaction | ✅ $transaction Serializable |
| Audit | CREATE_VISIT (sau commit) |
| Snapshot | — |
| Error cases | 400 DTO, 403, 404 patient, 409 duplicate, 409 cap |
| Test mapping | happy; no-patient(404); dup(409); over-cap(409); wrong-role(403) |

### UC09 — Mở lượt khám (SEQ_P1_02)
| Mục | Giá trị |
|---|---|
| Actor / RBAC | DOCTOR, ADMIN |
| Input | path :id (visitId), actor từ JWT |
| Business validation | doctor ACTIVE (400, ngoài tx); visit tồn tại (404); chưa có exam (409); status==WAITING (400) |
| State transition | Visit WAITING → IN_EXAMINATION; Exam none → OPEN |
| Transaction | ✅ (pre-check doctor ngoài tx) |
| Audit | OPEN_EXAMINATION |
| Error cases | 401/403, 400 doctor-inactive, 404 visit, 409 exam-exists, 400 wrong-status |
| Test mapping | happy; inactive-doctor(400); no-visit(404); dup-exam(409); not-waiting(400) |

### UC10 — Lập/cập nhật phiếu khám (SEQ_P1_03)
| Mục | Giá trị |
|---|---|
| Actor / RBAC | DOCTOR, ADMIN |
| Input DTO | UpdateExaminationDto {symptoms?, clinicalNotes?, conclusion?, diagnoses?[]} |
| Business validation | exam tồn tại (404); status OPEN (400 nếu COMPLETED/CANCELLED); ≤1 primary (400); disease active (400) |
| State transition | — (giữ OPEN) |
| Transaction | ✅ (update + diagnosis replace) |
| Audit | — |
| Snapshot | diagnosis.name = disease.name lúc lưu |
| Error cases | 400 DTO, 403, 404, 400 locked, 400 multi-primary, 400 disease-inactive |
| Test mapping | happy; locked-exam(400); 2-primary(400); inactive-disease(400) |

### UC12 — Kê đơn thuốc upsert (SEQ_P1_04)
| Mục | Giá trị |
|---|---|
| Actor / RBAC | DOCTOR, ADMIN |
| Input DTO | CreatePrescriptionDto {items[], note?} |
| Business validation | exam tồn tại (404); chưa COMPLETED (400); items≥1 (400); drug active (400) |
| Business rules | BR-08 replace-all (xóa cũ → tạo mới) |
| Transaction | ✅ |
| Audit | — |
| Snapshot | unitPrice = drug.price; lineTotal = price×qty |
| Error cases | 400 DTO, 403, 404, 400 completed, 400 empty-items, 400 drug-inactive |
| Test mapping | happy-new; happy-replace; completed(400); empty(400); inactive-drug(400) |

### UC13 — Hoàn tất phiếu khám (SEQ_P1_05)
| Mục | Giá trị |
|---|---|
| Actor / RBAC | DOCTOR, ADMIN |
| Business validation | exam tồn tại (404); CANCELLED→400; COMPLETED→idempotent return; symptoms+conclusion (400); **primary diagnosis bắt buộc** (400) |
| Business rules | BR-07 (điều kiện hoàn tất) |
| State transition | Exam OPEN → COMPLETED; Visit IN_EXAMINATION → COMPLETED |
| Transaction | ✅ (validation INSIDE tx) |
| Audit | COMPLETE_EXAMINATION |
| Error cases | 401/403, 404, 400 cancelled, 400 missing-fields, 400 no-primary |
| Test mapping | happy; cancelled(400); missing-conclusion(400); no-primary(400); re-complete(idempotent) |

### UC14 — Lập hóa đơn (SEQ_P1_06)
| Mục | Giá trị |
|---|---|
| Actor / RBAC | CASHIER, ADMIN |
| Business validation | visit tồn tại (404); status COMPLETED (400); invoice tồn tại → trả existing (idempotent); có examination (400) |
| Business rules | BR-04 (chỉ từ COMPLETED), BR-05 (1 invoice/visit — idempotent, không 409) |
| State transition | Invoice none → ISSUED |
| Transaction | ❌ single `invoice.create` nested items (atomic nested write) |
| Audit | CREATE_INVOICE |
| Snapshot | consultationFee + drug unitPrice/lineTotal lúc lập |
| Error cases | 401/403, 404, 400 not-completed, 400 no-exam |
| Test mapping | happy; not-completed(400); re-issue(returns existing); no-exam(400) |

### UC15 — Ghi nhận thanh toán (SEQ_P1_07)
| Mục | Giá trị |
|---|---|
| Actor / RBAC | CASHIER, ADMIN |
| Input DTO | CreatePaymentDto {amount, method, note?} |
| Business validation | amount>0 (400); invoice tồn tại (404); VOID(400); PAID(400); amount≤remaining (400) |
| Business rules | BR-06 (không vượt remaining) |
| State transition | Invoice ISSUED → PARTIALLY_PAID → PAID |
| Transaction | ✅ |
| Audit | CREATE_PAYMENT |
| Error cases | 401/403, 400 amount≤0, 404, 400 void, 400 already-paid, 400 over-remaining |
| Test mapping | happy-partial; happy-full; over(400); void(400); paid(400) |

### UC01 — Đăng nhập (SEQ_P1_08)
| Mục | Giá trị |
|---|---|
| Actor / RBAC | All (PUBLIC, no guard) |
| Input DTO | LoginDto {username, password} |
| Business validation | user tồn tại (401 generic); LOCKED(403); INACTIVE(403); bcrypt(401) |
| State transition | — |
| Transaction | ❌ |
| Audit | LOGIN_SUCCESS / LOGIN_FAILED (mọi nhánh fail) |
| Security | 401 không tiết lộ account tồn tại; refresh token hash SHA-256 |
| Error cases | 400 DTO, 401 no-user, 403 locked, 403 inactive, 401 bad-pass |
| Test mapping | happy; no-user(401); locked(403); inactive(403); bad-pass(401) |

### UC17 — Kích hoạt quy định (SEQ_P1_09)
| Mục | Giá trị |
|---|---|
| Actor / RBAC | ADMIN |
| Business validation | version tồn tại (404); chưa active (400) |
| Business rules | BR-09 (deactivate-all + activate); không hồi tố |
| State transition | RegulationVersion isActive false → true (others → false) |
| Transaction | ✅ |
| Audit | **none in code** (RECOMMENDED: REGULATION_ACTIVATE — xem VALIDATION_REPORT) |
| Error cases | 401/403, 404, 400 already-active |
| Test mapping | happy; not-found(404); already-active(400) |

---

## 3. UC Rule Matrix — Phase 2A (PLANNED, theo MODE_C_CONTEXT)

| Diagram | Actor/RBAC | BR chính | State | Transaction | Audit (NEW) | Error chính |
|---|---|---|---|---|---|---|
| SEQ_P2_01 Check-in | RECEPTIONIST, NURSE | BR-P2-01/02/03; OQ-002 idempotent | Appointment SCHEDULED→CHECKED_IN; Visit→WAITING | ✅ atomic | CHECKIN | 404, 409 wrong-state, 409 already-checked-in |
| SEQ_P2_02 Dispense | PHARMACIST, ADMIN | BR-P2-09 FEFO, BR-P2-10 atomic, **BR-P2-11 trừ kho chỉ khi dispense** | Dispense→DISPENSED | ✅ | DISPENSE, STOCK_MOVEMENT | 404, 409 not-completed, 409 insufficient-stock |
| SEQ_P2_03 Lab | DOCTOR, LAB_TECHNICIAN | BR-P2-06/07 sync, BR-P2-08 reviewer≠entrant | LabOrder ORDERED→…→REVIEWED | ✅ (order) | LAB_RESULT_ENTERED | 400 reviewer-same, immutable-after-entered |
| SEQ_P2_04 Reversal | PHARMACIST, ADMIN | BR-P2-12 chỉ trước thanh toán | Dispense DISPENSED→REVERSED | ✅ | STOCK_MOVEMENT | 404, 409 already-reversed, 409 paid |
| SEQ_P2_05 Multi-invoice | CASHIER, ADMIN | BR-P2-13 snapshot, BR-P2-14 dedupe, BR-P2-15 no-void-if-paid | Invoice→ISSUED | ✅ | CREATE_INVOICE | 404, 400 not-completed |

**Canonical names (post CF-001..009):** REVIEWED, reviewedById/reviewedAt, scheduledStartAt/scheduledEndAt,
isRequiredForCompletion, DispenseStatus {DISPENSED, REVERSED}, StockMovementType {IN, OUT, ADJUSTMENT, REVERSAL},
Visit.visitSource {WALK_IN, APPOINTMENT}, Visit.doctorProfileId.
