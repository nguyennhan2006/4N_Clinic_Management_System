# 03 — Kiểm kê Module Phase 1 & Phase 2

---

## 1. Bảng kiểm kê module tổng hợp

| Module | Phase | Mục đích | Controller | Service | DTO | Guards/Roles | Prisma models | API chính | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|
| **auth** | P1 | Đăng nhập, token, logout, /me | `auth.controller.ts` | `auth.service.ts` | `login.dto.ts` | Public (login/refresh), JwtGuard (logout/me) | User, RefreshToken | POST /login, POST /refresh, POST /logout, GET /me | CONFIRMED | — |
| **users** | P1 | CRUD tài khoản, khóa, gán vai trò | `users.controller.ts` | `users.service.ts` | `create-user.dto.ts` | JwtGuard + ADMIN | User, Role, UserRole | GET/POST/PATCH /users | CONFIRMED | — |
| **rbac** | P1 | Quản lý vai trò, quyền | `rbac.controller.ts` | `rbac.service.ts` | — | JwtGuard + ADMIN | Role, Permission, RolePermission | GET /roles, GET /permissions, PATCH /roles/:id/permissions | CONFIRMED | — |
| **patients** | P1 | CRUD bệnh nhân, lịch sử khám | `patients.controller.ts` | `patients.service.ts` | `create-patient.dto.ts` | JwtGuard + RECEPTIONIST/ADMIN/DOCTOR | Patient | GET/POST /patients, GET /patients/:id, GET /patients/:id/medical-history | CONFIRMED | — |
| **visits** | P1 | Tạo lượt khám, mở phiên khám | `visits.controller.ts` | `visits.service.ts` | `create-visit.dto.ts`, `query-visits.dto.ts` | JwtGuard + RECEPTIONIST/ADMIN (create), DOCTOR/ADMIN (open) | Visit, Examination | POST/GET /visits, POST /visits/:id/open-examination | CONFIRMED | — |
| **examinations** | P1 | Phiên khám, chẩn đoán, đơn thuốc, hoàn tất | `examinations.controller.ts` | `examinations.service.ts` | `update-examination.dto.ts`, `create-prescription.dto.ts` | JwtGuard + DOCTOR/ADMIN | Examination, Prescription, PrescriptionItem, Diagnosis | GET/PATCH /examinations/:id, POST/PUT/DELETE /examinations/:id/prescription, POST /examinations/:id/complete | CONFIRMED | — |
| **prescriptions** | P1 | Service layer cho đơn thuốc (shared) | _(không có controller)_ | `prescriptions.service.ts` | — | — | Prescription, PrescriptionItem, Drug | (dùng bởi examinations module) | CONFIRMED | Module service-only, không route trực tiếp |
| **diseases** | P1 | Danh mục bệnh | `diseases.controller.ts` | `diseases.service.ts` | `create-disease.dto.ts` | JwtGuard + ADMIN (write), mọi role (read) | Disease | GET/POST/PATCH /diseases | CONFIRMED | — |
| **drugs** | P1 | Danh mục thuốc | `drugs.controller.ts` | `drugs.service.ts` | `create-drug.dto.ts` | JwtGuard + ADMIN (write) | Drug | GET/POST/PATCH /drugs | CONFIRMED | — |
| **billing** | P1 | Lập hóa đơn, ghi nhận thanh toán, tra cứu | `billing.controller.ts` | `billing.service.ts` | `create-invoice.dto.ts`, `create-payment.dto.ts` | JwtGuard + CASHIER/ADMIN | Invoice, Payment, InvoiceItem | POST /visits/:id/invoice, GET/invoices, GET /invoices/:id, GET /invoices/:id/items, POST /invoices/:id/payments | CONFIRMED | — |
| **regulations** | P1 | Phiên bản quy định phòng mạch | `regulations.controller.ts` | `regulations.service.ts` | `create-regulation.dto.ts` | JwtGuard + ADMIN | RegulationVersion, RegulationItem | GET /regulations/current, POST /regulations, PATCH /regulations/:id/activate | CONFIRMED | — |
| **reports** | P1+2 | Báo cáo tháng cơ bản + doanh thu theo loại | `reports.controller.ts` | `reports.service.ts` | — | JwtGuard + MANAGER/ADMIN | Invoice, Payment, Visit, Dispense | GET /reports/monthly, GET /reports/revenue-breakdown | CONFIRMED | Mở rộng sang P2 |
| **appointments** | P2 | Đặt lịch hẹn, check-in | `appointments.controller.ts` | `appointments.service.ts` | `create-appointment.dto.ts` | JwtGuard + RECEPTIONIST/ADMIN | Appointment, Visit | GET/POST /appointments, GET/PATCH/DELETE /appointments/:id, POST /appointments/:id/checkin | CONFIRMED | — |
| **queue** | P2 | Quản lý hàng đợi khám | `queue.controller.ts` | `queue.service.ts` | — | JwtGuard | QueueTicket, Visit | GET/GET-next /queue, GET /queue/:id, PATCH /queue/:id/status | CONFIRMED | — |
| **vitals** | P2 | Ghi nhận sinh hiệu | `vitals.controller.ts` | `vitals.service.ts` | `create-vital.dto.ts` | JwtGuard + NURSE/DOCTOR/ADMIN | VitalSign | POST /vitals, GET /vitals/visit/:visitId | CONFIRMED | — |
| **services** | P2 | Danh mục dịch vụ + chỉ định dịch vụ | `services.controller.ts` | `services.service.ts` | `create-service.dto.ts`, `create-service-order.dto.ts` | JwtGuard + ADMIN (catalog), DOCTOR/ADMIN (orders) | ServiceCatalog, ServiceOrder, LabTestCatalog | GET/POST/PATCH /service-catalog, GET/POST/PATCH /service-orders | CONFIRMED | — |
| **lab** | P2 | Xét nghiệm: tạo, lấy mẫu, kết quả, xác nhận | `lab.controller.ts` | `lab.service.ts` | `create-lab-order.dto.ts` | JwtGuard + LAB_TECHNICIAN/DOCTOR/ADMIN | LabOrder, LabSample, LabResult | POST/GET /lab/orders, POST /lab/orders/:id/sample, POST /lab/orders/:id/result, POST /lab/orders/:id/verify | CONFIRMED | — |
| **inventory** | P2 | Kho thuốc: nhập lô, xem tồn kho | `inventory.controller.ts` | `inventory.service.ts` | `create-stock-lot.dto.ts` | JwtGuard + PHARMACIST/ADMIN | StockLot, StockMovement | GET /inventory/stock, GET/POST /inventory/lots, GET /inventory/movements | CONFIRMED | — |
| **pharmacy** | P2 | Cấp phát thuốc theo FEFO | `pharmacy.controller.ts` | `pharmacy.service.ts` | `create-dispense.dto.ts` | JwtGuard + PHARMACIST/ADMIN | Dispense, DispenseItem | GET /pharmacy/worklist, POST /pharmacy/dispense, GET/PATCH /pharmacy/dispense | CONFIRMED | — |
| **organization** | P2 | Khoa, phòng, hồ sơ bác sĩ, lịch trực | `organization.controller.ts` | `organization.service.ts` | `create-department.dto.ts` | JwtGuard + ADMIN (write) | Department, Room, DoctorProfile, StaffSchedule | GET/POST/PATCH /organization/departments, /rooms, /doctors, /schedules | CONFIRMED | — |
| **audit** | P2 | Nhật ký hành động hệ thống | `audit.controller.ts` | `audit.service.ts` | — | JwtGuard + ADMIN | AuditLog | GET /audit | CONFIRMED | — |

---

## 2. Tóm tắt phân loại Phase

| Phase | Số module | Số endpoint (ước tính) | Số Prisma models | Trạng thái |
|---|---|---|---|---|
| Phase 1 | 12 module | ~35 endpoint | 15 models | CONFIRMED — hoàn thành |
| Phase 2 | 10 module mới | ~50 endpoint | 22 models mới | CONFIRMED — hoàn thành |
| **Tổng** | **22 module** | **~85 endpoint** | **37 models** | |

---

## 3. Dependency giữa Phase 1 và Phase 2

| Module Phase 2 | Phụ thuộc module Phase 1 | Lý do |
|---|---|---|
| appointments | patients, users | Appointment cần Patient + Doctor (User) |
| queue | visits | QueueTicket gắn với Visit |
| vitals | visits | VitalSign gắn với Visit |
| services | visits, examinations, billing | ServiceOrder gắn với Visit, ảnh hưởng Invoice |
| lab | services, visits | LabOrder gắn với ServiceOrder |
| inventory | drugs | StockLot gắn với Drug |
| pharmacy | prescriptions, drugs, inventory | Dispense cần Prescription + StockLot |
| organization | users | DoctorProfile gắn với User |
| audit | users | AuditLog ghi actor là User |
| reports (P2) | billing, pharmacy, services | Revenue breakdown cần Invoice + Dispense + ServiceOrder |

---

## 4. Module chưa có/thiếu bằng chứng

| Module | Trạng thái | Ghi chú |
|---|---|---|
| prescriptions (controller) | MISSING — không có controller riêng | Service tồn tại, logic được gọi từ examinations module — không phải lỗi, là thiết kế intentional |
| notifications | MISSING | Chức năng Ver2, không implement |
| patient portal | MISSING | Chức năng Ver2 |
| multi-branch | MISSING | Chức năng Ver2 |
| insurance | MISSING | Chức năng Ver2 |
