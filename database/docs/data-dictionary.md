# Data Dictionary

## 1. Mục tiêu

Tài liệu này mô tả ngắn ý nghĩa dữ liệu cốt lõi để team hiểu cùng một cách.

---

## 2. Users

### `users`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `username` | tên đăng nhập duy nhất |
| `password_hash` | mật khẩu đã hash |
| `full_name` | tên hiển thị |
| `status` | active / inactive / locked |
| `created_at` | thời điểm tạo |
| `updated_at` | thời điểm cập nhật |

---

## 3. Patients

### `patients`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `full_name` | họ tên bệnh nhân |
| `date_of_birth` | ngày sinh |
| `gender` | giới tính |
| `phone` | số điện thoại |
| `address` | địa chỉ |
| `citizen_id` | CCCD/CMND nếu có |
| `created_at` | thời điểm tạo |
| `updated_at` | thời điểm cập nhật |

---

## 4. Visits

### `visits`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `patient_id` | tham chiếu bệnh nhân |
| `visit_date` | ngày đến khám |
| `queue_number` | số thứ tự theo ngày |
| `status` | registered / waiting / in_examination / completed / cancelled |
| `reason` | lý do đến khám |
| `assigned_doctor_id` | bác sĩ được gán nếu có |
| `created_by` | user tạo lượt khám |

---

## 5. Examinations

### `examinations`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `visit_id` | tham chiếu visit |
| `doctor_id` | bác sĩ khám |
| `status` | open / completed / cancelled |
| `symptoms` | triệu chứng |
| `clinical_notes` | ghi chú lâm sàng |
| `conclusion` | kết luận khám |
| `completed_at` | thời điểm hoàn tất |

---

## 6. Diseases

### `diseases`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `code` | mã bệnh duy nhất |
| `name` | tên bệnh |
| `is_active` | còn được dùng không |

---

## 7. Drugs

### `drugs`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `code` | mã thuốc duy nhất |
| `name` | tên thuốc |
| `unit` | đơn vị tính |
| `unit_price` | đơn giá hiện hành |
| `is_active` | còn được kê mới không |

---

## 8. Prescriptions

### `prescriptions`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `examination_id` | examination tương ứng |
| `doctor_id` | bác sĩ kê toa |
| `status` | draft/finalized nếu team áp dụng |

### `prescription_items`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `prescription_id` | toa tương ứng |
| `drug_id` | thuốc |
| `quantity` | số lượng |
| `dose` | liều dùng |
| `frequency` | tần suất |
| `duration` | số ngày dùng |
| `unit_price_snapshot` | snapshot giá thuốc nếu dùng ở bước này |

---

## 9. Invoices

### `invoices`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `visit_id` | visit tương ứng |
| `status` | draft/issued/partially_paid/paid/void |
| `total_amount` | tổng tiền hóa đơn |
| `issued_at` | thời điểm phát hành |
| `created_by` | user tạo hóa đơn |

### `invoice_items`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `invoice_id` | hóa đơn tương ứng |
| `item_type` | consultation/drug/other |
| `description` | mô tả dòng tiền |
| `amount` | số tiền dòng này |
| `reference_id` | tham chiếu nghiệp vụ nếu cần |

### `payments`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `invoice_id` | hóa đơn tương ứng |
| `amount` | số tiền thanh toán |
| `payment_method` | tiền mặt/chuyển khoản/... |
| `paid_at` | thời điểm thanh toán |
| `received_by` | user thu ngân |

---

## 10. Regulation

### `regulation_versions`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `version_code` | mã version |
| `status` | draft/active/archived |
| `effective_from` | ngày hiệu lực |
| `created_by` | người tạo |
| `activated_by` | người kích hoạt |

### `regulation_values`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `regulation_version_id` | version chứa rule |
| `rule_key` | mã quy định |
| `rule_value` | giá trị quy định |
| `description` | mô tả |

---

## 11. Audit Logs

### `audit_logs`

| Field | Ý nghĩa |
|---|---|
| `id` | khóa chính |
| `actor_user_id` | ai thao tác |
| `action` | hành động |
| `entity_type` | bảng / object bị tác động |
| `entity_id` | id của object |
| `payload_json` | dữ liệu chi tiết |
| `created_at` | thời điểm log |
