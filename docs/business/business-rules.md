# Business Rules

## 1. Mục tiêu

File này là nguồn chốt business rules của ver1. Mọi thành viên phải bám file này trước khi code.

Nếu code khác với file này thì **file này là chuẩn để review** cho đến khi team thống nhất sửa lại.

---

## 2. Giả định nghiệp vụ của ver1

1. Hệ thống phục vụ **1 phòng mạch / 1 chi nhánh**
2. Chưa làm đặt lịch online
3. Chưa làm quản lý tồn kho thuốc đầy đủ
4. 1 lượt khám có tối đa 1 hóa đơn
5. 1 hóa đơn có thể có nhiều payment
6. Quy định dùng cơ chế versioning
7. Báo cáo tháng ở ver1 là báo cáo vận hành cơ bản

---

## 3. Trạng thái chính của visit

### `visits.status`

- `REGISTERED`: đã tạo lượt khám
- `WAITING`: đang chờ khám
- `IN_EXAMINATION`: đã mở phiếu khám
- `COMPLETED`: đã hoàn tất khám
- `CANCELLED`: lượt khám bị hủy

### Chuyển trạng thái hợp lệ

- `REGISTERED -> WAITING`
- `WAITING -> IN_EXAMINATION`
- `IN_EXAMINATION -> COMPLETED`
- `REGISTERED -> CANCELLED`
- `WAITING -> CANCELLED`

Không cho phép:
- `COMPLETED -> WAITING`
- `COMPLETED -> REGISTERED`
- `CANCELLED -> COMPLETED`

---

## 4. Trạng thái chính của examination

### `examinations.status`

- `OPEN`
- `COMPLETED`
- `CANCELLED`

### Rule

- Mỗi visit chỉ có tối đa 1 examination
- Examination chỉ được mở khi visit đang ở trạng thái phù hợp
- Examination `COMPLETED` không được sửa thoải mái như examination `OPEN`

---

## 5. Trạng thái hóa đơn

### `invoices.status`

- `DRAFT`
- `ISSUED`
- `PARTIALLY_PAID`
- `PAID`
- `VOID`

### Rule

- 1 visit chỉ có tối đa 1 invoice
- invoice được tạo cho visit đã đủ điều kiện theo rule hiện hành
- tổng payment không được vượt số dư còn lại
- invoice `PAID` không được chỉnh sửa nội dung ở ver1

---

## 6. Rule đăng nhập và phân quyền

### BR-01 — Chỉ user active mới đăng nhập được

- User `INACTIVE` hoặc `LOCKED` không được login
- Password phải được hash
- Refresh token phải quản lý vòng đời rõ ràng

**Mức ưu tiên:** Critical

### BR-02 — RBAC là bắt buộc ở backend

- Không dựa vào việc ẩn nút trên UI để bảo mật
- Mọi route nhạy cảm phải có guard / permission check phù hợp

**Mức ưu tiên:** Critical

---

## 7. Rule hồ sơ bệnh nhân

### BR-03 — Chống trùng bệnh nhân

Ưu tiên nhận diện theo:

1. `citizen_id` nếu có
2. nếu không có thì dùng tổ hợp kiểm tra mềm:
   - họ tên
   - ngày sinh
   - số điện thoại

Rule này không bắt buộc auto-merge hồ sơ ở ver1, nhưng phải có cơ chế cảnh báo trùng.

**Mức ưu tiên:** Critical

### BR-04 — Không hard delete bệnh nhân đã phát sinh nghiệp vụ

Nếu bệnh nhân đã có visit / examination / invoice thì không xóa cứng.

**Mức ưu tiên:** High

---

## 8. Rule tiếp nhận và tạo lượt khám

### BR-05 — Một bệnh nhân chỉ có một lượt khám đang hoạt động trong cùng ngày

“Đang hoạt động” ở đây hiểu là visit chưa bị hủy và chưa hoàn tất theo rule thống nhất của hệ thống.

**Mức ưu tiên:** Critical

### BR-06 — Không vượt số bệnh nhân tối đa trong ngày

Hệ thống phải đọc `regulation` hiện hành để kiểm tra quota ngày.

**Mức ưu tiên:** Critical

### BR-07 — Số thứ tự khám unique theo ngày

- queue number phải duy nhất trong 1 ngày
- phải sinh trong transaction để tránh race condition

**Mức ưu tiên:** Critical

### BR-08 — Visit chỉ được gán bác sĩ hợp lệ

Nếu có gán bác sĩ, user đó phải là bác sĩ active.

**Mức ưu tiên:** High

---

## 9. Rule mở khám và hoàn tất phiếu khám

### BR-09 — Chỉ bác sĩ hợp lệ mới được mở examination

Bác sĩ phải:
- có quyền phù hợp;
- visit ở trạng thái hợp lệ;
- không bị khóa/inactive.

**Mức ưu tiên:** Critical

### BR-10 — Không hoàn tất phiếu khám nếu thiếu dữ liệu tối thiểu

Tối thiểu cần có:
- thông tin khám nền;
- kết luận/chẩn đoán tối thiểu theo form ver1.

**Mức ưu tiên:** High

### BR-11 — Một examination chỉ có 1 chẩn đoán chính

- có thể có nhiều diagnosis phụ
- nhưng `PRIMARY` phải duy nhất

**Mức ưu tiên:** High

---

## 10. Rule kê đơn

### BR-12 — Chỉ kê thuốc đang active

Thuốc inactive:
- không được thêm mới vào toa;
- dữ liệu toa cũ vẫn giữ nguyên.

**Mức ưu tiên:** High

### BR-13 — Không cho phép dòng thuốc vô nghĩa

Một prescription item phải có:
- thuốc;
- số lượng > 0;
- liều dùng > 0 nếu trường đó tồn tại;
- thông tin đủ để in toa.

**Mức ưu tiên:** High

### BR-14 — Nếu cùng một thuốc được thêm lặp trong cùng toa thì phải xử lý nhất quán

Hệ thống ver1 ưu tiên **chặn hoặc merge theo rule thống nhất**, không để duplicate mơ hồ.

**Mức ưu tiên:** High

---

## 11. Rule hóa đơn và thanh toán

### BR-15 — Giá thuốc và phí khám phải snapshot khi chốt hóa đơn

Thay đổi danh mục thuốc hoặc quy định sau này không được làm thay đổi hóa đơn cũ.

**Mức ưu tiên:** Critical

### BR-16 — Tổng thanh toán không vượt số dư còn lại

Nếu `total_paid + current_payment > total_amount` thì chặn.

**Mức ưu tiên:** Critical

### BR-17 — Payment phải dương

- `amount > 0`
- không cho payment âm hoặc bằng 0

**Mức ưu tiên:** Critical

---

## 12. Rule quy định

### BR-18 — Quy định phải version hóa

Không sửa trực tiếp quy định active theo kiểu ghi đè phá lịch sử.

**Mức ưu tiên:** Critical

### BR-19 — Quy định mới không hồi tố dữ liệu đã chốt

Ví dụ:
- đổi phí khám hôm nay không làm invoice tháng trước đổi tiền;
- đổi quota không làm sai dữ liệu visit đã ghi nhận.

**Mức ưu tiên:** Critical

---

## 13. Rule báo cáo tháng

### BR-20 — Báo cáo phải định nghĩa nguồn tính rõ ràng

Chốt cho ver1:

- **Số lượt khám**: tính theo `visits.status = COMPLETED` trong tháng
- **Doanh thu**: tính theo `payments.paid_at` trong tháng
- **Cơ cấu bệnh**: dùng `PRIMARY diagnosis`
- **Thuốc kê**: lấy từ `prescription_items`

**Mức ưu tiên:** Critical

---

## 14. Danh sách quy định tối thiểu ở ver1

Ver1 phải có ít nhất các rule key sau:

- `MAX_PATIENTS_PER_DAY`
- `CONSULTATION_FEE`

Có thể mở rộng thêm sau nếu team thống nhất.

---

## 15. Những điểm chưa mở rộng ở ver1

Ver1 chưa xử lý sâu:

- tồn kho thuốc;
- hoàn trả / refund payment phức tạp;
- credit note / debit note;
- multiple branch;
- scheduling nâng cao.

Nếu phát sinh nhu cầu, phải đánh dấu rõ là phần ver2.
