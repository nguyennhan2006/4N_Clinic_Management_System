import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/common/AppShell'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RequireRole } from '@/features/auth/RequireRole'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PatientListPage } from '@/features/patients/PatientListPage'
import { PatientCreatePage } from '@/features/patients/PatientCreatePage'
import { PatientDetailPage } from '@/features/patients/PatientDetailPage'
import { MedicalHistoryPage } from '@/features/patients/MedicalHistoryPage'
import { VisitListPage } from '@/features/visits/VisitListPage'
import { VisitCreatePage } from '@/features/visits/VisitCreatePage'
import { ExaminationPage } from '@/features/examinations/ExaminationPage'
import { InvoiceListPage } from '@/features/invoices/InvoiceListPage'
import { InvoiceDetailPage } from '@/features/invoices/InvoiceDetailPage'
import { MonthlyReportPage } from '@/features/reports/MonthlyReportPage'
import { RegulationPage } from '@/features/regulations/RegulationPage'
import { DiseaseCatalogPage } from '@/features/diseases/DiseaseCatalogPage'
import { MedicineCatalogPage } from '@/features/medicines/MedicineCatalogPage'
import { UserManagementPage } from '@/features/users/UserManagementPage'
import { RoleManagementPage } from '@/features/users/RoleManagementPage'
import { DepartmentListPage } from '@/features/organization/DepartmentListPage'
import { DoctorProfilePage } from '@/features/organization/DoctorProfilePage'
import { AppointmentListPage } from '@/features/appointments/AppointmentListPage'
import { AppointmentCreatePage } from '@/features/appointments/AppointmentCreatePage'
import { QueueDashboardPage } from '@/features/queue/QueueDashboardPage'
import { LabWorklist } from '@/features/lab/LabWorklist'
import { StockListPage } from '@/features/inventory/StockListPage'
import { PharmacyWorklist } from '@/features/pharmacy/PharmacyWorklist'
import { ServiceCatalogPage } from '@/features/services/ServiceCatalogPage'
import { AuditLogPage } from '@/features/audit/AuditLogPage'

export const router = createBrowserRouter([
  // Public
  { path: '/login', element: <LoginPage /> },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/404', element: <NotFoundPage /> },

  // Root redirect → dashboard (requires auth)
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <Navigate to="/app/dashboard" replace /> }],
  },

  // Protected app shell
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          // Dashboard — all authenticated roles
          { path: 'dashboard', element: <DashboardPage /> },

          // ── Patients ────────────────────────────────────────────────
          // List + detail — ADMIN, RECEPTIONIST, DOCTOR, MANAGER
          {
            element: <RequireRole roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'MANAGER']} />,
            children: [
              { path: 'patients', element: <PatientListPage /> },
              { path: 'patients/:id', element: <PatientDetailPage /> },
            ],
          },
          // Create — ADMIN, RECEPTIONIST
          {
            element: <RequireRole roles={['ADMIN', 'RECEPTIONIST']} />,
            children: [{ path: 'patients/new', element: <PatientCreatePage /> }],
          },
          // Medical history — ADMIN, DOCTOR, MANAGER
          {
            element: <RequireRole roles={['ADMIN', 'DOCTOR', 'MANAGER']} />,
            children: [{ path: 'patients/:id/history', element: <MedicalHistoryPage /> }],
          },

          // ── Visits ──────────────────────────────────────────────────
          // List — ADMIN, RECEPTIONIST, DOCTOR, MANAGER
          {
            element: <RequireRole roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'MANAGER']} />,
            children: [{ path: 'visits', element: <VisitListPage /> }],
          },
          // Create — ADMIN, RECEPTIONIST
          {
            element: <RequireRole roles={['ADMIN', 'RECEPTIONIST']} />,
            children: [{ path: 'visits/new', element: <VisitCreatePage /> }],
          },
          // NOTE: /visits/:id intentionally omitted — GET /visits/:id missing from backend

          // ── Examinations ─────────────────────────────────────────────
          // ADMIN, DOCTOR
          {
            element: <RequireRole roles={['ADMIN', 'DOCTOR']} />,
            children: [{ path: 'examinations/:id', element: <ExaminationPage /> }],
          },

          // ── Invoices ─────────────────────────────────────────────────
          // ADMIN, CASHIER, MANAGER
          {
            element: <RequireRole roles={['ADMIN', 'CASHIER', 'MANAGER']} />,
            children: [
              { path: 'invoices', element: <InvoiceListPage /> },
              { path: 'invoices/:id', element: <InvoiceDetailPage /> },
            ],
          },

          // ── Reports ──────────────────────────────────────────────────
          // ADMIN, MANAGER
          {
            element: <RequireRole roles={['ADMIN', 'MANAGER']} />,
            children: [{ path: 'reports/monthly', element: <MonthlyReportPage /> }],
          },

          // ── Catalogs ─────────────────────────────────────────────────
          // ADMIN, MANAGER (read + write ADMIN; MANAGER read-only enforced at action level)
          {
            element: <RequireRole roles={['ADMIN', 'MANAGER']} />,
            children: [
              { path: 'catalog/diseases', element: <DiseaseCatalogPage /> },
              { path: 'catalog/medicines', element: <MedicineCatalogPage /> },
            ],
          },

          // ── Settings ─────────────────────────────────────────────────
          // Regulations — ADMIN, MANAGER
          {
            element: <RequireRole roles={['ADMIN', 'MANAGER']} />,
            children: [{ path: 'settings/regulations', element: <RegulationPage /> }],
          },

          // ── Organization (Phase 2A) ──────────────────────────────────────
          {
            element: <RequireRole roles={['ADMIN', 'MANAGER']} />,
            children: [
              { path: 'organization/departments', element: <DepartmentListPage /> },
              { path: 'organization/doctors', element: <DoctorProfilePage /> },
            ],
          },

          // ── Appointments (Phase 2) ────────────────────────────────────
          {
            element: <RequireRole roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'MANAGER']} />,
            children: [{ path: 'appointments', element: <AppointmentListPage /> }],
          },
          {
            element: <RequireRole roles={['ADMIN', 'RECEPTIONIST']} />,
            children: [{ path: 'appointments/new', element: <AppointmentCreatePage /> }],
          },

          // ── Queue (Phase 2) ───────────────────────────────────────────
          {
            element: <RequireRole roles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE']} />,
            children: [{ path: 'queue', element: <QueueDashboardPage /> }],
          },

          // ── Lab (Phase 2) ─────────────────────────────────────────────
          {
            element: <RequireRole roles={['ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECHNICIAN']} />,
            children: [{ path: 'lab', element: <LabWorklist /> }],
          },

          // ── Inventory (Phase 2) ───────────────────────────────────────
          {
            element: <RequireRole roles={['ADMIN', 'PHARMACIST', 'MANAGER']} />,
            children: [{ path: 'inventory', element: <StockListPage /> }],
          },

          // ── Pharmacy (Phase 2) ────────────────────────────────────────
          {
            element: <RequireRole roles={['ADMIN', 'PHARMACIST']} />,
            children: [{ path: 'pharmacy', element: <PharmacyWorklist /> }],
          },

          // ── Service catalog (Phase 2) ─────────────────────────────────
          {
            element: <RequireRole roles={['ADMIN', 'MANAGER']} />,
            children: [{ path: 'catalog/services', element: <ServiceCatalogPage /> }],
          },

          // ── Audit log (Phase 2) ───────────────────────────────────────
          {
            element: <RequireRole roles={['ADMIN']} />,
            children: [{ path: 'admin/audit-log', element: <AuditLogPage /> }],
          },

          // ── Admin ─────────────────────────────────────────────────────
          // ADMIN only
          {
            element: <RequireRole roles={['ADMIN']} />,
            children: [
              { path: 'admin/users', element: <UserManagementPage /> },
              { path: 'admin/roles', element: <RoleManagementPage /> },
            ],
          },
        ],
      },
    ],
  },

  // Catch-all → 404
  { path: '*', element: <NotFoundPage /> },
])
