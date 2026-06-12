# 06 — Bằng chứng Frontend và Giao diện

> Nguồn: `frontend/src/`  
> Framework: React 19 + Vite + TypeScript + Tailwind CSS v4

---

## 1. Kiểm kê Routes và Pages

| Route | Page Component | Phase | Actor/Role | API gọi tới | Form validation | UI state chính | File path | Trạng thái |
|---|---|---|---|---|---|---|---|---|
| `/login` | `LoginPage` | P1 | Tất cả | POST /auth/login | Zod/RHF: email, password | Loading, error msg | `features/auth/LoginPage.tsx` | CONFIRMED |
| `/app/dashboard` | `DashboardPage` | P1 | Tất cả (sau login) | GET /auth/me | — | Role-based cards | `features/dashboard/DashboardPage.tsx` | CONFIRMED |
| `/app/patients` | `PatientListPage` | P1 | RECEPTIONIST, DOCTOR, ADMIN | GET /patients | — | Loading, Empty, Search | `features/patients/PatientListPage.tsx` | CONFIRMED |
| `/app/patients/new` | `PatientCreatePage` | P1 | RECEPTIONIST, ADMIN | POST /patients | Zod: fullName, dateOfBirth, gender | Validation errors, success toast | `features/patients/PatientCreatePage.tsx` | CONFIRMED |
| `/app/patients/:id` | `PatientDetailPage` | P1 | Tất cả | GET /patients/:id | — | Loading, Error | `features/patients/PatientDetailPage.tsx` | CONFIRMED |
| `/app/patients/:id/history` | `MedicalHistoryPage` | P1 | DOCTOR, ADMIN | GET /patients/:id/medical-history | — | Timeline, Loading, Empty | `features/patients/MedicalHistoryPage.tsx` | CONFIRMED |
| `/app/visits` | `VisitListPage` | P1 | Tất cả | GET /visits | — | Date filter, Status filter | `features/visits/VisitListPage.tsx` | CONFIRMED |
| `/app/visits/new` | `VisitCreatePage` | P1 | RECEPTIONIST, ADMIN | POST /visits, GET /patients | Zod: patientId, date | Conflict error, quota error | `features/visits/VisitCreatePage.tsx` | CONFIRMED |
| `/app/examinations/:id` | `ExaminationPage` | P1 | DOCTOR, ADMIN | GET/PATCH /examinations/:id, POST /examinations/:id/prescription, POST /examinations/:id/complete | Zod: prescription items | Read-only after COMPLETED | `features/examinations/ExaminationPage.tsx` | CONFIRMED |
| `/app/invoices` | `InvoiceListPage` | P1 | CASHIER, ADMIN | GET /invoices | — | Search, Status filter | `features/invoices/InvoiceListPage.tsx` | CONFIRMED |
| `/app/invoices/:id` | `InvoiceDetailPage` | P1 | CASHIER, ADMIN | GET /invoices/:id, GET /invoices/:id/items, POST /invoices/:id/payments | Zod: amount, method | Payment dialog, VND format | `features/invoices/InvoiceDetailPage.tsx` | CONFIRMED |
| `/app/reports/monthly` | `MonthlyReportPage` | P1 | MANAGER, ADMIN | GET /reports/monthly, GET /reports/revenue-breakdown | — | Month/year selector, summary cards | `features/reports/MonthlyReportPage.tsx` | CONFIRMED |
| `/app/catalog/diseases` | `DiseaseCatalogPage` | P1 | ADMIN (write), mọi role (read) | GET/POST/PATCH /diseases | Zod: code, name | Active/inactive toggle | `features/diseases/DiseaseCatalogPage.tsx` | CONFIRMED |
| `/app/catalog/medicines` | `MedicineCatalogPage` | P1 | ADMIN (write) | GET/POST/PATCH /drugs | Zod: name, unit, pricePerUnit | Search, Edit inline | `features/medicines/MedicineCatalogPage.tsx` | CONFIRMED |
| `/app/settings/regulations` | `RegulationPage` | P1 | ADMIN | GET /regulations/current, POST/PATCH /regulations | Zod: regulation items | Confirm dialog for activate | `features/regulations/RegulationPage.tsx` | CONFIRMED |
| `/app/admin/users` | `UserManagementPage` | P1 | ADMIN | GET/POST/PATCH /users | Zod: username, fullName, password | Lock/unlock, Role assign | `features/users/UserManagementPage.tsx` | CONFIRMED |
| `/app/admin/roles` | `RoleManagementPage` | P1 | ADMIN | GET /rbac/roles, GET /rbac/permissions, PATCH /rbac/roles/:id/permissions | — | Permission matrix | `features/users/RoleManagementPage.tsx` | CONFIRMED |
| `/app/appointments` | `AppointmentListPage` | P2 | RECEPTIONIST, ADMIN | GET /appointments, PATCH /appointments/:id/cancel, POST /appointments/:id/checkin | — | Date filter, Status badge | `features/appointments/AppointmentListPage.tsx` | CONFIRMED |
| `/app/appointments/new` | `AppointmentCreatePage` | P2 | RECEPTIONIST, ADMIN | POST /appointments, GET /patients, GET /organization/doctors | Zod: patientId, doctorId, scheduledAt | Doctor selector | `features/appointments/AppointmentCreatePage.tsx` | CONFIRMED |
| `/app/queue` | `QueueDashboardPage` | P2 | Tất cả | GET /visits | — | Real-time feel, status badges | `features/queue/QueueDashboardPage.tsx` | CONFIRMED |
| `/app/catalog/services` | `ServiceCatalogPage` | P2 | ADMIN, MANAGER | GET/POST/PATCH /services/service-catalog | Zod: name, type, price | Toggle active | `features/services/ServiceCatalogPage.tsx` | CONFIRMED |
| `/app/lab` | `LabWorklist` (embedded) | P2 | LAB_TECHNICIAN, ADMIN | GET/POST /lab/orders, POST /lab/orders/:id/sample, POST /lab/orders/:id/result, POST /lab/orders/:id/verify | — | Status filter, Result modal | `features/lab/LabWorklist.tsx` | CONFIRMED |
| `/app/pharmacy` | `PharmacyWorklist` (embedded) | P2 | PHARMACIST, ADMIN | GET /pharmacy/dispense, POST /pharmacy/dispense | — | Lot selection, daily view | `features/pharmacy/PharmacyWorklist.tsx` | CONFIRMED |
| `/app/inventory/stock` | `StockListPage` | P2 | PHARMACIST, ADMIN | GET /inventory/stock, GET /inventory/lots, POST /inventory/lots | — | Expiry badges, FEFO display | `features/inventory/StockListPage.tsx` | CONFIRMED |
| `/app/organization/departments` | `DepartmentListPage` | P2 | ADMIN | GET/POST/PATCH /organization/departments | Zod: code, name | Expand rooms | `features/organization/DepartmentListPage.tsx` | CONFIRMED |
| `/app/organization/doctors` | `DoctorProfilePage` | P2 | ADMIN | GET /organization/doctors | — | Card grid layout | `features/organization/DoctorProfilePage.tsx` | CONFIRMED |
| `/app/admin/audit-log` | `AuditLogPage` | P2 | ADMIN | GET /audit | — | Expand row, JSON diff view | `features/audit/AuditLogPage.tsx` | CONFIRMED |
| `/403` | `ForbiddenPage` | — | — | — | — | — | `pages/ForbiddenPage.tsx` | CONFIRMED |
| `/404` | `NotFoundPage` | — | — | — | — | — | `pages/NotFoundPage.tsx` | CONFIRMED |

---

## 2. Bằng chứng kiến trúc Frontend

### 2.1. Router setup

- **File**: `frontend/src/app/router.tsx`
- **Bằng chứng**: React Router v7, có `<ProtectedRoute>` bọc tất cả `/app/*` routes
- **CONFIRMED**: Redirect `/login` nếu chưa auth, redirect `/app/dashboard` sau login

### 2.2. Auth Store (Zustand)

- **File**: `frontend/src/features/auth/store.ts`
- **CONFIRMED**: Lưu `user`, `accessToken`, `refreshToken` trong memory (không localStorage cho security)
- **CONFIRMED**: `hasRole()` helper để kiểm tra quyền trong component

### 2.3. API Client

- **File**: `frontend/src/lib/api-client.ts`
- **CONFIRMED**: Tự động đính kèm `Authorization: Bearer <token>`
- **CONFIRMED**: Normalize lỗi từ backend (400/401/403/404/409/500)
- **CONFIRMED**: `ApiError` class với status code

### 2.4. Role-based Navigation

- **File**: `frontend/src/config/navigation.ts`
- **CONFIRMED**: Mỗi menu item có `allowedRoles: string[]`
- **File**: `frontend/src/components/common/Sidebar.tsx`
- **CONFIRMED**: Filter menu theo `user.roles` từ auth store

### 2.5. Protected Route

- **File**: `frontend/src/features/auth/ProtectedRoute.tsx`
- **CONFIRMED**: Kiểm tra `isAuthenticated` từ store, redirect `/login`
- **File**: `frontend/src/features/auth/RequireRole.tsx`
- **CONFIRMED**: Kiểm tra role, redirect `/403` nếu thiếu quyền

### 2.6. Theme System

- **File**: `frontend/src/styles/globals.css`
- **File**: `frontend/src/lib/theme.ts`
- **CONFIRMED**: Dark/light mode toggle, CSS custom properties, localStorage persistence

---

## 3. Checklist Screenshot cần chụp cho báo cáo

| Screenshot ID | Màn hình | Mục đích trong báo cáo | Actor demo | Dữ liệu cần chuẩn bị | Trạng thái |
|---|---|---|---|---|---|
| SS-01 | Trang đăng nhập | UC01 — Giao diện login | — | — | Cần chụp |
| SS-02 | Dashboard (RECEPTIONIST) | Role-based dashboard | receptionist@clinic.local | — | Cần chụp |
| SS-03 | Dashboard (DOCTOR) | Role-based dashboard khác | doctor@clinic.local | — | Cần chụp |
| SS-04 | Sidebar — RECEPTIONIST | Sidebar theo vai trò | receptionist@clinic.local | — | Cần chụp |
| SS-05 | Sidebar — ADMIN | Sidebar đầy đủ | admin@clinic.local | — | Cần chụp |
| SS-06 | Danh sách bệnh nhân | UC04 — Tìm kiếm bệnh nhân | admin | Cần seed bệnh nhân | Cần chụp |
| SS-07 | Form tạo bệnh nhân | UC05 — Tạo hồ sơ | receptionist | — | Cần chụp |
| SS-08 | Chi tiết bệnh nhân | UC04 — Xem thông tin | admin | Cần có patient | Cần chụp |
| SS-09 | Danh sách lượt khám | UC08 — Xem danh sách | receptionist | Cần có visits | Cần chụp |
| SS-10 | Form tạo lượt khám | UC07 — Tạo lượt khám | receptionist | Cần có patient | Cần chụp |
| SS-11 | Phiếu khám (đang mở) | UC10 — Lập phiếu khám | doctor | Visit IN_EXAMINATION | Cần chụp |
| SS-12 | Phiếu khám — Kê đơn thuốc | UC12 — Kê đơn | doctor | Cần có drugs active | Cần chụp |
| SS-13 | Lịch sử khám bệnh nhân | UC11 — Lịch sử khám | doctor/admin | Bệnh nhân có nhiều visits | Cần chụp |
| SS-14 | Danh sách hóa đơn | UC16 — Tra cứu hóa đơn | cashier | Cần có invoices | Cần chụp |
| SS-15 | Chi tiết hóa đơn — Thanh toán | UC15 — Ghi nhận thanh toán | cashier | Invoice ISSUED | Cần chụp |
| SS-16 | Báo cáo tháng | UC20 — Báo cáo | manager | Cần có completed visits | Cần chụp |
| SS-17 | Quản lý danh mục bệnh | UC18 — Danh mục bệnh | admin | — | Cần chụp |
| SS-18 | Quản lý danh mục thuốc | UC19 — Danh mục thuốc | admin | — | Cần chụp |
| SS-19 | Quy định phòng mạch | UC17 — Quy định | admin | — | Cần chụp |
| SS-20 | Quản lý tài khoản | UC02 — Tài khoản | admin | — | Cần chụp |
| SS-21 | Phân quyền vai trò | UC03 — Phân quyền | admin | — | Cần chụp |
| SS-22 | Lịch hẹn (Phase 2) | Appointment list | receptionist | Cần có appointments | Cần chụp |
| SS-23 | Danh sách xét nghiệm (Phase 2) | Lab worklist | lab_technician | Cần lab orders | Cần chụp |
| SS-24 | Tồn kho thuốc (Phase 2) | Stock list | pharmacist | Cần stock lots | Cần chụp |
| SS-25 | Cấp phát thuốc (Phase 2) | Pharmacy worklist | pharmacist | Cần prescriptions | Cần chụp |
| SS-26 | Nhật ký hệ thống (Phase 2) | Audit log | admin | — | Cần chụp |
| SS-27 | Thông báo lỗi validation | UX — Form validation | any | Cố tình nhập sai | Cần chụp |
| SS-28 | Thông báo business error | UX — Conflict error | receptionist | Tạo visit trùng ngày | Cần chụp |

---

## 4. Gợi ý viết Chương 3 — Thiết kế giao diện

- Trình bày **Design System**: palette màu (Gentle Pastels Clinical), typography, spacing, component pattern
- Trình bày **Layout**: Sidebar cố định trái + Main content + Topbar
- Mỗi màn hình trình bày: mục đích, actor, wireframe/screenshot, flow người dùng
- Đặc biệt trình bày: state handling (Loading → Empty → Error → Success) cho mọi màn hình data
- Trình bày: Dark/Light mode toggle (tính năng UI nổi bật)
- Đề cập: VND formatting cho mọi field tiền tệ
