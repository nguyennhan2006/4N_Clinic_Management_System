# Use Cases — 4N Clinic Management System

## Quy ước

| Ký hiệu | Ý nghĩa |
|---|---|
| **Actor** | Vai trò thực hiện use case |
| **Precondition** | Điều kiện phải thỏa trước khi thực hiện |
| **Main Flow** | Luồng chính (happy path) |
| **Alt Flow** | Luồng thay thế / xử lý lỗi |
| **Postcondition** | Trạng thái hệ thống sau khi hoàn thành |
| BR-xx | Business Rule số xx |

**Roles:** ADMIN · RECEPTIONIST · DOCTOR · CASHIER · MANAGER

---

## UC01 — Đăng nhập

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | Tất cả roles |
| **Endpoint** | `POST /auth/login` |
| **Mô tả** | Nhân viên xác thực danh tính để truy cập hệ thống |

**Precondition:** Tài khoản đã được tạo và đang ở trạng thái ACTIVE.

**Input:**
```json
{ "username": "string", "password": "string (≥6 ký tự)" }
```

**Main Flow:**
1. Nhân viên nhập username và password.
2. Hệ thống kiểm tra username tồn tại.
3. Hệ thống xác minh password với bcrypt hash.
4. Hệ thống kiểm tra tài khoản không bị LOCKED/INACTIVE.
5. Hệ thống tạo `accessToken` (JWT) và `refreshToken`.
6. Lưu hash của refreshToken vào bảng `RefreshToken`.
7. Trả về token và thông tin user (id, fullName, roles). Không trả về `passwordHash`.

**Alt Flow:**
- **Username không tồn tại hoặc sai password** → 401 "Invalid credentials" (không phân biệt để tránh lộ thông tin).
- **Tài khoản LOCKED** → 401 "Account is locked".
- **Thiếu username hoặc password** → 400 validation error.

**Postcondition:** Client lưu `accessToken` và `refreshToken`. Mọi request sau đính kèm `Authorization: Bearer <accessToken>`.

---

## UC01-EXT — Làm mới & Đăng xuất

| Endpoint | Mô tả |
|---|---|
| `POST /auth/refresh` | Đổi refreshToken lấy accessToken mới |
| `POST /auth/logout` | Thu hồi refreshToken |
| `GET /auth/me` | Lấy thông tin user hiện tại |

**Refresh Token Flow:**
1. Client gửi `{ refreshToken }`.
2. Hệ thống tìm hash trong DB, kiểm tra chưa bị revoke và chưa hết hạn.
3. Trả về `accessToken` mới.

**Logout Flow:**
1. Client gửi `{ refreshToken }` kèm accessToken.
2. Hệ thống đặt `revokedAt = now()` cho refreshToken đó.
3. Mọi lần refresh sau với token này sẽ bị từ chối.

---

## UC02 — Quản lý tài khoản

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | ADMIN |
| **Endpoints** | `GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/lock` |
| **Mô tả** | ADMIN quản lý toàn bộ tài khoản nhân viên trong hệ thống |

**Precondition:** Đăng nhập với role ADMIN.

### 2.1 Xem danh sách / chi tiết

**Main Flow:**
1. ADMIN gọi `GET /users` với tùy chọn `?keyword=` để tìm kiếm.
2. Hệ thống trả về danh sách users (có phân trang).
3. ADMIN gọi `GET /users/:id` để xem chi tiết.
4. Response không bao giờ chứa `passwordHash`.

### 2.2 Tạo tài khoản mới

**Input:**
```json
{
  "username": "string (bắt buộc)",
  "password": "string (≥8 ký tự, bắt buộc)",
  "fullName": "string (bắt buộc)",
  "email": "string (tùy chọn, định dạng email)",
  "phone": "string (tùy chọn)",
  "roleIds": ["uuid", ...] // tùy chọn, gán role ngay khi tạo
}
```

**Main Flow:**
1. ADMIN điền thông tin user mới.
2. Hệ thống kiểm tra `username` chưa tồn tại.
3. Hệ thống hash password bằng bcrypt.
4. Tạo User với `status = ACTIVE`.
5. Nếu có `roleIds`, gán vào bảng `UserRole`.
6. Ghi AuditLog.

**Alt Flow:**
- **Username đã tồn tại** → 409 Conflict.
- **Password < 8 ký tự** → 400 validation.

### 2.3 Cập nhật thông tin

**Input:** `{ fullName?, email?, phone? }` — tất cả tùy chọn.

### 2.4 Khóa / Mở khóa tài khoản

**Input:** `{ lock: true | false }`

**Main Flow:**
1. ADMIN gọi `PATCH /users/:id/lock`.
2. Hệ thống cập nhật `status = LOCKED` hoặc `ACTIVE`.
3. Tài khoản bị LOCKED không thể đăng nhập.

**Alt Flow:**
- **ADMIN tự khóa chính mình** → 400 (tự bảo vệ).

**Postcondition:** Tài khoản mới có thể đăng nhập hoặc bị chặn đăng nhập tùy thao tác.

---

## UC03 — Phân quyền

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | ADMIN |
| **Endpoint** | `PATCH /users/:id/roles` |
| **Mô tả** | ADMIN gán hoặc thay đổi role cho tài khoản nhân viên |

**Precondition:** Đăng nhập với role ADMIN. User đích tồn tại.

**Input:**
```json
{ "roleIds": ["uuid", ...] }
```

**Main Flow:**
1. ADMIN chọn user và danh sách roles muốn gán.
2. Hệ thống xóa toàn bộ UserRole cũ của user này.
3. Hệ thống tạo UserRole mới theo danh sách `roleIds`.
4. Ghi AuditLog.

**Alt Flow:**
- **roleId không tồn tại** → 404 Not Found.
- **roleIds rỗng `[]`** → Xóa toàn bộ role, user không còn quyền truy cập.

**Postcondition:** User chỉ mang đúng các role được truyền vào (replace-all semantics).

> **Lưu ý:** RBAC backend là nguồn chốt bảo mật. Frontend ẩn menu/nút theo role chỉ để cải thiện UX.

---

## UC04 — Tra cứu bệnh nhân

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | RECEPTIONIST, DOCTOR, MANAGER, ADMIN |
| **Endpoints** | `GET /patients`, `GET /patients/:id` |
| **Mô tả** | Tìm kiếm và xem thông tin bệnh nhân đã có trong hệ thống |

**Precondition:** Đăng nhập với role phù hợp.

**Main Flow:**
1. Nhân viên nhập từ khóa tìm kiếm (tên, số điện thoại).
2. Hệ thống gọi `GET /patients?keyword=<từ khóa>`.
3. Tìm kiếm không phân biệt hoa thường trên `fullName` và `phone`.
4. Hiển thị danh sách kết quả.
5. Chọn bệnh nhân để xem chi tiết qua `GET /patients/:id`.

**Alt Flow:**
- **Không tìm thấy** → Trả về mảng rỗng `[]`.
- **ID không tồn tại** → 404.
- **CASHIER truy cập** → 403 Forbidden.

---

## UC05 — Tạo hồ sơ bệnh nhân

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | RECEPTIONIST, ADMIN |
| **Endpoint** | `POST /patients` |
| **Mô tả** | Lễ tân tạo mới hồ sơ cho bệnh nhân đến lần đầu |

**Precondition:** Bệnh nhân chưa có hồ sơ trong hệ thống (hoặc cần tạo mới).

**Input:**
```json
{
  "fullName": "string (bắt buộc)",
  "dob": "ISO date string (tùy chọn)",
  "gender": "string (tùy chọn)",
  "phone": "string (tùy chọn)",
  "citizenId": "string (tùy chọn)",
  "address": "string (tùy chọn)"
}
```

**Main Flow:**
1. Lễ tân nhập thông tin bệnh nhân.
2. Hệ thống sinh `patientCode` tự động (duy nhất).
3. Lưu Patient với `createdAt` hiện tại.
4. Ghi AuditLog.
5. Trả về patient kèm `patientCode`.

**Alt Flow:**
- **`citizenId` đã tồn tại** → 409 Conflict (ràng buộc unique).
- **`fullName` bị thiếu** → 400 validation.
- **Định dạng `dob` sai** → 400 validation.
- **DOCTOR hoặc CASHIER tạo** → 403 Forbidden.

**Postcondition:** Bệnh nhân mới được lưu, sẵn sàng tiếp nhận lượt khám.

---

## UC06 — Tiếp nhận bệnh nhân

> UC06 và UC07 liên kết chặt: tiếp nhận bệnh nhân = tạo lượt khám cho ngày đó.

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | RECEPTIONIST, ADMIN |
| **Mô tả** | Lễ tân tra cứu hoặc tạo hồ sơ bệnh nhân, sau đó tạo lượt khám |

**Main Flow:**
1. Lễ tân tra cứu bệnh nhân (UC04).
2. Nếu chưa có hồ sơ → Tạo mới (UC05).
3. Lễ tân tạo lượt khám cho bệnh nhân (UC07).
4. Hệ thống in hoặc hiển thị số thứ tự hàng chờ.

---

## UC07 — Tạo lượt khám

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | RECEPTIONIST, ADMIN |
| **Endpoint** | `POST /visits` |
| **Mô tả** | Tạo một lượt khám mới cho bệnh nhân trong ngày, gán số thứ tự hàng đợi |

**Precondition:** Bệnh nhân tồn tại. Ngày khám chưa đạt giới hạn. Bệnh nhân chưa có lượt khám ngày đó.

**Input:**
```json
{
  "patientId": "uuid (bắt buộc)",
  "visitDate": "ISO date string (tùy chọn, mặc định hôm nay)",
  "reason": "string (tùy chọn)"
}
```

**Main Flow:**
1. Lễ tân chọn bệnh nhân và ngày khám.
2. Hệ thống thực hiện trong transaction Serializable:
   - Kiểm tra bệnh nhân chưa có visit trong ngày.
   - Đếm tổng visit trong ngày (không tính CANCELLED), so với `MAX_PATIENTS_PER_DAY` từ regulation đang active.
   - Lấy `queueNumber` = `max(queueNumber trong ngày) + 1`.
   - Tạo Visit với `status = WAITING`.
3. Ghi AuditLog hành động `CREATE_VISIT`.
4. Trả về Visit kèm thông tin bệnh nhân.

**Alt Flow:**
- **`patientId` không tồn tại** → 404 "Patient not found".
- **Bệnh nhân đã có visit hôm nay** → 409 "Patient already has a visit on this date" (BR-01).
- **Vượt giới hạn ngày** → 409 "Daily patient limit reached (n)" (BR-02).
- **Không có regulation active** → Dùng giá trị mặc định `MAX_PATIENTS_PER_DAY = 40`.
- **DOCTOR gọi endpoint** → 403 Forbidden.

**Postcondition:** Visit ở trạng thái `WAITING`, bệnh nhân vào hàng chờ với số thứ tự.

> **BR-01:** Mỗi bệnh nhân chỉ 1 lượt khám / ngày.  
> **BR-02:** Tổng visit `status ≠ CANCELLED` trong ngày không vượt `MAX_PATIENTS_PER_DAY`.

---

## UC08 — Xem danh sách khám

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | RECEPTIONIST, DOCTOR, MANAGER, ADMIN |
| **Endpoint** | `GET /visits` |
| **Mô tả** | Xem danh sách lượt khám, lọc theo ngày / trạng thái / hóa đơn |

**Query Parameters:**

| Tham số | Kiểu | Mô tả |
|---|---|---|
| `date` | ISO date | Lọc theo ngày khám |
| `status` | VisitStatus enum | REGISTERED / WAITING / IN_EXAMINATION / COMPLETED / CANCELLED |
| `hasInvoice` | boolean | `true` = đã có hóa đơn, `false` = chưa có |

**Main Flow:**
1. Nhân viên chọn bộ lọc (thường là ngày hiện tại).
2. Hệ thống trả về danh sách visits sắp xếp theo `queueNumber ASC`.
3. Mỗi item kèm thông tin patient, createdByUser, examination (nếu có).

**Postcondition:** Không thay đổi dữ liệu (read-only).

---

## UC09 — Mở lượt khám

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | DOCTOR, ADMIN |
| **Endpoint** | `POST /visits/:id/open-examination` |
| **Mô tả** | Bác sĩ nhận bệnh nhân từ hàng chờ, mở phiếu khám |

**Precondition:** Visit tồn tại, `status = WAITING`. Bác sĩ đang ACTIVE. Chưa có Examination cho visit này.

**Main Flow:**
1. Bác sĩ chọn visit WAITING từ danh sách.
2. Hệ thống kiểm tra bác sĩ đang ACTIVE (BR-05).
3. Trong transaction:
   - Kiểm tra visit `status = WAITING`.
   - Kiểm tra chưa có Examination.
   - Tạo Examination với `status = OPEN`, `doctorUserId = bác sĩ hiện tại`.
   - Cập nhật Visit → `status = IN_EXAMINATION`.
4. Ghi AuditLog `OPEN_EXAMINATION`.

**Alt Flow:**
- **Visit không ở WAITING** → 400 "visit status is {status}, expected WAITING" (BR-04).
- **Examination đã tồn tại** → 409 "Examination already exists".
- **Bác sĩ INACTIVE/LOCKED** → 400 "Doctor account is inactive" (BR-05).
- **Visit không tồn tại** → 404.
- **RECEPTIONIST gọi** → 403.

**Postcondition:** Examination OPEN tồn tại. Visit chuyển sang IN_EXAMINATION.

> **BR-04:** Chỉ mở khám khi Visit = WAITING.  
> **BR-05:** Bác sĩ phải đang ACTIVE.

---

## UC10 — Lập phiếu khám

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | DOCTOR, ADMIN |
| **Endpoint** | `PATCH /examinations/:id` |
| **Mô tả** | Bác sĩ ghi nhận triệu chứng, ghi chú lâm sàng, kết luận và chẩn đoán bệnh |

**Precondition:** Examination tồn tại và `status = OPEN`.

**Input:**
```json
{
  "symptoms": "string (tùy chọn)",
  "clinicalNotes": "string (tùy chọn)",
  "conclusion": "string (tùy chọn)",
  "diagnoses": [
    { "diseaseId": "uuid", "isPrimary": true | false }
  ]
}
```

**Main Flow:**
1. Bác sĩ nhập triệu chứng, ghi chú, kết luận.
2. Bác sĩ chọn một hoặc nhiều chẩn đoán bệnh từ danh mục (chỉ bệnh `isActive = true`).
3. Đánh dấu 1 chẩn đoán là chính (`isPrimary = true`).
4. Hệ thống trong transaction:
   - Kiểm tra tối đa 1 `isPrimary = true` (BR-06).
   - Kiểm tra tất cả `diseaseId` tồn tại và `isActive = true` (BR-07).
   - Snapshot tên bệnh vào `Diagnosis.name` tại thời điểm này.
   - Xóa toàn bộ diagnoses cũ, tạo lại theo danh sách mới.
   - Cập nhật `symptoms`, `clinicalNotes`, `conclusion`.
5. Trả về Examination cập nhật kèm diagnoses.

**Alt Flow:**
- **Examination COMPLETED/CANCELLED** → 400 "Cannot edit examination with status {status}".
- **Có ≥ 2 chẩn đoán isPrimary=true** → 400 "At most one primary diagnosis is allowed" (BR-06).
- **diseaseId không tồn tại hoặc inactive** → 400 "Some diseases are invalid or inactive" (BR-07).
- **Examination không tồn tại** → 404.

**Postcondition:** Dữ liệu lâm sàng được lưu. Diagnoses cũ bị thay thế hoàn toàn nếu có truyền `diagnoses`.

> **BR-06:** Chỉ tối đa 1 chẩn đoán chính (`isPrimary = true`).  
> **BR-07:** Chỉ dùng Disease đang `isActive = true`.

---

## UC11 — Xem lịch sử khám

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | DOCTOR, MANAGER, ADMIN |
| **Endpoint** | `GET /patients/:id/medical-history` |
| **Mô tả** | Xem toàn bộ lịch sử khám của một bệnh nhân theo thứ tự thời gian |

**Precondition:** Bệnh nhân tồn tại. Người dùng có role được phép.

**Main Flow:**
1. Bác sĩ mở trang bệnh nhân, chọn xem lịch sử.
2. Hệ thống truy vấn tất cả visits của patient, bao gồm:
   - Examination (symptoms, clinicalNotes, conclusion, diagnoses)
   - Prescription và PrescriptionItems (với drug snapshot)
3. Trả về danh sách sắp xếp theo thời gian.

**Alt Flow:**
- **Bệnh nhân chưa có lượt khám** → `[]` (không phải lỗi).
- **ID không tồn tại** → 404.
- **RECEPTIONIST / CASHIER gọi** → 403.

**Postcondition:** Read-only, không thay đổi dữ liệu.

---

## UC12 — Kê đơn thuốc

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | DOCTOR, ADMIN |
| **Endpoints** | `PUT /examinations/:id/prescription`, `DELETE /examinations/:id/prescription` |
| **Mô tả** | Bác sĩ tạo hoặc cập nhật đơn thuốc cho phiếu khám |

**Precondition:** Examination tồn tại và `status = OPEN`.

### PUT — Tạo / Thay thế đơn thuốc (Upsert)

**Input:**
```json
{
  "note": "string (tùy chọn)",
  "items": [
    {
      "drugId": "uuid (bắt buộc)",
      "quantity": "int ≥ 1 (bắt buộc)",
      "dosage": "string (bắt buộc, ví dụ: '2 lần/ngày sau ăn')"
    }
  ]
}
```

**Main Flow:**
1. Bác sĩ chọn thuốc từ danh mục (chỉ drug `isActive = true`).
2. Nhập số lượng và hướng dẫn dùng thuốc.
3. Hệ thống trong transaction:
   - Kiểm tra tất cả `drugId` tồn tại và `isActive = true` (BR-08).
   - Snapshot `unitPrice = Drug.price` tại thời điểm kê (BR-09).
   - Tính `lineTotal = unitPrice × quantity`.
   - Nếu đã có Prescription cũ → xóa toàn bộ, tạo lại (replace-all).
   - Nếu chưa có → tạo mới.
4. Trả về Prescription với items và drug info.

**Alt Flow:**
- **items rỗng `[]`** → 400 "Prescription must have at least one item".
- **drugId không tồn tại hoặc inactive** → 400 "Some drugs are invalid or inactive" (BR-08).
- **Examination COMPLETED** → 400 "Cannot update prescription for completed examination".

### DELETE — Xóa đơn thuốc

- **Examination COMPLETED** → 400.
- **Không có đơn thuốc** → 204 idempotent (không lỗi).

**Postcondition:** `PrescriptionItem.unitPrice` là snapshot — thay đổi giá Drug sau này không ảnh hưởng.

> **BR-08:** Chỉ kê thuốc đang `isActive = true`.  
> **BR-09:** `unitPrice` lấy từ `Drug.price` tại thời điểm kê đơn, không phải giá hiện tại.

---

## UC13 — Hoàn tất phiếu khám

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | DOCTOR, ADMIN |
| **Endpoint** | `POST /examinations/:id/complete` |
| **Mô tả** | Bác sĩ xác nhận kết thúc khám, chuyển visit sang trạng thái hoàn thành |

**Precondition:** Examination `status = OPEN`. Đã có đầy đủ thông tin bắt buộc.

**Main Flow:**
1. Bác sĩ xác nhận hoàn tất khám.
2. Hệ thống kiểm tra các điều kiện trong transaction:
   - `symptoms` và `conclusion` phải có giá trị (BR-10).
   - Phải có ít nhất 1 chẩn đoán với `isPrimary = true` (BR-10).
   - Không còn ServiceOrder bắt buộc (`isRequired = true`) nào ở trạng thái chưa hoàn tất (BR-11).
3. Cập nhật Examination → `status = COMPLETED`, `completedAt = now()`.
4. Cập nhật Visit → `status = COMPLETED`.
5. Ghi AuditLog `COMPLETE_EXAMINATION`.

**Alt Flow:**
- **Thiếu symptoms hoặc conclusion** → 400 "Symptoms and conclusion are required".
- **Không có chẩn đoán chính** → 400 "Primary diagnosis is required".
- **Còn required service order chưa xong** → 400 "n required service order(s) must be completed".
- **Examination đã COMPLETED** → 200 idempotent, trả về existing.
- **Examination CANCELLED** → 400 "Cannot complete a cancelled examination".

**Postcondition:** Examination COMPLETED. Visit COMPLETED. Sẵn sàng lập hóa đơn.

> **BR-10:** Bắt buộc: `symptoms`, `conclusion`, và ít nhất 1 `isPrimary = true` diagnosis.  
> **BR-11:** Tất cả ServiceOrder `isRequired = true` phải ở COMPLETED/CANCELLED trước khi hoàn tất khám.

---

## UC14 — Lập hóa đơn

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | CASHIER, ADMIN |
| **Endpoint** | `POST /visits/:visitId/invoice` |
| **Mô tả** | Thu ngân tạo hóa đơn từ visit đã hoàn thành, tổng hợp tất cả chi phí |

**Precondition:** Visit `status = COMPLETED`. Có ít nhất 1 Examination. Chưa có Invoice.

**Main Flow:**
1. Thu ngân chọn visit đã COMPLETED.
2. Hệ thống đọc Regulation active để lấy `CONSULTATION_FEE`.
3. Tổng hợp các dòng chi phí:
   - **Phí khám:** `CONSULTATION_FEE` (từ regulation, mặc định 150,000 VND).
   - **Dịch vụ:** Các ServiceOrder có `status = COMPLETED`.
   - **Thuốc:** Các PrescriptionItem (dùng `unitPrice` snapshot).
4. Tính `totalAmount = tổng lineTotal`.
5. Tạo Invoice với `status = ISSUED`, `paidAmount = 0`.
6. Tạo InvoiceItems kèm snapshot: `description`, `unitPrice`, `lineTotal`.
7. Ghi AuditLog `CREATE_INVOICE`.

**Alt Flow:**
- **Visit chưa COMPLETED** → 400 "Only COMPLETED visit can be converted to invoice".
- **Visit không có Examination** → 400 "Visit has no examination".
- **Invoice đã tồn tại** → 200, trả về invoice cũ (idempotent).
- **Visit không tồn tại** → 404.
- **Không có regulation active** → Dùng `CONSULTATION_FEE` mặc định 150,000 VND.
- **DOCTOR gọi endpoint** → 403.

**Postcondition:** Invoice `status = ISSUED` với đầy đủ InvoiceItems là snapshot không thay đổi theo thời gian.

> **BR-12:** Chỉ visit COMPLETED mới lập được hóa đơn.  
> **BR-13:** `CONSULTATION_FEE` lấy từ RegulationVersion đang active, mặc định 150,000 nếu không có.

---

## UC15 — Ghi nhận thanh toán

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | CASHIER, ADMIN |
| **Endpoint** | `POST /invoices/:id/payments` |
| **Mô tả** | Thu ngân ghi nhận khoản thanh toán của bệnh nhân (hỗ trợ thanh toán từng phần) |

**Precondition:** Invoice tồn tại, `status ∈ {ISSUED, PARTIALLY_PAID}`.

**Input:**
```json
{
  "amount": "number > 0 (bắt buộc)",
  "method": "CASH | TRANSFER | CARD (bắt buộc)",
  "note": "string (tùy chọn)"
}
```

**Main Flow:**
1. Thu ngân nhập số tiền và phương thức thanh toán.
2. Hệ thống trong transaction:
   - Kiểm tra `amount > 0` (BR-14).
   - Tính `remainingAmount = totalAmount - paidAmount`.
   - Kiểm tra `amount ≤ remainingAmount` (BR-14).
   - Tạo Payment record.
   - Cộng dồn: `newPaidAmount = paidAmount + amount`.
   - Cập nhật Invoice: `status = PAID` nếu `newPaidAmount ≥ totalAmount`, else `PARTIALLY_PAID`.
3. Ghi AuditLog `CREATE_PAYMENT`.

**Alt Flow:**
- **`amount ≤ 0`** → 400 "Payment amount must be greater than 0".
- **`amount > remaining`** → 400 "Payment amount exceeds remaining amount" (BR-14).
- **Invoice đã PAID** → 400 "Invoice is already paid" (BR-15).
- **Invoice bị VOID** → 400 "Cannot pay voided invoice" (BR-16).
- **Method không hợp lệ** → 400 validation (chỉ CASH / TRANSFER / CARD).
- **Invoice không tồn tại** → 404.

**Postcondition:** Payment được lưu. Invoice.paidAmount tăng. Khi thanh toán đủ → PAID.

> **BR-14:** `0 < amount ≤ remainingAmount`.  
> **BR-15:** Invoice PAID không nhận thêm thanh toán.  
> **BR-16:** Invoice VOID không nhận thanh toán.

---

## UC16 — Tra cứu hóa đơn

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | CASHIER, MANAGER, ADMIN |
| **Endpoints** | `GET /invoices`, `GET /invoices/:id`, `GET /invoices/:id/items` |
| **Mô tả** | Tìm kiếm và xem chi tiết hóa đơn |

**Query Parameters (GET /invoices):**

| Tham số | Mô tả |
|---|---|
| `status` | Lọc theo InvoiceStatus |
| `date` | Lọc theo ngày tạo hóa đơn |
| `keyword` | Tìm theo tên bệnh nhân, patientCode, hoặc số điện thoại |

**Main Flow:**
1. Thu ngân / Manager nhập bộ lọc.
2. `GET /invoices` trả về tối đa 50 bản ghi, sắp xếp mới nhất trước.
3. `GET /invoices/:id` trả về đầy đủ: invoice + items + payments + patient info.
4. `GET /invoices/:id/items` trả về chỉ danh sách InvoiceItems.

**Postcondition:** Read-only.

---

## UC17 — Thay đổi quy định

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | ADMIN (tạo/kích hoạt) · Tất cả roles (xem) |
| **Endpoints** | `GET /regulations/current`, `POST /regulations`, `PATCH /regulations/:id/activate` |
| **Mô tả** | ADMIN quản lý các quy định vận hành phòng mạch theo phiên bản |

**Regulation keys hợp lệ:**

| Key | Mô tả | Ảnh hưởng |
|---|---|---|
| `MAX_PATIENTS_PER_DAY` | Số lượt khám tối đa trong ngày | UC07 — kiểm tra khi tạo visit |
| `CONSULTATION_FEE` | Phí khám cơ bản (VND) | UC14 — tính vào hóa đơn |

### Xem quy định hiện tại

**Main Flow:**
1. Bất kỳ user nào gọi `GET /regulations/current`.
2. Trả về RegulationVersion đang `isActive = true` kèm items.

### Tạo phiên bản quy định mới

**Input:**
```json
{
  "note": "string (tùy chọn)",
  "items": [
    { "key": "MAX_PATIENTS_PER_DAY", "value": "30" },
    { "key": "CONSULTATION_FEE", "value": "200000" }
  ]
}
```

**Main Flow:**
1. ADMIN tạo phiên bản mới với các giá trị mong muốn.
2. Phiên bản mới tạo ra với `isActive = false`.
3. Phiên bản này chưa có hiệu lực cho đến khi được kích hoạt.

**Alt Flow:**
- **key không nằm trong danh sách cho phép** → 400 validation.
- **MANAGER hoặc role khác tạo** → 403.

### Kích hoạt phiên bản

**Main Flow:**
1. ADMIN gọi `PATCH /regulations/:id/activate`.
2. Hệ thống deactivate tất cả phiên bản khác (`isActive = false`).
3. Kích hoạt phiên bản này (`isActive = true`, `activatedAt = now()`).
4. Quy định mới có hiệu lực ngay cho mọi lượt khám và hóa đơn tiếp theo.

> **Lưu ý:** Thay đổi quy định không có tính hồi tố — hóa đơn và lượt khám đã tạo không bị ảnh hưởng.

**Postcondition:** Chỉ 1 RegulationVersion có `isActive = true` tại mọi thời điểm.

---

## UC18 — Quản lý danh mục bệnh

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | ADMIN (tạo/cập nhật) · DOCTOR, MANAGER, RECEPTIONIST, ADMIN (xem) |
| **Endpoints** | `GET /diseases`, `POST /diseases`, `PATCH /diseases/:id` |
| **Mô tả** | Quản lý danh mục bệnh dùng để chẩn đoán trong phiếu khám |

### Xem danh sách

**Query:** `?activeOnly=true` — chỉ lấy bệnh đang hoạt động.

### Tạo bệnh mới

**Input:**
```json
{ "code": "string (unique)", "name": "string", "isActive": true }
```

**Alt Flow:**
- **`code` đã tồn tại** → 409 Conflict.
- **CASHIER xem danh sách** → 403.

### Cập nhật bệnh

**Input:** `{ name?, isActive? }` — tất cả tùy chọn.

**Business Rule:**
- Bệnh `isActive = false` không thể dùng khi lập phiếu khám (UC10 kiểm tra).
- Tắt bệnh không ảnh hưởng Diagnosis đã tạo trước đó (lịch sử được bảo toàn qua snapshot `name`).

---

## UC19 — Quản lý danh mục thuốc

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | ADMIN (tạo/cập nhật) · DOCTOR, MANAGER, ADMIN (xem) |
| **Endpoints** | `GET /drugs`, `POST /drugs`, `PATCH /drugs/:id` |
| **Mô tả** | Quản lý danh mục thuốc dùng để kê đơn trong phiếu khám |

### Xem danh sách

**Query:** `?activeOnly=true` — chỉ lấy thuốc đang hoạt động.

### Tạo thuốc mới

**Input:**
```json
{
  "name": "string (unique)",
  "unit": "string (ví dụ: viên, ml, gói)",
  "price": "decimal > 0",
  "isActive": true
}
```

**Alt Flow:**
- **`name` đã tồn tại** → 409 Conflict.
- **RECEPTIONIST / CASHIER xem** → 403.

### Cập nhật thuốc

**Input:** `{ name?, unit?, price?, isActive? }`

**Business Rules:**
- Thuốc `isActive = false` không thể kê trong đơn thuốc mới (UC12 kiểm tra).
- Thay đổi `price` chỉ ảnh hưởng đơn thuốc tạo sau — đơn cũ giữ nguyên snapshot (BR-09).
- Tắt thuốc không ảnh hưởng PrescriptionItem đã tạo.

---

## UC20 — Xem báo cáo tháng cơ bản

| Thuộc tính | Nội dung |
|---|---|
| **Actor** | ADMIN, MANAGER |
| **Endpoints** | `GET /reports/monthly`, `GET /reports/revenue-breakdown` |
| **Mô tả** | Xem tổng hợp hoạt động phòng mạch theo tháng |

**Query:** `?month=YYYY-MM` (bắt buộc, ví dụ: `?month=2026-06`)

### Báo cáo tháng tổng hợp (`/reports/monthly`)

Trả về các chỉ số:
- Tổng số lượt khám trong tháng.
- Số lượt khám đã hoàn thành.
- Tổng doanh thu (tổng `Invoice.totalAmount` các invoice PAID/PARTIALLY_PAID).
- Số hóa đơn theo từng trạng thái.

### Báo cáo doanh thu theo nhóm (`/reports/revenue-breakdown`)

Trả về phân chia doanh thu theo loại InvoiceItem:
- CONSULTATION (phí khám).
- DRUG (thuốc).
- SERVICE (dịch vụ).

**Alt Flow:**
- **Thiếu `month`** → 400 validation.
- **Tháng không có dữ liệu** → Trả về số 0 (không phải lỗi).
- **DOCTOR / CASHIER / RECEPTIONIST gọi** → 403.

**Postcondition:** Read-only.

---

## Luồng tích hợp — Full Clinical Journey

```
[RECEPTIONIST] UC04 → Tìm bệnh nhân
                   ↓ Chưa có hồ sơ
               UC05 → Tạo hồ sơ bệnh nhân
                   ↓
               UC07 → Tạo lượt khám → Gán queueNumber
                   ↓
[DOCTOR]       UC09 → Mở lượt khám → Examination OPEN
                   ↓
               UC10 → Lập phiếu khám (symptoms, diagnosis)
                   ↓
               UC12 → Kê đơn thuốc (snapshot giá)
                   ↓
               UC13 → Hoàn tất khám → Visit COMPLETED
                   ↓
[CASHIER]      UC14 → Lập hóa đơn (tổng hợp phí khám + thuốc)
                   ↓
               UC15 → Ghi nhận thanh toán → Invoice PAID
```

---

## State Machines

### Visit Status

```
REGISTERED → WAITING → IN_EXAMINATION → COMPLETED
     ↓            ↓           ↓
 CANCELLED    CANCELLED   CANCELLED
```

| Chuyển trạng thái | Trigger | Actor |
|---|---|---|
| `REGISTERED → WAITING` | Tạo visit (UC07) | RECEPTIONIST |
| `WAITING → IN_EXAMINATION` | Mở khám (UC09) | DOCTOR |
| `IN_EXAMINATION → COMPLETED` | Hoàn tất khám (UC13) | DOCTOR |
| `* → CANCELLED` | Hủy visit (chưa implement UC) | ADMIN |

### Examination Status

```
OPEN → COMPLETED
  ↓
CANCELLED
```

### Invoice Status

```
DRAFT → ISSUED → PARTIALLY_PAID → PAID
             ↓
            VOID
```

---

## Phân quyền tổng hợp

| Use Case | ADMIN | MANAGER | DOCTOR | RECEPTIONIST | CASHIER |
|---|:---:|:---:|:---:|:---:|:---:|
| UC01 — Đăng nhập | ✅ | ✅ | ✅ | ✅ | ✅ |
| UC02 — Quản lý tài khoản | ✅ | ❌ | ❌ | ❌ | ❌ |
| UC03 — Phân quyền | ✅ | ❌ | ❌ | ❌ | ❌ |
| UC04 — Tra cứu bệnh nhân | ✅ | ✅ | ✅ | ✅ | ❌ |
| UC05 — Tạo hồ sơ | ✅ | ❌ | ❌ | ✅ | ❌ |
| UC06/07 — Tạo lượt khám | ✅ | ❌ | ❌ | ✅ | ❌ |
| UC08 — Xem danh sách khám | ✅ | ✅ | ✅ | ✅ | ❌ |
| UC09 — Mở lượt khám | ✅ | ❌ | ✅ | ❌ | ❌ |
| UC10 — Lập phiếu khám | ✅ | ❌ | ✅ | ❌ | ❌ |
| UC11 — Xem lịch sử khám | ✅ | ✅ | ✅ | ❌ | ❌ |
| UC12 — Kê đơn thuốc | ✅ | ❌ | ✅ | ❌ | ❌ |
| UC13 — Hoàn tất khám | ✅ | ❌ | ✅ | ❌ | ❌ |
| UC14 — Lập hóa đơn | ✅ | ❌ | ❌ | ❌ | ✅ |
| UC15 — Ghi nhận thanh toán | ✅ | ❌ | ❌ | ❌ | ✅ |
| UC16 — Tra cứu hóa đơn | ✅ | ✅ | ❌ | ❌ | ✅ |
| UC17 — Thay đổi quy định | ✅ | xem | xem | xem | xem |
| UC18 — Danh mục bệnh | ✅ | xem | xem | xem | ❌ |
| UC19 — Danh mục thuốc | ✅ | xem | xem | ❌ | ❌ |
| UC20 — Báo cáo tháng | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Business Rules — Tổng hợp

| BR | Mô tả | UC liên quan | Xử lý |
|---|---|---|---|
| BR-01 | Mỗi bệnh nhân chỉ 1 visit/ngày | UC07 | 409 Conflict |
| BR-02 | Tổng visit chưa CANCELLED ≤ MAX_PATIENTS_PER_DAY | UC07 | 409 Conflict |
| BR-03 | Visit CANCELLED không tính vào giới hạn ngày | UC07 | Tính trong query |
| BR-04 | Chỉ mở Examination khi Visit = WAITING | UC09 | 400 Bad Request |
| BR-05 | Doctor phải ACTIVE | UC09 | 400 Bad Request |
| BR-06 | Tối đa 1 chẩn đoán isPrimary | UC10 | 400 Bad Request |
| BR-07 | Disease phải isActive để chẩn đoán | UC10 | 400 Bad Request |
| BR-08 | Drug phải isActive để kê đơn | UC12 | 400 Bad Request |
| BR-09 | unitPrice kê đơn là snapshot (không đổi theo giá sau) | UC12 | Snapshot at creation |
| BR-10 | Hoàn tất khám cần: symptoms + conclusion + isPrimary diagnosis | UC13 | 400 Bad Request |
| BR-11 | Required ServiceOrder phải COMPLETED trước khi hoàn tất | UC13 | 400 Bad Request |
| BR-12 | Chỉ Visit COMPLETED mới lập được hóa đơn | UC14 | 400 Bad Request |
| BR-13 | CONSULTATION_FEE từ regulation active (mặc định 150,000) | UC14 | Đọc regulation |
| BR-14 | 0 < payment.amount ≤ remaining | UC15 | 400 Bad Request |
| BR-15 | Invoice PAID không thanh toán thêm | UC15 | 400 Bad Request |
| BR-16 | Invoice VOID không thanh toán | UC15 | 400 Bad Request |
| BR-17 | Chỉ 1 RegulationVersion isActive tại 1 thời điểm | UC17 | Deactivate cũ khi activate mới |
| BR-18 | Thay đổi regulation không có tính hồi tố | UC17 | Chỉ áp dụng cho giao dịch mới |
