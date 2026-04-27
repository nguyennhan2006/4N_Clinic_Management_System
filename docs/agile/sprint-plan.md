# Sprint Plan

## 1. Khung thời gian

Dự án ver1 được triển khai trong **6 tuần**, mỗi tuần có **2 buổi họp chốt progress**.

### Cadence khuyến nghị
- Buổi 1: đầu tuần, planning + unblock
- Buổi 2: cuối tuần, demo + review + retro

---

## 2. Sprint 0 — Chuẩn bị

### Objective
Chốt nền tảng để sprint sau code được ngay.

### Backlog chính
- hoàn thiện docs nền;
- chốt business rules;
- chốt role matrix;
- chốt API scope;
- scaffold backend/frontend;
- init Prisma;
- draft ERD implementation.

### Deliverables
- repo sạch;
- docs cơ bản đầy đủ;
- backend và frontend chạy được;
- DB draft rõ.

---

## 3. Sprint 1 — Nền tảng hệ thống

### Objective
Đăng nhập được, có auth nền và schema nền.

### Backlog chính
- user/role/permission schema;
- login/refresh/me;
- JWT guard;
- seed roles/users;
- audit nền cơ bản.

### Deliverables
- login flow chạy được;
- route protected hoạt động;
- seed tài khoản demo.

---

## 4. Sprint 2 — Bệnh nhân + tiếp nhận

### Objective
Lễ tân có thể tạo bệnh nhân và tạo lượt khám.

### Backlog chính
- patient CRUD cơ bản;
- patient search;
- duplicate-check;
- visit schema;
- daily counter;
- create visit;
- visit list theo ngày;
- rule max patients per day.

### Deliverables
- luồng demo: login → tạo bệnh nhân → tạo visit.

---

## 5. Sprint 3 — Khám bệnh + kê đơn

### Objective
Bác sĩ có thể mở khám, cập nhật bệnh án và kê đơn.

### Backlog chính
- open examination;
- update examination;
- diagnosis;
- drug catalog read;
- prescription + prescription items;
- complete examination.

### Deliverables
- luồng demo: bác sĩ nhận visit → khám → kê đơn → hoàn tất khám.

---

## 6. Sprint 4 — Hóa đơn + thanh toán

### Objective
Thu ngân lập hóa đơn và ghi nhận thanh toán.

### Backlog chính
- invoice schema;
- invoice item snapshot;
- create invoice;
- invoice detail;
- record payment;
- invoice status update;
- invoice list.

### Deliverables
- luồng demo: visit completed → invoice → payment.

---

## 7. Sprint 5 — Quy định + báo cáo + hardening

### Objective
Hoàn thiện admin/manager flow, báo cáo tháng và khóa bản demo.

### Backlog chính
- regulation versioning;
- activate regulation;
- monthly report queries;
- report APIs;
- frontend integration;
- bug fixing;
- regression testing;
- demo data hardening.

### Deliverables
- demo full flow;
- báo cáo tháng cơ bản;
- quy định hiện hành hoạt động.

---

## 8. Phân công khuyến nghị cho team 4 người

| Thành viên | Phụ trách chính |
|---|---|
| A | Core, Auth, RBAC, DB nền, release |
| B | Patient, Visit Intake |
| C | Examination, Prescription |
| D | Billing, Report, FE integration |

---

## 9. Quy tắc carry-over

Nếu task không xong trong sprint:

- không đánh Done giả;
- ghi rõ phần đã xong / phần chưa xong;
- đánh giá lại dependency;
- đưa vào sprint sau với scope được cắt gọn nếu cần.

---

## 10. Checklist cuối mỗi sprint

- có cái gì chạy được để demo;
- docs có cập nhật chưa;
- DB schema có lệch docs không;
- API contract có rõ không;
- bug blocker nào còn tồn tại;
- task nào cần carry-over.
