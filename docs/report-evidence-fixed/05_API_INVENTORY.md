# 05 — API Inventory

> Audit date: 2026-06-07 | Nguồn: `backend/src/modules/**/*.controller.ts` đọc trực tiếp

---

## Canonical counts (thống nhất với file 00)

- **Tổng API endpoints: 92** (đếm từ HTTP decorator scan)
- **Phase 1 endpoints: 41**
- **Phase 2 endpoints: 51**
- API prefix: `/api/v1`
- Swagger UI: `http://localhost:3000/api/docs`
- Auth rule: tất cả endpoint yêu cầu `Authorization: Bearer <accessToken>` trừ `POST /api/v1/auth/login`

---

## Phase 1 Endpoints (41 endpoints)

### Auth Module — `@Controller('auth')`

| Method | Path | Controller method | Guard | Role | Business rule | Status |
|---|---|---|---|---|---|---|
| POST | `/api/v1/auth/login` | login() | None (public) | — | Validate credentials, issue tokens | CONFIRMED |
| POST | `/api/v1/auth/refresh` | refresh() | JwtAuth | — | Validate refresh token, issue new access token | CONFIRMED |
| POST | `/api/v1/auth/logout` | logout() | JwtAuth | — | Revoke refresh token | CONFIRMED |
| GET | `/api/v1/auth/me` | me() | JwtAuth | — | Return current user info | CONFIRMED |

### Users Module — `@Controller('users')`

| Method | Path | Controller method | Guard | Role | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/users` | findAll() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |
| GET | `/api/v1/users/:id` | findOne() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |
| POST | `/api/v1/users` | create() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |
| PATCH | `/api/v1/users/:id` | update() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |
| PATCH | `/api/v1/users/:id/lock` | lock() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |
| PATCH | `/api/v1/users/:id/roles` | updateRoles() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |

### RBAC Module — `@Controller('rbac')`

| Method | Path | Controller method | Guard | Role | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/rbac/roles` | getRoles() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |
| GET | `/api/v1/rbac/permissions` | getPermissions() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |
| PATCH | `/api/v1/rbac/roles/:id/permissions` | updateRolePermissions() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |

### Patients Module — `@Controller('patients')`

| Method | Path | Controller method | Guard | Role | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/patients` | findAll() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |
| POST | `/api/v1/patients` | create() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |
| GET | `/api/v1/patients/:id` | findOne() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |
| GET | `/api/v1/patients/:id/medical-history` | getMedicalHistory() | JwtAuth | NEED_MANUAL_CONFIRMATION | CONFIRMED |

### Visits Module — `@Controller('visits')`

| Method | Path | Controller method | Guard | Role | Business rule | Status |
|---|---|---|---|---|---|---|
| POST | `/api/v1/visits` | create() | JwtAuth | NEED_MANUAL_CONFIRMATION | No duplicate same patient/date; daily quota check | CONFIRMED |
| GET | `/api/v1/visits` | findAll() | JwtAuth | NEED_MANUAL_CONFIRMATION | Filter by date/status | CONFIRMED |
| POST | `/api/v1/visits/:id/open-examination` | openExamination() | JwtAuth | NEED_MANUAL_CONFIRMATION | Visit must be REGISTERED/WAITING; assign doctor | CONFIRMED |

### Examinations Module — `@Controller('examinations')`

| Method | Path | Controller method | Guard | Role | Business rule | Status |
|---|---|---|---|---|---|---|
| GET | `/api/v1/examinations/:id` | findOne() | JwtAuth | NEED_MANUAL_CONFIRMATION | — | CONFIRMED |
| PATCH | `/api/v1/examinations/:id` | update() | JwtAuth | NEED_MANUAL_CONFIRMATION | Only OPEN examination | CONFIRMED |
| POST | `/api/v1/examinations/:id/prescription` | createPrescription() | JwtAuth | NEED_MANUAL_CONFIRMATION | Drug must be active | CONFIRMED |
| PUT | `/api/v1/examinations/:id/prescription` | updatePrescription() | JwtAuth | NEED_MANUAL_CONFIRMATION | Replace full prescription | CONFIRMED |
| DELETE | `/api/v1/examinations/:id/prescription` | deletePrescription() | JwtAuth | NEED_MANUAL_CONFIRMATION | Examination must be OPEN | CONFIRMED |
| POST | `/api/v1/examinations/:id/complete` | complete() | JwtAuth | NEED_MANUAL_CONFIRMATION | Requires diagnosis; status → COMPLETED | CONFIRMED |

### Diseases Module — `@Controller('diseases')`

| Method | Path | Controller method | Status |
|---|---|---|---|
| GET | `/api/v1/diseases` | findAll() | CONFIRMED |
| POST | `/api/v1/diseases` | create() | CONFIRMED |
| PATCH | `/api/v1/diseases/:id` | update() | CONFIRMED |

### Drugs Module — `@Controller('drugs')`

| Method | Path | Controller method | Status |
|---|---|---|---|
| GET | `/api/v1/drugs` | findAll() | CONFIRMED |
| POST | `/api/v1/drugs` | create() | CONFIRMED |
| PATCH | `/api/v1/drugs/:id` | update() | CONFIRMED |

### Billing Module — `@Controller()` (không prefix riêng)

| Method | Path | Controller method | Business rule | Status |
|---|---|---|---|---|
| POST | `/api/v1/visits/:visitId/invoice` | createInvoice() | Visit phải COMPLETED; chỉ tạo 1 invoice | CONFIRMED |
| GET | `/api/v1/invoices` | findAll() | Filter by status/date | CONFIRMED |
| GET | `/api/v1/invoices/:id` | findOne() | — | CONFIRMED |
| GET | `/api/v1/invoices/:id/items` | getItems() | — | CONFIRMED |
| POST | `/api/v1/invoices/:id/payments` | createPayment() | Amount ≤ remaining; no overpayment | CONFIRMED |

### Regulations Module — `@Controller('regulations')`

| Method | Path | Controller method | Business rule | Status |
|---|---|---|---|---|
| GET | `/api/v1/regulations/current` | getCurrent() | Trả regulation version đang active | CONFIRMED |
| POST | `/api/v1/regulations` | create() | Tạo version mới (chưa active) | CONFIRMED |
| PATCH | `/api/v1/regulations/:id/activate` | activate() | Deactivate version cũ, activate version mới (transaction) | CONFIRMED |

### Reports Module — `@Controller('reports')` — Phase 1 endpoint

| Method | Path | Controller method | Status |
|---|---|---|---|
| GET | `/api/v1/reports/monthly` | getMonthly() | CONFIRMED (P1) |

---

## Phase 2 Endpoints (51 endpoints)

### Appointments — `@Controller('appointments')`

| Method | Path | Status |
|---|---|---|
| GET | `/api/v1/appointments` | CONFIRMED |
| POST | `/api/v1/appointments` | CONFIRMED |
| GET | `/api/v1/appointments/:id` | CONFIRMED |
| PATCH | `/api/v1/appointments/:id` | CONFIRMED |
| PATCH | `/api/v1/appointments/:id/cancel` | CONFIRMED |
| POST | `/api/v1/appointments/:id/checkin` | CONFIRMED — creates Visit from Appointment |

### Audit — `@Controller('audit-logs')`

| Method | Path | Status |
|---|---|---|
| GET | `/api/v1/audit-logs` | CONFIRMED |

### Queue — `@Controller('queue')`

| Method | Path | Status |
|---|---|---|
| GET | `/api/v1/queue` | CONFIRMED |
| GET | `/api/v1/queue/next` | CONFIRMED |
| GET | `/api/v1/queue/:id` | CONFIRMED |
| PATCH | `/api/v1/queue/:id/status` | CONFIRMED — state machine transitions |

### Vitals — `@Controller('vitals')`

| Method | Path | Status |
|---|---|---|
| POST | `/api/v1/vitals` | CONFIRMED — BMI auto-calculated |
| GET | `/api/v1/vitals/visit/:visitId` | CONFIRMED |

### Services — `@Controller('services')`

| Method | Path | Status |
|---|---|---|
| GET | `/api/v1/services/service-catalog` | CONFIRMED |
| POST | `/api/v1/services/service-catalog` | CONFIRMED |
| PATCH | `/api/v1/services/service-catalog/:id` | CONFIRMED |
| GET | `/api/v1/services/service-orders` | CONFIRMED |
| GET | `/api/v1/services/service-orders/:id` | CONFIRMED |
| POST | `/api/v1/services/service-orders` | CONFIRMED |
| PATCH | `/api/v1/services/service-orders/:id/status` | CONFIRMED |

### Lab — `@Controller('lab')`

| Method | Path | Status |
|---|---|---|
| POST | `/api/v1/lab/orders` | CONFIRMED |
| GET | `/api/v1/lab/orders` | CONFIRMED |
| GET | `/api/v1/lab/orders/:id` | CONFIRMED |
| POST | `/api/v1/lab/orders/:id/sample` | CONFIRMED — sample collection |
| POST | `/api/v1/lab/orders/:id/result` | CONFIRMED — enter result |
| POST | `/api/v1/lab/orders/:id/verify` | CONFIRMED — doctor verify |
| GET | `/api/v1/lab/orders/:id/result` | CONFIRMED |

### Inventory — `@Controller('inventory')`

| Method | Path | Status |
|---|---|---|
| GET | `/api/v1/inventory/stock` | CONFIRMED |
| GET | `/api/v1/inventory/lots` | CONFIRMED |
| POST | `/api/v1/inventory/lots` | CONFIRMED |
| GET | `/api/v1/inventory/lots/:id` | CONFIRMED |
| GET | `/api/v1/inventory/movements` | CONFIRMED |
| GET | `/api/v1/inventory/drugs/:drugId/stock` | CONFIRMED |

### Pharmacy — `@Controller('pharmacy')`

| Method | Path | Status |
|---|---|---|
| GET | `/api/v1/pharmacy/worklist` | CONFIRMED |
| POST | `/api/v1/pharmacy/dispense` | CONFIRMED — FEFO lot selection |
| GET | `/api/v1/pharmacy/dispense` | CONFIRMED |
| GET | `/api/v1/pharmacy/dispense/:id` | CONFIRMED |
| PATCH | `/api/v1/pharmacy/dispense/:id/cancel` | CONFIRMED |

### Organization — `@Controller('organization')`

| Method | Path | Status |
|---|---|---|
| GET | `/api/v1/organization/departments` | CONFIRMED |
| POST | `/api/v1/organization/departments` | CONFIRMED |
| PATCH | `/api/v1/organization/departments/:id` | CONFIRMED |
| GET | `/api/v1/organization/rooms` | CONFIRMED |
| POST | `/api/v1/organization/rooms` | CONFIRMED |
| PATCH | `/api/v1/organization/rooms/:id` | CONFIRMED |
| GET | `/api/v1/organization/doctors` | CONFIRMED |
| POST | `/api/v1/organization/doctors` | CONFIRMED |
| PATCH | `/api/v1/organization/doctors/:id` | CONFIRMED |
| GET | `/api/v1/organization/schedules` | CONFIRMED |
| POST | `/api/v1/organization/schedules` | CONFIRMED |
| DELETE | `/api/v1/organization/schedules/:id` | CONFIRMED |

### Reports (P2) — `@Controller('reports')`

| Method | Path | Status |
|---|---|---|
| GET | `/api/v1/reports/revenue-breakdown` | CONFIRMED (P2) |

---

## Endpoint Risk Table

| Risk | Mô tả | Endpoint | Khuyến nghị |
|---|---|---|---|
| RBAC chưa confirm chi tiết | @Roles() cụ thể chưa verify từng endpoint | Nhiều endpoint | Scan từng controller và ghi @Roles() vào bảng |
| No GET /visits/:id | GET visit chi tiết không có trong controller | `visits.controller.ts` | Frontend navigate bằng list rồi lọc |
| Examination complete không check pending lab | examinations.service.ts:269 không check ServiceOrder pending | POST /examinations/:id/complete | RISK — ghi là limitation |
