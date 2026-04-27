# Architecture Overview

## 1. Mục tiêu kiến trúc

Kiến trúc của `4N_Clinic_Management_System` ver1 phải đáp ứng đồng thời các mục tiêu sau:

- dễ hiểu với team sinh viên;
- dev được ngay;
- chia việc song song được;
- kiểm thử được;
- dễ mở rộng ở ver2;
- không kéo team vào độ phức tạp hạ tầng không cần thiết.

---

## 2. Kiến trúc chốt

### Kiến trúc tổng thể

- **Web Application**
- **Modular Monolith**
- **REST API**
- **PostgreSQL 18**
- **Backend-first**

### Thành phần chính

- Frontend: React Web App
- Backend: NestJS REST API
- Database: PostgreSQL 18
- ORM / query layer: Prisma

---

## 3. Sơ đồ logic

```text
[React Web App]
      |
      v
[REST API - NestJS]
      |
      +--> Auth & User Management
      +--> RBAC / Permission
      +--> Patient
      +--> Reception / Visit Intake
      +--> Examination / Medical Record
      +--> Prescription
      +--> Billing & Payment
      +--> Disease Catalog
      +--> Drug Catalog
      +--> Regulation
      +--> Monthly Report
      +--> Audit / Logging
      |
      v
[Prisma]
      |
      v
[PostgreSQL 18]
```

---

## 4. Vì sao không chọn microservices ở ver1

Không chọn microservices cho ver1 vì:

- team nhỏ;
- domain chưa đủ lớn;
- nhiều service sẽ tăng gánh nặng DevOps;
- test tích hợp phức tạp hơn;
- rủi ro demo thất bại vì lỗi infra cao hơn lợi ích nhận được.

---

## 5. Boundary của các layer

### Controller layer

Nhiệm vụ:
- nhận request;
- parse input;
- gọi use case / service;
- trả response.

Không nên đặt business rule nặng ở đây.

### DTO / Validation layer

Nhiệm vụ:
- kiểm tra field bắt buộc;
- kiểm tra kiểu dữ liệu;
- kiểm tra enum;
- kiểm tra format cơ bản.

### Service / Use Case layer

Nhiệm vụ:
- xử lý business logic;
- gọi repository / Prisma;
- điều phối transaction;
- enforce rule nghiệp vụ;
- gọi audit nếu cần.

### Repository / Query layer

Nhiệm vụ:
- truy xuất dữ liệu;
- tách query phức tạp;
- hỗ trợ reporting query khi cần.

---

## 6. Nơi đặt các loại logic

| Loại logic | Nơi đặt |
|---|---|
| Request parsing | Controller |
| Validate kiểu dữ liệu | DTO / Validation |
| Validate nghiệp vụ | Service / Use Case |
| Authorization route-level | Guard |
| Authorization record-level | Service |
| Transaction handling | Service |
| Logging request | Interceptor / middleware |
| Audit trail | Audit service |
| Reporting query | Report module |

---

## 7. Luồng request điển hình

### 7.1 Tiếp nhận bệnh nhân

1. Frontend gửi request tạo bệnh nhân hoặc tìm bệnh nhân
2. Backend validate input
3. Service kiểm tra duplicate / business rule
4. Lưu patient hoặc dùng patient có sẵn
5. Frontend gửi request tạo visit
6. Service visit kiểm tra quota ngày, trạng thái, queue number
7. DB ghi visit trong transaction
8. Audit log nếu cần

### 7.2 Khám bệnh

1. Bác sĩ lấy danh sách visit chờ khám
2. Mở examination cho visit hợp lệ
3. Cập nhật triệu chứng, chẩn đoán
4. Kê đơn nếu cần
5. Hoàn tất examination
6. Trạng thái visit chuyển sang completed

### 7.3 Thanh toán

1. Thu ngân tạo invoice từ visit đã hoàn tất
2. Hệ thống snapshot phí khám và dòng thuốc
3. Phát hành hóa đơn
4. Ghi nhận payment
5. Cập nhật invoice status

---

## 8. Chiến lược reporting

Ở ver1, reporting chạy ngay trên transactional database theo hướng:

- query read-only;
- có thể dùng SQL view cho báo cáo tháng;
- chưa tách reporting service;
- chưa làm data warehouse.

---

## 9. Chiến lược mở rộng ver2

Nếu hệ thống lớn hơn ở ver2, có thể cân nhắc tách riêng:

- reporting service;
- notification service;
- inventory / pharmacy service;
- scheduling service.

Tuy nhiên, chỉ tách khi có bằng chứng rằng modular monolith không còn đủ tốt.

---

## 10. Quyết định kiến trúc chính thức

Kiến trúc chính thức cho ver1 là:

**Modular Monolith + REST API + PostgreSQL 18 + backend-first implementation.**
