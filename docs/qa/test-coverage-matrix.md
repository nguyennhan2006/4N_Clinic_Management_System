# Test Coverage Matrix — 4N Clinic Management System

> Phiên bản: 2026-06-08  
> Phương pháp: Use Case–Driven Testing + Business Rule Testing + Workflow Testing  
> Tầng test: Unit → API/Integration → Workflow → E2E → Acceptance  
> Quy tắc đặt tên: `TC-[MODULE]-[UC]-[TYPE]-[SEQ]`

---

## Mục lục

1. [Tầng test và công cụ](#1-tầng-test-và-công-cụ)
2. [Ma trận bao phủ tổng hợp](#2-ma-trận-bao-phủ-tổng-hợp)
3. [Phase 1 — Chi tiết test case](#3-phase-1--chi-tiết-test-case)
4. [Phase 2 — Chi tiết test case](#4-phase-2--chi-tiết-test-case)
5. [Cross-module / Integration tests](#5-cross-module--integration-tests)
6. [Seed data yêu cầu](#6-seed-data-yêu-cầu)
7. [Bug report format](#7-bug-report-format)
8. [Checklist trước demo](#8-checklist-trước-demo)

---

## 1. Tầng test và công cụ

| Tầng | Tên | Công cụ | File/Folder |
|---|---|---|---|
| T1 | Unit Test | Jest + NestJS Testing | `backend/src/**/*.spec.ts` |
| T2 | API/Integration Test | Supertest + Jest e2e | `backend/test/*.e2e-spec.ts` |
| T3 | Workflow Test | Supertest (multi-step) | `backend/test/clinic-flow.e2e-spec.ts` |
| T4 | E2E / UI Test | Playwright hoặc manual | `e2e/` (planned) |
| T5 | Acceptance Test | Manual + checklist | `docs/qa/acceptance-*.md` |

**Type codes dùng trong TC-ID:**

| Code | Ý nghĩa |
|---|---|
| `SUCCESS` | Main flow thành công |
| `ALT` | Alternate flow hợp lệ |
| `VALIDATION` | Thiếu/sai input |
| `CONFLICT` | Vi phạm business rule (409) |
| `PERMISSION` | Sai role (403) |
| `STATE` | Sai trạng thái workflow |
| `NOTFOUND` | Resource không tồn tại (404) |
| `TRANSACTION` | Rollback khi lỗi giữa chừng |
| `DB` | Kiểm tra trực tiếp database |
| `REGRESSION` | Kiểm tra không làm hỏng module khác |

---

## 2. Ma trận bao phủ tổng hợp

### Phase 1

| UC | Tên | Actor | Main | Alt | Exception | Permission | State | DB | E2E | Trạng thái |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| UC01 | Đăng nhập | All | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | **Done** |
| UC02 | Quản lý người dùng | Admin | ✅ | ✅ | ✅ | ✅ | — | ✅ | ⬜ | **Done** |
| UC03 | Phân quyền / RBAC | Admin | ✅ | ⬜ | ✅ | ✅ | — | ✅ | ⬜ | **Done** |
| UC04 | Tra cứu bệnh nhân | Receptionist/All | ✅ | ✅ | ✅ | ✅ | — | ✅ | ⬜ | **Done** |
| UC05 | Tạo hồ sơ bệnh nhân | Receptionist | ✅ | ✅ | ✅ | ✅ | — | ✅ | ⬜ | **Done** |
| UC06 | Tiếp nhận bệnh nhân | Receptionist | ✅ | ✅ | ✅ | ✅ | — | ✅ | ⬜ | **Done** |
| UC07 | Tạo lượt khám | Receptionist | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | **Done** |
| UC08 | Xem danh sách khám | Doctor/Receptionist | ✅ | ✅ | ⬜ | ✅ | — | — | ⬜ | **Done** |
| UC09 | Mở lượt khám | Doctor | ✅ | ⬜ | ✅ | ✅ | ✅ | ✅ | ⬜ | **Done** |
| UC10 | Lập phiếu khám | Doctor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | **Done** |
| UC11 | Xem lịch sử khám | Doctor/All | ✅ | ✅ | ✅ | ✅ | — | — | ⬜ | **Done** |
| UC12 | Kê đơn thuốc | Doctor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | **Done** |
| UC13 | Hoàn tất phiếu khám | Doctor | ✅ | ⬜ | ✅ | ✅ | ✅ | ✅ | ⬜ | **Done** |
| UC14 | Lập hóa đơn | Cashier | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | **Done** |
| UC15 | Ghi nhận thanh toán | Cashier | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | **Done** |
| UC16 | Tra cứu hóa đơn | Cashier/Admin | ✅ | ✅ | ⬜ | ✅ | — | — | ⬜ | **Done** |
| UC17 | Thay đổi quy định | Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | **Done** |
| UC18 | Quản lý danh mục bệnh | Admin/Manager | ✅ | ✅ | ✅ | ✅ | — | ✅ | ⬜ | **Done** |
| UC19 | Quản lý danh mục thuốc | Admin/Manager | ✅ | ✅ | ✅ | ✅ | — | ✅ | ⬜ | **Done** |
| UC20 | Xem báo cáo tháng | Manager/Admin | ✅ | ✅ | ⬜ | ✅ | — | ✅ | ⬜ | **Done** |

### Phase 2

| Module | Tên | Actor | Main | Alt | Exception | Permission | State | DB | E2E | Trạng thái |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| P2-APT | Appointment | Receptionist | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | **Need test** |
| P2-QUE | Queue | Nurse/Doctor | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | **Need test** |
| P2-VIT | Vitals | Nurse/Doctor | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | **Need test** |
| P2-SVC | Service Order | Doctor | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | **Need test** |
| P2-LAB | Lab | Doctor/LabTech | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | **Need test** |
| P2-INV | Inventory | Pharmacist/Admin | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | **Need test** |
| P2-PHA | Pharmacy/Dispense | Pharmacist | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | **Need test** |
| P2-ORG | Organization | Admin | ⬜ | ⬜ | ⬜ | ⬜ | — | ⬜ | ⬜ | **Need test** |
| P2-AUD | Audit Log | Admin/Manager | ⬜ | ⬜ | ⬜ | ⬜ | — | — | ⬜ | **Need test** |

> **Ký hiệu:** ✅ Có test case | ⬜ Chưa có | — Không áp dụng

---

## 3. Phase 1 — Chi tiết test case

---

### UC01 — Đăng nhập

**File hiện có:** `backend/test/auth.e2e-spec.ts`

| TC-ID | Mô tả | Type | Input | Expected | Priority | Auto |
|---|---|---|---|---|---|---|
| TC-AUTH-UC01-SUCCESS-001 | Login với username/password đúng | SUCCESS | username+password hợp lệ | 201 + accessToken | High | ✅ API |
| TC-AUTH-UC01-SUCCESS-002 | Login trả đúng role trong token payload | SUCCESS | admin credentials | token.role = ADMIN | High | ✅ API |
| TC-AUTH-UC01-VALIDATION-001 | Login thiếu username | VALIDATION | password only | 400 | Medium | ✅ API |
| TC-AUTH-UC01-VALIDATION-002 | Login thiếu password | VALIDATION | username only | 400 | Medium | ✅ API |
| TC-AUTH-UC01-VALIDATION-003 | Login email format sai | VALIDATION | username=notEmail | 400 | Low | ⬜ |
| TC-AUTH-UC01-CONFLICT-001 | Login với password sai | CONFLICT | đúng username, sai password | 401 INVALID_CREDENTIALS | High | ✅ API |
| TC-AUTH-UC01-CONFLICT-002 | Login với user inactive | CONFLICT | user.isActive=false | 401 USER_INACTIVE | High | ⬜ |
| TC-AUTH-UC01-PERMISSION-001 | Truy cập protected route không có token | PERMISSION | no Authorization header | 401 | High | ✅ API |
| TC-AUTH-UC01-PERMISSION-002 | Truy cập với token giả mạo | PERMISSION | invalid JWT | 401 | High | ✅ API |
| TC-AUTH-UC01-PERMISSION-003 | Truy cập với token hết hạn | PERMISSION | expired JWT | 401 | High | ⬜ |
| TC-AUTH-UC01-DB-001 | Token chứa userId khớp với DB | DB | login thành công | decoded.sub = user.id | Medium | ⬜ |

**RBAC Matrix cho UC01:**

| Role | Login | Logout | Xem profile |
|---|---|---|---|
| All (unauthenticated) | ✅ | — | — |
| ADMIN | ✅ | ✅ | ✅ |
| DOCTOR | ✅ | ✅ | ✅ |
| RECEPTIONIST | ✅ | ✅ | ✅ |
| CASHIER | ✅ | ✅ | ✅ |
| MANAGER | ✅ | ✅ | ✅ |

---

### UC02 + UC03 — Quản lý người dùng & Phân quyền

**File hiện có:** `backend/test/auth.e2e-spec.ts` (RBAC section)

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-USER-UC02-SUCCESS-001 | Admin tạo user mới | SUCCESS | 201 + user record | High | ✅ API |
| TC-USER-UC02-SUCCESS-002 | Admin xem danh sách users | SUCCESS | 200 + array | High | ✅ API |
| TC-USER-UC02-SUCCESS-003 | Admin cập nhật role user | SUCCESS | 200 + updated role | High | ✅ API |
| TC-USER-UC02-SUCCESS-004 | Admin deactivate user | SUCCESS | user.isActive = false | High | ⬜ |
| TC-USER-UC02-VALIDATION-001 | Tạo user thiếu email | VALIDATION | 400 | Medium | ⬜ |
| TC-USER-UC02-VALIDATION-002 | Tạo user email trùng | VALIDATION | 409 | High | ⬜ |
| TC-USER-UC02-VALIDATION-003 | Password không đủ mạnh | VALIDATION | 400 | Medium | ⬜ |
| TC-USER-UC02-PERMISSION-001 | Doctor cố tạo user | PERMISSION | 403 | High | ✅ API |
| TC-USER-UC02-PERMISSION-002 | Cashier cố xem user list | PERMISSION | 403 | High | ✅ API |
| TC-USER-UC02-DB-001 | passwordHash không trả về trong response | DB | response không có passwordHash | High | ✅ API |
| TC-RBAC-UC03-SUCCESS-001 | Doctor truy cập endpoint của Doctor | PERMISSION | 200 | High | ✅ API |
| TC-RBAC-UC03-PERMISSION-001 | Doctor truy cập endpoint của Admin | PERMISSION | 403 | High | ✅ API |
| TC-RBAC-UC03-PERMISSION-002 | Cashier truy cập endpoint của Doctor | PERMISSION | 403 | High | ✅ API |
| TC-RBAC-UC03-PERMISSION-003 | Manager truy cập endpoint của Cashier | PERMISSION | 403 | High | ✅ API |

---

### UC04 + UC05 — Tra cứu & Tạo hồ sơ bệnh nhân

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-PAT-UC05-SUCCESS-001 | Tạo bệnh nhân với đủ thông tin bắt buộc | SUCCESS | 201 + patient.id | High | ✅ API |
| TC-PAT-UC05-SUCCESS-002 | Patient tạo ra có timestamps hợp lệ | SUCCESS | createdAt, updatedAt đúng | Medium | ⬜ |
| TC-PAT-UC05-VALIDATION-001 | Thiếu fullName | VALIDATION | 400 | High | ⬜ |
| TC-PAT-UC05-VALIDATION-002 | Thiếu dateOfBirth | VALIDATION | 400 | High | ⬜ |
| TC-PAT-UC05-VALIDATION-003 | Thiếu gender | VALIDATION | 400 | High | ⬜ |
| TC-PAT-UC05-VALIDATION-004 | dateOfBirth tương lai | VALIDATION | 400 | Medium | ⬜ |
| TC-PAT-UC05-CONFLICT-001 | Trùng phone (nếu có unique rule) | CONFLICT | 409 | Medium | ⬜ |
| TC-PAT-UC04-SUCCESS-001 | Tìm kiếm theo tên | SUCCESS | 200 + filtered array | High | ⬜ |
| TC-PAT-UC04-SUCCESS-002 | Tìm kiếm theo phone | SUCCESS | 200 + filtered array | High | ⬜ |
| TC-PAT-UC04-SUCCESS-003 | Tìm kiếm trả empty khi không có kết quả | SUCCESS | 200 + [] | Medium | ⬜ |
| TC-PAT-UC04-SUCCESS-004 | Xem chi tiết patient theo ID | SUCCESS | 200 + patient object | High | ✅ API |
| TC-PAT-UC04-NOTFOUND-001 | Xem patient không tồn tại | NOTFOUND | 404 | High | ⬜ |
| TC-PAT-UC04-PERMISSION-001 | Không có token | PERMISSION | 401 | High | ✅ API |

---

### UC06 + UC07 — Tiếp nhận & Tạo lượt khám

**File hiện có:** `backend/test/clinic-flow.e2e-spec.ts`

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-VISIT-UC07-SUCCESS-001 | Tạo visit cho patient hợp lệ | SUCCESS | 201 + visit.status=WAITING | High | ✅ API |
| TC-VISIT-UC07-SUCCESS-002 | Visit được gán queue number tăng dần | SUCCESS | queueNumber > 0 | High | ✅ API |
| TC-VISIT-UC07-SUCCESS-003 | Receptionist tạo được visit | SUCCESS | 201 | High | ✅ API |
| TC-VISIT-UC07-CONFLICT-001 | Patient đã có visit trong ngày | CONFLICT | 409 DUPLICATE_VISIT | High | ✅ API |
| TC-VISIT-UC07-CONFLICT-002 | Quota ngày đã đầy | CONFLICT | 409 DAILY_QUOTA_EXCEEDED | High | ✅ API |
| TC-VISIT-UC07-NOTFOUND-001 | patientId không tồn tại | NOTFOUND | 404 | High | ⬜ |
| TC-VISIT-UC07-VALIDATION-001 | Thiếu patientId | VALIDATION | 400 | High | ⬜ |
| TC-VISIT-UC07-VALIDATION-002 | Date format sai | VALIDATION | 400 | Medium | ⬜ |
| TC-VISIT-UC07-PERMISSION-001 | Doctor cố tạo visit | PERMISSION | 403 | High | ✅ API |
| TC-VISIT-UC07-PERMISSION-002 | Cashier cố tạo visit | PERMISSION | 403 | High | ✅ API |
| TC-VISIT-UC07-DB-001 | Visit lưu đúng patientId, date, status | DB | record khớp | High | ✅ API |
| TC-VISIT-UC07-TRANSACTION-001 | Queue number không bị trùng khi tạo đồng thời | TRANSACTION | unique queueNumbers | High | ⬜ |
| TC-VISIT-UC08-SUCCESS-001 | Lấy danh sách visit theo ngày | SUCCESS | 200 + array | High | ✅ API |
| TC-VISIT-UC08-SUCCESS-002 | Filter theo status WAITING | SUCCESS | chỉ trả WAITING | Medium | ⬜ |
| TC-VISIT-UC08-SUCCESS-003 | Filter theo status IN_EXAMINATION | SUCCESS | chỉ trả IN_EXAMINATION | Medium | ⬜ |

---

### UC09 + UC10 + UC11 — Mở & Lập phiếu khám & Lịch sử

**File hiện có:** `backend/test/clinic-flow.e2e-spec.ts`

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-EXAM-UC09-SUCCESS-001 | Doctor mở examination từ visit WAITING | SUCCESS | 201 + exam, visit→IN_EXAMINATION | High | ✅ API |
| TC-EXAM-UC09-STATE-001 | Mở examination khi visit đã IN_EXAMINATION | STATE | 409/400 | High | ✅ API |
| TC-EXAM-UC09-STATE-002 | Mở examination khi visit DONE | STATE | chặn | High | ⬜ |
| TC-EXAM-UC09-NOTFOUND-001 | visitId không tồn tại | NOTFOUND | 404 | High | ⬜ |
| TC-EXAM-UC09-PERMISSION-001 | Receptionist cố mở examination | PERMISSION | 403 | High | ✅ API |
| TC-EXAM-UC10-SUCCESS-001 | Doctor nhập diagnosis | SUCCESS | 200 + diagnosis saved | High | ✅ API |
| TC-EXAM-UC10-SUCCESS-002 | Doctor thêm nhiều disease | SUCCESS | multiple diagnoses | Medium | ⬜ |
| TC-EXAM-UC10-STATE-001 | Nhập diagnosis khi exam COMPLETED | STATE | chặn | High | ⬜ |
| TC-EXAM-UC10-NOTFOUND-001 | diseaseId không tồn tại | NOTFOUND | 404 | High | ⬜ |
| TC-EXAM-UC11-SUCCESS-001 | Xem lịch sử khám của patient | SUCCESS | 200 + visits array | High | ✅ API |
| TC-EXAM-UC11-SUCCESS-002 | Lịch sử có đủ visit, exam, prescription | SUCCESS | nested objects | Medium | ⬜ |

---

### UC12 + UC13 — Kê đơn & Hoàn tất phiếu khám

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-PRESC-UC12-SUCCESS-001 | Tạo prescription với items hợp lệ | SUCCESS | 201 + prescription | High | ✅ API |
| TC-PRESC-UC12-SUCCESS-002 | PrescriptionItem có snapshot giá | SUCCESS | unitPrice snapshot | High | ✅ API |
| TC-PRESC-UC12-VALIDATION-001 | quantity <= 0 | VALIDATION | 400 | High | ⬜ |
| TC-PRESC-UC12-VALIDATION-002 | Thiếu dosage / instruction | VALIDATION | 400 | Medium | ⬜ |
| TC-PRESC-UC12-NOTFOUND-001 | drugId không tồn tại | NOTFOUND | 404 | High | ⬜ |
| TC-PRESC-UC12-STATE-001 | Kê đơn khi examination COMPLETED | STATE | chặn | High | ✅ API |
| TC-PRESC-UC12-PERMISSION-001 | Cashier cố kê đơn | PERMISSION | 403 | High | ✅ API |
| TC-PRESC-UC12-DB-001 | PrescriptionItem liên kết đúng examination | DB | examinationId khớp | High | ⬜ |
| TC-EXAM-UC13-SUCCESS-001 | Hoàn tất examination khi đủ điều kiện | SUCCESS | exam.status=COMPLETED, visit.status=DONE | High | ✅ API |
| TC-EXAM-UC13-STATE-001 | Hoàn tất khi chưa có diagnosis | STATE | 400/409 nếu bắt buộc | High | ⬜ |
| TC-EXAM-UC13-STATE-002 | Hoàn tất khi đã COMPLETED | STATE | chặn | High | ⬜ |
| TC-EXAM-UC13-DB-001 | Visit chuyển DONE sau complete | DB | visit.status=DONE | High | ✅ API |

---

### UC14 + UC15 + UC16 — Hóa đơn & Thanh toán

**File hiện có:** `backend/test/billing-catalog-flow.e2e-spec.ts`

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-BILL-UC14-SUCCESS-001 | Tạo invoice từ completed examination | SUCCESS | 201 + invoice | High | ✅ API |
| TC-BILL-UC14-SUCCESS-002 | Invoice tổng tiền tính đúng (consultation + services + drugs) | SUCCESS | totalAmount chính xác | High | ✅ API |
| TC-BILL-UC14-STATE-001 | Tạo invoice khi visit chưa DONE | STATE | 409 | High | ✅ API |
| TC-BILL-UC14-CONFLICT-001 | Tạo invoice lần 2 cho visit đã có invoice | CONFLICT | 409 INVOICE_EXISTS | High | ✅ API |
| TC-BILL-UC14-PERMISSION-001 | Doctor cố tạo invoice | PERMISSION | 403 | High | ✅ API |
| TC-BILL-UC15-SUCCESS-001 | Thanh toán đủ tiền | SUCCESS | invoice.status=PAID | High | ✅ API |
| TC-BILL-UC15-SUCCESS-002 | Thanh toán nhiều lần đến đủ (nếu có PARTIAL) | SUCCESS | PARTIAL → PAID | Medium | ⬜ |
| TC-BILL-UC15-VALIDATION-001 | amount <= 0 | VALIDATION | 400 | High | ⬜ |
| TC-BILL-UC15-VALIDATION-002 | amount > remainingAmount | VALIDATION | 400 OVERPAYMENT | High | ✅ API |
| TC-BILL-UC15-STATE-001 | Thanh toán invoice đã PAID | STATE | 409 | High | ✅ API |
| TC-BILL-UC15-STATE-002 | Thanh toán invoice CANCELED | STATE | 409 | High | ⬜ |
| TC-BILL-UC15-PERMISSION-001 | Doctor cố ghi nhận payment | PERMISSION | 403 | High | ✅ API |
| TC-BILL-UC15-DB-001 | Payment record lưu đúng amount, method | DB | record khớp | High | ⬜ |
| TC-BILL-UC15-TRANSACTION-001 | Lỗi giữa chừng khi ghi payment — rollback | TRANSACTION | không ghi dở | High | ⬜ |
| TC-BILL-UC16-SUCCESS-001 | Tìm kiếm invoice theo patient | SUCCESS | 200 + array | High | ✅ API |
| TC-BILL-UC16-SUCCESS-002 | Xem chi tiết invoice theo ID | SUCCESS | 200 + full invoice | High | ✅ API |
| TC-BILL-UC16-NOTFOUND-001 | invoiceId không tồn tại | NOTFOUND | 404 | Medium | ⬜ |

---

### UC17 — Thay đổi quy định

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-REG-UC17-SUCCESS-001 | Xem quy định hiện hành | SUCCESS | 200 + active regulation | High | ✅ API |
| TC-REG-UC17-SUCCESS-002 | Tạo phiên bản quy định mới | SUCCESS | 201 + regulation | High | ✅ API |
| TC-REG-UC17-SUCCESS-003 | Kích hoạt quy định mới | SUCCESS | status=ACTIVE, cũ deactivated | High | ✅ API |
| TC-REG-UC17-STATE-001 | Kích hoạt quy định đã active | STATE | 409 | Medium | ⬜ |
| TC-REG-UC17-PERMISSION-001 | Doctor cố thay đổi quy định | PERMISSION | 403 | High | ✅ API |
| TC-REG-UC17-DB-001 | Chỉ 1 regulation active tại cùng thời điểm | DB | count(active) = 1 | High | ⬜ |
| TC-REG-UC17-TRANSACTION-001 | Activate mới + deactivate cũ là atomic | TRANSACTION | không có trạng thái dở | High | ⬜ |

---

### UC18 + UC19 — Danh mục bệnh & Thuốc

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-DIS-UC18-SUCCESS-001 | Xem danh sách bệnh | SUCCESS | 200 + array | High | ✅ API |
| TC-DIS-UC18-SUCCESS-002 | Tạo bệnh mới | SUCCESS | 201 + disease | High | ✅ API |
| TC-DIS-UC18-SUCCESS-003 | Cập nhật thông tin bệnh | SUCCESS | 200 + updated | High | ✅ API |
| TC-DIS-UC18-VALIDATION-001 | Trùng disease code | VALIDATION | 409 | High | ⬜ |
| TC-DIS-UC18-PERMISSION-001 | Receptionist cố tạo bệnh | PERMISSION | 403 | High | ✅ API |
| TC-DRUG-UC19-SUCCESS-001 | Xem danh sách thuốc | SUCCESS | 200 + array | High | ✅ API |
| TC-DRUG-UC19-SUCCESS-002 | Tạo thuốc mới | SUCCESS | 201 + drug | High | ✅ API |
| TC-DRUG-UC19-SUCCESS-003 | Cập nhật giá thuốc | SUCCESS | 200 + updated | High | ✅ API |
| TC-DRUG-UC19-VALIDATION-001 | pricePerUnit <= 0 | VALIDATION | 400 | High | ⬜ |
| TC-DRUG-UC19-PERMISSION-001 | Doctor cố tạo thuốc | PERMISSION | 403 | High | ✅ API |

---

### UC20 — Báo cáo tháng

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-RPT-UC20-SUCCESS-001 | Xem báo cáo tháng hợp lệ | SUCCESS | 200 + report object | High | ✅ API |
| TC-RPT-UC20-SUCCESS-002 | Báo cáo tính đúng revenue | SUCCESS | revenue = sum(PAID invoices) | High | ✅ API |
| TC-RPT-UC20-SUCCESS-003 | Báo cáo tháng không có data | SUCCESS | 200 + zeros | Medium | ⬜ |
| TC-RPT-UC20-VALIDATION-001 | month < 1 hoặc > 12 | VALIDATION | 400 | Medium | ⬜ |
| TC-RPT-UC20-VALIDATION-002 | year < 2000 | VALIDATION | 400 | Low | ⬜ |
| TC-RPT-UC20-PERMISSION-001 | Doctor cố xem báo cáo | PERMISSION | 403 | High | ✅ API |
| TC-RPT-UC20-PERMISSION-002 | Manager xem được báo cáo | PERMISSION | 200 | High | ✅ API |

---

## 4. Phase 2 — Chi tiết test case

---

### P2-APT — Appointment (Đặt lịch hẹn)

**State machine:** `SCHEDULED → CONFIRMED → CHECKED_IN → CANCELED / NO_SHOW`

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-APT-P2-SUCCESS-001 | Receptionist tạo lịch hẹn hợp lệ | SUCCESS | 201 + status=SCHEDULED | High | ⬜ |
| TC-APT-P2-SUCCESS-002 | Confirm appointment | SUCCESS | SCHEDULED → CONFIRMED | High | ⬜ |
| TC-APT-P2-SUCCESS-003 | Check-in appointment → tạo Visit + QueueTicket | SUCCESS | Visit+QueueTicket created | High | ⬜ |
| TC-APT-P2-SUCCESS-004 | Hủy appointment | SUCCESS | status=CANCELED | High | ⬜ |
| TC-APT-P2-CONFLICT-001 | Trùng slot của bác sĩ cùng giờ | CONFLICT | 409 | High | ⬜ |
| TC-APT-P2-CONFLICT-002 | Cùng bệnh nhân trùng giờ | CONFLICT | 409 | High | ⬜ |
| TC-APT-P2-STATE-001 | Check-in appointment đã CANCELED | STATE | chặn | High | ⬜ |
| TC-APT-P2-STATE-002 | Check-in lần 2 appointment đã CHECKED_IN | STATE | chặn | High | ⬜ |
| TC-APT-P2-STATE-003 | Appointment quá hạn chưa check-in → NO_SHOW | STATE | auto-update hoặc báo lỗi | Medium | ⬜ |
| TC-APT-P2-VALIDATION-001 | scheduledAt là thời gian quá khứ | VALIDATION | 400 | High | ⬜ |
| TC-APT-P2-PERMISSION-001 | Doctor cố tạo appointment | PERMISSION | 403 | High | ⬜ |
| TC-APT-P2-DB-001 | Check-in tạo Visit liên kết đúng appointmentId | DB | visit.appointmentId khớp | High | ⬜ |
| TC-APT-P2-TRANSACTION-001 | Check-in fail giữa chừng — không tạo Visit hoặc QueueTicket dở | TRANSACTION | rollback | High | ⬜ |

---

### P2-QUE — Queue (Hàng đợi khám)

**State machine:** `WAITING → CALLED → IN_SERVICE → DONE`  
**Transition bị chặn:** `WAITING→DONE`, `CALLED→DONE`, `DONE→*`, `CANCELED→*`

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-QUE-P2-SUCCESS-001 | Gọi số tiếp theo: WAITING → CALLED | SUCCESS | status=CALLED, calledAt set | High | ⬜ |
| TC-QUE-P2-SUCCESS-002 | Bắt đầu phục vụ: CALLED → IN_SERVICE | SUCCESS | status=IN_SERVICE, startedAt set | High | ⬜ |
| TC-QUE-P2-SUCCESS-003 | Hoàn tất: IN_SERVICE → DONE | SUCCESS | status=DONE, doneAt set | High | ⬜ |
| TC-QUE-P2-SUCCESS-004 | Xem queue theo visit/department | SUCCESS | 200 + list | High | ⬜ |
| TC-QUE-P2-STATE-001 | WAITING → DONE (bỏ qua CALLED, IN_SERVICE) | STATE | 400 | High | ⬜ |
| TC-QUE-P2-STATE-002 | CALLED → DONE trực tiếp | STATE | 400 | High | ⬜ |
| TC-QUE-P2-STATE-003 | DONE → IN_SERVICE | STATE | chặn | High | ⬜ |
| TC-QUE-P2-STATE-004 | CANCELED → IN_SERVICE | STATE | chặn | High | ⬜ |
| TC-QUE-P2-CONFLICT-001 | Gọi số khi queue đang rỗng | CONFLICT | 400/404 hợp lý | Medium | ⬜ |
| TC-QUE-P2-CONFLICT-002 | Một visit có 2 active queue tickets | CONFLICT | chặn | High | ⬜ |
| TC-QUE-P2-DB-001 | Timestamps (calledAt, startedAt, doneAt) tự cập nhật | DB | timestamps khớp transition | High | ⬜ |

---

### P2-VIT — Vitals (Sinh hiệu)

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-VIT-P2-SUCCESS-001 | Nurse nhập sinh hiệu cho visit | SUCCESS | 201 + vitals record | High | ⬜ |
| TC-VIT-P2-SUCCESS-002 | Xem lại sinh hiệu đã nhập | SUCCESS | 200 + vitals | High | ⬜ |
| TC-VIT-P2-SUCCESS-003 | Cập nhật sinh hiệu | SUCCESS | 200 + updated | Medium | ⬜ |
| TC-VIT-P2-VALIDATION-001 | temperature âm | VALIDATION | 400 | Medium | ⬜ |
| TC-VIT-P2-VALIDATION-002 | bloodPressure format sai | VALIDATION | 400 | Medium | ⬜ |
| TC-VIT-P2-NOTFOUND-001 | visitId không tồn tại | NOTFOUND | 404 | High | ⬜ |
| TC-VIT-P2-PERMISSION-001 | Cashier cố nhập sinh hiệu | PERMISSION | 403 | High | ⬜ |

---

### P2-SVC — Service Order (Y lệnh dịch vụ)

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-SVC-P2-SUCCESS-001 | Doctor tạo service order xét nghiệm | SUCCESS | 201 + order.status=PENDING | High | ⬜ |
| TC-SVC-P2-SUCCESS-002 | Service order liên kết đúng examination | SUCCESS | examinationId khớp | High | ⬜ |
| TC-SVC-P2-NOTFOUND-001 | serviceId không tồn tại | NOTFOUND | 404 | High | ⬜ |
| TC-SVC-P2-PERMISSION-001 | Cashier cố tạo service order | PERMISSION | 403 | High | ⬜ |

---

### P2-LAB — Laboratory (Xét nghiệm)

**State machine:** `PENDING → COLLECTED → RESULTED → VERIFIED`

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-LAB-P2-SUCCESS-001 | Lab tech collect sample: PENDING → COLLECTED | SUCCESS | status=COLLECTED | High | ⬜ |
| TC-LAB-P2-SUCCESS-002 | Lab tech nhập kết quả: COLLECTED → RESULTED | SUCCESS | status=RESULTED | High | ⬜ |
| TC-LAB-P2-SUCCESS-003 | Doctor/Lab verify: RESULTED → VERIFIED | SUCCESS | status=VERIFIED | High | ⬜ |
| TC-LAB-P2-SUCCESS-004 | Doctor xem kết quả xét nghiệm | SUCCESS | 200 + results | High | ⬜ |
| TC-LAB-P2-STATE-001 | PENDING → VERIFIED (bỏ qua các bước) | STATE | chặn | High | ⬜ |
| TC-LAB-P2-STATE-002 | Sửa result sau VERIFIED | STATE | chặn nếu immutable | High | ⬜ |
| TC-LAB-P2-CONFLICT-001 | Complete examination khi required lab chưa VERIFIED | CONFLICT | 409 | High | ⬜ |
| TC-LAB-P2-SUCCESS-005 | Complete examination khi tất cả lab đã VERIFIED | SUCCESS | exam có thể complete | High | ⬜ |
| TC-LAB-P2-PERMISSION-001 | Cashier cố nhập kết quả xét nghiệm | PERMISSION | 403 | High | ⬜ |
| TC-LAB-P2-PERMISSION-002 | Lab tech verify kết quả (nếu role cho phép) | PERMISSION | 200 hoặc 403 | High | ⬜ |
| TC-LAB-P2-DB-001 | Result lưu đúng values và referenceRange | DB | record khớp | High | ⬜ |

---

### P2-INV — Inventory (Kho thuốc)

**FEFO rule:** Xuất lô gần hết hạn trước (First Expired, First Out)

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-INV-P2-SUCCESS-001 | Admin nhập lô thuốc mới | SUCCESS | 201 + StockLot | High | ⬜ |
| TC-INV-P2-SUCCESS-002 | Xem tồn kho hiện tại | SUCCESS | 200 + stock levels | High | ⬜ |
| TC-INV-P2-SUCCESS-003 | Báo cáo thuốc sắp hết hạn | SUCCESS | 200 + expiring list | High | ⬜ |
| TC-INV-P2-SUCCESS-004 | Báo cáo tồn kho thấp | SUCCESS | 200 + low stock list | High | ⬜ |
| TC-INV-P2-VALIDATION-001 | Nhập lô có expiryDate quá khứ | VALIDATION | 400 | High | ⬜ |
| TC-INV-P2-VALIDATION-002 | quantity <= 0 | VALIDATION | 400 | High | ⬜ |
| TC-INV-P2-PERMISSION-001 | Doctor cố nhập kho | PERMISSION | 403 | High | ⬜ |
| TC-INV-P2-DB-001 | StockLot lưu đúng batchNumber, expiryDate | DB | record khớp | High | ⬜ |

---

### P2-PHA — Pharmacy / Dispense (Cấp phát thuốc)

**FEFO rule phải được áp dụng**

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-PHA-P2-SUCCESS-001 | Pharmacist dispense prescription hợp lệ | SUCCESS | 201 + dispense record | High | ⬜ |
| TC-PHA-P2-SUCCESS-002 | FEFO: lô gần hết hạn được xuất trước | SUCCESS | stockLot.expiryDate sớm nhất | High | ⬜ |
| TC-PHA-P2-SUCCESS-003 | Tồn kho giảm đúng sau dispense | SUCCESS | currentStock giảm đúng qty | High | ⬜ |
| TC-PHA-P2-CONFLICT-001 | Không đủ tồn kho | CONFLICT | 409 INSUFFICIENT_STOCK | High | ⬜ |
| TC-PHA-P2-CONFLICT-002 | Lô thuốc đã hết hạn | CONFLICT | 409 EXPIRED_STOCK | High | ⬜ |
| TC-PHA-P2-STATE-001 | Dispense prescription đã cancelled | STATE | chặn | High | ⬜ |
| TC-PHA-P2-TRANSACTION-001 | Dispense fail giữa chừng — tồn kho không bị trừ | TRANSACTION | rollback | High | ⬜ |
| TC-PHA-P2-TRANSACTION-002 | Hoàn thuốc / hủy cấp phát — tồn kho cộng lại đúng | TRANSACTION | stock += returned qty | High | ⬜ |
| TC-PHA-P2-PERMISSION-001 | Doctor cố dispense | PERMISSION | 403 | High | ⬜ |
| TC-PHA-P2-DB-001 | DispenseRecord có đủ lotId, qty, dispensedAt | DB | record đầy đủ | High | ⬜ |

---

### P2-ORG — Organization (Khoa/Phòng/Bác sĩ)

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-ORG-P2-SUCCESS-001 | Admin tạo department | SUCCESS | 201 + department | High | ⬜ |
| TC-ORG-P2-SUCCESS-002 | Admin xem danh sách doctors | SUCCESS | 200 + array | High | ⬜ |
| TC-ORG-P2-SUCCESS-003 | Admin cập nhật DoctorProfile | SUCCESS | 200 + updated | High | ⬜ |
| TC-ORG-P2-PERMISSION-001 | Doctor cố tạo department | PERMISSION | 403 | High | ⬜ |

---

### P2-AUD — Audit Log

| TC-ID | Mô tả | Type | Expected | Priority | Auto |
|---|---|---|---|---|---|
| TC-AUD-P2-SUCCESS-001 | Admin xem audit log | SUCCESS | 200 + array | High | ⬜ |
| TC-AUD-P2-SUCCESS-002 | Filter audit log theo userId | SUCCESS | filtered array | Medium | ⬜ |
| TC-AUD-P2-SUCCESS-003 | Filter audit log theo action | SUCCESS | filtered array | Medium | ⬜ |
| TC-AUD-P2-PERMISSION-001 | Doctor cố xem audit log | PERMISSION | 403 | High | ⬜ |

---

## 5. Cross-module / Integration tests

### Luồng khám bệnh đầy đủ (Phase 1)

```text
TC-INT-CLINIC-FLOW-001
Receptionist tạo Patient → tạo Visit
  → Doctor mở Examination → nhập Diagnosis → kê Prescription
  → Cashier tạo Invoice → ghi nhận Payment
  → Manager xem Monthly Report

Verify tại mỗi bước:
- Status transitions đúng
- DB records liên kết đúng (visitId, examinationId, invoiceId)
- Role boundaries được giữ
- Report cuối tháng tính đúng revenue
```

**File hiện có:** `backend/test/clinic-flow.e2e-spec.ts` + `billing-catalog-flow.e2e-spec.ts`

### Luồng khám bệnh đầy đủ (Phase 2)

```text
TC-INT-CLINIC-FLOW-002
Receptionist tạo Appointment → xác nhận
  → Bệnh nhân đến: Check-in → tạo Visit + QueueTicket
  → Nurse nhập Vitals
  → Doctor mở Queue: WAITING→CALLED→IN_SERVICE
  → Doctor mở Examination → tạo Service Order (xét nghiệm)
  → Lab tech: PENDING→COLLECTED→RESULTED→VERIFIED
  → Doctor xem kết quả → Complete Examination
  → Pharmacist Dispense Prescription (FEFO, kiểm tồn kho)
  → Cashier tạo Invoice (consultation + services + drugs) → Payment

Verify:
- Appointment liên kết Visit liên kết Examination liên kết Lab
- Tồn kho giảm đúng sau dispense
- Invoice tổng tiền = consultation + services + drug items
- Queue timestamp đúng thứ tự
```

### Regression test khi sửa module

| Khi sửa module | Phải chạy lại |
|---|---|
| Auth | Tất cả PERMISSION tests |
| Visit | Visit + Examination + Queue + Appointment |
| Examination | Examination + Prescription + Lab + Invoice |
| Invoice | Invoice + Payment + Report |
| Inventory | Inventory + Pharmacy/Dispense |
| Regulation | Report (nếu dùng regulation cho fee calculation) |

---

## 6. Seed data yêu cầu

Seed data phải cố định, không random. File: `backend/prisma/seed.ts`

### Users (1 user mỗi role)

| Username | Role | Mục đích |
|---|---|---|
| admin | ADMIN | Test quản trị, RBAC, catalog |
| doctor | DOCTOR | Test examination, prescription |
| receptionist | RECEPTIONIST | Test patient, visit, appointment |
| cashier | CASHIER | Test invoice, payment |
| manager | MANAGER | Test report |
| nurse | NURSE | Test vitals, queue |
| labtech | LAB_TECHNICIAN | Test lab workflow |
| pharmacist | PHARMACIST | Test dispense, inventory |

### Patients (4 nhóm)

| Patient | Mục đích |
|---|---|
| Bệnh nhân sạch (không có visit) | Test tạo visit mới |
| Bệnh nhân đã có visit hôm nay | Test duplicate visit conflict |
| Bệnh nhân có lịch sử dài | Test medical history |
| Bệnh nhân có appointment chưa check-in | Test appointment flow |

### Drugs / StockLots (3 nhóm)

| Nhóm | Mục đích |
|---|---|
| Thuốc còn tồn, còn hạn | Test dispense thành công |
| Thuốc hết tồn | Test INSUFFICIENT_STOCK |
| Thuốc hết hạn / sắp hết hạn | Test EXPIRED_STOCK + expiry report |

### Services

| Service | Mục đích |
|---|---|
| Khám thường | Tính phí consultation |
| Xét nghiệm máu | Test lab flow |
| Xét nghiệm nước tiểu | Test lab flow multi-item |

### Regulations (1 version active)

| Key | Value | Mục đích |
|---|---|---|
| MAX_PATIENTS_PER_DAY | 40 | Test quota |
| CONSULTATION_FEE | 150000 | Tính invoice |

---

## 7. Bug report format

```
Bug ID:       BUG-[MODULE]-[SEQ]
TC-ID:        TC-... (nếu phát sinh từ test case cụ thể)
Module:       [tên module]
Severity:     Critical / High / Medium / Low
Priority:     High / Medium / Low
Environment:  Local / Staging / Production
Role:         [role đang test]

Pre-condition:
  - [trạng thái hệ thống trước khi test]

Steps:
  1. ...
  2. ...

Expected:
  - [hành vi đúng]

Actual:
  - [hành vi thực tế sai]

Evidence:
  - Screenshot / API response / DB record

Suggested Fix:
  - [gợi ý nếu có]

Status:       Open / In Progress / Fixed / Closed
Fixed in:     [commit hash hoặc PR]
Regression:   Thêm vào TC-... để tránh tái phát
```

---

## 8. Checklist trước demo / báo cáo

### Trước mỗi sprint demo

| Nhóm | Câu hỏi |
|---|---|
| Use Case | Mỗi UC đã có đủ main / alternate / exception case chưa? |
| Role | Mỗi API/màn hình đã test đúng role chưa? |
| Validation | Đã test input thiếu / sai / biên chưa? |
| State machine | Đã test chuyển trạng thái sai chưa? |
| Transaction | Các thao tác nhiều bảng có rollback khi lỗi chưa? |
| DB | Đã kiểm tra dữ liệu thật trong DB chưa? |
| UI | Các flow chính đã test E2E / manual chưa? |
| Regression | Sửa module mới có làm hỏng module cũ không? |

### Trước báo cáo cuối kỳ

| Nhóm | Câu hỏi |
|---|---|
| Coverage | Test matrix đã điền đầy đủ ✅/⬜ chưa? |
| TC-ID | Mỗi test case có ID theo format chuẩn chưa? |
| Evidence | Có screenshot / API log / DB record chưa? |
| Bug log | Có danh sách bugs đã fix + regression test chưa? |
| Seed data | Seed chạy được và ổn định không? |
| E2E | Ít nhất 5 luồng critical có E2E hoặc manual script chưa? |
| Report | Có `docs/qa/test-report-final.md` chưa? |

---

*Cập nhật: 2026-06-08 | Version: 1.0 | Tác giả: 4N Team*
