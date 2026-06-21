# Database constraint tests

Kiểm thử hộp trắng ở tầng database — xác nhận PostgreSQL thực thi đúng các ràng buộc
toàn vẹn dữ liệu (UNIQUE, FOREIGN KEY, CHECK, NOT NULL), độc lập với business logic ở service layer.

## Vì sao cần

Service layer kiểm tra business rule, nhưng nếu một bug bỏ qua kiểm tra (hoặc có ghi dữ liệu
trực tiếp), database vẫn phải là **lưới an toàn cuối cùng**. Test này chứng minh lưới đó hoạt động.

## Phạm vi test (`constraints_test.sql`)

| Test | Ràng buộc | UC liên quan |
|---|---|---|
| DB-UNIQUE-username | `users.username UNIQUE` | UC2 |
| DB-UNIQUE-citizen_id | `patients.citizen_id UNIQUE` | UC5 (chống bệnh nhân trùng) |
| DB-UNIQUE-visit_queue | `visits (visit_date, queue_number) UNIQUE` | UC7 (số thứ tự hàng đợi) |
| DB-UNIQUE-invoice_visit | `invoices.visit_id UNIQUE` | UC14 (1 visit ≤ 1 hóa đơn) |
| DB-FK-visit_patient | `visits.patient_id → patients(id)` | UC7 |
| DB-CHECK-invoice_total_nonneg | `CHECK (total_amount >= 0)` | UC14 |
| DB-NOTNULL-patient_name | `patients.full_name NOT NULL` | UC5 |
| DB-POSITIVE-valid_insert | positive control (insert hợp lệ phải thành công) | — |

## Cách chạy

```bash
# 1. Tạo database test riêng (KHÔNG dùng DB thật)
createdb clinic_test

# 2. Nạp schema
psql -d clinic_test -f database/schema.sql

# 3. Chạy bộ test ràng buộc
psql -d clinic_test -v ON_ERROR_STOP=1 -f database/tests/constraints_test.sql

# 4. Dọn dẹp
dropdb clinic_test
```

Script tự `ROLLBACK` nên không để lại dữ liệu. Nếu có test fail, lệnh kết thúc với
exit code khác 0 — phù hợp để gắn vào CI.

## Kết quả mong đợi

```
================ DB CONSTRAINT TEST RESULTS ================
 status |            name              | detail
--------+------------------------------+-----------------------------
 PASS   | DB-CHECK-invoice_total_nonneg| ...
 PASS   | DB-FK-visit_patient          | ...
 ...
 passed | failed | total
--------+--------+-------
   8    |   0    |   8
```
