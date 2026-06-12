# 07 — Bằng chứng Business Rules

> Tất cả business rules enforce tại **service layer** — không ở controller, không ở frontend  
> Nguồn: `backend/src/modules/*/`

---

## 1. Bảng Business Rules Phase 1

| Rule ID | Phase | Module | Mô tả rule | Điều kiện kích hoạt | Cách enforce | Error/status | File path | Test case đề xuất | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|
| BR-01 | P1 | auth | Đăng nhập sai credentials trả lỗi 401 | POST /auth/login với password sai | bcrypt.compare() false → UnauthorizedException | 401 Unauthorized | `auth.service.ts` | Test: login sai password → 401 | CONFIRMED |
| BR-02 | P1 | auth | Refresh token bị revoke không dùng được | POST /auth/refresh với token đã logout | Kiểm tra `revokedAt` trong DB | 401 Unauthorized | `auth.service.ts` | Test: logout rồi refresh → 401 | CONFIRMED |
| BR-03 | P1 | users | Mật khẩu phải hash trước khi lưu | POST /users (tạo tài khoản) | bcrypt.hash() trước prisma.user.create() | — | `users.service.ts` | Test: mật khẩu trong DB ≠ plain text | CONFIRMED |
| BR-04 | P1 | patients | Không tạo bệnh nhân với citizenId trùng | POST /patients | Prisma unique constraint → ConflictException | 409 Conflict | `patients.service.ts:27` | Test: tạo 2 bệnh nhân cùng citizenId | CONFIRMED |
| BR-05 | P1 | visits | Không tạo 2 lượt khám cùng bệnh nhân cùng ngày | POST /visits | Check `@@unique([patientId, date])` → ConflictException | 409 Conflict | `visits.service.ts:62` | Test: tạo 2 visits cùng patientId, date | CONFIRMED |
| BR-06 | P1 | visits | Không vượt quota lượt khám trong ngày nếu có regulation | POST /visits | Đọc regulation `maxPatientsPerDay`, so sánh count | 409 Conflict | `visits.service.ts:75` | Test: tạo visit khi đã đủ quota | CONFIRMED |
| BR-07 | P1 | visits | Bệnh nhân phải tồn tại khi tạo lượt khám | POST /visits | findUnique patient → NotFoundException nếu null | 404 Not Found | `visits.service.ts:50` | Test: tạo visit với patientId không tồn tại | CONFIRMED |
| BR-08 | P1 | visits | Chỉ mở phiên khám khi doctor account active | POST /visits/:id/open-examination | Check user.status === ACTIVE | 400 Bad Request | `visits.service.ts:178` | Test: gán doctor bị khóa → lỗi | CONFIRMED |
| BR-09 | P1 | visits | Visit phải ở trạng thái cho phép khi mở khám | POST /visits/:id/open-examination | Check status WAITING → IN_EXAMINATION | 409 Conflict | `visits.service.ts:192` | Test: mở khám visit đã COMPLETED | CONFIRMED |
| BR-10 | P1 | examinations | Không sửa phiếu khám đã COMPLETED | PATCH /examinations/:id | Check status OPEN, throw BadRequest nếu không | 400 Bad Request | `examinations.service.ts:53` | Test: patch examination COMPLETED | CONFIRMED |
| BR-11 | P1 | examinations | Không tạo đơn thuốc khi đã có đơn | POST /examinations/:id/prescription | Check prescription null | 400 Bad Request | `examinations.service.ts:146` | Test: tạo đơn 2 lần | CONFIRMED |
| BR-12 | P1 | examinations | Đơn thuốc phải có ít nhất 1 dòng thuốc | POST/PUT /examinations/:id/prescription | items.length === 0 → BadRequest | 400 Bad Request | `examinations.service.ts:150, 216` | Test: tạo đơn với items rỗng | CONFIRMED |
| BR-13 | P1 | examinations | Thuốc trong đơn phải đang active | POST/PUT /examinations/:id/prescription | Kiểm tra drug.isActive cho từng item | 400 Bad Request | `examinations.service.ts:161` | Test: kê thuốc bị ngừng | CONFIRMED |
| BR-14 | P1 | examinations | Không hoàn tất khám nếu chưa có diagnosis | POST /examinations/:id/complete | Check diagnosis tồn tại | 400 Bad Request | `examinations.service.ts:301` | Test: complete examination không có diagnosis | CONFIRMED |
| BR-15 | P1 | billing | Không lập hóa đơn nếu visit chưa COMPLETED | POST /visits/:visitId/invoice | Check visit.status | 400 Bad Request | `billing.service.ts:59` | Test: invoice visit WAITING | CONFIRMED |
| BR-16 | P1 | billing | Không lập trùng hóa đơn cho cùng visit | POST /visits/:visitId/invoice | findUnique invoice → throw nếu đã có | 400 Bad Request | `billing.service.ts:63` | Test: tạo invoice 2 lần | CONFIRMED |
| BR-17 | P1 | billing | Số tiền thanh toán phải > 0 | POST /invoices/:id/payments | amount <= 0 → BadRequest | 400 Bad Request | `billing.service.ts:241` | Test: payment amount = 0 | CONFIRMED |
| BR-18 | P1 | billing | Không thanh toán hóa đơn đã PAID hoặc VOID | POST /invoices/:id/payments | Check invoice.status | 400 Bad Request | `billing.service.ts:254, 258` | Test: pay invoice đã PAID | CONFIRMED |
| BR-19 | P1 | billing | Không thanh toán vượt quá số tiền còn lại | POST /invoices/:id/payments | remaining = total - paid; amount > remaining → BadRequest | 400 Bad Request | `billing.service.ts:266` | Test: pay amount > remaining | CONFIRMED |
| BR-20 | P1 | regulations | Chỉ 1 regulation version active tại 1 thời điểm | PATCH /regulations/:id/activate | Deactivate all, then activate target trong $transaction | — | `regulations.service.ts` | Test: activate → kiểm tra chỉ 1 active | CONFIRMED |

---

## 2. Bảng Business Rules Phase 2

| Rule ID | Phase | Module | Mô tả rule | Cách enforce | File path | Trạng thái |
|---|---|---|---|---|---|---|
| BR-21 | P2 | appointments | Không đặt lịch trùng giờ cho cùng bác sĩ | Check conflict trong DB | `appointments.service.ts` | CONFIRMED |
| BR-22 | P2 | appointments | Status transition: SCHEDULED → CHECKED_IN hoặc CANCELLED/NO_SHOW | Check status trước khi update | `appointments.service.ts` | CONFIRMED |
| BR-23 | P2 | queue | Status transition hợp lệ: WAITING → CALLED → IN_SERVICE → DONE | Validate state machine | `queue.service.ts` | CONFIRMED |
| BR-24 | P2 | lab | Lab flow: ORDERED → SAMPLE_COLLECTED → RESULT_ENTERED → VERIFIED | Sequential state checks | `lab.service.ts` | CONFIRMED |
| BR-25 | P2 | inventory | Cấp phát thuốc trừ kho atomic (transaction) | prisma.$transaction() | `pharmacy.service.ts` | CONFIRMED |
| BR-26 | P2 | inventory | Cấp phát theo FEFO (First Expire First Out) | Sort lots by expiryDate ASC | `pharmacy.service.ts` | CONFIRMED |
| BR-27 | P2 | inventory | Không cấp phát nếu số lượng tồn kho không đủ | Check quantityOnHand >= quantity | `pharmacy.service.ts` | CONFIRMED |
| BR-28 | P2 | vitals | Tự động tính BMI từ weight/height | bmi = weight / (height/100)^2 | `vitals.service.ts` | CONFIRMED |
| BR-29 | P2 | billing | InvoiceItem phân loại theo itemType | CONSULTATION, SERVICE, DRUG, DISPENSE | `billing.service.ts` | CONFIRMED |

---

## 3. Transaction usage (consistency đảm bảo)

| Operation | Transaction | Mục đích | File path |
|---|---|---|---|
| Tạo Visit với queue number | `prisma.$transaction()` | Atomic increment số thứ tự | `visits.service.ts` |
| Ghi nhận thanh toán | `prisma.$transaction()` | Atomic update paidAmount + invoice status | `billing.service.ts` |
| Activate regulation version | `prisma.$transaction()` | Deactivate all + activate one atomically | `regulations.service.ts` |
| Cấp phát thuốc (Dispense) | `prisma.$transaction()` | Tạo Dispense + cập nhật StockLot.quantityOnHand | `pharmacy.service.ts` |

---

## 4. RBAC enforcement

**File**: `backend/src/common/guards/roles.guard.ts` và `backend/src/common/decorators/roles.decorator.ts`

Tất cả endpoint (trừ login/refresh) đều có `@UseGuards(JwtAuthGuard)`.  
Các endpoint nhạy cảm thêm `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN', ...)`.

**Ma trận vai trò chính:**

| Chức năng | ADMIN | DOCTOR | RECEPTIONIST | CASHIER | MANAGER | NURSE | LAB_TECHNICIAN | PHARMACIST |
|---|---|---|---|---|---|---|---|---|
| Tạo bệnh nhân | ✅ | — | ✅ | — | — | — | — | — |
| Tạo lượt khám | ✅ | — | ✅ | — | — | — | — | — |
| Mở phiên khám | ✅ | ✅ | — | — | — | — | — | — |
| Lập phiếu khám | ✅ | ✅ | — | — | — | — | — | — |
| Lập hóa đơn | ✅ | — | — | ✅ | — | — | — | — |
| Ghi nhận thanh toán | ✅ | — | — | ✅ | — | — | — | — |
| Xem báo cáo | ✅ | — | — | — | ✅ | — | — | — |
| Quản lý tài khoản | ✅ | — | — | — | — | — | — | — |
| Ghi sinh hiệu | ✅ | ✅ | — | — | — | ✅ | — | — |
| Xét nghiệm | ✅ | ✅ | — | — | — | — | ✅ | — |
| Cấp phát thuốc | ✅ | — | — | — | — | — | — | ✅ |

---

## 5. Gợi ý Test Case cho Chương 5

| Test ID | Loại | Module | Mục tiêu | Input | Expected |
|---|---|---|---|---|---|
| TC-01 | E2E | auth | Login thành công | email đúng, password đúng | 201, accessToken |
| TC-02 | E2E | auth | Login sai password | email đúng, password sai | 401 |
| TC-03 | E2E | patients | Tạo bệnh nhân thành công | đủ field | 201, patientCode |
| TC-04 | E2E | patients | Tạo trùng citizenId | citizenId đã tồn tại | 409 |
| TC-05 | E2E | visits | Tạo lượt khám thành công | patientId, date hợp lệ | 201, queueNumber |
| TC-06 | E2E | visits | Tạo trùng lượt khám | cùng patientId, date | 409 |
| TC-07 | E2E | examinations | Hoàn tất khám thành công | examination OPEN + diagnosis | 200 |
| TC-08 | E2E | examinations | Kê đơn với thuốc không active | drugId bị ngừng | 400 |
| TC-09 | E2E | billing | Thanh toán vượt quá | amount > remaining | 400 |
| TC-10 | E2E | billing | Thanh toán hóa đơn đã PAID | invoice PAID | 400 |
