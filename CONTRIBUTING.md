# CONTRIBUTING

## 1. Mục tiêu

File này quy định cách cộng tác trong repo `4N_Clinic_Management_System` để:

- giảm conflict;
- chia việc song song được;
- review chéo dễ;
- giữ tài liệu, DB, API và code luôn đồng bộ.

---

## 2. Branch strategy

### 2.1 Branch cố định

- `main`: bản ổn định để demo
- `develop`: nhánh tích hợp chính hằng ngày

### 2.2 Branch làm việc

- `feature/...`: chức năng mới
- `fix/...`: sửa lỗi
- `docs/...`: cập nhật tài liệu
- `chore/...`: cấu hình, setup, tooling
- `db/...`: schema, migration, seed, report SQL
- `test/...`: test case, test automation
- `refactor/...`: cải tổ code nhưng không đổi hành vi

### 2.3 Mẫu tên branch

```text
<type>/<module>-<short-description>
```

Ví dụ:

- `feature/auth-login`
- `feature/patients-create-api`
- `feature/visits-create-api`
- `db/init-prisma-schema`
- `docs/business-rules-v1`

---

## 3. Commit conventions

Dùng kiểu **Conventional Commits**.

### Mẫu

```text
feat(module): short description
fix(module): short description
docs(scope): short description
chore(scope): short description
refactor(scope): short description
test(scope): short description
```

### Ví dụ

- `feat(auth): add login endpoint`
- `feat(visits): add create visit flow`
- `fix(billing): prevent overpayment`
- `docs(business): update invoice rules`

---

## 4. Quy trình làm 1 task

1. Checkout `develop`
2. Pull mới nhất từ remote
3. Tạo branch mới theo task
4. Code + test local
5. Update docs nếu task làm thay đổi behavior
6. Push branch
7. Mở Pull Request vào `develop`
8. Chờ review chéo
9. Sửa góp ý nếu có
10. Merge khi đạt Definition of Done

---

## 5. Pull Request rules

Mọi PR phải có:

- mục tiêu rõ;
- thay đổi chính;
- phạm vi ảnh hưởng;
- reviewer;
- kết quả test;
- docs update nếu có thay đổi rule/API/schema.

### Không merge nếu:

- chưa đọc review;
- chưa test local;
- migration chưa chạy được;
- API đổi nhưng Swagger chưa cập nhật;
- behavior đổi nhưng docs chưa cập nhật.

---

## 6. Review chéo

### Nguyên tắc

- Không tự approve PR của chính mình
- Reviewer phải đọc cả code và docs liên quan
- Nếu task có DB hoặc API, reviewer phải kiểm tra kỹ ảnh hưởng chéo

### Reviewer cần kiểm tra

- module boundary có sạch không;
- controller có mỏng không;
- business logic có nằm trong service không;
- validation đặt đúng chỗ chưa;
- error message / error code có rõ không;
- test có bao phủ use case chính chưa.

---

## 7. Quy tắc với DB schema và migration

- Mọi thay đổi schema phải đi kèm cập nhật `database/docs/`
- Không để nhiều người sửa Prisma schema cùng lúc quá lâu
- Mỗi migration phải có tên rõ nghĩa
- Mỗi migration chỉ nên phục vụ 1 mục tiêu chính
- Mọi migration phải chạy được trên local trước khi mở PR

### Ví dụ tên migration

- `init_auth_tables`
- `add_patient_and_visit_tables`
- `add_invoice_and_payment_tables`

---

## 8. Quy tắc với API

- API phải bám `docs/api/api-scope.md`
- Route naming phải nhất quán
- DTO phải rõ input
- Response nên giữ format thống nhất
- Business error cần có `code` dễ debug

---

## 9. Quy tắc với tài liệu

Tài liệu `.md` là phần bắt buộc của dự án, không phải phần phụ.

Khi đổi:

- business rule,
- role matrix,
- schema,
- API,
- sprint plan,

thì phải update tài liệu tương ứng.

---

## 10. Quy tắc với test

Tối thiểu trước khi merge:

- task có chạy local;
- không làm vỡ flow cũ;
- nếu là use case quan trọng thì phải có test tối thiểu hoặc manual test evidence.

Các flow ưu tiên test lại khi gần demo:

1. login
2. create patient
3. create visit
4. open/complete examination
5. create invoice
6. record payment

---

## 11. Những điều không được làm

- Không push thẳng vào `main`
- Không đổi schema vì “thấy tiện” mà không bàn
- Không sửa rule nghiệp vụ trong code nhưng quên update docs
- Không tự ý thêm thư viện lớn nếu chưa được thống nhất
- Không làm task quá to rồi mới push cuối tuần
- Không để branch sống quá lâu gây conflict lớn

---

## 12. Definition of Ready

Task chỉ được kéo vào sprint khi:

- có mô tả rõ;
- có output rõ;
- có người phụ trách;
- có reviewer;
- biết phụ thuộc gì;
- biết tiêu chí Done.

---

## 13. Definition of Done

Task chỉ được xem là Done khi:

- code chạy local;
- pass lint/test tối thiểu;
- migration chạy được nếu có DB change;
- docs liên quan đã cập nhật;
- PR được review;
- test chéo hoặc manual smoke test đã thực hiện.
