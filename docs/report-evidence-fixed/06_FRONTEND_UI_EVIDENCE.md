# 06 — Bằng chứng Frontend UI

> Audit date: 2026-06-07 | Nguồn: `frontend/src/app/router.tsx`, `frontend/src/features/**/*.tsx`

---

## Canonical counts (thống nhất với file 00)

- **Frontend page files: 33** (31 feature pages + 2 error pages)
- **Named routes: 36** (từ router.tsx)
- **Feature folders: 20**

---

## 1. Route / Page Inventory

| Route | Page component | File path | Actor/Role | UC | Phase |
|---|---|---|---|---|---|
| `/login` | LoginPage | `features/auth/LoginPage.tsx` | Tất cả (public) | UC01 | P1 |
| `/403` | ForbiddenPage | `pages/ForbiddenPage.tsx` | — | — | P1 |
| `/404` | NotFoundPage | `pages/NotFoundPage.tsx` | — | — | P1 |
| `/app/dashboard` | DashboardPage | `features/dashboard/DashboardPage.tsx` | Tất cả roles | — | P1 |
| `/app/patients` | PatientListPage | `features/patients/PatientListPage.tsx` | ADMIN, RECEPTIONIST, DOCTOR, MANAGER | UC04 | P1 |
| `/app/patients/new` | PatientCreatePage | `features/patients/PatientCreatePage.tsx` | ADMIN, RECEPTIONIST | UC05 | P1 |
| `/app/patients/:id` | PatientDetailPage | `features/patients/PatientDetailPage.tsx` | ADMIN, RECEPTIONIST, DOCTOR, MANAGER | UC04 | P1 |
| `/app/patients/:id/history` | MedicalHistoryPage | `features/patients/MedicalHistoryPage.tsx` | ADMIN, DOCTOR, MANAGER | UC11 | P1 |
| `/app/visits` | VisitListPage | `features/visits/VisitListPage.tsx` | ADMIN, RECEPTIONIST, DOCTOR, MANAGER | UC08 | P1 |
| `/app/visits/new` | VisitCreatePage | `features/visits/VisitCreatePage.tsx` | ADMIN, RECEPTIONIST | UC07 | P1 |
| `/app/examinations/:id` | ExaminationPage | `features/examinations/ExaminationPage.tsx` | ADMIN, DOCTOR | UC09-UC13 | P1 |
| `/app/invoices` | InvoiceListPage | `features/invoices/InvoiceListPage.tsx` | ADMIN, CASHIER, MANAGER | UC16 | P1 |
| `/app/invoices/:id` | InvoiceDetailPage | `features/invoices/InvoiceDetailPage.tsx` | ADMIN, CASHIER, MANAGER | UC14-UC16 | P1 |
| `/app/reports/monthly` | MonthlyReportPage | `features/reports/MonthlyReportPage.tsx` | ADMIN, MANAGER | UC20 | P1 |
| `/app/catalog/diseases` | DiseaseCatalogPage | `features/diseases/DiseaseCatalogPage.tsx` | ADMIN, MANAGER | UC18 | P1 |
| `/app/catalog/medicines` | MedicineCatalogPage | `features/medicines/MedicineCatalogPage.tsx` | ADMIN, MANAGER | UC19 | P1 |
| `/app/settings/regulations` | RegulationPage | `features/regulations/RegulationPage.tsx` | ADMIN, MANAGER | UC17 | P1 |
| `/app/admin/users` | UserManagementPage | `features/users/UserManagementPage.tsx` | ADMIN | UC02 | P1 |
| `/app/admin/roles` | RoleManagementPage | `features/users/RoleManagementPage.tsx` | ADMIN | UC03 | P1 |
| `/app/appointments` | AppointmentListPage | `features/appointments/AppointmentListPage.tsx` | ADMIN, RECEPTIONIST, DOCTOR, MANAGER | UC21 | P2 |
| `/app/appointments/new` | AppointmentCreatePage | `features/appointments/AppointmentCreatePage.tsx` | ADMIN, RECEPTIONIST | UC21 | P2 |
| `/app/queue` | QueueDashboardPage | `features/queue/QueueDashboardPage.tsx` | ADMIN, RECEPTIONIST, DOCTOR, NURSE | UC22 | P2 |
| `/app/lab` | LabWorklist | `features/lab/LabWorklist.tsx` | ADMIN, DOCTOR, NURSE, LAB_TECHNICIAN | UC26 | P2 |
| `/app/inventory` | StockListPage | `features/inventory/StockListPage.tsx` | ADMIN, PHARMACIST, MANAGER | UC27 | P2 |
| `/app/pharmacy` | PharmacyWorklist | `features/pharmacy/PharmacyWorklist.tsx` | ADMIN, PHARMACIST | UC28 | P2 |
| `/app/catalog/services` | ServiceCatalogPage | `features/services/ServiceCatalogPage.tsx` | ADMIN, MANAGER | UC25 | P2 |
| `/app/organization/departments` | DepartmentListPage | `features/organization/DepartmentListPage.tsx` | ADMIN, MANAGER | UC29 | P2 |
| `/app/organization/doctors` | DoctorProfilePage | `features/organization/DoctorProfilePage.tsx` | ADMIN, MANAGER | UC29 | P2 |
| `/app/admin/audit-log` | AuditLogPage | `features/audit/AuditLogPage.tsx` | ADMIN | UC30 | P2 |
| — (embedded) | VitalSignSection | `features/vitals/VitalSignSection.tsx` | NURSE, DOCTOR | UC24 | P2 |
| — (embedded) | ServiceOrderSection | `features/services/ServiceOrderSection.tsx` | DOCTOR, ADMIN | UC25 | P2 |

**Tổng page files: 33** (29 route-based pages + 2 embedded sections + 2 error pages)

---

## 2. Frontend Architecture Evidence

### 2.1 ProtectedRoute

**CONFIRMED** — `frontend/src/features/auth/ProtectedRoute.tsx`  
Bọc toàn bộ `/app` routes. Redirect `/login` nếu không có accessToken trong Zustand store.

### 2.2 RequireRole

**CONFIRMED** — `frontend/src/features/auth/RequireRole.tsx`  
Dùng trong router.tsx trên mỗi nhóm route. Redirect `/403` nếu user role không nằm trong `roles[]` prop.

Ví dụ từ router.tsx:
```tsx
{ element: <RequireRole roles={['ADMIN', 'RECEPTIONIST']} />,
  children: [{ path: 'patients/new', element: <PatientCreatePage /> }] }
```

### 2.3 Role-based Sidebar

**CONFIRMED** — `frontend/src/config/navigation.ts`  
`navigationConfig` là array NavSection, mỗi item có `roles: Role[]`. Sidebar component filter theo role của user đăng nhập.

8 roles hệ thống: ADMIN, RECEPTIONIST, DOCTOR, CASHIER, MANAGER, NURSE, LAB_TECHNICIAN, PHARMACIST

### 2.4 API Client

**CONFIRMED** — `frontend/src/lib/api-client.ts`  
- Base URL từ `VITE_API_BASE_URL` env var
- Attach `Authorization: Bearer <accessToken>` từ Zustand auth store
- Map HTTP errors: 400→invalid data, 401→session expired, 403→no permission, 404→not found, 409→business conflict, 500→server error

### 2.5 Auth Store

**CONFIRMED** — `frontend/src/features/auth/` (Zustand store)  
Lưu: accessToken, refreshToken, user info, role. Clear on logout.

### 2.6 Theme System

**CONFIRMED** — `frontend/src/lib/theme.ts`, `frontend/src/styles/globals.css`  
Dark/light mode toggle với localStorage persistence. Sử dụng Tailwind v4 `@theme` CSS custom properties.

---

## 3. Common Components

| Component | File | Vai trò |
|---|---|---|
| AppShell | `components/common/AppShell.tsx` | Layout wrapper: Sidebar + Topbar + main content |
| Sidebar | `components/common/Sidebar.tsx` | Role-filtered navigation |
| Topbar | `components/common/Topbar.tsx` | Search, user info, theme toggle |
| PageHeader | `components/common/PageHeader.tsx` | Page title + action button |
| ConfirmDialog | `components/common/ConfirmDialog.tsx` | Modal xác nhận action nguy hiểm |
| EmptyState | `components/common/EmptyState.tsx` | Hiển thị khi không có data |
| ErrorState | `components/common/ErrorState.tsx` | Hiển thị khi API error |
| LoadingState | `components/common/LoadingState.tsx` | Skeleton / spinner |
| StatusBadge | `components/common/StatusBadge.tsx` | Badge màu cho Visit/Invoice/Exam status |
| RoleBadge | `components/common/RoleBadge.tsx` | Badge vai trò người dùng |

---

## 4. Screenshot Checklist (nhóm cần chụp)

```
PHASE 1 SCREENS:
□ /login — form đăng nhập
□ /app/dashboard — dashboard tổng quan
□ /app/patients — danh sách bệnh nhân (có search)
□ /app/patients/new — form tạo bệnh nhân
□ /app/patients/:id — chi tiết bệnh nhân
□ /app/patients/:id/history — lịch sử khám
□ /app/visits — danh sách lượt khám
□ /app/visits/new — tạo lượt khám
□ /app/examinations/:id — phiếu khám (OPEN state)
□ /app/examinations/:id — phiếu khám (kê đơn)
□ /app/examinations/:id — phiếu khám (COMPLETED state)
□ /app/invoices — danh sách hóa đơn
□ /app/invoices/:id — chi tiết hóa đơn + thanh toán dialog
□ /app/reports/monthly — báo cáo tháng
□ /app/catalog/diseases — danh mục bệnh
□ /app/catalog/medicines — danh mục thuốc
□ /app/settings/regulations — quy định
□ /app/admin/users — quản lý tài khoản
□ /app/admin/roles — phân quyền
□ /403 — trang không có quyền

PHASE 2 SCREENS:
□ /app/appointments — danh sách lịch hẹn
□ /app/appointments/new — tạo lịch hẹn
□ /app/queue — hàng đợi
□ /app/lab — xét nghiệm worklist
□ /app/inventory — tồn kho
□ /app/pharmacy — phát thuốc worklist
□ /app/catalog/services — danh mục dịch vụ
□ /app/organization/departments — khoa phòng
□ /app/organization/doctors — hồ sơ bác sĩ
□ /app/admin/audit-log — nhật ký hệ thống

SIDEBAR SCREENSHOTS (theo role):
□ Sidebar RECEPTIONIST
□ Sidebar DOCTOR
□ Sidebar CASHIER
□ Sidebar MANAGER
□ Sidebar ADMIN
```

**Status: MISSING** — Tất cả screenshots cần chụp thủ công khi app đang chạy.
