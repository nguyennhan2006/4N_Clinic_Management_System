# Test Cases — 4N Clinic Management System

## Quy ước

| Ký hiệu | Ý nghĩa |
|---|---|
| TC-UCxx-yy | Test case cho Use Case xx, số thứ tự yy |
| ✅ Pass | Expected: HTTP 2xx, logic đúng |
| ❌ Fail | Expected: HTTP 4xx/5xx, nghiệp vụ bị chặn |
| `[ROLE]` | Role thực hiện request |
| `{id}` | UUID hợp lệ có trong DB |

**Base URL:** `http://localhost:3000`  
**Auth header:** `Authorization: Bearer <accessToken>`

---

## UC01 — Đăng nhập

**Endpoint:** `POST /auth/login`  
**Public** (không cần token)

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-01-01 | Đăng nhập thành công | `{ username: "admin", password: "Admin@123" }` | ✅ 201 — trả về `accessToken`, `refreshToken`, `user.role` |
| TC-01-02 | Sai mật khẩu | `{ username: "admin", password: "wrong" }` | ❌ 401 — "Invalid credentials" |
| TC-01-03 | Username không tồn tại | `{ username: "ghost", password: "abc" }` | ❌ 401 — "Invalid credentials" |
| TC-01-04 | Tài khoản bị khóa (LOCKED) | Tài khoản status=LOCKED | ❌ 401 — "Account is locked" |
| TC-01-05 | Thiếu field username | `{ password: "Admin@123" }` | ❌ 400 — validation error |
| TC-01-06 | Thiếu field password | `{ username: "admin" }` | ❌ 400 — validation error |
| TC-01-07 | Body rỗng | `{}` | ❌ 400 — validation error |

---

**Endpoint:** `POST /auth/refresh`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-01-08 | Làm mới token thành công | `{ refreshToken: "<validToken>" }` | ✅ 200 — trả về `accessToken` mới |
| TC-01-09 | Refresh token hết hạn / bị revoke | Token đã expired | ❌ 401 |
| TC-01-10 | Refresh token không hợp lệ | `{ refreshToken: "garbage" }` | ❌ 401 |

---

**Endpoint:** `GET /auth/me` — `[ALL_ROLES]`

| TC | Mô tả | Expected |
|---|---|---|
| TC-01-11 | Lấy thông tin user hiện tại | ✅ 200 — trả về `id`, `fullName`, `email`, `roles`. Không có `passwordHash` |
| TC-01-12 | Không có token | ❌ 401 |

---

**Endpoint:** `POST /auth/logout` — `[ALL_ROLES]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-01-13 | Đăng xuất thành công | `{ refreshToken: "<validToken>" }` | ✅ 201 — token bị revoke |
| TC-01-14 | Gọi lại refresh sau khi logout | Token đã revoke | ❌ 401 |

---

## UC02 — Quản lý tài khoản

**Endpoint:** `GET /users` — `[ADMIN]`

| TC | Mô tả | Query | Expected |
|---|---|---|---|
| TC-02-01 | Lấy danh sách người dùng | — | ✅ 200 — array users, không có `passwordHash` |
| TC-02-02 | Tìm kiếm theo keyword | `?keyword=nguyen` | ✅ 200 — lọc đúng |
| TC-02-03 | RECEPTIONIST gọi endpoint ADMIN | — | ❌ 403 |
| TC-02-04 | Không có token | — | ❌ 401 |

---

**Endpoint:** `GET /users/:id` — `[ADMIN]`

| TC | Mô tả | Expected |
|---|---|---|
| TC-02-05 | Lấy chi tiết user hợp lệ | ✅ 200 — trả về đầy đủ thông tin, không có `passwordHash` |
| TC-02-06 | ID không tồn tại | ❌ 404 |

---

**Endpoint:** `POST /users` — `[ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-02-07 | Tạo user thành công | `{ username, password, fullName, email }` | ✅ 201 — user mới, status=ACTIVE |
| TC-02-08 | Username đã tồn tại | Trùng username | ❌ 409 — conflict |
| TC-02-09 | Thiếu fullName | `{ username, password }` | ❌ 400 |
| TC-02-10 | Password quá ngắn (nếu có validation) | `password: "abc"` | ❌ 400 |

---

**Endpoint:** `PATCH /users/:id` — `[ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-02-11 | Cập nhật fullName | `{ fullName: "Nguyễn A" }` | ✅ 200 — đã cập nhật |
| TC-02-12 | Cập nhật email | `{ email: "new@clinic.vn" }` | ✅ 200 |
| TC-02-13 | ID không tồn tại | — | ❌ 404 |

---

**Endpoint:** `PATCH /users/:id/lock` — `[ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-02-14 | Khóa tài khoản | `{ lock: true }` | ✅ 200 — status=LOCKED |
| TC-02-15 | Mở khóa tài khoản | `{ lock: false }` | ✅ 200 — status=ACTIVE |
| TC-02-16 | Admin tự khóa chính mình | actorId = userId | ❌ 400 — không được tự khóa |

---

## UC03 — Phân quyền

**Endpoint:** `PATCH /users/:id/roles` — `[ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-03-01 | Gán role DOCTOR cho user | `{ roleIds: ["<doctorRoleId>"] }` | ✅ 200 — user.roles cập nhật |
| TC-03-02 | Gán nhiều roles | `{ roleIds: ["<doctorId>", "<managerId>"] }` | ✅ 200 |
| TC-03-03 | Gán role không tồn tại | `{ roleIds: ["<invalidId>"] }` | ❌ 404 |
| TC-03-04 | roleIds rỗng (xóa toàn bộ role) | `{ roleIds: [] }` | ✅ 200 — user không còn role nào |
| TC-03-05 | RECEPTIONIST gọi endpoint này | — | ❌ 403 |

---

## UC04 — Tra cứu bệnh nhân

**Endpoint:** `GET /patients` — `[RECEPTIONIST, DOCTOR, MANAGER, ADMIN]`

| TC | Mô tả | Query | Expected |
|---|---|---|---|
| TC-04-01 | Lấy toàn bộ danh sách | — | ✅ 200 — array patients |
| TC-04-02 | Tìm theo tên | `?keyword=Nguyen` | ✅ 200 — kết quả có fullName chứa "Nguyen" |
| TC-04-03 | Tìm theo số điện thoại | `?keyword=0901234567` | ✅ 200 |
| TC-04-04 | Keyword không khớp | `?keyword=zzzzzzzzz` | ✅ 200 — array rỗng |
| TC-04-05 | CASHIER gọi endpoint | — | ❌ 403 |

---

**Endpoint:** `GET /patients/:id` — `[RECEPTIONIST, DOCTOR, MANAGER, ADMIN]`

| TC | Mô tả | Expected |
|---|---|---|
| TC-04-06 | Lấy chi tiết bệnh nhân hợp lệ | ✅ 200 — đầy đủ thông tin |
| TC-04-07 | ID không tồn tại | ❌ 404 |

---

## UC05 — Tạo hồ sơ bệnh nhân

**Endpoint:** `POST /patients` — `[RECEPTIONIST, ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-05-01 | Tạo bệnh nhân thành công | `{ fullName, dob, gender, phone }` | ✅ 201 — trả về patient với `patientCode` tự sinh |
| TC-05-02 | Thiếu fullName | `{ phone: "0901234567" }` | ❌ 400 |
| TC-05-03 | citizenId trùng | citizenId đã có trong DB | ❌ 409 |
| TC-05-04 | dob định dạng sai | `{ dob: "32/13/2000" }` | ❌ 400 |
| TC-05-05 | DOCTOR tạo bệnh nhân | — | ❌ 403 |
| TC-05-06 | CASHIER tạo bệnh nhân | — | ❌ 403 |

---

## UC06 — Tiếp nhận bệnh nhân / UC07 — Tạo lượt khám

**Endpoint:** `POST /visits` — `[RECEPTIONIST, ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-07-01 | Tạo lượt khám thành công | `{ patientId, visitDate: "2026-06-13" }` | ✅ 201 — `queueNumber` tự tăng, `status=WAITING` |
| TC-07-02 | Bệnh nhân đã có lượt khám hôm nay | Trùng patientId + visitDate | ❌ 409 — "Patient already has a visit on this date" |
| TC-07-03 | Ngày khám đã đạt giới hạn (MAX_PATIENTS_PER_DAY) | Số visit trong ngày = max | ❌ 409 — "Daily patient limit reached" |
| TC-07-04 | patientId không tồn tại | `{ patientId: "<invalid>" }` | ❌ 404 — "Patient not found" |
| TC-07-05 | Thiếu visitDate | `{ patientId: "{id}" }` | ❌ 400 |
| TC-07-06 | DOCTOR tạo lượt khám | — | ❌ 403 |
| TC-07-07 | Queue number đúng thứ tự | Tạo lần lượt 3 visit trong ngày | ✅ queueNumber lần lượt là 1, 2, 3 |
| TC-07-08 | Visit bị CANCELLED không tính vào giới hạn ngày | Cancel 1 visit rồi tạo thêm | ✅ Tổng chưa CANCELLED < max → tạo thành công |

---

## UC08 — Xem danh sách khám

**Endpoint:** `GET /visits` — `[RECEPTIONIST, DOCTOR, MANAGER, ADMIN]`

| TC | Mô tả | Query | Expected |
|---|---|---|---|
| TC-08-01 | Lấy danh sách theo ngày | `?date=2026-06-13` | ✅ 200 — chỉ visits của ngày đó |
| TC-08-02 | Lọc theo status WAITING | `?status=WAITING` | ✅ 200 — chỉ visits WAITING |
| TC-08-03 | Lọc visit đã có hóa đơn | `?hasInvoice=true` | ✅ 200 |
| TC-08-04 | Lọc visit chưa có hóa đơn | `?hasInvoice=false` | ✅ 200 |
| TC-08-05 | Không có filter | — | ✅ 200 — tất cả visits, sắp xếp theo queueNumber ASC |
| TC-08-06 | CASHIER gọi endpoint | — | ❌ 403 |

---

## UC09 — Mở lượt khám

**Endpoint:** `POST /visits/:id/open-examination` — `[DOCTOR, ADMIN]`

| TC | Mô tả | Trạng thái visit | Expected |
|---|---|---|---|
| TC-09-01 | Mở khám thành công | status=WAITING | ✅ 201 — Examination tạo mới, visit → IN_EXAMINATION |
| TC-09-02 | Visit không tồn tại | — | ❌ 404 — "Visit not found" |
| TC-09-03 | Visit không ở trạng thái WAITING | status=IN_EXAMINATION | ❌ 400 — "visit status is IN_EXAMINATION, expected WAITING" |
| TC-09-04 | Visit đã có Examination rồi | examination != null | ❌ 409 — "Examination already exists" |
| TC-09-05 | Visit status=COMPLETED | status=COMPLETED | ❌ 400 |
| TC-09-06 | Doctor bị LOCKED/INACTIVE | doctor.status=INACTIVE | ❌ 400 — "Doctor account is inactive" |
| TC-09-07 | RECEPTIONIST mở khám | — | ❌ 403 |

---

## UC10 — Lập phiếu khám

**Endpoint:** `PATCH /examinations/:id` — `[DOCTOR, ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-10-01 | Cập nhật symptoms + clinicalNotes | `{ symptoms: "Sốt", clinicalNotes: "..." }` | ✅ 200 — dữ liệu cập nhật |
| TC-10-02 | Cập nhật chẩn đoán (diagnoses) | `{ diagnoses: [{ diseaseId, isPrimary: true }] }` | ✅ 200 — diagnoses được thay thế |
| TC-10-03 | Hai chẩn đoán cùng isPrimary=true | `{ diagnoses: [{isPrimary:true},{isPrimary:true}] }` | ❌ 400 — "At most one primary diagnosis" |
| TC-10-04 | diseaseId không tồn tại | `{ diagnoses: [{ diseaseId: "<invalid>" }] }` | ❌ 400 — "Some diseases are invalid or inactive" |
| TC-10-05 | Disease isActive=false | diseaseId của bệnh đã vô hiệu hóa | ❌ 400 — "Some diseases are invalid or inactive" |
| TC-10-06 | Examination đã COMPLETED | status=COMPLETED | ❌ 400 — "Cannot edit examination with status COMPLETED" |
| TC-10-07 | Examination đã CANCELLED | status=CANCELLED | ❌ 400 |
| TC-10-08 | Examination không tồn tại | — | ❌ 404 |
| TC-10-09 | RECEPTIONIST cập nhật khám | — | ❌ 403 |

---

## UC11 — Xem lịch sử khám

**Endpoint:** `GET /patients/:id/medical-history` — `[DOCTOR, MANAGER, ADMIN]`

| TC | Mô tả | Expected |
|---|---|---|
| TC-11-01 | Lấy lịch sử bệnh nhân có dữ liệu | ✅ 200 — danh sách visits với examinations, diagnoses, prescriptions |
| TC-11-02 | Bệnh nhân chưa có lượt khám nào | ✅ 200 — array rỗng |
| TC-11-03 | patientId không tồn tại | ❌ 404 |
| TC-11-04 | RECEPTIONIST gọi endpoint | ❌ 403 |
| TC-11-05 | CASHIER gọi endpoint | ❌ 403 |

---

## UC12 — Kê đơn thuốc

**Endpoint:** `PUT /examinations/:id/prescription` — `[DOCTOR, ADMIN]` (upsert / replace-all)

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-12-01 | Tạo đơn thuốc mới thành công | `{ items: [{ drugId, quantity: 2, dosage: "2 lần/ngày" }] }` | ✅ 200 — Prescription tạo mới, `unitPrice` snapshot từ Drug.price |
| TC-12-02 | Cập nhật đơn thuốc đã có | Gọi lại với items khác | ✅ 200 — Prescription cũ bị xóa, tạo lại |
| TC-12-03 | items rỗng | `{ items: [] }` | ❌ 400 — "Prescription must have at least one item" |
| TC-12-04 | drugId không tồn tại | `{ items: [{ drugId: "<invalid>", ... }] }` | ❌ 400 — "Some drugs are invalid or inactive" |
| TC-12-05 | Drug isActive=false | drugId của thuốc đã vô hiệu hóa | ❌ 400 — "Some drugs are invalid or inactive" |
| TC-12-06 | Examination đã COMPLETED | status=COMPLETED | ❌ 400 — "Cannot update prescription for completed examination" |
| TC-12-07 | lineTotal được tính đúng | quantity=3, Drug.price=50000 | ✅ `lineTotal = 150000`, `unitPrice = 50000` (snapshot) |
| TC-12-08 | RECEPTIONIST kê đơn | — | ❌ 403 |

---

**Endpoint:** `DELETE /examinations/:id/prescription` — `[DOCTOR, ADMIN]`

| TC | Mô tả | Expected |
|---|---|---|
| TC-12-09 | Xóa đơn thuốc thành công | ✅ 204 — Prescription bị xóa |
| TC-12-10 | Xóa khi không có đơn thuốc | ✅ 204 — idempotent |
| TC-12-11 | Examination đã COMPLETED | ❌ 400 |

---

## UC13 — Hoàn tất phiếu khám

**Endpoint:** `POST /examinations/:id/complete` — `[DOCTOR, ADMIN]`

| TC | Mô tả | Trạng thái | Expected |
|---|---|---|---|
| TC-13-01 | Hoàn tất khám thành công | Có symptoms, conclusion, primary diagnosis | ✅ 200 — status=COMPLETED, visit → COMPLETED, completedAt ghi lại |
| TC-13-02 | Thiếu symptoms | symptoms=null | ❌ 400 — "Symptoms and conclusion are required" |
| TC-13-03 | Thiếu conclusion | conclusion=null | ❌ 400 — "Symptoms and conclusion are required" |
| TC-13-04 | Không có chẩn đoán chính (isPrimary=true) | diagnoses rỗng hoặc không có isPrimary | ❌ 400 — "Primary diagnosis is required" |
| TC-13-05 | Còn required service order chưa COMPLETED | isRequired=true, status=ORDERED | ❌ 400 — "required service order(s) must be completed" |
| TC-13-06 | Examination đã COMPLETED rồi | status=COMPLETED | ✅ 200 — idempotent, trả về existing |
| TC-13-07 | Examination bị CANCELLED | status=CANCELLED | ❌ 400 — "Cannot complete a cancelled examination" |
| TC-13-08 | RECEPTIONIST hoàn tất khám | — | ❌ 403 |
| TC-13-09 | Visit status cập nhật sau khi hoàn tất | — | ✅ Visit.status = COMPLETED |

---

## UC14 — Lập hóa đơn

**Endpoint:** `POST /visits/:visitId/invoice` — `[CASHIER, ADMIN]`

| TC | Mô tả | Trạng thái visit | Expected |
|---|---|---|---|
| TC-14-01 | Lập hóa đơn thành công | status=COMPLETED, có Examination | ✅ 201 — Invoice với các InvoiceItems (phí khám + thuốc + dịch vụ), status=ISSUED |
| TC-14-02 | Invoice đã tồn tại | Gọi lại lần 2 | ✅ 200 — trả về invoice cũ (idempotent) |
| TC-14-03 | Visit chưa COMPLETED | status=IN_EXAMINATION | ❌ 400 — "Only COMPLETED visit can be converted to invoice" |
| TC-14-04 | Visit không có Examination | examination=null | ❌ 400 — "Visit has no examination" |
| TC-14-05 | Visit không tồn tại | — | ❌ 404 |
| TC-14-06 | CONSULTATION_FEE lấy từ regulation active | Regulation.key=CONSULTATION_FEE | ✅ InvoiceItem phí khám = giá trị trong regulation |
| TC-14-07 | Không có regulation active → dùng default 150000 | — | ✅ InvoiceItem phí khám = 150000 |
| TC-14-08 | Đơn thuốc được thêm vào invoice | Prescription có 2 items | ✅ 2 InvoiceItems loại DRUG với unitPrice snapshot |
| TC-14-09 | DOCTOR lập hóa đơn | — | ❌ 403 |

---

## UC15 — Ghi nhận thanh toán

**Endpoint:** `POST /invoices/:id/payments` — `[CASHIER, ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-15-01 | Thanh toán một lần đủ | `{ amount: <totalAmount>, method: "CASH" }` | ✅ 201 — Invoice.status = PAID |
| TC-15-02 | Thanh toán một phần | `{ amount: <50% total>, method: "TRANSFER" }` | ✅ 201 — Invoice.status = PARTIALLY_PAID |
| TC-15-03 | Thanh toán lần 2 hoàn tất | Lần 1 PARTIALLY_PAID + lần 2 = remaining | ✅ Invoice.status = PAID |
| TC-15-04 | Số tiền vượt remaining | `amount > remainingAmount` | ❌ 400 — "Payment amount exceeds remaining amount" |
| TC-15-05 | Số tiền = 0 | `{ amount: 0 }` | ❌ 400 — "Payment amount must be greater than 0" |
| TC-15-06 | Số tiền âm | `{ amount: -1000 }` | ❌ 400 |
| TC-15-07 | Invoice đã PAID | status=PAID | ❌ 400 — "Invoice is already paid" |
| TC-15-08 | Invoice bị VOID | status=VOID | ❌ 400 — "Cannot pay voided invoice" |
| TC-15-09 | Invoice không tồn tại | — | ❌ 404 |
| TC-15-10 | Method không hợp lệ | `{ method: "BITCOIN" }` | ❌ 400 |
| TC-15-11 | DOCTOR thanh toán | — | ❌ 403 |
| TC-15-12 | Thanh toán qua thẻ (CARD) | `{ method: "CARD" }` | ✅ 201 |

---

## UC16 — Tra cứu hóa đơn

**Endpoint:** `GET /invoices` — `[CASHIER, MANAGER, ADMIN]`

| TC | Mô tả | Query | Expected |
|---|---|---|---|
| TC-16-01 | Lấy toàn bộ danh sách | — | ✅ 200 — tối đa 50 bản ghi, sắp xếp mới nhất trước |
| TC-16-02 | Lọc theo status | `?status=PAID` | ✅ 200 — chỉ PAID |
| TC-16-03 | Lọc theo ngày | `?date=2026-06-13` | ✅ 200 — chỉ invoices ngày đó |
| TC-16-04 | Tìm theo tên bệnh nhân | `?keyword=Nguyen` | ✅ 200 |
| TC-16-05 | Tìm theo patientCode | `?keyword=BN00001` | ✅ 200 |
| TC-16-06 | Tìm theo số điện thoại | `?keyword=0901234567` | ✅ 200 |
| TC-16-07 | DOCTOR gọi endpoint | — | ❌ 403 |

---

**Endpoint:** `GET /invoices/:id` — `[CASHIER, MANAGER, ADMIN]`

| TC | Mô tả | Expected |
|---|---|---|
| TC-16-08 | Lấy chi tiết hóa đơn | ✅ 200 — đầy đủ invoice + items + payments + patient |
| TC-16-09 | ID không tồn tại | ❌ 404 |

---

**Endpoint:** `GET /invoices/:id/items` — `[CASHIER, MANAGER, ADMIN]`

| TC | Mô tả | Expected |
|---|---|---|
| TC-16-10 | Lấy danh sách line items | ✅ 200 — InvoiceItems có description, unitPrice, lineTotal |
| TC-16-11 | ID không tồn tại | ❌ 404 |

---

## UC17 — Thay đổi quy định

**Endpoint:** `GET /regulations/current` — `[ALL_ROLES]`

| TC | Mô tả | Expected |
|---|---|---|
| TC-17-01 | Lấy quy định đang active | ✅ 200 — RegulationVersion với items |
| TC-17-02 | Không có quy định nào active | ✅ 200 hoặc 404 tùy implementation |

---

**Endpoint:** `POST /regulations` — `[ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-17-03 | Tạo phiên bản quy định mới | `{ note, items: [{ key: "MAX_PATIENTS_PER_DAY", value: "30" }, { key: "CONSULTATION_FEE", value: "200000" }] }` | ✅ 201 — phiên bản mới, `isActive=false` |
| TC-17-04 | Thiếu items | `{ note: "..." }` | ❌ 400 |
| TC-17-05 | MANAGER tạo quy định | — | ❌ 403 |

---

**Endpoint:** `PATCH /regulations/:id/activate` — `[ADMIN]`

| TC | Mô tả | Expected |
|---|---|---|
| TC-17-06 | Kích hoạt phiên bản quy định | ✅ 200 — phiên bản được activate, phiên bản cũ deactivate |
| TC-17-07 | ID không tồn tại | ❌ 404 |
| TC-17-08 | Sau kích hoạt, MAX_PATIENTS_PER_DAY dùng giá trị mới | Tạo visit vượt giới hạn mới | ❌ 409 — giới hạn mới được áp dụng |
| TC-17-09 | Sau kích hoạt, CONSULTATION_FEE dùng giá trị mới | Tạo invoice | ✅ InvoiceItem.unitPrice = giá trị mới |

---

## UC18 — Quản lý danh mục bệnh

**Endpoint:** `GET /diseases` — `[ADMIN, MANAGER, DOCTOR, RECEPTIONIST]`

| TC | Mô tả | Query | Expected |
|---|---|---|---|
| TC-18-01 | Lấy tất cả bệnh | — | ✅ 200 — array diseases |
| TC-18-02 | Lọc chỉ bệnh active | `?activeOnly=true` | ✅ 200 — chỉ isActive=true |
| TC-18-03 | CASHIER gọi endpoint | — | ❌ 403 |

---

**Endpoint:** `POST /diseases` — `[ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-18-04 | Tạo bệnh mới | `{ code: "J06", name: "Viêm hô hấp trên" }` | ✅ 201 — isActive=true |
| TC-18-05 | Trùng code | Code đã tồn tại | ❌ 409 |
| TC-18-06 | Thiếu code | `{ name: "Viêm" }` | ❌ 400 |
| TC-18-07 | DOCTOR tạo bệnh | — | ❌ 403 |

---

**Endpoint:** `PATCH /diseases/:id` — `[ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-18-08 | Cập nhật tên bệnh | `{ name: "Tên mới" }` | ✅ 200 |
| TC-18-09 | Vô hiệu hóa bệnh | `{ isActive: false }` | ✅ 200 — isActive=false |
| TC-18-10 | Kích hoạt lại bệnh | `{ isActive: true }` | ✅ 200 |
| TC-18-11 | Bệnh inactive không thể dùng trong examination | Diagnose bằng diseaseId inactive | ❌ 400 — "Some diseases are invalid or inactive" |
| TC-18-12 | ID không tồn tại | — | ❌ 404 |

---

## UC19 — Quản lý danh mục thuốc

**Endpoint:** `GET /drugs` — `[ADMIN, MANAGER, DOCTOR]`

| TC | Mô tả | Query | Expected |
|---|---|---|---|
| TC-19-01 | Lấy tất cả thuốc | — | ✅ 200 — array drugs |
| TC-19-02 | Lọc chỉ thuốc active | `?activeOnly=true` | ✅ 200 — chỉ isActive=true |
| TC-19-03 | CASHIER gọi endpoint | — | ❌ 403 |
| TC-19-04 | RECEPTIONIST gọi endpoint | — | ❌ 403 |

---

**Endpoint:** `POST /drugs` — `[ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-19-05 | Tạo thuốc mới | `{ name: "Paracetamol 500mg", unit: "viên", price: 2000 }` | ✅ 201 — isActive=true |
| TC-19-06 | Trùng name | Name đã tồn tại | ❌ 409 |
| TC-19-07 | Thiếu unit | `{ name: "Thuốc A", price: 1000 }` | ❌ 400 |
| TC-19-08 | price âm hoặc bằng 0 | `{ price: 0 }` | ❌ 400 |
| TC-19-09 | DOCTOR tạo thuốc | — | ❌ 403 |

---

**Endpoint:** `PATCH /drugs/:id` — `[ADMIN]`

| TC | Mô tả | Input | Expected |
|---|---|---|---|
| TC-19-10 | Cập nhật giá thuốc | `{ price: 3000 }` | ✅ 200 |
| TC-19-11 | Vô hiệu hóa thuốc | `{ isActive: false }` | ✅ 200 — isActive=false |
| TC-19-12 | Thuốc inactive không kê được | Prescription với drugId inactive | ❌ 400 — "Some drugs are invalid or inactive" |
| TC-19-13 | Cập nhật giá không ảnh hưởng đơn thuốc cũ | Kê đơn xong rồi tăng giá | ✅ PrescriptionItem.unitPrice vẫn giữ giá cũ (snapshot) |
| TC-19-14 | ID không tồn tại | — | ❌ 404 |

---

## UC20 — Xem báo cáo tháng cơ bản

**Endpoint:** `GET /reports/monthly` — `[ADMIN, MANAGER]`

| TC | Mô tả | Query | Expected |
|---|---|---|---|
| TC-20-01 | Báo cáo tháng có dữ liệu | `?month=2026-06` | ✅ 200 — tổng lượt khám, doanh thu, số hóa đơn |
| TC-20-02 | Báo cáo tháng không có dữ liệu | `?month=2000-01` | ✅ 200 — số 0 / array rỗng |
| TC-20-03 | Thiếu tham số month | — | ❌ 400 |
| TC-20-04 | Định dạng month sai | `?month=06-2026` | ❌ 400 |
| TC-20-05 | DOCTOR gọi endpoint | — | ❌ 403 |
| TC-20-06 | CASHIER gọi endpoint | — | ❌ 403 |

---

**Endpoint:** `GET /reports/revenue-breakdown` — `[ADMIN, MANAGER]`

| TC | Mô tả | Query | Expected |
|---|---|---|---|
| TC-20-07 | Báo cáo doanh thu theo nhóm | `?month=2026-06` | ✅ 200 — phân chia CONSULTATION / DRUG / SERVICE |
| TC-20-08 | Thiếu month | — | ❌ 400 |

---

## Luồng End-to-End — Full Clinical Flow

Kiểm tra toàn bộ luồng khám từ tiếp nhận đến thanh toán:

| Bước | TC | Endpoint | Expected |
|---|---|---|---|
| 1. Tạo bệnh nhân | TC-E2E-01 | `POST /patients` | ✅ 201 — patientCode sinh |
| 2. Tạo lượt khám | TC-E2E-02 | `POST /visits` | ✅ 201 — queueNumber=1, WAITING |
| 3. Mở khám | TC-E2E-03 | `POST /visits/:id/open-examination` | ✅ 201 — Examination OPEN, Visit → IN_EXAMINATION |
| 4. Lập phiếu khám | TC-E2E-04 | `PATCH /examinations/:id` | ✅ 200 — symptoms, clinicalNotes, diagnoses |
| 5. Kê đơn thuốc | TC-E2E-05 | `PUT /examinations/:id/prescription` | ✅ 200 — Prescription với items |
| 6. Hoàn tất khám | TC-E2E-06 | `POST /examinations/:id/complete` | ✅ 200 — COMPLETED, Visit → COMPLETED |
| 7. Lập hóa đơn | TC-E2E-07 | `POST /visits/:id/invoice` | ✅ 201 — Invoice với CONSULTATION + DRUG items |
| 8. Thanh toán | TC-E2E-08 | `POST /invoices/:id/payments` | ✅ 201 — PAID |
| 9. Xem lịch sử | TC-E2E-09 | `GET /patients/:id/medical-history` | ✅ 200 — đầy đủ lịch sử |

---

## Ma trận RBAC — Tổng hợp

| Endpoint | ADMIN | MANAGER | DOCTOR | RECEPTIONIST | CASHIER |
|---|:---:|:---:|:---:|:---:|:---:|
| POST /auth/login | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /auth/me | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /users | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /users | ✅ | ❌ | ❌ | ❌ | ❌ |
| PATCH /users/:id/roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /patients | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /patients | ✅ | ❌ | ❌ | ✅ | ❌ |
| GET /patients/:id/medical-history | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /visits | ✅ | ❌ | ❌ | ✅ | ❌ |
| GET /visits | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /visits/:id/open-examination | ✅ | ❌ | ✅ | ❌ | ❌ |
| GET /examinations/:id | ✅ | ✅ | ✅ | ❌ | ❌ |
| PATCH /examinations/:id | ✅ | ❌ | ✅ | ❌ | ❌ |
| PUT /examinations/:id/prescription | ✅ | ❌ | ✅ | ❌ | ❌ |
| DELETE /examinations/:id/prescription | ✅ | ❌ | ✅ | ❌ | ❌ |
| POST /examinations/:id/complete | ✅ | ❌ | ✅ | ❌ | ❌ |
| POST /visits/:id/invoice | ✅ | ❌ | ❌ | ❌ | ✅ |
| GET /invoices | ✅ | ✅ | ❌ | ❌ | ✅ |
| POST /invoices/:id/payments | ✅ | ❌ | ❌ | ❌ | ✅ |
| GET /regulations/current | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /regulations | ✅ | ❌ | ❌ | ❌ | ❌ |
| PATCH /regulations/:id/activate | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /diseases | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /diseases | ✅ | ❌ | ❌ | ❌ | ❌ |
| PATCH /diseases/:id | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /drugs | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /drugs | ✅ | ❌ | ❌ | ❌ | ❌ |
| PATCH /drugs/:id | ✅ | ❌ | ❌ | ❌ | ❌ |
| GET /reports/monthly | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Business Rules được kiểm thử

| BR | Rule | TC liên quan |
|---|---|---|
| BR-01 | Mỗi bệnh nhân chỉ 1 lượt khám/ngày | TC-07-02 |
| BR-02 | Số lượt khám/ngày không vượt MAX_PATIENTS_PER_DAY | TC-07-03 |
| BR-03 | CANCELLED không tính vào giới hạn ngày | TC-07-08 |
| BR-04 | Examination chỉ mở được khi Visit = WAITING | TC-09-03 |
| BR-05 | Doctor phải ACTIVE mới mở khám được | TC-09-06 |
| BR-06 | Chỉ có 1 chẩn đoán isPrimary=true | TC-10-03 |
| BR-07 | Disease phải isActive=true mới chẩn đoán được | TC-10-05, TC-18-11 |
| BR-08 | Drug phải isActive=true mới kê được | TC-12-05, TC-19-12 |
| BR-09 | unitPrice trong đơn thuốc là snapshot | TC-12-07, TC-19-13 |
| BR-10 | Hoàn tất khám cần symptoms + conclusion + primary diagnosis | TC-13-02, TC-13-03, TC-13-04 |
| BR-11 | Required service orders phải COMPLETED trước khi hoàn tất khám | TC-13-05 |
| BR-12 | Chỉ COMPLETED visit mới lập được hóa đơn | TC-14-03 |
| BR-13 | CONSULTATION_FEE lấy từ regulation active | TC-14-06 |
| BR-14 | Số tiền thanh toán không vượt remaining | TC-15-04 |
| BR-15 | Invoice đã PAID không thanh toán thêm | TC-15-07 |
| BR-16 | Invoice VOID không thanh toán được | TC-15-08 |
| BR-17 | Regulation mới activate, quy định cũ tự deactivate | TC-17-06 |
| BR-18 | Thay đổi giá trong regulation áp dụng ngay cho lượt khám mới | TC-17-08, TC-17-09 |
