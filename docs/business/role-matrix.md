# Role Matrix

## 1. Mục tiêu

Tài liệu này định nghĩa quyền của từng actor trong ver1. Đây là cơ sở cho RBAC ở backend và ẩn/hiện hành vi ở frontend.

---

## 2. Danh sách role

- `ADMIN`
- `RECEPTIONIST`
- `DOCTOR`
- `CASHIER`
- `MANAGER`

---

## 3. Ma trận quyền mức nghiệp vụ

| Chức năng | Admin | Receptionist | Doctor | Cashier | Manager |
|---|---:|---:|---:|---:|---:|
| Đăng nhập | ✓ | ✓ | ✓ | ✓ | ✓ |
| Xem hồ sơ cá nhân | ✓ | ✓ | ✓ | ✓ | ✓ |
| Quản lý user | ✓ |  |  |  |  |
| Gán role | ✓ |  |  |  |  |
| Xem role/permission | ✓ |  |  |  |  |
| Tra cứu bệnh nhân | ✓ | ✓ | ✓ |  | ✓ |
| Tạo hồ sơ bệnh nhân | ✓ | ✓ |  |  |  |
| Sửa hồ sơ bệnh nhân | ✓ | ✓ |  |  |  |
| Tạo lượt khám | ✓ | ✓ |  |  |  |
| Xem danh sách khám ngày | ✓ | ✓ | ✓ |  | ✓ |
| Gán bác sĩ cho lượt khám | ✓ | ✓ |  |  |  |
| Hủy lượt khám | ✓ | ✓ |  |  |  |
| Mở khám | ✓ |  | ✓ |  |  |
| Sửa bệnh án đang mở | ✓ |  | ✓ |  |  |
| Hoàn tất phiếu khám | ✓ |  | ✓ |  |  |
| Xem lịch sử khám | ✓ | ✓ | ✓ |  | ✓ |
| Kê đơn thuốc | ✓ |  | ✓ |  |  |
| Xem toa thuốc | ✓ |  | ✓ | ✓ | ✓ |
| Tạo hóa đơn | ✓ |  |  | ✓ |  |
| Tra cứu hóa đơn | ✓ |  |  | ✓ | ✓ |
| Ghi nhận thanh toán | ✓ |  |  | ✓ |  |
| Xem payment history | ✓ |  |  | ✓ | ✓ |
| Quản lý danh mục bệnh | ✓ |  |  |  |  |
| Quản lý danh mục thuốc | ✓ |  |  |  |  |
| Xem danh mục bệnh/thuốc | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tạo/kích hoạt quy định | ✓ |  |  |  | ✓ |
| Xem quy định hiện hành | ✓ | ✓ | ✓ | ✓ | ✓ |
| Xem báo cáo tháng | ✓ |  |  |  | ✓ |
| Xem audit logs | ✓ |  |  |  |  |

---

## 4. Quy tắc quan trọng theo role

### Admin

- Có toàn quyền cấu hình hệ thống và user
- Không có nghĩa là được bỏ qua business rule
- Những hành động nhạy cảm của admin phải được audit

### Receptionist

- Chịu trách nhiệm patient + visit intake
- Không được sửa bệnh án
- Không được ghi nhận payment

### Doctor

- Chịu trách nhiệm examination + prescription
- Không được tạo user, đổi role, đổi quy định
- Không được trực tiếp issue payment

### Cashier

- Chịu trách nhiệm invoice + payment
- Không được sửa nội dung bệnh án hoặc toa
- Được xem đơn thuốc để lập hóa đơn nhưng không được chỉnh sửa toa

### Manager

- Chủ yếu đọc dữ liệu quản trị, báo cáo, quy định
- Có thể xem thông tin tổng hợp và cấu hình ở mức quản lý nếu team thống nhất
- Không phải role vận hành hằng ngày như lễ tân/bác sĩ/thu ngân

---

## 5. Mapping quyền API mức cao

### Auth & Users
- `ADMIN`: full
- others: chỉ `login`, `logout`, `me`

### Patients
- `ADMIN`, `RECEPTIONIST`: create/update/search
- `DOCTOR`: search/read
- `MANAGER`: read nếu cần báo cáo hoặc xem hồ sơ tổng quan

### Visits
- `ADMIN`, `RECEPTIONIST`: create/list/cancel/assign-doctor
- `DOCTOR`: list/read/open-examination với điều kiện phù hợp

### Examinations / Prescriptions
- `ADMIN`, `DOCTOR`: create/update/complete theo rule
- `CASHIER`, `MANAGER`: read-only ở phần cần thiết

### Billing / Payment
- `ADMIN`, `CASHIER`: create invoice / record payment
- `MANAGER`: read-only

### Regulation / Report
- `ADMIN`, `MANAGER`: read
- `ADMIN`: full write
- `MANAGER`: write hay không tùy team chốt; trong ver1 khuyến nghị `read`, còn activation do `ADMIN`

---

## 6. Gợi ý permission code nền

### User / Auth
- `user.read`
- `user.create`
- `user.update`
- `user.assign_role`

### Patient
- `patient.read`
- `patient.create`
- `patient.update`

### Visit
- `visit.read`
- `visit.create`
- `visit.cancel`
- `visit.assign_doctor`
- `visit.open_examination`

### Examination
- `examination.read`
- `examination.update`
- `examination.complete`

### Prescription
- `prescription.read`
- `prescription.create`
- `prescription.update`

### Billing
- `invoice.read`
- `invoice.create`
- `invoice.issue`
- `payment.create`
- `payment.read`

### Catalog
- `disease.manage`
- `drug.manage`
- `catalog.read`

### Regulation / Report / Audit
- `regulation.read`
- `regulation.manage`
- `report.read`
- `audit.read`

---

## 7. Nguyên tắc triển khai RBAC

- check ở backend là bắt buộc;
- frontend chỉ hỗ trợ UX;
- ngoài role-level check, một số API còn cần record-level check;
- mọi hành động vượt quyền phải trả lỗi rõ ràng.
