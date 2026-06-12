# Frontend Implementation Plan — 4N Clinic Management System

> Stage 0 audit completed: 2026-05-18
> 32 backend endpoints confirmed. 4 security gaps documented in `missing-backend-endpoints.md`.
> Implementation follows CLAUDE.md Section 19 workflow.

---

## Tech Stack

| Concern | Technology | Version |
|---------|-----------|---------|
| Build | Vite | ^6.x |
| UI Framework | React + TypeScript | 19.x / 5.x |
| Styling | Tailwind CSS | ^3.x |
| Component Library | shadcn/ui | latest |
| Server State | TanStack Query | ^5.x |
| Local/Auth State | Zustand | ^5.x |
| Forms | React Hook Form | ^7.x |
| Validation | Zod | ^3.x |
| Tables | TanStack Table | ^8.x |
| Icons | lucide-react | latest |
| Dates | date-fns | ^3.x |
| Testing | Vitest + React Testing Library | latest |

---

## Implementation Stages

### Stage 1 — Scaffold (Foundation)

**Goal:** Working skeleton with routing, auth shell, and design system. No business screens yet.

**Tasks:**
- [ ] Init Vite React TS project at `frontend/`
- [ ] Install and configure Tailwind CSS with clinic palette (from CLAUDE.md §10.2)
- [ ] Install and configure shadcn/ui
- [ ] Create `src/lib/api-client.ts` — base fetch wrapper with Bearer token, error normalization
- [ ] Create `src/lib/errors.ts` — `ApiError` class (400/401/403/404/409/500 mapping)
- [ ] Create `src/lib/query-client.ts` — TanStack Query client setup
- [ ] Create `src/lib/date.ts` — format helpers (dd/MM/yyyy, YYYY-MM)
- [ ] Create `src/lib/money.ts` — VND formatter (`Intl.NumberFormat`)
- [ ] Create `src/app/providers.tsx` — QueryClientProvider + Zustand context
- [ ] Create `src/app/router.tsx` — React Router v6 routes skeleton
- [ ] Create `src/features/auth/store.ts` — Zustand auth store (token, user, role)
- [ ] Create `src/features/auth/ProtectedRoute.tsx` — redirect /login if not authed
- [ ] Create `src/features/auth/RequireRole.tsx` — redirect /403 if role missing
- [ ] Create `src/components/common/AppShell.tsx` — Sidebar + Topbar layout
- [ ] Create `src/components/common/Sidebar.tsx` — role-filtered nav items
- [ ] Create `src/components/common/Topbar.tsx` — search bar + user avatar + logout
- [ ] Create `src/components/common/PageHeader.tsx` — page title + action button slot
- [ ] Create `src/components/common/DataTable.tsx` — generic TanStack Table wrapper
- [ ] Create `src/components/common/StatusBadge.tsx` — color-coded status display
- [ ] Create `src/components/common/RoleBadge.tsx` — role badge with clinic colors
- [ ] Create `src/components/common/LoadingState.tsx` — skeleton card/table rows
- [ ] Create `src/components/common/EmptyState.tsx` — illustration + message + CTA
- [ ] Create `src/components/common/ErrorState.tsx` — error display with retry
- [ ] Create `src/components/common/ConfirmDialog.tsx` — reusable confirm modal
- [ ] Create `src/pages/ForbiddenPage.tsx` — /403
- [ ] Create `src/pages/NotFoundPage.tsx` — /404
- [ ] Run `npm run lint && npm run build` — must pass

**API endpoints used in this stage:** None (no real API calls yet)

---

### Stage 2 — Auth + RBAC (UC1, UC2, UC3)

**Goal:** Login works, session persists, sidebar adapts by role, user management for ADMIN.

**Tasks:**
- [ ] Create `src/features/auth/LoginPage.tsx` — email/password form, submit state, error display
- [ ] Wire `POST /auth/login` → store token + user in Zustand
- [ ] Call `GET /auth/me` on app bootstrap to restore session
- [ ] Implement logout — clear store + redirect /login
- [ ] Sidebar nav items filtered by `useAuthStore().user.role`
- [ ] Create `src/features/users/UserManagementPage.tsx` — ADMIN only
  - Table: GET /users
  - Create dialog: POST /users
  - Assign role dialog: PUT /users/:id/roles
- [ ] Protect `/admin/users` with `RequireRole(['ADMIN'])`
- [ ] Run lint/build — must pass

**API endpoints used:**
- `POST /auth/login`
- `GET /auth/me`
- `GET /users` (ADMIN only)
- `POST /users` (ADMIN only)
- `PUT /users/:id/roles` (ADMIN only)

---

### Stage 3 — Patients + Visits (UC4–UC9)

**Goal:** Receptionist and Doctor can find patients, create records, manage visits and queue.

**Tasks:**

**Patients (UC4, UC5):**
- [ ] `src/features/patients/api.ts` — list(), getById(), create(), getMedicalHistory()
- [ ] `src/features/patients/PatientListPage.tsx` — keyword search, data table, role-filtered "Add" button
- [ ] `src/features/patients/PatientCreatePage.tsx` — form with Zod validation
- [ ] `src/features/patients/PatientDetailPage.tsx` — detail card + edit if authorized

**Visits (UC6, UC7, UC8, UC9):**
- [ ] `src/features/visits/api.ts` — list(), create(), openExamination()
- [ ] `src/features/visits/VisitListPage.tsx` — date filter + status filter + queue number column
- [ ] `src/features/visits/VisitCreatePage.tsx` — patient picker + date + reason form
- [ ] `src/features/visits/VisitDetailPage.tsx` — visit info + "Open Examination" button for Doctor/Admin
- [ ] Status badge display: `REGISTERED → WAITING → IN_EXAMINATION → COMPLETED / CANCELLED`
- [ ] Business error handling:
  - 409 on daily quota exceeded → clear toast message
  - 409 on duplicate visit same patient/day → clear toast message
- [ ] Run lint/build — must pass

**API endpoints used:**
- `GET /patients`, `POST /patients`, `GET /patients/:id`
- `GET /visits`, `POST /visits`, `POST /visits/:id/open-examination`

---

### Stage 4 — Examinations + Prescriptions + History (UC10–UC13)

**Goal:** Doctor can open, fill, prescribe, and complete examinations. History is viewable.

**Tasks:**

**Examination flow (UC10, UC12, UC13):**
- [ ] `src/features/examinations/api.ts` — getById(), update(), upsertPrescription(), complete()
- [ ] `src/features/examinations/ExaminationPage.tsx` — main exam workspace
  - Patient context card (read-only)
  - Symptoms + clinical notes + conclusion text areas (PATCH /examinations/:id)
  - Diagnosis section: disease multi-select (GET /diseases?activeOnly=true), isPrimary toggle
  - Prescription section: drug rows (GET /drugs?activeOnly=true) with quantity + dosage
  - "Complete Examination" button with confirm dialog → POST /examinations/:id/complete
  - Read-only display when `status === 'COMPLETED'`

**Prescription logic (UC12):**
- [ ] If no prescription exists → POST /examinations/:id/prescription
- [ ] If prescription exists → PUT /examinations/:id/prescription (replace-all)
- [ ] Show drug unit price from catalog (display only — backend uses snapshot at save time)

**Medical History (UC11):**
- [ ] `src/features/patients/MedicalHistoryPage.tsx` — GET /patients/:id/medical-history
  - Timeline of visits with exam summary
  - Diagnosis list + prescription items per visit
  - Read-only

- [ ] Run lint/build — must pass

**API endpoints used:**
- `GET /examinations/:id`, `PATCH /examinations/:id`
- `POST /examinations/:id/prescription`, `PUT /examinations/:id/prescription`
- `POST /examinations/:id/complete`
- `GET /diseases?activeOnly=true`
- `GET /drugs?activeOnly=true`
- `GET /patients/:id/medical-history`

---

### Stage 5 — Billing + Payments (UC14–UC16)

**Goal:** Cashier can issue invoices, record payments, and search invoices.

**Tasks:**
- [ ] `src/features/invoices/api.ts` — list(), getById(), createFromVisit(), recordPayment()
- [ ] `src/features/invoices/InvoiceListPage.tsx` — keyword/status/date filter, table
- [ ] `src/features/invoices/InvoiceDetailPage.tsx`
  - Invoice header (status badge, totalAmount, paidAmount, remaining)
  - Invoice items table
  - Payment history list
  - "Record Payment" button (CASHIER/ADMIN only)
- [ ] `src/features/invoices/PaymentDialog.tsx`
  - Amount input (max = remainingAmount, min = 1)
  - Method selector: CASH / TRANSFER / CARD
  - Note field
  - Validation: prevent amount > remaining
- [ ] "Issue Invoice" button on Visit detail page (Cashier/Admin) → POST /visits/:visitId/invoice
- [ ] Invoice status badges: DRAFT / ISSUED / PARTIALLY_PAID / PAID / VOID
- [ ] VND formatting on all money fields
- [ ] Run lint/build — must pass

**API endpoints used:**
- `POST /visits/:visitId/invoice`
- `GET /invoices`, `GET /invoices/:id`
- `POST /invoices/:id/payments`

---

### Stage 6 — Regulations + Catalogs + Reports (UC17–UC20)

**Goal:** Admin can manage regulations, catalogs. Manager can view reports.

**Tasks:**

**Regulations (UC17):**
- [ ] `src/features/regulations/api.ts` — getCurrent(), create(), activate()
- [ ] `src/features/regulations/RegulationPage.tsx`
  - Active regulation display card (MAX_PATIENTS_PER_DAY, CONSULTATION_FEE)
  - Version history list if returned by backend
  - "Create New Version" form: key-value pairs, note
  - "Activate" button with ConfirmDialog warning (changes not retroactive)

**Diseases (UC18):**
- [ ] `src/features/diseases/api.ts` — list(), create(), update()
- [ ] `src/features/diseases/DiseaseCatalogPage.tsx`
  - Search + active/inactive filter
  - Table with isActive badge
  - Create dialog (ADMIN only)
  - Edit dialog (ADMIN only) — name + toggle isActive

**Medicines (UC19):**
- [ ] `src/features/medicines/api.ts` — list(), create(), update()
- [ ] `src/features/medicines/MedicineCatalogPage.tsx`
  - Search + active/inactive filter
  - Table with unit + pricePerUnit (VND) + isActive badge
  - Create dialog (ADMIN only)
  - Edit dialog (ADMIN only) — name + unit + price + toggle isActive

**Monthly Report (UC20):**
- [ ] `src/features/reports/api.ts` — getMonthly(month: string)
- [ ] `src/features/reports/MonthlyReportPage.tsx`
  - Month/year selector (default: current month)
  - Summary cards: total visits, completed visits, total revenue (VND)
  - Monthly data table (if backend returns breakdown)
  - Loading skeleton + empty state
- [ ] Run lint/build — must pass

**API endpoints used:**
- `GET /regulations/current`, `POST /regulations`, `PATCH /regulations/:id/activate`
- `GET /diseases`, `POST /diseases`, `PATCH /diseases/:id`
- `GET /drugs`, `POST /drugs`, `PATCH /drugs/:id`
- `GET /reports/monthly`

---

### Stage 7 — Final QA

**Goal:** Verify completeness, correctness, and quality before handoff.

**Tasks:**
- [ ] Verify every `api.ts` call maps to an entry in `api-endpoint-inventory.md`
- [ ] Verify no invented endpoints
- [ ] Verify sidebar nav by role (smoke test each role's visible items)
- [ ] Verify /403 redirect for unauthorized routes
- [ ] Verify all screens have loading / empty / error states
- [ ] Verify no `passwordHash` or sensitive fields rendered anywhere
- [ ] Verify no Phase 2 features (inventory, booking, insurance, multi-branch)
- [ ] Verify TypeScript strict mode: `tsc --noEmit` must pass
- [ ] Run `npm run lint` — must pass
- [ ] Run `npm run build` — must pass
- [ ] Create `frontend-docs/final-frontend-qa-report.md`

---

## Route Map

```
/login

/app
  /dashboard                    → All roles

  /patients                     → ADMIN, RECEPTIONIST, DOCTOR, MANAGER
  /patients/new                 → ADMIN, RECEPTIONIST
  /patients/:id                 → ADMIN, RECEPTIONIST, DOCTOR, MANAGER
  /patients/:id/history         → ADMIN, DOCTOR, MANAGER

  /visits                       → ADMIN, RECEPTIONIST, DOCTOR, MANAGER
  /visits/new                   → ADMIN, RECEPTIONIST
  /visits/:id                   → ADMIN, RECEPTIONIST, DOCTOR, MANAGER

  /examinations/:id             → ADMIN, DOCTOR

  /invoices                     → ADMIN, CASHIER, MANAGER
  /invoices/:id                 → ADMIN, CASHIER, MANAGER

  /reports/monthly              → ADMIN, MANAGER

  /settings/regulations         → ADMIN
  /catalog/diseases             → ADMIN, DOCTOR (read), MANAGER (read)
  /catalog/medicines            → ADMIN, DOCTOR (read), MANAGER (read)

  /admin/users                  → ADMIN

/403
/404
```

---

## Component Checklist

### Common Components (Stage 1)
- [ ] AppShell
- [ ] Sidebar (role-filtered)
- [ ] Topbar
- [ ] PageHeader
- [ ] DataTable (TanStack Table)
- [ ] StatusBadge
- [ ] RoleBadge
- [ ] LoadingState (skeleton rows)
- [ ] EmptyState
- [ ] ErrorState
- [ ] ConfirmDialog

### Feature Components
- [ ] LoginPage
- [ ] PatientListPage / PatientCreatePage / PatientDetailPage
- [ ] MedicalHistoryPage
- [ ] VisitListPage / VisitCreatePage / VisitDetailPage
- [ ] ExaminationPage (exam form + diagnosis + prescription)
- [ ] InvoiceListPage / InvoiceDetailPage / PaymentDialog
- [ ] RegulationPage
- [ ] DiseaseCatalogPage
- [ ] MedicineCatalogPage
- [ ] MonthlyReportPage
- [ ] UserManagementPage

---

## Key Design Decisions

1. **Prescription upsert pattern:** POST if no prescription, PUT to replace. Frontend checks if `examination.prescription` exists before deciding method.
2. **Drug/Disease price snapshot:** Display current price from catalog in prescription UI as hint. Do not treat it as the saved value — backend records `unitPrice` at save time.
3. **Visit → Exam → Invoice flow:** Each entity is linked by ID. Frontend navigates: Visit detail → open exam → ExaminationPage → complete → CashierIssues invoice from Visit detail.
4. **Regulation activation warning:** Show explicit warning that changing active regulation does NOT retroactively affect past invoices (backend behavior, communicate in UI).
5. **No refresh token flow yet:** Backend may not expose `/auth/refresh`. On 401, clear session and redirect /login immediately.
6. **Medical history ordering:** Visits ordered by visitDate DESC, examinations nested inside each visit card.
