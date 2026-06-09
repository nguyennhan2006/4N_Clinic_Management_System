# 12 — Bằng chứng Kiểm thử và Kế hoạch Test

> Audit date: 2026-06-07 | Nguồn: `backend/test/`, `backend/src/**/*.spec.ts`

---

> **Ghi chú trung thực:** Codebase hiện có e2e tests cho các luồng lõi Phase 1. Phase 2 cần được bổ sung manual test evidence hoặc automated tests trong tương lai. Không được ghi "đã pass" nếu chưa chạy test thực tế.

---

## 1. Test Files hiện có (CONFIRMED)

| File | Loại | Phase | Nội dung | Status |
|---|---|---|---|---|
| `backend/test/auth.e2e-spec.ts` | E2E | P1 | Login với đúng/sai credentials; refresh token; logout revoke; GET /auth/me | CONFIRMED |
| `backend/test/clinic-flow.e2e-spec.ts` | E2E | P1 | Luồng UC07→UC13: tạo patient → tạo visit → open examination → diagnosis → prescription → complete | CONFIRMED |
| `backend/test/billing-catalog-flow.e2e-spec.ts` | E2E | P1 | Billing: create invoice, payment; Catalog: diseases CRUD, drugs CRUD | CONFIRMED |
| `backend/test/app.e2e-spec.ts` | E2E | — | Boilerplate health check (không test business logic) | PARTIAL |
| `backend/src/app.controller.spec.ts` | Unit | — | Boilerplate app controller unit test | PARTIAL |

**Tổng E2E files meaningful: 3** (app.e2e-spec.ts là boilerplate)  
**Unit test files: 1** (boilerplate)  
**MISSING: Unit tests cho service layer (visits.service, billing.service, pharmacy.service, etc.)**  
**MISSING: E2E tests cho Phase 2 modules**

---

## 2. Test Scripts

| Script | Lệnh | Ghi chú |
|---|---|---|
| Backend unit test | `cd backend && npm run test` | Chỉ có 1 spec file boilerplate |
| Backend e2e test | `cd backend && npm run test:e2e` | **Cần PostgreSQL thật** — DATABASE_URL phải cấu hình |
| Frontend build | `cd frontend && npm run build` | Kiểm tra TypeScript compile |
| Frontend lint | `cd frontend && npm run lint` | ESLint check |
| Backend build | `cd backend && npm run build` | Kiểm tra TypeScript compile |
| Backend lint | `cd backend && npm run lint` | ESLint check |

> Tất cả scripts cần chạy và paste kết quả: **NEED_MANUAL_CONFIRMATION**

---

## 3. Test Plan Phase 1 (E2E Coverage)

### Auth Module

| Test ID | Loại | Mục tiêu | Input | Expected | Evidence file |
|---|---|---|---|---|---|
| T-AUTH-01 | E2E | Login đúng credentials | email/password hợp lệ | 201, accessToken + refreshToken | `auth.e2e-spec.ts` |
| T-AUTH-02 | E2E | Login sai password | password sai | 401 Unauthorized | `auth.e2e-spec.ts` |
| T-AUTH-03 | E2E | Refresh token hợp lệ | valid refreshToken | 200, new accessToken | `auth.e2e-spec.ts` |
| T-AUTH-04 | E2E | Logout revoke | refreshToken | Token bị revoke sau logout | `auth.e2e-spec.ts` |
| T-AUTH-05 | Manual | GET /auth/me | valid Bearer | User info + roles | Cần chụp response |

### Patients Module

| Test ID | Loại | Mục tiêu | Expected | Evidence |
|---|---|---|---|---|
| T-PAT-01 | E2E | Tạo patient thành công | 201, patientCode generated | `clinic-flow.e2e-spec.ts` |
| T-PAT-02 | E2E | Tìm kiếm patient | List filtered | `clinic-flow.e2e-spec.ts` |
| T-PAT-03 | Manual | Trùng citizenId | 409 Conflict | Cần chụp |

### Visits Module

| Test ID | Loại | Mục tiêu | Expected | Evidence |
|---|---|---|---|---|
| T-VIS-01 | E2E | Tạo visit thành công | 201, queueNumber assigned | `clinic-flow.e2e-spec.ts` |
| T-VIS-02 | E2E | Tạo trùng visit cùng patient/date | 409 Conflict | `clinic-flow.e2e-spec.ts` |
| T-VIS-03 | E2E | Open examination | 201, Examination OPEN | `clinic-flow.e2e-spec.ts` |
| T-VIS-04 | Manual | Quota exceeded | 409 Conflict | Cần chụp |
| T-VIS-05 | Manual | Open với doctor INACTIVE | 400 BadRequest | Cần chụp |

### Examinations Module

| Test ID | Loại | Mục tiêu | Expected | Evidence |
|---|---|---|---|---|
| T-EXAM-01 | E2E | Update examination (symptoms/notes) | 200, updated | `clinic-flow.e2e-spec.ts` |
| T-EXAM-02 | E2E | Create prescription | 201, PrescriptionItems | `clinic-flow.e2e-spec.ts` |
| T-EXAM-03 | E2E | Complete examination với diagnosis | 200, COMPLETED | `clinic-flow.e2e-spec.ts` |
| T-EXAM-04 | Manual | Complete không có diagnosis | 400 BadRequest | Cần chụp |
| T-EXAM-05 | Manual | Kê thuốc isActive=false | 400 BadRequest | Cần chụp |

### Billing Module

| Test ID | Loại | Mục tiêu | Expected | Evidence |
|---|---|---|---|---|
| T-BILL-01 | E2E | Tạo invoice từ COMPLETED visit | 201, invoice ISSUED | `billing-catalog-flow.e2e-spec.ts` |
| T-BILL-02 | E2E | Payment hợp lệ | 201, paidAmount updated | `billing-catalog-flow.e2e-spec.ts` |
| T-BILL-03 | Manual | Payment > remaining | 400 BadRequest | Cần chụp |
| T-BILL-04 | Manual | Payment invoice đã PAID | 400 BadRequest | Cần chụp |

### Catalog (Diseases/Drugs)

| Test ID | Loại | Mục tiêu | Evidence |
|---|---|---|---|
| T-CAT-01 | E2E | CRUD diseases | `billing-catalog-flow.e2e-spec.ts` |
| T-CAT-02 | E2E | CRUD drugs | `billing-catalog-flow.e2e-spec.ts` |

---

## 4. Test Plan Phase 2 (Manual)

| Test ID | Module | Mục tiêu | Steps | Expected |
|---|---|---|---|---|
| T-APT-01 | appointments | Tạo lịch hẹn mới | Chọn patient, doctor, giờ → Submit | Appointment SCHEDULED |
| T-APT-02 | appointments | Check-in lịch hẹn | Checkin button → Confirm | Visit tạo, Appointment CHECKED_IN |
| T-QUE-01 | queue | Xem hàng đợi | GET /queue với date | QueueTickets listed |
| T-QUE-02 | queue | Chuyển trạng thái | WAITING → CALLED → IN_SERVICE → DONE | State transitions correct |
| T-VTL-01 | vitals | Ghi sinh hiệu | Nhập weight/height → Submit | BMI tự tính |
| T-LAB-01 | lab | Tạo lab order | Doctor chỉ định | LabOrder ORDERED |
| T-LAB-02 | lab | Lấy mẫu | Nurse confirm | SAMPLE_COLLECTED |
| T-LAB-03 | lab | Nhập kết quả | Lab tech nhập | RESULT_ENTERED |
| T-LAB-04 | lab | Verify kết quả | Doctor verify | VERIFIED |
| T-INV-01 | inventory | Nhập lô thuốc | lotNumber, expiryDate, quantity | StockLot created |
| T-PHM-01 | pharmacy | Cấp phát FEFO | Prescription → chọn lô | DISPENSED, stock giảm |
| T-PHM-02 | pharmacy | Cấp phát hết hạn | Lô expired | 400 BadRequest |
| T-PHM-03 | pharmacy | Cấp phát không đủ tồn | quantity > available | 400 BadRequest |
| T-ORG-01 | organization | Tạo department | name, code | Department created |
| T-AUD-01 | audit | Xem audit log | GET /audit-logs | List AuditLog entries |

---

## 5. Manual UI Test Checklist

```
□ Đăng nhập thành công với 5 roles chính (ADMIN, DOCTOR, RECEPTIONIST, CASHIER, MANAGER)
□ Sidebar hiển thị đúng theo role (RECEPTIONIST ≠ DOCTOR ≠ ADMIN)
□ Redirect /403 khi truy cập route không có quyền
□ Form validation hiển thị lỗi rõ ràng (required, format, business conflict)
□ Loading state hiển thị khi fetch data
□ Empty state hiển thị khi không có data
□ Error state hiển thị khi API error
□ Success toast hiển thị sau action thành công
□ VND format đúng cho tất cả field tiền tệ
□ Date format đúng (dd/MM/yyyy)
□ Dark mode toggle hoạt động, persist qua localStorage
□ Confirm dialog hiển thị trước action nguy hiểm
□ Logout xóa token, redirect /login
□ /403 redirect khi không có role
□ Không hiển thị passwordHash ở bất kỳ màn hình nào
```

---

## 6. Template Bảng kết quả Test

| Test ID | Loại | Module | Mục tiêu | Kết quả | Pass/Fail | Ghi chú | Người test | Ngày test |
|---|---|---|---|---|---|---|---|---|
| T-AUTH-01 | E2E | auth | Login thành công | ___ | ___ | — | ___ | ___ |
| T-AUTH-02 | E2E | auth | Login sai | ___ | ___ | — | ___ | ___ |
| T-PAT-01 | E2E | patients | Tạo patient | ___ | ___ | — | ___ | ___ |
| T-VIS-01 | E2E | visits | Tạo visit | ___ | ___ | — | ___ | ___ |
| T-EXAM-03 | E2E | examinations | Complete | ___ | ___ | — | ___ | ___ |
| T-BILL-01 | E2E | billing | Tạo invoice | ___ | ___ | — | ___ | ___ |
| T-BILL-02 | E2E | billing | Payment | ___ | ___ | — | ___ | ___ |
| ___ | Manual | ___ | ___ | ___ | ___ | ___ | ___ | ___ |

> **Nhóm điền vào bảng này sau khi chạy test thực tế và chụp screenshots.**

---

## 7. Nhận xét trung thực

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| E2E tests Phase 1 | PARTIAL — 3 files covering core flows | Chưa chạy và xác nhận kết quả |
| Unit tests service layer | MISSING | Không có `*.service.spec.ts` |
| E2E tests Phase 2 | MISSING | Không có automated test cho P2 |
| Frontend tests | MISSING | Không có Vitest test files |
| CI/CD auto test | MISSING | Không có .github/workflows/ |
| Manual test results | MISSING | Cần nhóm chạy và ghi kết quả |
