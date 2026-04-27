# Demo Script

## 1. Mục tiêu

File này chuẩn hóa kịch bản demo để nhóm thuyết trình thống nhất, không demo tùy hứng.

---

## 2. Chuẩn bị trước demo

- backend chạy ổn;
- frontend chạy ổn;
- DB đã seed dữ liệu demo;
- có sẵn tài khoản cho từng role;
- dữ liệu demo không lỗi logic;
- internet không phải phụ thuộc bắt buộc nếu demo local.

---

## 3. Tài khoản demo nên có

- admin
- receptionist
- doctor
- cashier
- manager

---

## 4. Flow demo chuẩn

### Bước 1 — Đăng nhập bằng lễ tân

Mục tiêu:
- cho thấy hệ thống có xác thực;
- menu và quyền theo role.

### Bước 2 — Tra cứu bệnh nhân cũ

Mục tiêu:
- chứng minh patient search hoạt động.

### Bước 3 — Tạo bệnh nhân mới nếu không tìm thấy

Mục tiêu:
- chứng minh hệ thống tạo hồ sơ được;
- nếu có cảnh báo trùng thì càng tốt để thể hiện business rule.

### Bước 4 — Tạo lượt khám

Mục tiêu:
- sinh queue number;
- kiểm tra quy định số bệnh nhân/ngày;
- hiển thị danh sách khám.

### Bước 5 — Đăng nhập bằng bác sĩ

Mục tiêu:
- role-based access thay đổi đúng.

### Bước 6 — Mở examination cho bệnh nhân đang chờ

Mục tiêu:
- chuyển trạng thái visit;
- tạo bệnh án.

### Bước 7 — Nhập thông tin khám và chẩn đoán

Mục tiêu:
- cho thấy medical record flow hoạt động.

### Bước 8 — Kê đơn thuốc

Mục tiêu:
- thêm dòng thuốc;
- hiển thị chi tiết toa.

### Bước 9 — Hoàn tất phiếu khám

Mục tiêu:
- khóa luồng khám;
- sẵn sàng sang thu ngân.

### Bước 10 — Đăng nhập bằng thu ngân

Mục tiêu:
- chứng minh phân tách trách nhiệm.

### Bước 11 — Tạo hóa đơn

Mục tiêu:
- invoice lấy được phí khám và thuốc.

### Bước 12 — Ghi nhận thanh toán

Mục tiêu:
- cập nhật trạng thái hóa đơn;
- thể hiện flow tài chính.

### Bước 13 — Đăng nhập bằng quản lý

Mục tiêu:
- xem báo cáo tháng.

### Bước 14 — Mở báo cáo tháng

Mục tiêu:
- tổng lượt khám;
- doanh thu;
- cơ cấu bệnh hoặc thuốc.

---

## 5. Điểm nhấn nên nói khi demo

- hệ thống chia quyền rõ theo role;
- business rules được chốt trước nên flow nhất quán;
- dữ liệu khám, kê đơn, hóa đơn liên kết chặt;
- quy định được version hóa;
- báo cáo tháng lấy từ dữ liệu nghiệp vụ thật.

---

## 6. Câu hỏi phản biện có thể gặp

### Vì sao không dùng microservices?
Trả lời: ver1 ưu tiên khả năng triển khai ổn định, dễ debug, dễ demo với team nhỏ.

### Vì sao chọn PostgreSQL?
Trả lời: dữ liệu nghiệp vụ có quan hệ rõ, cần transaction tốt, reporting cơ bản thuận lợi.

### Vì sao backend-first?
Trả lời: business rules của hệ thống này nặng ở phía nghiệp vụ và dữ liệu, nên phải chốt backend và DB trước để frontend không bị làm sai flow.

### Nếu đổi quy định thì sao?
Trả lời: dùng versioning, quy định mới không hồi tố dữ liệu đã chốt.

---

## 7. Checklist trước giờ demo

- [ ] login được tất cả role
- [ ] dữ liệu seed ổn định
- [ ] flow create visit hoạt động
- [ ] flow examination hoạt động
- [ ] flow invoice/payment hoạt động
- [ ] report mở được
- [ ] có sẵn phương án demo backup bằng ảnh/chụp màn hình nếu app lỗi
