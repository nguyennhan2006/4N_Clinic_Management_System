# 09 — Ma trận Truy vết (Traceability Matrix)

> Audit date: 2026-06-07

---

## 1. Ma trận Requirement → UC → Backend → DB → Frontend → BR → Test

| REQ | Use Case | Actor | Phase | Backend Endpoint | DB Model | Frontend Page | Business Rule | Test Evidence | Status |
|---|---|---|---|---|---|---|---|---|---|
| REQ-01 | UC01 Đăng nhập | Tất cả | P1 | POST /api/v1/auth/login | User, RefreshToken | LoginPage | BR-01, BR-02 | auth.e2e-spec.ts | CONFIRMED |
| REQ-02 | UC03 Phân quyền | ADMIN | P1 | GET/PATCH /api/v1/rbac/* | Role, Permission, RolePermission | RoleManagementPage | — | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-03 | UC02 Quản lý TK | ADMIN | P1 | GET/POST/PATCH /api/v1/users/* | User, UserRole | UserManagementPage | BR-03 | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-04 | UC04 Tra cứu BN | RECEPTIONIST, DOCTOR | P1 | GET /api/v1/patients | Patient | PatientListPage | — | clinic-flow.e2e-spec.ts | CONFIRMED |
| REQ-05 | UC05 Tạo hồ sơ BN | RECEPTIONIST | P1 | POST /api/v1/patients | Patient | PatientCreatePage | BR-04 | clinic-flow.e2e-spec.ts | CONFIRMED |
| REQ-06 | UC06 Tiếp nhận BN | RECEPTIONIST | P1 | POST /api/v1/visits | Visit | VisitCreatePage | BR-05, BR-06 | clinic-flow.e2e-spec.ts | CONFIRMED |
| REQ-07 | UC07 Tạo lượt khám | RECEPTIONIST | P1 | POST /api/v1/visits | Visit | VisitCreatePage | BR-07 | clinic-flow.e2e-spec.ts | CONFIRMED |
| REQ-08 | UC08 Xem DS lượt khám | DOCTOR, RECEPTIONIST | P1 | GET /api/v1/visits | Visit | VisitListPage | — | clinic-flow.e2e-spec.ts | CONFIRMED |
| REQ-09 | UC09 Mở lượt khám | DOCTOR | P1 | POST /api/v1/visits/:id/open-examination | Visit, Examination | ExaminationPage | BR-08, BR-09 | clinic-flow.e2e-spec.ts | CONFIRMED |
| REQ-10 | UC10 Lập phiếu khám | DOCTOR | P1 | PATCH /api/v1/examinations/:id | Examination, Diagnosis, Disease | ExaminationPage | BR-10 | clinic-flow.e2e-spec.ts | CONFIRMED |
| REQ-11 | UC11 Lịch sử khám | DOCTOR | P1 | GET /api/v1/patients/:id/medical-history | Patient, Visit, Examination | MedicalHistoryPage | — | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-12 | UC12 Kê đơn thuốc | DOCTOR | P1 | POST/PUT /api/v1/examinations/:id/prescription | Prescription, PrescriptionItem, Drug | ExaminationPage | BR-11 | clinic-flow.e2e-spec.ts | CONFIRMED |
| REQ-13 | UC13 Hoàn tất KH | DOCTOR | P1 | POST /api/v1/examinations/:id/complete | Examination, Visit | ExaminationPage | BR-12, BR-13, BR-14(RISK) | clinic-flow.e2e-spec.ts | CONFIRMED |
| REQ-14 | UC14 Lập hóa đơn | CASHIER | P1 | POST /api/v1/visits/:visitId/invoice | Invoice, InvoiceItem | InvoiceDetailPage | BR-15 | billing-catalog-flow.e2e-spec.ts | CONFIRMED |
| REQ-15 | UC15 Thanh toán | CASHIER | P1 | POST /api/v1/invoices/:id/payments | Payment, Invoice | InvoiceDetailPage | BR-16, BR-17, BR-18, BR-19 | billing-catalog-flow.e2e-spec.ts | CONFIRMED |
| REQ-16 | UC16 Tra cứu HĐ | CASHIER, MANAGER | P1 | GET /api/v1/invoices | Invoice | InvoiceListPage | — | billing-catalog-flow.e2e-spec.ts | CONFIRMED |
| REQ-17 | UC17 Thay đổi quy định | ADMIN, MANAGER | P1 | POST/PATCH /api/v1/regulations/* | RegulationVersion, RegulationItem | RegulationPage | BR-20 | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-18 | UC18 Danh mục bệnh | ADMIN, MANAGER | P1 | GET/POST/PATCH /api/v1/diseases | Disease | DiseaseCatalogPage | — | billing-catalog-flow.e2e-spec.ts | CONFIRMED |
| REQ-19 | UC19 Danh mục thuốc | ADMIN, MANAGER | P1 | GET/POST/PATCH /api/v1/drugs | Drug | MedicineCatalogPage | — | billing-catalog-flow.e2e-spec.ts | CONFIRMED |
| REQ-20 | UC20 Báo cáo tháng | MANAGER | P1 | GET /api/v1/reports/monthly | — (aggregate) | MonthlyReportPage | — | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-21 | UC21 Lịch hẹn | RECEPTIONIST | P2 | GET/POST /api/v1/appointments | Appointment | AppointmentListPage, AppointmentCreatePage | BR-27 | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-22 | UC22 Hàng đợi | RECEPTIONIST, NURSE | P2 | GET/PATCH /api/v1/queue/* | QueueTicket | QueueDashboardPage | BR-28 | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-23 | UC23 Check-in | RECEPTIONIST | P2 | POST /api/v1/appointments/:id/checkin | Appointment, Visit | AppointmentListPage | BR-27 | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-24 | UC24 Sinh hiệu | NURSE | P2 | POST /api/v1/vitals | VitalSign | VitalSignSection (embedded) | BR-26 | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-25 | UC25 Dịch vụ | DOCTOR, ADMIN | P2 | GET/POST /api/v1/services/* | ServiceCatalog, ServiceOrder | ServiceCatalogPage | — | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-26 | UC26 Xét nghiệm | LAB_TECHNICIAN, DOCTOR | P2 | GET/POST /api/v1/lab/* | LabOrder, LabSample, LabResult | LabWorklist | BR-25 | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-27 | UC27 Kho thuốc | PHARMACIST | P2 | GET/POST /api/v1/inventory/* | StockLot, StockMovement | StockListPage | BR-29 | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-28 | UC28 Cấp phát | PHARMACIST | P2 | POST /api/v1/pharmacy/dispense | Dispense, DispenseItem, StockLot | PharmacyWorklist | BR-21, BR-22, BR-23, BR-24 | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-29 | UC29 Tổ chức | ADMIN, MANAGER | P2 | GET/POST /api/v1/organization/* | Department, Room, DoctorProfile | DepartmentListPage, DoctorProfilePage | — | NEED_MANUAL_CONFIRMATION | PARTIAL |
| REQ-30 | UC30 Audit Log | ADMIN | P2 | GET /api/v1/audit-logs | AuditLog | AuditLogPage | — | NEED_MANUAL_CONFIRMATION | PARTIAL |

---

## 2. Coverage Summary

| Hạng mục | Số lượng | Tỷ lệ |
|---|---|---|
| Tổng UC | 30 (UC01–UC30) | 100% |
| UC có backend endpoint | 30 | 100% |
| UC có frontend page | 30 | 100% |
| UC có E2E test evidence | 13 (UC01–UC16 + UC18, UC19) | 43% |
| UC chỉ có manual test plan | 17 (UC11, UC17, UC20–UC30) | 57% |
| UC có business rule documented | 24 | 80% |

---

## 3. Evidence Gaps

| UC | Thiếu gì | Khuyến nghị |
|---|---|---|
| UC11, UC17, UC20 | E2E test evidence | Thêm vào e2e hoặc chạy manual và chụp |
| UC21–UC30 | E2E test evidence | Viết manual test report, chụp screenshots |
| Tất cả | Screenshots thực tế | Nhóm chụp theo checklist file 06 |
| UC23 | Kiểm tra checkin → Visit link logic | Manual test + verify |

---

## 4. Không ghi "test evidence confirmed" cho

- UC17 (regulations) — chưa có e2e test riêng
- UC20 (monthly report) — chưa có e2e test
- UC21–UC30 (tất cả Phase 2) — chỉ có manual test plan
