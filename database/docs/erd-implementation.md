# ERD Implementation

## 1. Mục tiêu

Tài liệu này mô tả mô hình logic DB ở mức đủ để bắt đầu triển khai ver1.

---

## 2. Nhóm bảng nền tảng

### `users`
- lưu tài khoản người dùng
- thông tin chính: username, password_hash, full_name, status, email, phone

### `roles`
- danh sách role

### `permissions`
- danh sách permission code

### `user_roles`
- quan hệ n-n giữa user và role

### `role_permissions`
- quan hệ n-n giữa role và permission

### `refresh_tokens`
- quản lý refresh token nếu dùng cơ chế refresh

### `audit_logs`
- nhật ký audit thao tác nhạy cảm

---

## 3. Nhóm bảng bệnh nhân và khám

### `patients`
- hồ sơ bệnh nhân

### `visits`
- lượt khám / lượt tiếp nhận

### `daily_visit_counters`
- bộ đếm số thứ tự theo ngày

### `examinations`
- phiếu khám / hồ sơ khám cho từng visit

### `diseases`
- danh mục bệnh

### `examination_diagnoses`
- chẩn đoán chính/phụ của examination

---

## 4. Nhóm bảng toa thuốc

### `drugs`
- danh mục thuốc

### `prescriptions`
- toa thuốc gắn với examination

### `prescription_items`
- các dòng thuốc của toa

---

## 5. Nhóm bảng tài chính

### `invoices`
- hóa đơn gắn với visit

### `invoice_items`
- các dòng tiền trong hóa đơn

### `payments`
- các lần thanh toán của hóa đơn

---

## 6. Nhóm bảng quy định

### `regulation_versions`
- version quy định

### `regulation_values`
- key/value của từng version

---

## 7. Quan hệ chính

| Quan hệ | Loại |
|---|---|
| users - roles | n-n |
| roles - permissions | n-n |
| patients - visits | 1-n |
| visits - examinations | 1-1 |
| examinations - diagnoses | 1-n |
| examinations - prescriptions | 1-1 |
| prescriptions - prescription_items | 1-n |
| visits - invoices | 1-1 |
| invoices - invoice_items | 1-n |
| invoices - payments | 1-n |
| regulation_versions - regulation_values | 1-n |

---

## 8. Constraint quan trọng

### Unique
- `users.username`
- `roles.code`
- `permissions.code`
- `diseases.code`
- `drugs.code`
- `visits(visit_date, queue_number)`
- `examinations.visit_id`
- `prescriptions.examination_id`
- `invoices.visit_id`
- `regulation_values(regulation_version_id, rule_key)`

### Check
- `payments.amount > 0`
- `invoice_items.amount >= 0`
- `drugs.unit_price >= 0`
- `daily_visit_counters.last_queue_number >= 0`
- `prescription_items.quantity > 0`

---

## 9. Soft delete

### Nên soft delete
- users
- patients
- diseases
- drugs

### Không soft delete kiểu xóa tùy tiện
- visits
- examinations
- prescriptions
- invoices
- payments
- audit_logs

Với nhóm này, nên dùng status hoặc preserve dữ liệu lịch sử.

---

## 10. Timestamp / audit fields

Tối thiểu các bảng chính nên có:

- `created_at`
- `updated_at`
- `created_by` nếu phù hợp
- `updated_by` nếu phù hợp
- `deleted_at` cho bảng soft delete

---

## 11. Index cơ bản

### `patients`
- index phone
- index citizen_id
- index `(full_name, date_of_birth)`

### `visits`
- index `(visit_date, status)`
- index `(assigned_doctor_id, status)`
- index `patient_id`

### `examinations`
- index `visit_id`
- index `doctor_id`

### `invoices`
- index `visit_id`
- index `(status, issued_at)`

### `payments`
- index `invoice_id`
- index `paid_at`

### `audit_logs`
- index `(entity_type, entity_id, created_at)`
- index `(actor_user_id, created_at)`

---

## 12. Các ràng buộc nên đặt ở DB

- PK/FK
- unique cơ bản
- check số âm/số dương
- enum/state valid
- 1 visit - 1 exam
- 1 exam - 1 prescription
- 1 visit - 1 invoice

---

## 13. Các ràng buộc nên đặt ở service layer

- chống trùng bệnh nhân mềm
- không vượt quota ngày
- chỉ bác sĩ hợp lệ mới mở khám
- không overpayment theo số dư động
- quy định mới không hồi tố dữ liệu cũ
- rule merge/chặn duplicate thuốc trong toa
