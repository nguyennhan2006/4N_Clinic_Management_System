# Stage 2 — Auth + RBAC Complete

> Completed: 2026-05-18
> Build: PASS ✅
> Lint: PASS ✅

---

## Files Created

- `frontend/src/features/auth/api.ts` — `authApi.login()` → POST /auth/login, `authApi.me()` → GET /auth/me

## Files Modified

- `frontend/src/features/auth/types.ts` — Added `UserStatus`, `MeResponse` interface (includes `status` field from GET /auth/me)
- `frontend/src/features/auth/store.ts` — Added `setUser()` action for post-bootstrap user refresh
- `frontend/src/features/auth/LoginPage.tsx` — Full rewrite: react-hook-form + zod, field-level errors, root error, clinic semantic tokens, accessible labels + aria attributes
- `frontend/src/features/auth/ProtectedRoute.tsx` — Added `GET /auth/me` bootstrap on mount: verifies persisted token is still valid; clears session on 401; shows spinner during check
- `frontend/src/features/auth/RequireRole.tsx` — No change needed (already correct)
- `frontend/src/components/common/Topbar.tsx` — Full rewrite: user dropdown with RoleBadge, role text, logout button, click-outside close
- `frontend/src/components/common/Sidebar.tsx` — Semantic clinic tokens, `end` prop on dashboard NavLink to prevent over-matching, `aria-label` on nav
- `frontend/src/components/common/AppShell.tsx` — `bg-[#F8F7F4]` → `bg-clinic-bg`
- `frontend/src/config/navigation.ts` — Regulations/catalog routes updated to MANAGER+ADMIN; `Examinations` label in sidebar for ADMIN+DOCTOR only
- `frontend/src/app/router.tsx` — Full rewrite: clean comments per group, root `/` → `Navigate /app/dashboard`, catalog/regulations → MANAGER+ADMIN, `/visits/:id` intentionally absent
- `frontend/src/features/users/UserManagementPage.tsx` — Security warning banner + disabled table shell (no live API calls)
- `frontend/src/features/users/RoleManagementPage.tsx` — Config-driven role access matrix table (frontend-only, no API calls)

---

## Auth Endpoint Used

| Method | Path | Purpose |
|--------|------|---------|
| POST | /auth/login | UC1 login — email + password → accessToken + user |
| GET | /auth/me | Session bootstrap on page reload — verify token validity, refresh user info |

No other auth endpoints called. No refresh token endpoint exists in backend, so none was invented.

---

## RBAC Implemented

### Protected routes

| Route | Guard | Allowed Roles |
|-------|-------|---------------|
| /login | Public | — |
| /403, /404 | Public | — |
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
| /app/catalog/diseases | Auth + Role | ADMIN, MANAGER |
| /app/catalog/medicines | Auth + Role | ADMIN, MANAGER |
| /app/settings/regulations | Auth + Role | ADMIN, MANAGER |
| /app/admin/users | Auth + Role | ADMIN |
| /app/admin/roles | Auth + Role | ADMIN |

### Role-based sidebar

- Sidebar items filtered by `hasRole(item.roles)` — each role sees only their relevant sections
- RECEPTIONIST: Dashboard, Bệnh nhân, Lượt khám
- DOCTOR: Dashboard, Bệnh nhân, Lượt khám, Phiếu khám
- CASHIER: Dashboard, Hóa đơn
- MANAGER: Dashboard, Bệnh nhân, Lượt khám, Hóa đơn, Báo cáo tháng, Danh mục bệnh, Danh mục thuốc, Quy định
- ADMIN: All items

### 403 behavior

- `RequireRole` renders `<Navigate to="/403" replace />` when user's role is not in allowed list
- `ForbiddenPage` shows icon + message + link back to dashboard
- Backend 403 → `ApiError(403)` → `mapHttpError` returns Vietnamese message → displayed in UI

### Logout behavior

- Topbar dropdown → "Đăng xuất" button calls `logout()` + `navigate('/login', { replace: true })`
- Sidebar bottom → same `logout()` + navigate
- `logout()` in store: removes `access_token` from localStorage, clears Zustand state
- Router's ProtectedRoute immediately redirects to `/login` on next render

### Session bootstrap (new in Stage 2)

- On every `/app/*` mount: ProtectedRoute calls `GET /auth/me` with Bearer token
- Success → `setUser()` refreshes user fields (catches stale role after admin changes)
- Failure (401/network) → `logout()` → redirect `/login`
- Shows spinner while bootstrapping to avoid flash of unauthorized content

---

## UC2/UC3 Handling

### User Management live API enabled? **No**

Backend `UsersController` has no `@UseGuards(JwtAuthGuard, RolesGuard)`. Any HTTP client can call these endpoints unauthenticated. Frontend will not call them until backend is patched.

Current state of `/app/admin/users`:
- Route is guarded: ADMIN-only via `RequireRole`
- Page shows a visible warning banner explaining the blocker
- Table shell is rendered but all actions are `disabled`
- No API calls made to `/users`, `POST /users`, or `PUT /users/:id/roles`

Backend fix required:
```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
@Controller('users')
export class UsersController { ... }
```

### Role management implemented as config matrix? **Yes**

`/app/admin/roles` (ADMIN-only) displays:
- Role description cards for all 5 roles
- Complete route × role access matrix (16 routes × 5 roles) derived from frontend router config
- No backend API calls — purely frontend config display
- Source: `src/app/router.tsx` role arrays + `src/config/permissions.ts`

---

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ PASS — 0 errors, 0 warnings |
| `npm run build` | ✅ PASS — 1935 modules, 467KB JS (146KB gzip) |
| TypeScript strict mode | ✅ PASS |
| No invented API endpoints | ✅ Confirmed — only POST /auth/login and GET /auth/me used |
| No UsersController calls | ✅ Confirmed |
| No passwordHash rendered | ✅ Confirmed |
| Logout clears token + state | ✅ Both Topbar and Sidebar logout wired |
| Session bootstrap via /auth/me | ✅ ProtectedRoute calls on every mount |

---

## Issues / Blockers

1. **UsersController missing guards** — UC2 live API blocked. Will re-enable once backend is patched. See `missing-backend-endpoints.md §1.1`.
2. **No token refresh** — JWT expires in 1 day (backend config). On expiry, `/auth/me` returns 401 → auto logout. Acceptable for Phase 1.
3. **`/app/visits/:id` absent** — `GET /visits/:id` still missing from backend. Visit detail navigation not possible yet. Documented in `missing-backend-endpoints.md §2.1`.
