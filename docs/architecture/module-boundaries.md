# Module Boundaries

## 1. Mục tiêu

Tài liệu này chốt ranh giới module để tránh:

- code lẫn trách nhiệm;
- module gọi chéo hỗn loạn;
- service nào cũng sửa mọi thứ.

---

## 2. Danh sách module chính

1. Auth & User Management
2. RBAC / Permission
3. Patient
4. Reception / Visit Intake
5. Examination / Medical Record
6. Prescription
7. Billing & Payment
8. Disease Catalog
9. Drug Catalog
10. Regulation
11. Monthly Report
12. Audit / Logging

---

## 3. Ranh giới ngắn gọn từng module

### Auth & User Management

Chịu trách nhiệm:
- login;
- logout;
- refresh token;
- user profile;
- user CRUD cơ bản.

Không chịu trách nhiệm:
- business rule của visit/exam/payment.

### RBAC / Permission

Chịu trách nhiệm:
- role;
- permission;
- gán role;
- check quyền route-level.

Không chịu trách nhiệm:
- xác thực token;
- validate business record ownership sâu.

### Patient

Chịu trách nhiệm:
- hồ sơ bệnh nhân;
- tra cứu;
- chống trùng;
- cập nhật thông tin nền.

Không chịu trách nhiệm:
- queue khám;
- examination;
- invoice.

### Reception / Visit Intake

Chịu trách nhiệm:
- tiếp nhận;
- tạo visit;
- sinh số thứ tự;
- danh sách khám ngày;
- gán bác sĩ nếu có.

Không chịu trách nhiệm:
- nội dung bệnh án;
- đơn thuốc;
- thanh toán.

### Examination / Medical Record

Chịu trách nhiệm:
- mở examination;
- cập nhật phiếu khám;
- chẩn đoán;
- hoàn tất khám.

Không chịu trách nhiệm:
- phát hành hóa đơn;
- quản lý user.

### Prescription

Chịu trách nhiệm:
- tạo/sửa toa;
- quản lý prescription items;
- validate thuốc active.

Không chịu trách nhiệm:
- payment;
- disease catalog CRUD.

### Billing & Payment

Chịu trách nhiệm:
- tạo invoice;
- snapshot giá;
- issue invoice;
- ghi nhận payment;
- cập nhật trạng thái hóa đơn.

Không chịu trách nhiệm:
- thay đổi nội dung bệnh án;
- tạo visit.

### Disease Catalog / Drug Catalog

Chịu trách nhiệm:
- CRUD danh mục;
- active/inactive.

Không chịu trách nhiệm:
- logic examination hay billing ngoài chuyện cung cấp dữ liệu danh mục.

### Regulation

Chịu trách nhiệm:
- version hóa quy định;
- active regulation set;
- cung cấp giá trị quy định hiện hành.

Không chịu trách nhiệm:
- tự hồi tố dữ liệu cũ.

### Monthly Report

Chịu trách nhiệm:
- query tổng hợp;
- báo cáo tháng;
- dashboard summary.

Không chịu trách nhiệm:
- sửa dữ liệu nghiệp vụ gốc.

### Audit / Logging

Chịu trách nhiệm:
- log request;
- log audit action;
- truy vết thao tác nhạy cảm.

Không chịu trách nhiệm:
- quyết định nghiệp vụ thay module khác.

---

## 4. Phụ thuộc module chính thức

```text
Auth/RBAC
   ↓
Patient + Catalog + Regulation
   ↓
Visit Intake
   ↓
Examination
   ↓
Prescription
   ↓
Billing & Payment
   ↓
Monthly Report
```

---

## 5. Quy tắc gọi chéo

- Module chỉ gọi sang module khác khi thật sự cần dữ liệu hoặc validation phụ thuộc
- Ưu tiên gọi qua service công khai, không đọc trực tiếp internals của module khác
- Không để 1 service vừa xử lý visit, exam, payment trong cùng class hỗn tạp

---

## 6. Quy tắc khi có logic “khó đặt”

Nếu logic liên quan nhiều module:

1. xác định use case bắt đầu từ đâu;
2. module sở hữu use case sẽ điều phối transaction;
3. các module khác chỉ cung cấp dependency cần thiết.

Ví dụ:
- tạo invoice từ visit completed là use case của `Billing`, không phải của `Visit`.
