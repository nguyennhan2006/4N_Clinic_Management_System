# 07 — Bằng chứng Business Rules

> Audit date: 2026-06-07 | Nguồn: `backend/src/modules/**/*.service.ts` đọc trực tiếp

---

## 1. Business Rules Phase 1 (BR-01 → BR-20)

| Rule ID | Phase | Module | Description | Trigger | Enforcement | Error/Status | File path | Status |
|---|---|---|---|---|---|---|---|---|
| BR-01 | P1 | auth | Validate email/password credentials | POST /auth/login | `auth.service.ts` — bcrypt compare | 401 Unauthorized | `backend/src/modules/auth/auth.service.ts` | CONFIRMED |
| BR-02 | P1 | auth | Refresh token revoke on logout | POST /auth/logout | `auth.service.ts` — delete RefreshToken record | Token invalid after logout | `backend/src/modules/auth/auth.service.ts` | CONFIRMED |
| BR-03 | P1 | auth | Password hash using bcrypt | User creation | `auth.service.ts` / `users.service.ts` | Never store plaintext | `backend/src/modules/auth/auth.service.ts` | CONFIRMED |
| BR-04 | P1 | patients | Unique citizenId per patient | POST /patients | `patients.service.ts` — Prisma @unique + PrismaExceptionFilter | 409 Conflict | `backend/src/modules/patients/patients.service.ts` | CONFIRMED |
| BR-05 | P1 | visits | No duplicate visit: same patient on same date | POST /visits | `visits.service.ts:62` — `throw new ConflictException` inside `prisma.$transaction` | 409 Conflict | `backend/src/modules/visits/visits.service.ts:57-75` | CONFIRMED |
| BR-06 | P1 | visits | Daily visit quota check (từ regulation) | POST /visits | `visits.service.ts` — so sánh count với regulation value | 409 Conflict | `backend/src/modules/visits/visits.service.ts` | CONFIRMED |
| BR-07 | P1 | visits | Queue number atomic generation | POST /visits | `visits.service.ts:55` — `prisma.$transaction` | Race condition safe | `backend/src/modules/visits/visits.service.ts:55` | CONFIRMED |
| BR-08 | P1 | visits | Visit status transition: REGISTERED → IN_EXAMINATION khi open-examination | POST /visits/:id/open-examination | `visits.service.ts:181` — `prisma.$transaction` | 409 if wrong status | `backend/src/modules/visits/visits.service.ts:181-198` | CONFIRMED |
| BR-09 | P1 | visits | Doctor must be active before open examination | POST /visits/:id/open-examination | `visits.service.ts:172-178` — check User.status === ACTIVE | 400 BadRequest | `backend/src/modules/visits/visits.service.ts:172` | CONFIRMED |
| BR-10 | P1 | examinations | Only OPEN examination can be updated | PATCH /examinations/:id | `examinations.service.ts` — check status | 400 BadRequest | `backend/src/modules/examinations/examinations.service.ts` | CONFIRMED |
| BR-11 | P1 | examinations | Drug must be active (isActive=true) to prescribe | POST/PUT /examinations/:id/prescription | `examinations.service.ts` — check Drug.isActive | 400 BadRequest | `backend/src/modules/examinations/examinations.service.ts` | CONFIRMED |
| BR-12 | P1 | examinations | Examination requires diagnosis to complete | POST /examinations/:id/complete | `examinations.service.ts` — check Diagnosis exists | 400 BadRequest | `backend/src/modules/examinations/examinations.service.ts` | CONFIRMED |
| BR-13 | P1 | examinations | Examination complete: status OPEN → COMPLETED; Visit → COMPLETED | POST /examinations/:id/complete | `examinations.service.ts` — transaction update both | Atomic | `backend/src/modules/examinations/examinations.service.ts` | CONFIRMED |
| BR-14 | P1 | examinations | **LIMITATION:** complete không check pending service/lab orders | POST /examinations/:id/complete | `examinations.service.ts:269` — không có check ServiceOrder | RISK — bác sĩ tự quyết | `backend/src/modules/examinations/examinations.service.ts:269` | RISK |
| BR-15 | P1 | billing | Invoice chỉ tạo khi Visit status = COMPLETED | POST /visits/:visitId/invoice | `billing.service.ts:55-69` | 400 BadRequest | `backend/src/modules/billing/billing.service.ts:55` | CONFIRMED |
| BR-16 | P1 | billing | Payment amount > 0 | POST /invoices/:id/payments | `billing.service.ts:241` | 400 BadRequest | `backend/src/modules/billing/billing.service.ts:241` | CONFIRMED |
| BR-17 | P1 | billing | No overpayment: amount ≤ remaining | POST /invoices/:id/payments | `billing.service.ts:266` — `throw new BadRequestException` | 400 BadRequest | `backend/src/modules/billing/billing.service.ts:266` | CONFIRMED |
| BR-18 | P1 | billing | Cannot pay VOID or already PAID invoice | POST /invoices/:id/payments | `billing.service.ts:254-258` | 400 BadRequest | `backend/src/modules/billing/billing.service.ts:254` | CONFIRMED |
| BR-19 | P1 | billing | Payment atomic: update paidAmount + InvoiceStatus trong transaction | POST /invoices/:id/payments | `billing.service.ts:244` — `prisma.$transaction` | Atomic | `backend/src/modules/billing/billing.service.ts:244` | CONFIRMED |
| BR-20 | P1 | regulations | Regulation activation: deactivate old → activate new trong transaction | PATCH /regulations/:id/activate | `regulations.service.ts` — `prisma.$transaction` | Atomic | `backend/src/modules/regulations/regulations.service.ts` | CONFIRMED |

---

## 2. Business Rules Phase 2 (BR-21 → BR-29)

| Rule ID | Phase | Module | Description | Trigger | File path | Status |
|---|---|---|---|---|---|---|
| BR-21 | P2 | pharmacy | Expired lot check: không cấp phát lô hết hạn | POST /pharmacy/dispense | `pharmacy.service.ts:114-116` — `lot.expiryDate < new Date()` | CONFIRMED |
| BR-22 | P2 | pharmacy | Sufficient stock check: quantity ≤ available | POST /pharmacy/dispense | `pharmacy.service.ts:103-108` | CONFIRMED |
| BR-23 | P2 | pharmacy | Duplicate dispense check: prescription đã dispensed | POST /pharmacy/dispense | `pharmacy.service.ts:75` | CONFIRMED |
| BR-24 | P2 | pharmacy | Dispense atomic: tạo Dispense + StockMovement + giảm StockLot | POST /pharmacy/dispense | `pharmacy.service.ts:122` — `prisma.$transaction` | CONFIRMED |
| BR-25 | P2 | lab | Lab flow state machine: ORDERED → SAMPLE_COLLECTED → RESULT_ENTERED → VERIFIED | Lab endpoints | `lab.service.ts` | CONFIRMED |
| BR-26 | P2 | vitals | BMI tự tính từ weight/height | POST /vitals | `vitals.service.ts` | CONFIRMED |
| BR-27 | P2 | appointments | Appointment checkin tạo Visit mới (hoặc link Visit hiện có) | POST /appointments/:id/checkin | `appointments.service.ts` | CONFIRMED |
| BR-28 | P2 | queue | Queue state machine: WAITING → CALLED → IN_SERVICE → DONE/SKIPPED | PATCH /queue/:id/status | `queue.service.ts` | CONFIRMED |
| BR-29 | P2 | inventory | Stock movement ghi nhận IN/OUT/ADJUSTMENT với audit trail | Inventory endpoints | `inventory.service.ts` | CONFIRMED |

---

## 3. Prisma Transaction Usage

| Business operation | Module | Evidence | Status |
|---|---|---|---|
| Visit creation + queue number | visits | `visits.service.ts:55` — `prisma.$transaction` | CONFIRMED |
| Open examination + update visit status | visits | `visits.service.ts:181` — `prisma.$transaction` | CONFIRMED |
| Payment + update invoice status | billing | `billing.service.ts:244` — `prisma.$transaction` | CONFIRMED |
| Regulation activation | regulations | `regulations.service.ts` — `prisma.$transaction` | CONFIRMED |
| Dispense + stock deduction + movement | pharmacy | `pharmacy.service.ts:122` — `prisma.$transaction` | CONFIRMED |

---

## 4. RBAC Matrix (từ `frontend/src/app/router.tsx` và navigation.ts)

| Route / Feature | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER | NURSE | LAB_TECH | PHARMACIST |
|---|---|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Patients list/detail | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| Patient create | ✓ | ✓ | — | — | — | — | — | — |
| Medical history | ✓ | — | ✓ | — | ✓ | — | — | — |
| Visits list | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| Visit create | ✓ | ✓ | — | — | — | — | — | — |
| Examination | ✓ | — | ✓ | — | — | — | — | — |
| Invoices | ✓ | — | — | ✓ | ✓ | — | — | — |
| Monthly report | ✓ | — | — | — | ✓ | — | — | — |
| Disease/Drug catalog | ✓ | — | — | — | ✓ | — | — | — |
| Regulations | ✓ | — | — | — | ✓ | — | — | — |
| User management | ✓ | — | — | — | — | — | — | — |
| Role management | ✓ | — | — | — | — | — | — | — |
| Appointments | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| Queue | ✓ | ✓ | ✓ | — | — | ✓ | — | — |
| Lab | ✓ | — | ✓ | — | — | ✓ | ✓ | — |
| Inventory | ✓ | — | — | — | ✓ | — | — | ✓ |
| Pharmacy | ✓ | — | — | — | — | — | — | ✓ |
| Service catalog | ✓ | — | — | — | ✓ | — | — | — |
| Organization | ✓ | — | — | — | ✓ | — | — | — |
| Audit log | ✓ | — | — | — | — | — | — | — |

> **Lưu ý:** Đây là RBAC frontend (từ `RequireRole` và `navigation.ts`). Backend RBAC chi tiết (@Roles decorator) cần xác nhận thủ công từng controller.

---

## 5. Test Case Suggestions

| BR | Test type | Test scenario |
|---|---|---|
| BR-05 | E2E | Tạo 2 visit cùng patient cùng ngày → expect 409 |
| BR-06 | Manual | Tạo visit khi đã đủ quota → expect 409 |
| BR-09 | Manual | Open examination với doctor INACTIVE → expect 400 |
| BR-11 | Manual | Kê đơn thuốc isActive=false → expect 400 |
| BR-12 | E2E | Complete examination không có diagnosis → expect 400 |
| BR-14 | Manual | Complete examination khi còn pending lab order → ghi nhận RISK (không có check) |
| BR-17 | E2E | Payment amount > remaining → expect 400 |
| BR-21 | Manual | Dispense từ lô hết hạn → expect 400 |
| BR-24 | Manual | Dispense quantity > available stock → expect 400 |
