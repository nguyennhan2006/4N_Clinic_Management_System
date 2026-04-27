# API Scope

## 1. Mục tiêu

Tài liệu này chốt phạm vi REST API cho ver1 để backend và frontend làm việc cùng một contract.

---

## 2. Quy ước chung

### Base path

```text
/api/v1
```

### Response thành công

```json
{
  "success": true,
  "message": "optional",
  "data": {},
  "meta": {}
}
```

### Response lỗi nghiệp vụ

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_ERROR_CODE",
    "message": "Mô tả lỗi"
  }
}
```

---

## 3. Nguyên tắc ưu tiên implementation

### P1
API bắt buộc để luồng ver1 chạy được

### P2
API quan trọng nhưng có thể làm sau P1

### P3
API nice-to-have cho ver1, làm nếu còn thời gian

---

## 4. Auth & User Management

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/auth/login` | POST | đăng nhập | P1 |
| `/auth/refresh` | POST | làm mới access token | P1 |
| `/auth/logout` | POST | logout | P1 |
| `/auth/me` | GET | lấy profile hiện tại | P1 |
| `/users` | GET | danh sách user | P2 |
| `/users` | POST | tạo user | P1 |
| `/users/:id` | PATCH | cập nhật user | P2 |
| `/users/:id/roles` | PUT | gán role | P1 |

---

## 5. RBAC

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/roles` | GET | danh sách role | P1 |
| `/permissions` | GET | danh sách permission | P1 |
| `/roles/:id/permissions` | PUT | gán permission cho role | P2 |

---

## 6. Patient

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/patients` | GET | tra cứu bệnh nhân | P1 |
| `/patients` | POST | tạo hồ sơ bệnh nhân | P1 |
| `/patients/:id` | GET | xem chi tiết bệnh nhân | P1 |
| `/patients/:id` | PATCH | sửa hồ sơ bệnh nhân | P2 |
| `/patients/:id/visits` | GET | xem lịch sử khám | P1 |

---

## 7. Reception / Visit Intake

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/visits` | POST | tạo lượt khám | P1 |
| `/visits` | GET | danh sách khám ngày | P1 |
| `/visits/:id` | GET | chi tiết lượt khám | P1 |
| `/visits/:id/assign-doctor` | POST | gán bác sĩ | P2 |
| `/visits/:id/cancel` | POST | hủy lượt khám | P2 |
| `/visits/:id/open-examination` | POST | mở khám | P1 |

---

## 8. Examination / Medical Record

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/examinations/:id` | GET | xem bệnh án | P1 |
| `/examinations/:id` | PATCH | cập nhật bệnh án | P1 |
| `/examinations/:id/diagnoses` | PUT | cập nhật chẩn đoán | P1 |
| `/examinations/:id/complete` | POST | hoàn tất khám | P1 |
| `/examinations` | GET | tra cứu bệnh án | P2 |

---

## 9. Prescription

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/examinations/:id/prescription` | POST | tạo hoặc upsert toa thuốc | P1 |
| `/prescriptions/:id/items` | POST | thêm dòng thuốc | P1 |
| `/prescriptions/:id/items/:itemId` | PATCH | sửa dòng thuốc | P1 |
| `/prescriptions/:id/items/:itemId` | DELETE | xóa dòng thuốc | P2 |
| `/prescriptions/:id` | GET | xem toa thuốc | P1 |
| `/prescriptions/:id/finalize` | POST | chốt toa | P2 |

---

## 10. Billing & Payment

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/visits/:id/invoice` | POST | tạo hóa đơn | P1 |
| `/invoices` | GET | tra cứu hóa đơn | P1 |
| `/invoices/:id` | GET | chi tiết hóa đơn | P1 |
| `/invoices/:id/issue` | POST | phát hành hóa đơn | P2 |
| `/invoices/:id/payments` | POST | ghi nhận thanh toán | P1 |
| `/payments` | GET | tra cứu payment | P2 |
| `/invoices/:id/void` | POST | hủy hóa đơn | P3 |

---

## 11. Disease Catalog

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/diseases` | GET | list/search bệnh | P1 |
| `/diseases` | POST | tạo bệnh | P2 |
| `/diseases/:id` | PATCH | sửa bệnh | P2 |

---

## 12. Drug Catalog

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/drugs` | GET | list/search thuốc | P1 |
| `/drugs` | POST | tạo thuốc | P2 |
| `/drugs/:id` | PATCH | sửa thuốc | P2 |

---

## 13. Regulation

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/regulations/current` | GET | xem quy định hiện hành | P1 |
| `/regulation-versions` | GET | danh sách version quy định | P2 |
| `/regulation-versions` | POST | tạo version nháp | P2 |
| `/regulation-versions/:id/activate` | POST | kích hoạt version | P1 |

---

## 14. Monthly Report

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/reports/monthly-summary` | GET | tổng quan tháng | P2 |
| `/reports/monthly-revenue` | GET | doanh thu theo tháng | P2 |
| `/reports/monthly-disease-breakdown` | GET | cơ cấu bệnh | P2 |
| `/reports/monthly-drug-usage` | GET | sử dụng thuốc | P3 |

---

## 15. Audit

| Endpoint | Method | Mục đích | Priority |
|---|---|---|---|
| `/audit-logs` | GET | danh sách audit logs | P2 |
| `/audit-logs/:id` | GET | chi tiết audit log | P2 |

---

## 16. API phụ thuộc business rules nào trước khi code

### Cần chốt rule trước

- `/visits` POST
- `/visits/:id/open-examination`
- `/examinations/:id/complete`
- `/prescriptions/:id/items`
- `/visits/:id/invoice`
- `/invoices/:id/payments`
- `/regulation-versions/:id/activate`
- mọi API báo cáo tháng

---

## 17. API có thể code độc lập sớm

- `/auth/login`
- `/auth/me`
- `/roles`
- `/permissions`
- `/diseases` GET
- `/drugs` GET
- `/regulations/current`

---

## 18. API cần DB schema xong trước

- Patient CRUD
- Visit create/list
- Examination endpoints
- Prescription endpoints
- Billing/Payment endpoints
- Reports

---

## 19. Nguyên tắc giữ contract ổn định

- Không đổi request/response tùy ý khi frontend đã bám vào
- Nếu cần đổi lớn, phải cập nhật tài liệu và thông báo rõ trong PR
- Swagger sẽ là contract kỹ thuật chính thức khi code backend bắt đầu hoàn thiện
