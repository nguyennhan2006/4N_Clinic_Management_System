# Stage 1 Scaffold Report — 4N Clinic Management System Frontend

> Completed: 2026-05-18
> Build: PASS ✅
> Lint: PASS ✅

---

## Files Created

### Project root
- `frontend/.env` — VITE_API_BASE_URL=http://localhost:3000
- `frontend/.env.example`
- `frontend/vite.config.ts` — Added @tailwindcss/vite plugin, path alias @/*

### Config
- `frontend/tsconfig.app.json` — Fixed duplicate compilerOptions, added paths alias @/*→./src/*

### Styles
- `frontend/src/styles/globals.css` — Tailwind v4 @import + @theme with full clinic palette

### App Foundation
- `frontend/src/main.tsx` — Entry: Providers + RouterProvider, imports globals.css
- `frontend/src/app/providers.tsx` — QueryClientProvider wrapper
- `frontend/src/app/router.tsx` — Full route tree with ProtectedRoute + RequireRole guards

### Lib
- `frontend/src/lib/errors.ts` — ApiError class + mapHttpError + isApiError
- `frontend/src/lib/api-client.ts` — Fetch wrapper: Bearer token, query params, error normalization, 401→logout
- `frontend/src/lib/query-client.ts` — TanStack Query client with retry logic
- `frontend/src/lib/date.ts` — Native Intl date/datetime formatters (no external dep needed)
- `frontend/src/lib/money.ts` — VND formatter with Intl.NumberFormat
- `frontend/src/lib/cn.ts` — clsx + tailwind-merge utility

### Config
- `frontend/src/config/navigation.ts` — Role-filtered nav sections with icon names + role arrays
- `frontend/src/config/permissions.ts` — ROLE_LABELS, ROLE_COLORS, ALL_ROLES

### Auth Feature
- `frontend/src/features/auth/types.ts` — Role type, AuthUser, LoginRequest, LoginResponse
- `frontend/src/features/auth/store.ts` — Zustand persisted store: token, user, isAuthenticated, setAuth, logout, hasRole
- `frontend/src/features/auth/ProtectedRoute.tsx` — Redirects unauthenticated users to /login
- `frontend/src/features/auth/RequireRole.tsx` — Redirects unauthorized role to /403
- `frontend/src/features/auth/LoginPage.tsx` — Login form with error handling, connected to POST /auth/login

### Common Components
- `frontend/src/components/common/AppShell.tsx` — Sidebar + Topbar + Outlet layout
- `frontend/src/components/common/Sidebar.tsx` — Role-filtered navigation, logo, user info, logout
- `frontend/src/components/common/Topbar.tsx` — Bell icon + user avatar
- `frontend/src/components/common/PageHeader.tsx` — Title + description + action slot
- `frontend/src/components/common/StatusBadge.tsx` — All status variants: VisitStatus, ExaminationStatus, InvoiceStatus, UserStatus
- `frontend/src/components/common/RoleBadge.tsx` — Role-colored badge using clinic palette
- `frontend/src/components/common/LoadingState.tsx` — Skeleton rows + LoadingSpinner
- `frontend/src/components/common/EmptyState.tsx` — Icon + title + description + optional CTA
- `frontend/src/components/common/ErrorState.tsx` — Error icon + message + optional retry
- `frontend/src/components/common/ConfirmDialog.tsx` — Modal overlay dialog with danger/default variants

### Pages
- `frontend/src/pages/ForbiddenPage.tsx` — /403 page
- `frontend/src/pages/NotFoundPage.tsx` — /404 page

### Placeholder Feature Pages
- `frontend/src/features/dashboard/DashboardPage.tsx`
- `frontend/src/features/patients/PatientListPage.tsx`
- `frontend/src/features/patients/PatientCreatePage.tsx`
- `frontend/src/features/patients/PatientDetailPage.tsx`
- `frontend/src/features/patients/MedicalHistoryPage.tsx`
- `frontend/src/features/visits/VisitListPage.tsx`
- `frontend/src/features/visits/VisitCreatePage.tsx`
- `frontend/src/features/examinations/ExaminationPage.tsx`
- `frontend/src/features/invoices/InvoiceListPage.tsx`
- `frontend/src/features/invoices/InvoiceDetailPage.tsx`
- `frontend/src/features/reports/MonthlyReportPage.tsx`
- `frontend/src/features/regulations/RegulationPage.tsx`
- `frontend/src/features/diseases/DiseaseCatalogPage.tsx`
- `frontend/src/features/medicines/MedicineCatalogPage.tsx`
- `frontend/src/features/users/UserManagementPage.tsx`
- `frontend/src/features/users/RoleManagementPage.tsx`

---

## Files Modified

- `frontend/tsconfig.app.json` — Fixed duplicate compilerOptions block, added paths alias
- `frontend/vite.config.ts` — Added @tailwindcss/vite + path alias
- `frontend/src/main.tsx` — Replaced default Vite boilerplate with Providers + RouterProvider

---

## Files Removed

- `frontend/src/App.tsx` — Vite default boilerplate
- `frontend/src/App.css` — Vite default boilerplate
- `frontend/src/index.css` — Replaced by src/styles/globals.css
- `frontend/src/assets/` — Vite default react.svg

---

## Routes Created

| Path | Guard | Roles allowed |
|------|-------|---------------|
| /login | Public | — |
| /403 | Public | — |
| /404 | Public | — |
| /app/dashboard | Auth | All roles |
| /app/patients | Auth + Role | ADMIN, RECEPTIONIST, DOCTOR, MANAGER |
| /app/patients/new | Auth + Role | ADMIN, RECEPTIONIST |
| /app/patients/:id | Auth + Role | ADMIN, RECEPTIONIST, DOCTOR, MANAGER |
| /app/patients/:id/history | Auth + Role | ADMIN, DOCTOR, MANAGER |
| /app/visits | Auth + Role | ADMIN, RECEPTIONIST, DOCTOR, MANAGER |
| /app/visits/new | Auth + Role | ADMIN, RECEPTIONIST |
| /app/examinations/:id | Auth + Role | ADMIN, DOCTOR |
| /app/invoices | Auth + Role | ADMIN, CASHIER, MANAGER |
| /app/invoices/:id | Auth + Role | ADMIN, CASHIER, MANAGER |
| /app/reports/monthly | Auth + Role | ADMIN, MANAGER |
| /app/catalog/diseases | Auth + Role | ADMIN, DOCTOR, MANAGER |
| /app/catalog/medicines | Auth + Role | ADMIN, DOCTOR, MANAGER |
| /app/settings/regulations | Auth + Role | ADMIN |
| /app/admin/users | Auth + Role | ADMIN |
| /app/admin/roles | Auth + Role | ADMIN |

> Note: `/app/visits/:id` was intentionally NOT created as a real page because `GET /visits/:id` does not exist in the backend (documented in missing-backend-endpoints.md). Visit detail will be addressed when that endpoint is available.

---

## Theme Setup

**Design system:** Gentle Pastels Clinical Role-Based Dashboard

**Tailwind v4** configured via `@tailwindcss/vite` plugin with `@theme` custom properties in globals.css:

| Token | Value |
|-------|-------|
| `--color-clinic-bg` | #F8F7F4 |
| `--color-clinic-surface` | #FFFFFF |
| `--color-clinic-sidebar` | #6D5BD0 |
| `--color-clinic-sidebar-muted` | #EEEAFB |
| `--color-clinic-primary` | #8B7CF6 |
| `--color-clinic-primary-hover` | #7565E8 |
| `--color-clinic-secondary` | #A7D8DE |
| `--color-clinic-accent` | #F5C6AA |
| `--color-clinic-success` | #A8D5BA |
| `--color-clinic-warning` | #F6D58E |
| `--color-clinic-danger` | #EFA7A7 |
| `--color-clinic-text` | #2F2F3A |
| `--color-clinic-muted` | #6B7280 |
| `--color-clinic-border` | #E7E2DA |

**Layout:** Fixed left sidebar (#6D5BD0), off-white main area (#F8F7F4), white cards with `box-shadow: 0 8px 24px rgba(47,47,58,0.08)`, rounded-2xl borders.

---

## Components Created Summary

| Component | Type | Purpose |
|-----------|------|---------|
| AppShell | Layout | Sidebar + Topbar wrapper |
| Sidebar | Layout | Role-filtered nav, user info, logout |
| Topbar | Layout | Notifications, user avatar |
| PageHeader | UI | Page title + description + action |
| StatusBadge | UI | VisitStatus/ExamStatus/InvoiceStatus/UserStatus |
| RoleBadge | UI | Role-colored badge |
| LoadingState | State | Skeleton rows + spinner |
| EmptyState | State | Empty data placeholder |
| ErrorState | State | Error with retry |
| ConfirmDialog | Interaction | Confirmation modal |
| ProtectedRoute | Auth | Redirect to /login if unauthenticated |
| RequireRole | Auth | Redirect to /403 if role missing |
| LoginPage | Auth | Login form + POST /auth/login |

---

## Dependencies Installed

**Runtime:**
- react-router-dom — routing
- @tanstack/react-query — server state
- @tanstack/react-table — table primitive
- zustand — auth state with persist
- react-hook-form — forms (for Stage 2+)
- @hookform/resolvers — zod integration
- zod — schema validation
- lucide-react — icons
- clsx + tailwind-merge + class-variance-authority — className utilities

**Dev:**
- tailwindcss + @tailwindcss/vite — styling

**Not installed (for future stages):**
- shadcn/ui — will be added when needed (requires manual component copy)
- date-fns — replaced with native Intl API (date-fns v4 had TypeScript resolution issues with TS 5.9 bundler mode; native Intl covers all Stage 1 needs)

---

## Known Limitations

1. **`/app/visits/:id` not created** — Backend missing `GET /visits/:id`. Documented in `missing-backend-endpoints.md`. Will revisit in Stage 3.
2. **shadcn/ui not installed** — shadcn requires CLI initialization. Components were built from scratch using Tailwind for Stage 1. shadcn components can be added in Stage 2+ when needed.
3. **No toast/notification system yet** — Will add in Stage 2 when mutations are introduced.
4. **Auth token bootstrap** — `GET /auth/me` not yet called on app load. Zustand `persist` restores token+user from localStorage. Will verify via `/auth/me` call in Stage 2.
5. **date-fns not used** — Replaced with native `Intl.DateTimeFormat`. If more complex date math is needed (add days, range checks), will install once TS resolution confirmed.

---

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ PASS — 0 errors, 0 warnings |
| `npm run build` | ✅ PASS — 1851 modules, 367KB JS (116KB gzip) |
| TypeScript strict mode | ✅ PASS |
| No invented API endpoints | ✅ Confirmed |
| No Phase 2 features | ✅ Confirmed |
| No `any` usage | ✅ Confirmed |
| All routes guarded | ✅ Confirmed |
| No passwordHash displayed | ✅ Confirmed |
