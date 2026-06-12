# 12 — Bằng chứng Kiểm thử và Kế hoạch Test

---

## 1. Bằng chứng Test hiện có

### E2E Test files

| File | Phase | Nội dung | Bằng chứng |
|---|---|---|---|
| `backend/test/auth.e2e-spec.ts` | P1 | Login flow với 5 roles (admin, doctor, receptionist, cashier, manager). Test đăng nhập đúng/sai. | CONFIRMED |
| `backend/test/clinic-flow.e2e-spec.ts` | P1 | UC-07→UC-11: tạo patient → tạo visit → open examination → diagnosis → prescription → complete | CONFIRMED |
| `backend/test/billing-catalog-flow.e2e-spec.ts` | P1 | Billing flow: create invoice, payment; catalog flow: diseases, drugs | CONFIRMED |
| `backend/src/app.controller.spec.ts` | — | Unit test cơ bản app controller (boilerplate) | PARTIAL |

### Scripts build/lint

| Script | Lệnh | Trạng thái |
|---|---|---|
| Backend build | `cd backend && npm run build` | NEED_MANUAL_CONFIRMATION: chạy để xác nhận |
| Backend lint | `cd backend && npm run lint` | NEED_MANUAL_CONFIRMATION |
| Backend test e2e | `cd backend && npm run test:e2e` | NEED_MANUAL_CONFIRMATION: cần DB thật |
| Frontend build | `cd frontend && npm run build` | NEED_MANUAL_CONFIRMATION |
| Frontend lint | `cd frontend && npm run lint` | NEED_MANUAL_CONFIRMATION |
| Prisma validate | `cd backend && npx prisma validate` | NEED_MANUAL_CONFIRMATION |

> **Lưu ý**: E2E test cần database thật (`DATABASE_URL` trong `.env`). Test sẽ fail nếu chưa cấu hình DB.

---

## 2. Test Plan theo Module (Phase 1)

### Auth Module

| Test ID | Loại | Mục tiêu | Input | Expected | Evidence |
|---|---|---|---|---|---|
| T-AUTH-01 | E2E | Login thành công | email/password đúng | 201, accessToken, refreshToken | `auth.e2e-spec.ts` |
| T-AUTH-02 | E2E | Login sai password | password sai | 401 | `auth.e2e-spec.ts` |
| T-AUTH-03 | E2E | Refresh token hợp lệ | valid refreshToken | 200, new accessToken | `auth.e2e-spec.ts` |
| T-AUTH-04 | E2E | Logout revoke token | refreshToken | Token bị revoke | `auth.e2e-spec.ts` |
| T-AUTH-05 | Manual | GET /auth/me | valid Bearer token | Trả user + roles | Cần chụp response |

### Patients Module

| Test ID | Loại | Mục tiêu | Input | Expected | Evidence |
|---|---|---|---|---|---|
| T-PAT-01 | E2E | Tạo patient thành công | đủ field | 201, patientCode | `clinic-flow.e2e-spec.ts` |
| T-PAT-02 | E2E | Tìm kiếm patient | search query | Danh sách filtered | `clinic-flow.e2e-spec.ts` |
| T-PAT-03 | Manual | Tạo trùng citizenId | citizenId đã có | 409 | Cần chụp |

### Visits Module

| Test ID | Loại | Mục tiêu | Input | Expected | Evidence |
|---|---|---|---|---|---|
| T-VIS-01 | E2E | Tạo visit thành công | patientId, date | 201, queueNumber | `clinic-flow.e2e-spec.ts` |
| T-VIS-02 | E2E | Tạo trùng visit | cùng patientId+date | 409 | `clinic-flow.e2e-spec.ts` |
| T-VIS-03 | E2E | Open examination | visitId, doctorId | 201, examination OPEN | `clinic-flow.e2e-spec.ts` |
| T-VIS-04 | Manual | Quota exceeded | Tạo visit khi đã đủ quota | 409 | Cần chụp |

### Examinations Module

| Test ID | Loại | Mục tiêu | Input | Expected | Evidence |
|---|---|---|---|---|---|
| T-EXAM-01 | E2E | Update examination | symptoms, notes | 200, updated | `clinic-flow.e2e-spec.ts` |
| T-EXAM-02 | E2E | Create prescription | items với drugId | 201, prescription | `clinic-flow.e2e-spec.ts` |
| T-EXAM-03 | E2E | Complete examination | với diagnosis | 200, status COMPLETED | `clinic-flow.e2e-spec.ts` |
| T-EXAM-04 | Manual | Kê thuốc inactive | drugId bị ngừng | 400 | Cần chụp |
| T-EXAM-05 | Manual | Complete không có diagnosis | — | 400 | Cần chụp |

### Billing Module

| Test ID | Loại | Mục tiêu | Input | Expected | Evidence |
|---|---|---|---|---|---|
| T-BILL-01 | E2E | Tạo invoice | visitId COMPLETED | 201, invoice ISSUED | `billing-catalog-flow.e2e-spec.ts` |
| T-BILL-02 | E2E | Payment thành công | amount ≤ remaining | 201, paidAmount updated | `billing-catalog-flow.e2e-spec.ts` |
| T-BILL-03 | Manual | Payment quá số tiền | amount > remaining | 400 | Cần chụp |
| T-BILL-04 | Manual | Pay invoice đã PAID | invoice PAID | 400 | Cần chụp |

---

## 3. Test Plan Phase 2 (Manual)

| Test ID | Module | Mục tiêu | Steps | Expected |
|---|---|---|---|---|
| T-APT-01 | appointments | Đặt lịch hẹn mới | Chọn patient, doctor, giờ → Submit | Appointment SCHEDULED |
| T-APT-02 | appointments | Check-in lịch hẹn | Checkin button → Confirm | Visit tạo mới, appointment CHECKED_IN |
| T-VTL-01 | vitals | Ghi sinh hiệu | Nhập weight/height → Submit | BMI tự tính |
| T-LAB-01 | lab | Tạo lab order | Doctor chỉ định → Order created | LabOrder ORDERED |
| T-LAB-02 | lab | Lấy mẫu | Nurse confirm → SAMPLE_COLLECTED | — |
| T-LAB-03 | lab | Nhập kết quả XN | Lab technician nhập JSON result | RESULT_ENTERED |
| T-LAB-04 | lab | Xác nhận kết quả | Doctor verify | VERIFIED |
| T-INV-01 | inventory | Nhập lô thuốc | Nhập lotNumber, expiryDate, quantity | StockLot created |
| T-PHM-01 | pharmacy | Cấp phát theo đơn | Chọn lô FEFO → Confirm | Stock giảm, Dispense DISPENSED |
| T-PHM-02 | pharmacy | Cấp phát không đủ tồn kho | quantity > available | Error message |

---

## 4. Manual UI Test Checklist

```
□ Login thành công với 5 roles khác nhau
□ Sidebar hiển thị đúng theo role (RECEPTIONIST ≠ DOCTOR ≠ ADMIN)
□ Redirect /403 khi truy cập route không có quyền
□ Form validation hiển thị lỗi rõ ràng
□ Loading state hiển thị khi fetch data
□ Empty state hiển thị khi không có data
□ Error state hiển thị khi API lỗi
□ Success toast hiển thị sau action thành công
□ VND format đúng cho tất cả field tiền tệ
□ Date format đúng (DD/MM/YYYY)
□ Dark mode toggle hoạt động
□ Responsive trên màn hình 1280px
□ Không hiển thị passwordHash
□ Pagination hoạt động (nếu có)
□ Search/filter hoạt động real-time
□ Confirm dialog hiển thị trước action nguy hiểm
□ Logout xóa token và redirect login
```

---

## 5. Template Bảng kết quả Test (cho Chương 5 báo cáo)

| Test ID | Loại | Module | Mục tiêu | Kết quả | Pass/Fail | Ghi chú | Người test | Ngày test |
|---|---|---|---|---|---|---|---|---|
| T-AUTH-01 | E2E | auth | Login thành công | accessToken nhận được | Pass | — | — | — |
| T-AUTH-02 | E2E | auth | Login sai | 401 Unauthorized | Pass | — | — | — |
| T-PAT-01 | E2E | patients | Tạo patient | 201, patientCode | Pass | — | — | — |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

> Nhóm điền vào bảng này sau khi chạy test thực tế

---

## 6. Nhận xét thực trạng testing

**PARTIAL**: Codebase có 3 e2e test files covering Phase 1 core flows (auth, clinic, billing).  
**MISSING**: Không có unit test coverage đầy đủ cho service layer.  
**MISSING**: Không có e2e test cho Phase 2 modules.  
**MISSING**: Không có CI/CD pipeline tự động chạy test.

**Khuyến nghị viết báo cáo**: Trình bày trung thực — "Nhóm thực hiện kiểm thử E2E cho Phase 1 và kiểm thử thủ công cho Phase 2. E2E test được tích hợp vào repository và có thể chạy lại bất kỳ lúc nào."
