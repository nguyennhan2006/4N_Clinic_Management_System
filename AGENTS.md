# AGENTS.md — 4N Clinic Management System

Hướng dẫn cho Codex khi làm việc trong project này.

## Tổng quan project

Web app quản lý phòng mạch tư nhân, phase 1. Backend NestJS + Prisma + PostgreSQL. Frontend React + Vite (chưa bắt đầu).

**Bản kế hoạch chính:** [`PLAN.md`](PLAN.md) — đọc trước khi làm bất cứ thứ gì.
**Business rules:** [`docs/business/business-rules.md`](docs/business/business-rules.md) — nguồn chốt logic nghiệp vụ.

## Cấu trúc quan trọng

```
backend/src/modules/   # 11 feature modules
backend/prisma/        # schema.prisma + seed.ts
docs/business/         # business-rules.md, role-matrix.md
docs/agile/            # backlog.md, sprint-plan.md
docs/api/              # api-scope.md, error-codes.md
docs/architecture/     # architecture-overview.md, module-boundaries.md
```

## Quy tắc khi code

### Trước khi tạo/sửa bất kỳ file nào
1. Đọc `PLAN.md` phần liên quan
2. Kiểm tra business rules trong `docs/business/business-rules.md`
3. Liệt kê rõ: file nào tạo mới, file nào sửa, file nào là core

### Về schema
- **Schema là nguồn chốt dữ liệu.** Không code service trước khi schema đã được migrate.
- Có 6 schema mismatch cần sửa trước (xem `PLAN.md` mục 2).
- Sau mỗi thay đổi schema: chạy `cd backend && npx prisma migrate dev`.

### Về business logic
- Mọi business rule (BR-01 đến BR-20) phải implement ở **service layer**, không ở controller.
- Không dùng guard/middleware để thay thế business validation.
- Các operation quan trọng phải dùng `prisma.$transaction()`: tạo visit (queue number), record payment (check overpayment), activate regulation.

### Về RBAC
- Mọi route phải có `@UseGuards(JwtAuthGuard)` trừ `/auth/login`.
- RBAC check phải ở backend, không dựa vào UI ẩn nút.
- Role matrix: [`docs/business/role-matrix.md`](docs/business/role-matrix.md).

### Về code style
- Không tạo file tên mơ hồ (`test2.ts`, `fix_temp.ts`).
- Tên file theo NestJS convention: `patients.service.ts`, `create-patient.dto.ts`.
- Không comment giải thích WHAT (tên hàm đã nói rõ). Chỉ comment WHY khi logic không hiển nhiên.
- Không thêm error handling cho case không thể xảy ra.

### Về test
- Test chính thức: `backend/test/` hoặc `*.spec.ts` cạnh file source.
- Test tạm thời debug: `scripts/debug/` — xóa sau khi fix xong.

## Lệnh hay dùng

```bash
# Backend
cd backend
npm run start:dev          # dev server
npm run test               # unit tests
npm run test:e2e           # e2e tests
npx prisma migrate dev     # apply schema changes
npx prisma studio          # GUI xem DB
npx prisma db seed         # chạy seed

# Format + lint
npm run format
npm run lint
```

## Môi trường

- Backend port: 3000
- Swagger UI: http://localhost:3000/api/docs
- Database: PostgreSQL, xem `backend/.env`
- `.env.example` có tại `backend/.env.example`

## Những thứ CHƯA làm ở ver1

- Đặt lịch online
- Quản lý tồn kho thuốc đầy đủ
- Multi-branch
- Patient portal
- Inventory
- Refund / credit note phức tạp

Nếu ai hỏi hoặc suggest thêm những thứ này — đánh dấu rõ là ver2.
# AGENTS.md — 4N Clinic Management System Frontend Guide

> Project: SE104 — Quản lý phòng mạch tư nhân  
> Product name: 4N Clinic Management System  
> Current milestone: Backend Phase 1 completed through UC1 → UC20. Frontend implementation starts now.  
> Intended model/tool: Codex Sonnet 4.6 / Codex  
> Main goal: Build a production-quality internal frontend that integrates with the existing NestJS backend API without inventing endpoints.

---

## 1. Role for Codex

You are a **Senior Frontend Engineer + Integration Engineer + UI/UX Engineer** working on an internal web platform for a private clinic.

You must:
- Read the existing backend codebase before implementing frontend API calls.
- Treat the backend implementation as the source of truth.
- Build frontend within Phase 1 scope only.
- Preserve role-based access control in the UI.
- Create a clean, maintainable, feature-based React codebase.
- Run build/lint checks after meaningful implementation steps.
- Report changes clearly after each step.

You must not:
- Invent API endpoints.
- Hard-code fake business data as if it were real.
- Add Phase 2 features.
- Use `any` casually.
- Ignore TypeScript, lint, or build errors.
- Expose backend-sensitive fields such as `passwordHash`.
- Move business rules from backend into frontend as the only source of truth.

---

## 2. Project Context

4N Clinic Management System is a Phase 1 internal web application for a private outpatient clinic.

The system supports these roles:

| Role | Vietnamese label | Main responsibility |
|---|---|---|
| ADMIN | Quản trị viên | System configuration, users, roles, catalogs, regulations |
| RECEPTIONIST | Lễ tân | Patient records, patient reception, visit creation, queue |
| DOCTOR | Bác sĩ | Open visit, create examination, diagnose, prescribe, complete exam |
| CASHIER | Thu ngân | Invoice creation/search, payment recording |
| MANAGER | Quản lý | Monthly reports, operational overview, management visibility |

The frontend must be a role-based internal clinical platform, not a marketing website.

---

## 3. Phase 1 Use Case Scope

Frontend must stay within these 20 use cases:

| UC | Feature |
|---|---|
| UC1 | Đăng nhập |
| UC2 | Quản lý tài khoản |
| UC3 | Phân quyền |
| UC4 | Tra cứu bệnh nhân |
| UC5 | Tạo hồ sơ bệnh nhân |
| UC6 | Tiếp nhận bệnh nhân |
| UC7 | Tạo lượt khám |
| UC8 | Xem danh sách khám |
| UC9 | Mở lượt khám |
| UC10 | Lập phiếu khám |
| UC11 | Xem lịch sử khám |
| UC12 | Kê đơn thuốc |
| UC13 | Hoàn tất phiếu khám |
| UC14 | Lập hóa đơn |
| UC15 | Ghi nhận thanh toán |
| UC16 | Tra cứu hóa đơn |
| UC17 | Thay đổi quy định |
| UC18 | Quản lý danh mục bệnh |
| UC19 | Quản lý danh mục thuốc |
| UC20 | Xem báo cáo tháng cơ bản |

Out of scope:
- Patient portal
- Online appointment booking
- SMS/email reminders
- Drug inventory import/export/stock
- Multi-branch / multi-tenant
- Insurance workflow
- Advanced analytics
- Telemedicine
- Lab/imaging workflow
- Public-facing website

---

## 4. Backend Architecture Summary from Current Diagram

### 4.1 System Context

The system is an internal web application used by:
- Admin
- Receptionist
- Doctor
- Cashier
- Manager

External integrations/components:
- JWT Auth Service for stateless authentication with access token and refresh token.
- PostgreSQL database for persistent storage.
- HTTPS REST API with Bearer Token.

### 4.2 Container Architecture

Known architecture from the diagram:

| Container | Technology | Responsibility |
|---|---|---|
| Frontend SPA | React + Vite + TypeScript | Browser-based user interface |
| API Server | NestJS + TypeScript | REST API, business logic, JWT Guard, Role Guard |
| Database | PostgreSQL | Relational persistence |
| ORM | Prisma ORM | Database access and schema migration |

Known backend characteristics:
- API server exposes Swagger/OpenAPI docs, likely at `/api/docs`.
- API server uses JWT Guard and Role Guard.
- API server uses Prisma Client ORM.
- Frontend communicates with backend via HTTPS REST / JSON.

Important:
- The diagram is an architectural guide.
- The actual backend codebase is the source of truth.

---

## 5. Backend Module Reference

From the backend component diagram, the current backend is organized around these modules.

### 5.1 Foundation Modules

| Module | Purpose |
|---|---|
| PrismaModule | Database client, shared Prisma service |
| AuthModule | Login, JWT issue/refresh, authentication flow |
| HealthModule | Health check endpoint |

### 5.2 Core Clinical Flow

| Module | Purpose |
|---|---|
| PatientsModule | Patient CRUD, patient search |
| VisitsModule | Visit creation, queue number, daily cap |
| ExaminationsModule | Examination, diagnosis, prescription, completion |
| BillingModule | Invoice, payment, invoice search |

### 5.3 Catalog Management

| Module | Purpose |
|---|---|
| DiseasesModule | Disease catalog |
| DrugsModule / MedicinesModule | Drug/medicine catalog |
| RegulationsModule | Clinic regulations, version-controlled rules |

### 5.4 Reporting

| Module | Purpose |
|---|---|
| ReportsModule | Monthly basic report |

---

## 6. Data Model Reference

Use this as conceptual context only. Always verify actual field names in `schema.prisma`, DTOs, controllers, and services.

| Entity | Important fields from diagram |
|---|---|
| User | id, email, passwordHash, role |
| Patient | id, fullName, dateOfBirth, gender, phone, address |
| Visit | id, patientId, date, queueNumber, status, examinedBy |
| Examination | visitId, doctorId, diagnosis, consultationFee |
| Disease | id, code, name, isActive |
| Prescription | examinationId, items[] |
| PrescriptionItem | prescriptionId, drugId, quantity, unitPrice, snapshot, creationTime |
| Drug/Medicine | id, name, unit, pricePerUnit |
| Invoice | visitId, totalAmount, paidAmount, status |
| RegulationVersion | key, value, isActive, activatedAt |

Important UI implications:
- Never display `passwordHash`.
- Use badges for status fields.
- Use VND formatting for money fields.
- Use date formatting for visit/examination/invoice/report fields.
- Use snapshot fields for historical invoice/prescription display if provided by backend.

---

## 7. Known API Reference from Diagram

This section is only a starting reference. Before coding, scan the backend and create an exact API Endpoint Inventory.

Possible endpoints shown in the diagram include:

### Auth
- `POST /auth/login` — public login

### Patients
- `POST /patients`
- `GET /patients`
- `GET /patients/:id`

### Visits
- `POST /visits`
- `GET /visits`
- `GET /visits/:id`
- `GET /visits/queue/:date`
- `PATCH /visits/:id/status`

### Examinations / Prescriptions
- `POST /examinations/:id/diagnosis`
- `PUT /examinations/:id/prescription`
- `DELETE /examinations/:id/prescription`

### Invoices / Payments
- `POST /visits/:id/invoice`
- `GET /invoices`
- `GET /invoices/:id`
- `POST /invoices/:id/payments`

### Diseases
- `GET /diseases`
- `PATCH /diseases/:id`

### Drugs / Medicines
- `GET /drugs`
- `POST /drugs`
- `PATCH /drugs/:id`

### Regulations
- `GET /regulations/current`
- `GET /regulations`
- `POST /regulations`
- `PUT /regulations/:id/activate`

### Reports
- `GET /reports/monthly`

Required action:
- Verify every endpoint by reading backend code before using it.
- If actual endpoint differs, follow actual backend.
- If endpoint is missing, document it under `frontend-docs/missing-backend-endpoints.md`.

---

## 8. Mandatory First Step: Backend API Audit

Before writing frontend integration code, create:

```text
frontend-docs/api-endpoint-inventory.md
frontend-docs/rbac-matrix.md
frontend-docs/frontend-implementation-plan.md
frontend-docs/missing-backend-endpoints.md
```

Use commands similar to:

```bash
grep -R "@Controller" backend/src -n
grep -R "@Get\|@Post\|@Patch\|@Put\|@Delete" backend/src -n
grep -R "Roles" backend/src -n
grep -R "ApiTags\|ApiOperation\|ApiResponse" backend/src -n
grep -R "enum .*Role\|Role" backend/prisma backend/src -n
grep -R "model " backend/prisma/schema.prisma -n
```

Also inspect:
- `backend/src/**/*.controller.ts`
- `backend/src/**/*.service.ts`
- `backend/src/**/*.dto.ts`
- `backend/prisma/schema.prisma`
- Swagger configuration in `main.ts`

`api-endpoint-inventory.md` must contain:

```md
# API Endpoint Inventory

## Auth
| Method | Path | Controller | Request DTO | Response shape | Roles | Frontend screen |
|---|---|---|---|---|---|---|

## Patients
...

## Visits
...

## Examinations
...

## Billing / Invoices / Payments
...

## Diseases
...

## Drugs / Medicines
...

## Regulations
...

## Reports
...
```

---

## 9. Frontend Tech Stack

Use:

| Concern | Technology |
|---|---|
| Build | Vite |
| UI Framework | React + TypeScript |
| Styling | Tailwind CSS |
| Component Library | shadcn/ui |
| Server State | TanStack Query |
| Local/Auth State | Zustand |
| Forms | React Hook Form |
| Validation | Zod |
| Tables | TanStack Table or shadcn table |
| Icons | lucide-react |
| Dates | date-fns |
| Testing | Vitest + React Testing Library |

---

## 10. Frontend Design Style

### 10.1 Style Name

Use:

```text
Gentle Pastels Clinical Role-Based Dashboard
```

The frontend should feel:
- Clean
- Calm
- Clinical
- Minimal
- Professional
- Suitable for private clinic staff
- Similar in structure to a SaaS clinical platform: left sidebar, main workspace, cards/tables/forms.

### 10.2 Palette

Use this palette in Tailwind config:

```ts
clinic: {
  bg: "#F8F7F4",
  surface: "#FFFFFF",
  sidebar: "#6D5BD0",
  sidebarMuted: "#EEEAFB",
  primary: "#8B7CF6",
  primaryHover: "#7565E8",
  secondary: "#A7D8DE",
  accent: "#F5C6AA",
  success: "#A8D5BA",
  warning: "#F6D58E",
  danger: "#EFA7A7",
  text: "#2F2F3A",
  muted: "#6B7280",
  border: "#E7E2DA",
}
```

Suggested Tailwind extension:

```ts
theme: {
  extend: {
    colors: {
      clinic: {
        bg: "#F8F7F4",
        surface: "#FFFFFF",
        sidebar: "#6D5BD0",
        sidebarMuted: "#EEEAFB",
        primary: "#8B7CF6",
        primaryHover: "#7565E8",
        secondary: "#A7D8DE",
        accent: "#F5C6AA",
        success: "#A8D5BA",
        warning: "#F6D58E",
        danger: "#EFA7A7",
        text: "#2F2F3A",
        muted: "#6B7280",
        border: "#E7E2DA",
      },
    },
    borderRadius: {
      clinic: "1rem",
    },
    boxShadow: {
      clinic: "0 8px 24px rgba(47, 47, 58, 0.08)",
    },
  },
}
```

### 10.3 UI Layout

Use:

```text
+---------------------------------------------------------+
| Topbar: Search | Notifications | User role/avatar       |
+----------------------+----------------------------------+
| Pastel purple sidebar| Page title + action button       |
| 4N Clinic logo       | Filter/search                    |
| Dashboard            | White rounded table/card         |
| Patients             |                                  |
| Visits               |                                  |
| Examinations         |                                  |
| Invoices             |                                  |
| Reports              |                                  |
| Settings             |                                  |
+----------------------+----------------------------------+
```

Rules:
- Sidebar fixed left.
- Main background `clinic.bg`.
- Cards/tables use white surface, rounded corners, subtle shadow.
- Primary actions use `clinic.primary`.
- Dangerous actions use soft red pastel but still clearly destructive.
- Avoid heavy gradients.
- Avoid dark mode for Phase 1 unless already required.
- Avoid excessive animation.

---

## 11. Suggested Frontend Folder Structure

```text
frontend/
  src/
    app/
      router.tsx
      providers.tsx

    components/
      ui/
      common/
        AppShell.tsx
        Sidebar.tsx
        Topbar.tsx
        PageHeader.tsx
        DataTable.tsx
        ConfirmDialog.tsx
        EmptyState.tsx
        ErrorState.tsx
        LoadingState.tsx
        RoleBadge.tsx
        StatusBadge.tsx

    config/
      env.ts
      navigation.ts
      permissions.ts

    features/
      auth/
        api.ts
        types.ts
        store.ts
        LoginPage.tsx
        ProtectedRoute.tsx
        RequireRole.tsx

      dashboard/
        DashboardPage.tsx

      patients/
        api.ts
        types.ts
        PatientListPage.tsx
        PatientCreatePage.tsx
        PatientDetailPage.tsx
        MedicalHistoryPage.tsx
        components/

      visits/
        api.ts
        types.ts
        VisitListPage.tsx
        VisitCreatePage.tsx
        VisitDetailPage.tsx
        components/

      examinations/
        api.ts
        types.ts
        ExaminationPage.tsx
        ExaminationForm.tsx
        PrescriptionSection.tsx
        DiagnosisSection.tsx

      invoices/
        api.ts
        types.ts
        InvoiceListPage.tsx
        InvoiceDetailPage.tsx
        PaymentDialog.tsx

      regulations/
        api.ts
        types.ts
        RegulationPage.tsx

      diseases/
        api.ts
        types.ts
        DiseaseCatalogPage.tsx

      medicines/
        api.ts
        types.ts
        MedicineCatalogPage.tsx

      reports/
        api.ts
        types.ts
        MonthlyReportPage.tsx

      users/
        api.ts
        types.ts
        UserManagementPage.tsx
        RoleManagementPage.tsx

    lib/
      api-client.ts
      query-client.ts
      date.ts
      money.ts
      errors.ts
      auth.ts
      zod.ts

    pages/
      ForbiddenPage.tsx
      NotFoundPage.tsx

    styles/
      globals.css

    main.tsx
```

---

## 12. Routing Plan

Suggested routes:

```text
/login

/app
  /dashboard

  /patients
  /patients/new
  /patients/:id
  /patients/:id/history

  /visits
  /visits/new
  /visits/:id

  /examinations/:id
  /examinations/:id/prescription

  /invoices
  /invoices/:id

  /reports/monthly

  /settings/regulations
  /catalog/diseases
  /catalog/medicines

  /admin/users
  /admin/roles

/403
/404
```

Adjust route names only if needed to match project conventions.

---

## 13. RBAC Rules

### 13.1 Frontend RBAC Principles

Frontend RBAC improves UX, but backend RBAC remains the security source of truth.

Rules:
1. User not logged in → redirect `/login`.
2. User logged in but missing role → redirect `/403`.
3. Hide menu items outside user role.
4. Hide or disable actions outside user role.
5. If backend returns 401 → clear session and redirect login.
6. If backend returns 403 → show permission error or redirect `/403`.

### 13.2 Suggested Menu Visibility

| Role | Main menu |
|---|---|
| RECEPTIONIST | Dashboard, Patients, Visits |
| DOCTOR | Dashboard, Visits, Examinations, Patient History |
| CASHIER | Dashboard, Invoices, Payments |
| MANAGER | Dashboard, Monthly Reports, Catalogs |
| ADMIN | Dashboard, Users, Roles, Regulations, Catalogs, all management screens as allowed |

Verify actual role enum names in backend.

---

## 14. API Client Rules

Create `src/lib/api-client.ts`.

Requirements:
- `VITE_API_BASE_URL` from env.
- Attach `Authorization: Bearer <accessToken>`.
- Handle JSON body.
- Handle query params.
- Normalize backend errors.
- Do not swallow errors.
- Do not assume refresh endpoint unless it exists.

Suggested error class:

```ts
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
```

Error mapping:
- 400 → Invalid form data.
- 401 → Session expired.
- 403 → No permission.
- 404 → Not found.
- 409 → Business rule conflict.
- 500 → Server error.

---

## 15. Data Fetching Rules

Use TanStack Query.

Each feature should expose:
- `api.ts`: low-level API functions.
- `types.ts`: request/response types.
- hooks either in the same file or separate file if the feature grows.

Example pattern:

```ts
export function usePatientsQuery(params: PatientSearchParams) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () => patientApi.list(params),
  });
}
```

Mutation pattern:

```ts
export function useCreatePatientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
```

---

## 16. UX States Required on Every Main Screen

Every API-driven screen must handle:
- Loading state
- Empty state
- Error state
- Success toast
- Validation error
- Confirm dialog for irreversible/high-risk actions

Examples:
- Table loading → skeleton rows.
- No results → EmptyState with next action.
- 409 from visit creation → show clear business message.
- 403 from API → show no permission message.
- Payment over remaining amount → show clear validation message.

---

## 17. Feature Implementation Guide

### 17.1 Auth — UC1

Screens:
- `/login`

Must include:
- Email/password form
- Submit loading state
- Friendly error for invalid credentials
- Redirect to dashboard after login
- Store current user and role

Do not add:
- Public registration
- Forgot password unless backend supports it

### 17.2 Users and Roles — UC2, UC3

Screens:
- `/app/admin/users`
- `/app/admin/roles`

Role:
- ADMIN only

Must include if backend endpoints exist:
- User list
- Create user
- Update role
- Activate/deactivate user if supported

Do not display:
- passwordHash

### 17.3 Patients — UC4, UC5

Screens:
- `/app/patients`
- `/app/patients/new`
- `/app/patients/:id`

Must include:
- Search/filter
- Table
- Create form
- Detail page
- Form validation

### 17.4 Visits — UC6, UC7, UC8, UC9

Screens:
- `/app/visits`
- `/app/visits/new`
- `/app/visits/:id`

Must include:
- Date filter
- Status filter
- Queue number display
- Create visit form
- Open examination action for Doctor/Admin if backend supports it

Business error handling:
- Duplicate visit in same day
- Daily quota exceeded
- Invalid visit status

### 17.5 Examinations and Medical History — UC10, UC11, UC12, UC13

Screens:
- `/app/examinations/:id`
- `/app/patients/:id/history`

Must include:
- Patient context card
- Visit context card
- Symptoms/notes/diagnosis form if DTO supports it
- Disease selection
- Primary diagnosis handling if supported
- Prescription section
- Complete examination action
- Read-only state after completion if backend disallows edits
- Medical history timeline

### 17.6 Billing, Invoices, Payments — UC14, UC15, UC16

Screens:
- `/app/invoices`
- `/app/invoices/:id`

Must include:
- Invoice search/list
- Invoice detail
- Issue invoice if endpoint exists
- Payment dialog
- Payment history if returned by backend
- VND formatting
- Prevent negative payment amount
- Prevent amount greater than remaining amount if remaining amount exists on response

Backend remains source of truth.

### 17.7 Regulations — UC17

Screen:
- `/app/settings/regulations`

Must include:
- Current active regulation
- Regulation history if endpoint exists
- Create/update regulation version if supported
- Activate regulation with confirm dialog
- Warning: regulation changes are not retroactive

### 17.8 Diseases — UC18

Screen:
- `/app/catalog/diseases`

Must include:
- List/search
- Create/edit if backend supports
- Active/inactive if backend supports
- Disease should be selectable in examination only if active

### 17.9 Medicines/Drugs — UC19

Screen:
- `/app/catalog/medicines`

Must include:
- List/search
- Create/edit if backend supports
- Active/inactive if backend supports
- Price/unit display
- Use in prescription selection

Do not add:
- Inventory stock
- Import/export
- Warehouse management

### 17.10 Monthly Report — UC20

Screen:
- `/app/reports/monthly`

Must include:
- Month/year selector
- Summary cards
- Basic monthly table/chart if backend data supports it
- Empty state
- Loading state
- VND formatting

Do not add advanced BI beyond Phase 1.

---

## 18. Quality Rules

### 18.1 TypeScript

- No casual `any`.
- Prefer explicit request/response types.
- If backend shape is uncertain, inspect DTO/service.
- Use type narrowing for optional fields.
- Do not suppress TypeScript errors with `as any`.

### 18.2 Forms

Use:
- React Hook Form
- Zod
- Clear validation messages
- Backend error mapping

### 18.3 Components

Prefer small reusable components:
- `PageHeader`
- `DataTable`
- `StatusBadge`
- `RoleBadge`
- `ConfirmDialog`
- `EmptyState`
- `ErrorState`
- `LoadingState`

### 18.4 Accessibility

- Buttons must have clear labels.
- Forms must have labels.
- Icon-only buttons need accessible labels.
- Color should not be the only way to understand status.

### 18.5 Security UX

- Hide unauthorized screens/actions.
- Do not store or log sensitive data.
- Do not render raw backend error stacks.
- Do not expose passwordHash.
- Logout must clear tokens and user state.

---

## 19. Development Workflow for Codex

Follow this order.

### Stage 0 — Audit

Do not code UI yet.

Create:
- `frontend-docs/api-endpoint-inventory.md`
- `frontend-docs/rbac-matrix.md`
- `frontend-docs/frontend-implementation-plan.md`
- `frontend-docs/missing-backend-endpoints.md`

### Stage 1 — Scaffold

Create:
- Vite React TypeScript app if missing
- Tailwind config
- shadcn/ui setup
- App providers
- Router
- API client
- Auth store
- Route guards
- App shell
- Sidebar
- Topbar
- 403/404 pages

Run:
```bash
npm run lint
npm run build
```

### Stage 2 — Auth + RBAC

Implement:
- Login page
- Session handling
- Current user loading
- Role-based sidebar
- Protected routes

Run build/lint.

### Stage 3 — Patients + Visits

Implement:
- Patient list/create/detail
- Visit list/create/detail
- Queue/date/status UX
- Business conflict error handling

Run build/lint.

### Stage 4 — Examinations + Prescriptions + History

Implement:
- Open examination flow
- Examination form
- Diagnosis
- Prescription
- Complete examination
- Patient history

Run build/lint.

### Stage 5 — Billing

Implement:
- Invoice list/detail
- Issue invoice if endpoint exists
- Payment recording
- Payment validation and VND formatting

Run build/lint.

### Stage 6 — Regulations + Catalogs + Reports

Implement:
- Regulations
- Diseases
- Medicines
- Monthly reports

Run build/lint.

### Stage 7 — Final QA

Create:
- `frontend-docs/final-frontend-qa-report.md`

Check:
- All routes guarded
- Sidebar correct by role
- All API calls exist in inventory
- No fake endpoint
- No random `any`
- Loading/empty/error states
- Build pass
- Lint pass

---

## 20. Required Final Report Format

After every implementation stage, report:

```md
## Stage Completed: <name>

### Files Created
- ...

### Files Modified
- ...

### Backend Endpoints Used
- METHOD /path — screen

### Role/RBAC Changes
- ...

### UX States Implemented
- Loading:
- Empty:
- Error:
- Success:
- Confirm:

### Validation
- npm run lint: pass/fail
- npm run build: pass/fail
- tests: pass/fail/not run

### Issues / Blockers
- ...
```

---

## 21. Definition of Done

Frontend Phase 1 is done when:

- Login works.
- User is routed according to auth state.
- Sidebar changes by role.
- Unauthorized routes go to `/403`.
- Patient search/create/detail works.
- Visit creation/list/queue flow works.
- Doctor can open and complete examination according to backend rules.
- Prescription flow works if backend supports it.
- Medical history displays.
- Invoice and payment flow works.
- Regulation management works if endpoint exists.
- Disease catalog works.
- Medicine catalog works.
- Monthly report works.
- No frontend API call targets a missing endpoint.
- No sensitive field is displayed.
- Build passes.
- Lint passes.
- Final QA report exists.

---

## 22. Master Prompt for Codex Sonnet 4.6

Copy this into Codex when starting the frontend work:

```text
You are Senior Frontend Engineer + Integration Engineer + UI/UX Engineer for the 4N Clinic Management System.

The backend Phase 1 is completed through UC1 → UC20. Your task is to build the frontend internal clinical platform using the existing backend API only.

Project context:
- SE104 — Quản lý phòng mạch tư nhân
- Product: 4N Clinic Management System
- Frontend stack: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query + Zustand + React Hook Form + Zod
- Backend stack: NestJS + TypeScript + Prisma + PostgreSQL
- Auth: JWT access token / refresh token if supported by backend
- Authorization: backend uses JWT Guard + Role Guard
- API style: REST JSON
- Swagger may exist at /api/docs

Critical rules:
1. Do not invent API endpoints.
2. First scan the backend codebase and create API Endpoint Inventory.
3. Use backend controllers, DTOs, services, Prisma schema, and Swagger config as source of truth.
4. If the architecture diagram and codebase differ, follow the codebase.
5. If an endpoint needed by a UI flow is missing, document it. Do not fake it.
6. Keep frontend within Phase 1 only.
7. Do not build patient portal, online booking, reminders, inventory, insurance, multi-branch, or advanced analytics.
8. Preserve role-based UX: hide unauthorized menus/actions and route unauthorized access to /403.
9. Backend remains the security source of truth.
10. Run lint/build after each meaningful stage and report results.

Use this design style:
"Gentle Pastels Clinical Role-Based Dashboard"
- Sidebar left, pastel purple.
- Main background soft off-white.
- Cards/tables white with rounded corners and subtle shadows.
- Use this palette:
  bg #F8F7F4
  surface #FFFFFF
  sidebar #6D5BD0
  sidebarMuted #EEEAFB
  primary #8B7CF6
  primaryHover #7565E8
  secondary #A7D8DE
  accent #F5C6AA
  success #A8D5BA
  warning #F6D58E
  danger #EFA7A7
  text #2F2F3A
  muted #6B7280
  border #E7E2DA

Workflow:
A. Audit backend and create:
   - frontend-docs/api-endpoint-inventory.md
   - frontend-docs/rbac-matrix.md
   - frontend-docs/frontend-implementation-plan.md
   - frontend-docs/missing-backend-endpoints.md
B. Scaffold frontend architecture:
   - router
   - providers
   - API client
   - auth store
   - route guards
   - app shell
   - sidebar/topbar
   - common states
C. Implement modules in this order:
   1. Auth + RBAC
   2. Patients + Visits
   3. Examinations + Prescriptions + Medical History
   4. Invoices + Payments
   5. Regulations + Diseases + Medicines + Reports
D. Final QA:
   - verify every API call exists
   - verify role-based UI
   - verify no Phase 2 feature
   - verify build/lint pass
   - create final QA report

Start now with Stage 0 only: scan backend and generate the required frontend-docs files. Do not implement UI until the audit is complete.
```

---

## 23. Stage Prompts

### Stage 0 Prompt — Backend Audit Only

```text
Read AGENTS.md. Execute Stage 0 only.

Scan the backend codebase and create:
1. frontend-docs/api-endpoint-inventory.md
2. frontend-docs/rbac-matrix.md
3. frontend-docs/frontend-implementation-plan.md
4. frontend-docs/missing-backend-endpoints.md

Do not implement frontend UI yet.
Do not invent endpoints.
Use backend controllers, DTOs, services, Prisma schema, and Swagger config as source of truth.

After finishing, summarize:
- controllers found
- endpoints found
- roles found
- missing endpoints, if any
- recommended frontend implementation order
```

### Stage 1 Prompt — Frontend Scaffold

```text
Read AGENTS.md and the files in frontend-docs.

Implement Stage 1:
- Vite React TypeScript app if missing
- Tailwind and shadcn/ui setup
- Gentle Pastels palette
- app providers
- router
- API client
- auth store skeleton
- ProtectedRoute
- RequireRole
- AppShell
- Sidebar
- Topbar
- PageHeader
- common Loading/Empty/Error states
- 403 and 404 pages

Do not implement business screens yet except placeholders.

Run lint/build and report results.
```

### Stage 2 Prompt — Auth + RBAC

```text
Read AGENTS.md and api-endpoint-inventory.md.

Implement Stage 2:
- UC1 login
- session persistence
- current user loading if backend endpoint exists
- logout
- role-based sidebar
- route guards
- UC2/UC3 user and role management only if backend endpoints exist

Do not invent endpoints.
Run lint/build and report results.
```

### Stage 3 Prompt — Patients + Visits

```text
Read AGENTS.md and api-endpoint-inventory.md.

Implement Stage 3:
- UC4 patient search/list
- UC5 patient create/detail
- UC6 reception flow if endpoint exists
- UC7 create visit
- UC8 visit list by date/status
- visit detail if endpoint exists
- queue number/status badge display
- handle duplicate visit and daily quota conflicts

Do not invent endpoints.
Run lint/build and report results.
```

### Stage 4 Prompt — Examinations + Prescriptions + History

```text
Read AGENTS.md and api-endpoint-inventory.md.

Implement Stage 4:
- UC9 open examination
- UC10 examination form/diagnosis
- UC11 patient medical history
- UC12 prescription
- UC13 complete examination
- disease/medicine selection using real catalog endpoints
- read-only state after completion if backend enforces it

Do not invent endpoints.
Run lint/build and report results.
```

### Stage 5 Prompt — Billing

```text
Read AGENTS.md and api-endpoint-inventory.md.

Implement Stage 5:
- UC14 issue invoice if endpoint exists
- UC15 record payment
- UC16 invoice search/list/detail
- payment dialog
- payment amount validation
- invoice status badges
- VND formatting

Do not invent endpoints.
Run lint/build and report results.
```

### Stage 6 Prompt — Regulations + Catalogs + Reports

```text
Read AGENTS.md and api-endpoint-inventory.md.

Implement Stage 6:
- UC17 regulations
- UC18 disease catalog
- UC19 medicine/drug catalog
- UC20 monthly report

Do not implement inventory, patient portal, online booking, reminders, insurance, or multi-branch features.
Do not invent endpoints.
Run lint/build and report results.
```

### Stage 7 Prompt — Final QA

```text
Read AGENTS.md and all frontend-docs.

Perform final QA:
1. Verify every API call is listed in api-endpoint-inventory.md.
2. Verify no endpoint is invented.
3. Verify sidebar and routes by role.
4. Verify /403 behavior.
5. Verify all main screens have loading/empty/error states.
6. Verify no passwordHash or sensitive field is displayed.
7. Verify no Phase 2 features were implemented.
8. Verify TypeScript, lint, and build.
9. Create frontend-docs/final-frontend-qa-report.md.

Do not add new features in this stage.
```

