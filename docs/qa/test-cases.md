# Test Cases

## 1. Mục tiêu

Tài liệu này định nghĩa các test case mức nghiệp vụ cho ver1. Đây là nền để:

- manual test;
- regression test;
- chuẩn bị integration test và demo.

---

## 2. Nguyên tắc test

- test theo flow nghiệp vụ;
- ưu tiên test use case critical trước;
- với mỗi flow phải có case success và case fail;
- mọi bug critical phải thêm lại vào regression checklist.

---

## 3. Auth

### TC-AUTH-01 — Login thành công

**Tiền điều kiện:** user active tồn tại  
**Bước:** nhập username/password đúng  
**Kỳ vọng:** nhận access token / profile hợp lệ

### TC-AUTH-02 — Login thất bại do sai mật khẩu

**Kỳ vọng:** trả lỗi `INVALID_CREDENTIALS`

### TC-AUTH-03 — Login thất bại do user inactive

**Kỳ vọng:** trả lỗi `USER_INACTIVE`

---

## 4. Patient

### TC-PAT-01 — Tạo bệnh nhân mới thành công

**Bước:** nhập đủ thông tin bắt buộc  
**Kỳ vọng:** tạo patient thành công

### TC-PAT-02 — Cảnh báo trùng bệnh nhân

**Bước:** tạo patient với dữ liệu gần trùng patient đã có  
**Kỳ vọng:** hệ thống cảnh báo hoặc chặn theo rule

### TC-PAT-03 — Tra cứu bệnh nhân theo tên/số điện thoại

**Kỳ vọng:** trả đúng danh sách matching

---

## 5. Visit Intake

### TC-VIS-01 — Tạo lượt khám thành công

**Tiền điều kiện:** patient hợp lệ, chưa có active visit trong ngày  
**Kỳ vọng:** visit được tạo, có queue number

### TC-VIS-02 — Chặn tạo visit trùng trong ngày

**Kỳ vọng:** lỗi `VISIT_ALREADY_EXISTS` hoặc lỗi tương đương

### TC-VIS-03 — Chặn vượt số bệnh nhân tối đa/ngày

**Tiền điều kiện:** quota ngày đã đầy  
**Kỳ vọng:** lỗi `DAILY_LIMIT_EXCEEDED`

### TC-VIS-04 — Danh sách khám theo ngày hiển thị đúng

**Kỳ vọng:** đúng số lượng, đúng trạng thái, đúng queue

---

## 6. Examination

### TC-EXAM-01 — Bác sĩ mở khám thành công

**Tiền điều kiện:** visit hợp lệ, doctor có quyền  
**Kỳ vọng:** examination được tạo, visit đổi trạng thái phù hợp

### TC-EXAM-02 — Người không có quyền mở khám bị chặn

**Kỳ vọng:** `FORBIDDEN`

### TC-EXAM-03 — Hoàn tất phiếu khám với dữ liệu đầy đủ

**Kỳ vọng:** examination status = `COMPLETED`

### TC-EXAM-04 — Chặn hoàn tất phiếu khám khi thiếu dữ liệu tối thiểu

**Kỳ vọng:** `EXAM_INCOMPLETE_DATA`

---

## 7. Prescription

### TC-RX-01 — Tạo toa thuốc với thuốc active

**Kỳ vọng:** thêm prescription item thành công

### TC-RX-02 — Chặn thêm thuốc inactive

**Kỳ vọng:** `DRUG_INACTIVE`

### TC-RX-03 — Chặn số lượng thuốc không hợp lệ

**Kỳ vọng:** validation fail hoặc business error tương ứng

### TC-RX-04 — Chặn duplicate drug trong cùng toa theo rule hiện hành

**Kỳ vọng:** merge hoặc chặn nhất quán

---

## 8. Billing & Payment

### TC-BILL-01 — Tạo invoice cho visit completed

**Kỳ vọng:** invoice được tạo, snapshot item đúng

### TC-BILL-02 — Chặn tạo invoice khi visit chưa đủ điều kiện

**Kỳ vọng:** lỗi trạng thái phù hợp

### TC-BILL-03 — Ghi nhận payment một phần thành công

**Kỳ vọng:** invoice status = `PARTIALLY_PAID`

### TC-BILL-04 — Ghi nhận payment đủ số tiền còn lại

**Kỳ vọng:** invoice status = `PAID`

### TC-BILL-05 — Chặn overpayment

**Kỳ vọng:** `PAYMENT_EXCEEDS_BALANCE`

---

## 9. Regulation

### TC-REG-01 — Xem quy định hiện hành

**Kỳ vọng:** trả đúng bộ quy định active

### TC-REG-02 — Kích hoạt version quy định mới

**Kỳ vọng:** version mới active, version cũ archived hoặc inactive theo thiết kế

### TC-REG-03 — Dữ liệu cũ không bị hồi tố

**Kỳ vọng:** invoice cũ không đổi tiền sau khi đổi regulation

---

## 10. Reports

### TC-REP-01 — Báo cáo tháng trả tổng quan thành công

**Kỳ vọng:** có tổng lượt khám, tổng doanh thu, breakdown cơ bản

### TC-REP-02 — Doanh thu tháng bám payment date

**Kỳ vọng:** số liệu đúng theo payment trong tháng

### TC-REP-03 — Cơ cấu bệnh dùng primary diagnosis

**Kỳ vọng:** không đếm trùng diagnosis phụ vào breakdown chính

---

## 11. Regression checklist tối thiểu trước demo

1. login
2. create patient
3. search patient
4. create visit
5. open examination
6. update examination
7. add prescription items
8. complete examination
9. create invoice
10. record payment
11. view monthly report
