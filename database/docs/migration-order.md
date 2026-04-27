# Migration Order

## 1. Mục tiêu

File này chốt thứ tự migration để tránh lỗi phụ thuộc vòng và hạn chế conflict khi nhiều người sửa schema.

---

## 2. Nguyên tắc chung

- Migration đi từ bảng nền tảng đến bảng nghiệp vụ
- Không thêm quá nhiều thứ unrelated trong một migration
- Ưu tiên migration nhỏ, rõ nghĩa, dễ rollback suy luận
- Mỗi migration phải cập nhật docs liên quan nếu làm thay đổi thiết kế

---

## 3. Thứ tự migration đề xuất

### Nhóm M1 — Auth nền tảng
1. `users`
2. `roles`
3. `permissions`
4. `user_roles`
5. `role_permissions`
6. `refresh_tokens`

### Nhóm M2 — Audit và tiện ích nền
7. `audit_logs`

### Nhóm M3 — Hồ sơ bệnh nhân và danh mục cơ bản
8. `patients`
9. `diseases`
10. `drugs`

### Nhóm M4 — Regulation
11. `regulation_versions`
12. `regulation_values`

### Nhóm M5 — Visit flow
13. `daily_visit_counters`
14. `visits`

### Nhóm M6 — Examination
15. `examinations`
16. `examination_diagnoses`

### Nhóm M7 — Prescription
17. `prescriptions`
18. `prescription_items`

### Nhóm M8 — Billing
19. `invoices`
20. `invoice_items`
21. `payments`

---

## 4. Bảng nên tạo trước

- users / roles / permissions
- patients
- diseases / drugs
- regulation_versions / regulation_values
- visits / daily_visit_counters

---

## 5. Bảng có thể làm song song tương đối an toàn

- diseases
- drugs
- regulation_versions
- regulation_values
- audit_logs

Miễn là không có 2 người cùng sửa một file schema trong thời gian dài mà không sync.

---

## 6. Bảng cần cực kỳ cẩn thận vì phụ thuộc mạnh

- visits + daily_visit_counters
- examinations + visits
- prescriptions + prescription_items + drugs
- invoices + invoice_items + payments
- regulation_versions + nghiệp vụ snapshot

---

## 7. Tên migration gợi ý

- `init_auth_core`
- `add_patient_and_catalog`
- `add_regulation_tables`
- `add_visit_tables`
- `add_examination_tables`
- `add_prescription_tables`
- `add_billing_tables`

---

## 8. Quy tắc owner migration

Mỗi sprint nên có 1 người giữ vai trò **schema owner** để:

- gom thay đổi schema;
- resolve conflict Prisma schema;
- đảm bảo migration order không bị vỡ;
- review tất cả PR có đổi DB.
