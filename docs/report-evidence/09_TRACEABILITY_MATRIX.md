# 09 — Ma trận Truy vết (Traceability Matrix)

> Truy vết từ Yêu cầu → Use Case → Backend → Database → Frontend → Business Rule → Test

---

## Ma trận đầy đủ

| UC ID | Use Case | Actor | Req ID | Phase | Backend endpoint / module | Database model | Frontend page | Business rule | Test evidence | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|---|
| UC01 | Đăng nhập hệ thống | Tất cả | REQ-01 | P1 | POST /api/auth/login (`auth.controller.ts`) | User, RefreshToken | `LoginPage.tsx` | BR-01: sai cred → 401 | `auth.e2e-spec.ts` | CONFIRMED |
| UC02 | Quản lý tài khoản | ADMIN | REQ-02 | P1 | GET/POST/PATCH /api/users (`users.controller.ts`) | User, UserRole | `UserManagementPage.tsx` | BR-03: hash password | — | CONFIRMED |
| UC03 | Phân quyền vai trò | ADMIN | REQ-03 | P1 | GET/PATCH /api/rbac (`rbac.controller.ts`) | Role, Permission, RolePermission | `RoleManagementPage.tsx` | RolesGuard enforce | — | CONFIRMED |
| UC04 | Tra cứu bệnh nhân | RECEPTIONIST, DOCTOR, ADMIN | REQ-04 | P1 | GET /api/patients (`patients.controller.ts`) | Patient | `PatientListPage.tsx` | — | `clinic-flow.e2e-spec.ts` | CONFIRMED |
| UC05 | Tạo hồ sơ bệnh nhân | RECEPTIONIST, ADMIN | REQ-05 | P1 | POST /api/patients | Patient | `PatientCreatePage.tsx` | BR-04: unique citizenId | `clinic-flow.e2e-spec.ts` | CONFIRMED |
| UC06 | Cập nhật bệnh nhân | RECEPTIONIST, ADMIN | REQ-06 | P1 | GET /api/patients/:id (`patients.controller.ts`) | Patient | `PatientDetailPage.tsx` | — | — | CONFIRMED |
| UC07 | Tạo lượt khám | RECEPTIONIST, ADMIN | REQ-07, REQ-08, REQ-09 | P1 | POST /api/visits (`visits.controller.ts`) | Visit | `VisitCreatePage.tsx` | BR-05: no dup; BR-06: quota | `clinic-flow.e2e-spec.ts` | CONFIRMED |
| UC08 | Xem danh sách lượt khám | Tất cả | REQ-07 | P1 | GET /api/visits | Visit | `VisitListPage.tsx` | — | — | CONFIRMED |
| UC09 | Mở lượt khám (bác sĩ nhận) | DOCTOR, ADMIN | REQ-10 | P1 | POST /api/visits/:id/open-examination | Visit, Examination | `VisitListPage.tsx` (action button) | BR-08, BR-09: status check | `clinic-flow.e2e-spec.ts` | CONFIRMED |
| UC10 | Lập phiếu khám / chẩn đoán | DOCTOR, ADMIN | REQ-10, REQ-11 | P1 | GET/PATCH /api/examinations/:id | Examination, Diagnosis, Disease | `ExaminationPage.tsx` | BR-10: OPEN only | `clinic-flow.e2e-spec.ts` | CONFIRMED |
| UC11 | Xem lịch sử khám | DOCTOR, ADMIN | REQ-13 | P1 | GET /api/patients/:id/medical-history | Patient, Visit, Examination | `MedicalHistoryPage.tsx` | — | — | CONFIRMED |
| UC12 | Kê đơn thuốc | DOCTOR, ADMIN | REQ-12 | P1 | POST/PUT/DELETE /api/examinations/:id/prescription | Prescription, PrescriptionItem, Drug | `ExaminationPage.tsx` (PrescriptionSection) | BR-11,12,13: validate đơn | `clinic-flow.e2e-spec.ts` | CONFIRMED |
| UC13 | Hoàn tất phiếu khám | DOCTOR, ADMIN | REQ-10 | P1 | POST /api/examinations/:id/complete | Examination | `ExaminationPage.tsx` (complete button) | BR-14: cần diagnosis | `clinic-flow.e2e-spec.ts` | CONFIRMED |
| UC14 | Lập hóa đơn | CASHIER, ADMIN | REQ-14 | P1 | POST /api/visits/:visitId/invoice | Invoice, InvoiceItem | `InvoiceDetailPage.tsx` | BR-15,16: check visit COMPLETED | `billing-catalog-flow.e2e-spec.ts` | CONFIRMED |
| UC15 | Ghi nhận thanh toán | CASHIER, ADMIN | REQ-15 | P1 | POST /api/invoices/:id/payments | Payment, Invoice | `InvoiceDetailPage.tsx` (PaymentDialog) | BR-17,18,19: validate amount | `billing-catalog-flow.e2e-spec.ts` | CONFIRMED |
| UC16 | Tra cứu hóa đơn | CASHIER, ADMIN | REQ-16 | P1 | GET /api/invoices | Invoice | `InvoiceListPage.tsx` | — | — | CONFIRMED |
| UC17 | Thay đổi quy định | ADMIN | REQ-17 | P1 | POST/PATCH /api/regulations | RegulationVersion, RegulationItem | `RegulationPage.tsx` | BR-20: 1 active only | — | CONFIRMED |
| UC18 | Quản lý danh mục bệnh | ADMIN | REQ-18 | P1 | GET/POST/PATCH /api/diseases | Disease | `DiseaseCatalogPage.tsx` | — | `billing-catalog-flow.e2e-spec.ts` | CONFIRMED |
| UC19 | Quản lý danh mục thuốc | ADMIN | REQ-19 | P1 | GET/POST/PATCH /api/drugs | Drug | `MedicineCatalogPage.tsx` | — | `billing-catalog-flow.e2e-spec.ts` | CONFIRMED |
| UC20 | Xem báo cáo tháng | MANAGER, ADMIN | REQ-20 | P1 | GET /api/reports/monthly | Visit, Invoice, Payment | `MonthlyReportPage.tsx` | — | — | CONFIRMED |
| UC21 | Đặt lịch hẹn | RECEPTIONIST, ADMIN | REQ-21 | P2 | POST /api/appointments | Appointment, Patient, DoctorProfile | `AppointmentCreatePage.tsx` | BR-21: no conflict | — | CONFIRMED |
| UC22 | Check-in lịch hẹn | RECEPTIONIST, ADMIN | REQ-21 | P2 | POST /api/appointments/:id/checkin | Appointment, Visit | `AppointmentListPage.tsx` | BR-22: status transition | — | CONFIRMED |
| UC23 | Quản lý hàng đợi | Hệ thống | REQ-22 | P2 | GET/PATCH /api/queue | QueueTicket | `QueueDashboardPage.tsx` | BR-23: state machine | — | CONFIRMED |
| UC24 | Ghi nhận sinh hiệu | NURSE, DOCTOR | REQ-23 | P2 | POST /api/vitals | VitalSign | `ExaminationPage.tsx` (VitalSignSection) | BR-28: auto BMI | — | CONFIRMED |
| UC25 | Chỉ định dịch vụ | DOCTOR, ADMIN | REQ-24 | P2 | POST /api/services/service-orders | ServiceOrder | `ExaminationPage.tsx` (ServiceOrderSection) | — | — | CONFIRMED |
| UC26 | Xét nghiệm: lấy mẫu + kết quả | LAB_TECHNICIAN | REQ-25 | P2 | POST /api/lab/orders/:id/sample, /result, /verify | LabOrder, LabSample, LabResult | `LabWorklist.tsx` | BR-24: lab flow | — | CONFIRMED |
| UC27 | Nhập lô thuốc | PHARMACIST, ADMIN | REQ-26 | P2 | POST /api/inventory/lots | StockLot, StockMovement | `StockListPage.tsx` | — | — | CONFIRMED |
| UC28 | Cấp phát thuốc | PHARMACIST, ADMIN | REQ-27 | P2 | POST /api/pharmacy/dispense | Dispense, DispenseItem, StockLot | `PharmacyWorklist.tsx` | BR-25,26,27: FEFO + transaction | — | CONFIRMED |
| UC29 | Báo cáo doanh thu theo loại | MANAGER, ADMIN | REQ-28 | P2 | GET /api/reports/revenue-breakdown | Invoice, Dispense, ServiceOrder | `MonthlyReportPage.tsx` | — | — | CONFIRMED |
| UC30 | Xem nhật ký hệ thống | ADMIN | REQ-29 | P2 | GET /api/audit | AuditLog | `AuditLogPage.tsx` | — | — | CONFIRMED |

---

## Tóm tắt coverage

| Phase | UC có đủ trace | UC thiếu test evidence | UC thiếu frontend |
|---|---|---|---|
| Phase 1 | 20/20 | UC02, UC03, UC06, UC11, UC16, UC17, UC20 | Không có |
| Phase 2 | 10/10 | UC21~UC30 (thiếu e2e test P2) | Không có |

---

## Điểm thiếu cần bổ sung

| Hạng mục | Mô tả | Khuyến nghị |
|---|---|---|
| E2E test Phase 2 | Không có test tự động cho appointments, lab, pharmacy, inventory | Viết tóm tắt manual test trong báo cáo |
| Screenshot | 28 màn hình cần chụp (xem file 06) | Nhóm chụp sau khi seed dữ liệu |
| Diagram traceability | Không có sơ đồ trực quan | Vẽ bổ sung cho báo cáo nếu giảng viên yêu cầu |
