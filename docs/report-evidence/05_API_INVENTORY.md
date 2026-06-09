# 05 — Kiểm kê API Endpoints

> API Prefix: `/api`  
> Swagger UI: `http://localhost:3000/api/docs`  
> Auth: Bearer Token (JWT) — trừ login/refresh

---

## 1. Phase 1 — Endpoints lõi

### Auth Module (`/api/auth`)

| Method | Endpoint | Controller method | DTO/Input | Roles/Guard | Business rule | Trạng thái |
|---|---|---|---|---|---|---|
| POST | `/auth/login` | `login()` | `{ email, password }` | **Public** | Validate bcrypt, issue access+refresh token | CONFIRMED |
| POST | `/auth/refresh` | `refresh()` | `{ refreshToken }` | **Public** | Validate token hash, rotate refresh token | CONFIRMED |
| POST | `/auth/logout` | `logout()` | `{ refreshToken }` | JwtGuard | Revoke refresh token | CONFIRMED |
| GET | `/auth/me` | `getMe()` | — | JwtGuard | Trả thông tin user hiện tại kèm roles | CONFIRMED |

### Users Module (`/api/users`)

| Method | Endpoint | Controller method | DTO/Input | Roles/Guard | Business rule | Trạng thái |
|---|---|---|---|---|---|---|
| GET | `/users` | `findAll()` | Query params | JwtGuard + ADMIN | — | CONFIRMED |
| GET | `/users/:id` | `findOne()` | — | JwtGuard + ADMIN | — | CONFIRMED |
| POST | `/users` | `create()` | `CreateUserDto` | JwtGuard + ADMIN | Hash password | CONFIRMED |
| PATCH | `/users/:id` | `update()` | `UpdateUserDto` | JwtGuard + ADMIN | — | CONFIRMED |
| PATCH | `/users/:id/lock` | `lock()` | — | JwtGuard + ADMIN | Toggle ACTIVE/LOCKED | CONFIRMED |
| PATCH | `/users/:id/roles` | `updateRoles()` | `{ roles: string[] }` | JwtGuard + ADMIN | Gán vai trò hàng loạt | CONFIRMED |

### RBAC Module (`/api/rbac`)

| Method | Endpoint | Controller method | DTO/Input | Roles/Guard | Trạng thái |
|---|---|---|---|---|---|
| GET | `/rbac/roles` | `getRoles()` | — | JwtGuard + ADMIN | CONFIRMED |
| GET | `/rbac/permissions` | `getPermissions()` | — | JwtGuard + ADMIN | CONFIRMED |
| PATCH | `/rbac/roles/:id/permissions` | `updateRolePermissions()` | `{ permissionIds: string[] }` | JwtGuard + ADMIN | CONFIRMED |

### Patients Module (`/api/patients`)

| Method | Endpoint | Controller method | DTO/Input | Roles/Guard | Business rule | Trạng thái |
|---|---|---|---|---|---|---|
| GET | `/patients` | `findAll()` | `?search=&page=` | JwtGuard (mọi role) | — | CONFIRMED |
| POST | `/patients` | `create()` | `CreatePatientDto` | JwtGuard + RECEPTIONIST/ADMIN | Unique citizenId | CONFIRMED |
| GET | `/patients/:id` | `findOne()` | — | JwtGuard | — | CONFIRMED |
| GET | `/patients/:id/medical-history` | `getMedicalHistory()` | — | JwtGuard + DOCTOR/ADMIN | Trả visits + examinations | CONFIRMED |

### Visits Module (`/api/visits`)

| Method | Endpoint | Controller method | DTO/Input | Roles/Guard | Business rule | Trạng thái |
|---|---|---|---|---|---|---|
| POST | `/visits` | `create()` | `CreateVisitDto` | JwtGuard + RECEPTIONIST/ADMIN | Unique/date check, quota check | CONFIRMED |
| GET | `/visits` | `findAll()` | `QueryVisitsDto` (date, status) | JwtGuard | — | CONFIRMED |
| POST | `/visits/:id/open-examination` | `openExamination()` | `{ doctorId }` | JwtGuard + DOCTOR/ADMIN | Check status WAITING→IN_EXAMINATION | CONFIRMED |

### Examinations Module (`/api/examinations`)

| Method | Endpoint | Controller method | DTO/Input | Roles/Guard | Business rule | Trạng thái |
|---|---|---|---|---|---|---|
| GET | `/examinations/:id` | `findOne()` | — | JwtGuard + DOCTOR/ADMIN | — | CONFIRMED |
| PATCH | `/examinations/:id` | `update()` | `UpdateExaminationDto` | JwtGuard + DOCTOR/ADMIN | Check status OPEN | CONFIRMED |
| POST | `/examinations/:id/prescription` | `createPrescription()` | `CreatePrescriptionDto` | JwtGuard + DOCTOR/ADMIN | No duplicate, min 1 item, active drugs | CONFIRMED |
| PUT | `/examinations/:id/prescription` | `updatePrescription()` | `CreatePrescriptionDto` | JwtGuard + DOCTOR/ADMIN | Min 1 item, active drugs | CONFIRMED |
| DELETE | `/examinations/:id/prescription` | `deletePrescription()` | — | JwtGuard + DOCTOR/ADMIN | Check status OPEN | CONFIRMED |
| POST | `/examinations/:id/complete` | `complete()` | — | JwtGuard + DOCTOR/ADMIN | Check OPEN status, required fields | CONFIRMED |

### Billing Module (`/api`)

| Method | Endpoint | Controller method | DTO/Input | Roles/Guard | Business rule | Trạng thái |
|---|---|---|---|---|---|---|
| POST | `/visits/:visitId/invoice` | `createInvoice()` | `CreateInvoiceDto` | JwtGuard + CASHIER/ADMIN | Visit COMPLETED, no duplicate | CONFIRMED |
| GET | `/invoices` | `findAll()` | Query params | JwtGuard + CASHIER/ADMIN | — | CONFIRMED |
| GET | `/invoices/:id` | `findOne()` | — | JwtGuard | — | CONFIRMED |
| GET | `/invoices/:id/items` | `getItems()` | — | JwtGuard | — | CONFIRMED |
| POST | `/invoices/:id/payments` | `createPayment()` | `CreatePaymentDto` | JwtGuard + CASHIER/ADMIN | Amount > 0, not PAID/VOID, no overpayment | CONFIRMED |

### Catalog Modules

| Method | Endpoint | Module | Roles/Guard | Trạng thái |
|---|---|---|---|---|
| GET | `/drugs` | drugs | JwtGuard | CONFIRMED |
| POST | `/drugs` | drugs | JwtGuard + ADMIN | CONFIRMED |
| PATCH | `/drugs/:id` | drugs | JwtGuard + ADMIN | CONFIRMED |
| GET | `/diseases` | diseases | JwtGuard | CONFIRMED |
| POST | `/diseases` | diseases | JwtGuard + ADMIN | CONFIRMED |
| PATCH | `/diseases/:id` | diseases | JwtGuard + ADMIN | CONFIRMED |
| GET | `/regulations/current` | regulations | JwtGuard | CONFIRMED |
| POST | `/regulations` | regulations | JwtGuard + ADMIN | CONFIRMED |
| PATCH | `/regulations/:id/activate` | regulations | JwtGuard + ADMIN | CONFIRMED |

### Reports Module (`/api/reports`)

| Method | Endpoint | Roles/Guard | Trạng thái |
|---|---|---|---|
| GET | `/reports/monthly?month=&year=` | JwtGuard + MANAGER/ADMIN | CONFIRMED |
| GET | `/reports/revenue-breakdown?month=&year=` | JwtGuard + MANAGER/ADMIN | CONFIRMED |

---

## 2. Phase 2 — Endpoints mở rộng

### Appointments (`/api/appointments`)

| Method | Endpoint | Roles/Guard | Trạng thái |
|---|---|---|---|
| GET | `/appointments` | JwtGuard + RECEPTIONIST/ADMIN | CONFIRMED |
| POST | `/appointments` | JwtGuard + RECEPTIONIST/ADMIN | CONFIRMED |
| GET | `/appointments/:id` | JwtGuard | CONFIRMED |
| PATCH | `/appointments/:id` | JwtGuard + RECEPTIONIST/ADMIN | CONFIRMED |
| PATCH | `/appointments/:id/cancel` | JwtGuard + RECEPTIONIST/ADMIN | CONFIRMED |
| POST | `/appointments/:id/checkin` | JwtGuard + RECEPTIONIST/ADMIN | CONFIRMED |

### Queue (`/api/queue`)

| Method | Endpoint | Roles/Guard | Trạng thái |
|---|---|---|---|
| GET | `/queue` | JwtGuard | CONFIRMED |
| GET | `/queue/next` | JwtGuard | CONFIRMED |
| GET | `/queue/:id` | JwtGuard | CONFIRMED |
| PATCH | `/queue/:id/status` | JwtGuard + DOCTOR/NURSE/ADMIN | CONFIRMED |

### Vitals (`/api/vitals`)

| Method | Endpoint | Roles/Guard | Trạng thái |
|---|---|---|---|
| POST | `/vitals` | JwtGuard + NURSE/DOCTOR/ADMIN | CONFIRMED |
| GET | `/vitals/visit/:visitId` | JwtGuard | CONFIRMED |

### Services (`/api/services`)

| Method | Endpoint | Roles/Guard | Trạng thái |
|---|---|---|---|
| GET | `/services/service-catalog` | JwtGuard | CONFIRMED |
| POST | `/services/service-catalog` | JwtGuard + ADMIN/MANAGER | CONFIRMED |
| PATCH | `/services/service-catalog/:id` | JwtGuard + ADMIN/MANAGER | CONFIRMED |
| GET | `/services/service-orders` | JwtGuard | CONFIRMED |
| GET | `/services/service-orders/:id` | JwtGuard | CONFIRMED |
| POST | `/services/service-orders` | JwtGuard + DOCTOR/ADMIN | CONFIRMED |
| PATCH | `/services/service-orders/:id/status` | JwtGuard | CONFIRMED |

### Lab (`/api/lab`)

| Method | Endpoint | Roles/Guard | Trạng thái |
|---|---|---|---|
| POST | `/lab/orders` | JwtGuard + DOCTOR/ADMIN | CONFIRMED |
| GET | `/lab/orders` | JwtGuard | CONFIRMED |
| GET | `/lab/orders/:id` | JwtGuard | CONFIRMED |
| POST | `/lab/orders/:id/sample` | JwtGuard + NURSE/LAB_TECHNICIAN/ADMIN | CONFIRMED |
| POST | `/lab/orders/:id/result` | JwtGuard + LAB_TECHNICIAN/ADMIN | CONFIRMED |
| POST | `/lab/orders/:id/verify` | JwtGuard + DOCTOR/LAB_TECHNICIAN/ADMIN | CONFIRMED |
| GET | `/lab/orders/:id/result` | JwtGuard | CONFIRMED |

### Inventory (`/api/inventory`)

| Method | Endpoint | Roles/Guard | Trạng thái |
|---|---|---|---|
| GET | `/inventory/stock` | JwtGuard + PHARMACIST/ADMIN | CONFIRMED |
| GET | `/inventory/lots` | JwtGuard | CONFIRMED |
| POST | `/inventory/lots` | JwtGuard + PHARMACIST/ADMIN | CONFIRMED |
| GET | `/inventory/lots/:id` | JwtGuard | CONFIRMED |
| GET | `/inventory/movements` | JwtGuard + PHARMACIST/ADMIN | CONFIRMED |
| GET | `/inventory/drugs/:drugId/stock` | JwtGuard | CONFIRMED |

### Pharmacy (`/api/pharmacy`)

| Method | Endpoint | Roles/Guard | Trạng thái |
|---|---|---|---|
| GET | `/pharmacy/worklist` | JwtGuard + PHARMACIST/ADMIN | CONFIRMED |
| POST | `/pharmacy/dispense` | JwtGuard + PHARMACIST/ADMIN | CONFIRMED |
| GET | `/pharmacy/dispense` | JwtGuard | CONFIRMED |
| GET | `/pharmacy/dispense/:id` | JwtGuard | CONFIRMED |
| PATCH | `/pharmacy/dispense/:id/cancel` | JwtGuard + PHARMACIST/ADMIN | CONFIRMED |

### Organization (`/api/organization`)

| Method | Endpoint | Roles/Guard | Trạng thái |
|---|---|---|---|
| GET | `/organization/departments` | JwtGuard | CONFIRMED |
| POST | `/organization/departments` | JwtGuard + ADMIN | CONFIRMED |
| PATCH | `/organization/departments/:id` | JwtGuard + ADMIN | CONFIRMED |
| GET | `/organization/rooms` | JwtGuard | CONFIRMED |
| POST | `/organization/rooms` | JwtGuard + ADMIN | CONFIRMED |
| PATCH | `/organization/rooms/:id` | JwtGuard + ADMIN | CONFIRMED |
| GET | `/organization/doctors` | JwtGuard | CONFIRMED |
| POST | `/organization/doctors` | JwtGuard + ADMIN | CONFIRMED |
| PATCH | `/organization/doctors/:id` | JwtGuard + ADMIN | CONFIRMED |
| GET/POST/DELETE | `/organization/schedules` | JwtGuard + ADMIN | CONFIRMED |

### Audit (`/api/audit`)

| Method | Endpoint | Roles/Guard | Trạng thái |
|---|---|---|---|
| GET | `/audit` | JwtGuard + ADMIN | CONFIRMED |

---

## 3. Tổng kết API

| Hạng mục | Số lượng |
|---|---|
| Phase 1 endpoints | ~35 |
| Phase 2 endpoints | ~50 |
| Tổng endpoints | ~85 |
| Endpoint có JwtGuard | ~85 (100%) |
| Endpoint public (không auth) | 2 (login, refresh) |
| Endpoint có Role restriction | ~75% |

---

## 4. Rủi ro API

| Risk ID | Endpoint | Mô tả rủi ro | Mức độ | Khuyến nghị |
|---|---|---|---|---|
| R-API-01 | `GET /patients/:id/medical-history` | NEED_MANUAL_CONFIRMATION: kiểm tra lại role guard | Thấp | Đọc lại controller để xác nhận |
| R-API-02 | `GET /reports/monthly` | Không giới hạn date range — có thể query lớn | Thấp | Ghi chú trong báo cáo |
| R-API-03 | `POST /examinations/:id/complete` | Không check pending lab/service obligations | Trung bình | Ghi như limitation trong báo cáo |
