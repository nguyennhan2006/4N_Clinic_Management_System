# Missing / Problematic Backend Endpoints — 4N Clinic

> Identified during Stage 0 backend audit on 2026-05-18.
> These issues affect frontend implementation. Categorized by severity.

---

## Category 1 — Security Gaps (No Guards on Sensitive Routes)

These routes exist but are missing `@UseGuards(JwtAuthGuard, RolesGuard)`.
Frontend must **restrict access in UI**, but these are exploitable directly via HTTP.
Backend team should fix these before production.

### 1.1 Users Controller — Missing Auth Guards

**Routes affected:**
```
GET  /users
POST /users
PUT  /users/:id/roles
```

**Problem:** Controller has no `@UseGuards()`. Any unauthenticated request can access user data or create accounts.

**Expected behavior:** Should be restricted to `ADMIN` only.

**Frontend workaround:** All `/admin/users` routes guarded by `RequireRole(['ADMIN'])` in frontend router. But HTTP-level protection is absent.

**Backend fix needed:**
```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ROLES.ADMIN)
@Controller('users')
export class UsersController { ... }
```

---

### 1.2 RBAC Controller — Missing Auth Guards

**Routes affected:**
```
GET /roles
GET /permissions
```

**Problem:** No guards. Role/permission metadata is exposed publicly.

**Expected behavior:** Should require authentication; ADMIN for write operations.

**Frontend workaround:** Not surfaced in UI for non-ADMIN users. No frontend screen calls these endpoints directly — role info comes from `GET /auth/me`.

**Backend fix needed:** Add `@UseGuards(JwtAuthGuard)` minimum.

---

### 1.3 Prescriptions Controller — No Guards, No Defined Prefix

**Routes affected:**
```
POST /examinations/:id/prescription   (duplicate of ExaminationsController)
POST /prescriptions/:id/items
PATCH /prescriptions/:id/items/:itemId
GET  /prescriptions/:id
```

**Problem:**
1. No `@UseGuards()` on the controller
2. `@Controller()` has empty prefix — actual registered paths unclear
3. Overlaps with `ExaminationsController` prescription routes
4. Uses `Record<string, unknown>` instead of typed DTOs

**Expected behavior:** Prescription CRUD should be restricted to DOCTOR and ADMIN.

**Frontend workaround:** Frontend uses only `ExaminationsController` routes (`POST /examinations/:id/prescription` and `PUT /examinations/:id/prescription`) which **do** have guards. The standalone PrescriptionsController routes are not used by the frontend.

**Backend fix needed:** Either consolidate into ExaminationsController or add proper guards + prefix to PrescriptionsController.

---

### 1.4 Audit Controller — No Guards

**Routes affected:**
```
GET /audit-logs
```

**Problem:** No authentication. Audit logs may contain sensitive clinical/financial data.

**Expected behavior:** ADMIN and MANAGER only.

**Frontend workaround:** No frontend screen implemented for audit logs in Phase 1. Endpoint not called.

---

## Category 2 — Missing Endpoints Needed for Frontend Flow

These endpoints do not exist in the backend but the frontend flow logically needs them.

### 2.1 GET /visits/:id — Visit Detail by ID

**Status:** ❌ Not found in VisitsController

**Needed for:** `/visits/:id` detail page — show visit info before opening examination

**Current workaround:** Frontend can use `GET /visits?date=...` with client-side filtering by ID. Suboptimal.

**Recommended backend addition:**
```ts
@Get(':id')
@Roles(ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.MANAGER, ROLES.ADMIN)
findOne(@Param('id') id: string) {
  return this.visitsService.findOne(id);
}
```

---

### 2.2 GET /patients/:id/visits — Patient's Visit History (lightweight)

**Status:** ❌ Not found

**Needed for:** In the patient detail page, a quick view of past visits without full medical history

**Note:** `GET /patients/:id/medical-history` exists and covers this use case with more detail. Frontend will use that endpoint instead. Not blocking.

---

### 2.3 PATCH /visits/:id/status — Manual Visit Status Update

**Status:** ❌ Not found as standalone endpoint

**Needed for:** Receptionist marking a visit as WAITING or CANCELLED

**Current workaround:** Status changes happen implicitly:
- `POST /visits/:id/open-examination` → sets visit to `IN_EXAMINATION`
- `POST /examinations/:id/complete` → sets visit to `COMPLETED`
- Manual status override (e.g., CANCELLED) has no endpoint

**Impact:** Receptionist cannot cancel a visit from the frontend. This is a business workflow gap.

**Recommended backend addition:**
```ts
@Patch(':id/status')
@Roles(ROLES.RECEPTIONIST, ROLES.ADMIN)
updateStatus(@Param('id') id: string, @Body() dto: { status: VisitStatus }) {
  return this.visitsService.updateStatus(id, dto.status);
}
```

---

### 2.4 DELETE /examinations/:id/prescription — Clear Prescription

**Status:** ❌ Not confirmed in ExaminationsController

**Needed for:** If doctor wants to clear all prescription items and start fresh

**Current workaround:** Use `PUT /examinations/:id/prescription` with empty items array (if backend allows). Need to verify backend validation.

---

### 2.5 GET /auth/refresh — Token Refresh

**Status:** ❌ Not confirmed

**Needed for:** Keeping user session alive past access token expiry (1 day per backend config)

**Impact:** Low for Phase 1 since JWT expires in 1 day. On 401, frontend will clear session and redirect /login.

**Frontend behavior:** No proactive refresh. 401 → logout immediately.

---

### 2.6 POST /users/:id/deactivate or PATCH /users/:id/status — User Status Toggle

**Status:** ❌ Not found

**Needed for:** UC2 — Admin activating/deactivating user accounts (UserStatus: ACTIVE, INACTIVE, LOCKED)

**Impact:** User management page cannot show activate/deactivate buttons.

**Current workaround:** Frontend will omit status toggle button. Document as missing.

---

## Category 3 — Ambiguous / Unclear Endpoints

### 3.1 POST /users — Unknown DTO Structure

**Problem:** Controller uses `Record<string, unknown>` payload. No typed DTO found.

**Assumed DTO based on schema:**
```ts
{
  email: string;
  password: string;
  fullName: string;
  roleId: string;
}
```

**Frontend action:** Implement create-user form with these assumed fields. Display clear error from backend if fields differ.

---

### 3.2 PUT /users/:id/roles — Payload Structure

**Problem:** Controller uses `assignRoles(userId, payload)` with untyped payload.

**Assumed payload:**
```ts
{ roleId: string }
```

**Frontend action:** Implement role dropdown with role IDs from `GET /roles`. Store role info from `/auth/me` response.

---

## Summary Table

| # | Issue | Severity | Frontend impact | Status |
|---|-------|----------|-----------------|--------|
| 1.1 | Users controller no guards | 🔴 High | Workaround in place | Backend fix needed |
| 1.2 | RBAC controller no guards | 🟡 Medium | Not used in frontend | Backend fix needed |
| 1.3 | Prescriptions controller no guards + overlap | 🔴 High | Using ExaminationsController instead | Backend fix needed |
| 1.4 | Audit controller no guards | 🟡 Medium | Not in Phase 1 frontend | Backend fix needed |
| 2.1 | GET /visits/:id missing | 🔴 High | Workaround via list + filter | Add to backend |
| 2.2 | GET /patients/:id/visits missing | 🟢 Low | Using medical-history instead | Not blocking |
| 2.3 | PATCH /visits/:id/status missing | 🟡 Medium | Cannot cancel visits | Add to backend |
| 2.4 | DELETE /examinations/:id/prescription | 🟢 Low | Use PUT with empty items | Verify backend |
| 2.5 | GET /auth/refresh missing | 🟢 Low | 1-day expiry acceptable | Not blocking |
| 2.6 | User status toggle missing | 🟡 Medium | Omit button in UI | Add to backend |
| 3.1 | POST /users untyped DTO | 🟡 Medium | Assumed fields | Verify with team |
| 3.2 | PUT /users/:id/roles untyped | 🟡 Medium | Assumed roleId payload | Verify with team |

---

## Recommended Backend Fixes (Priority Order)

1. **[CRITICAL]** Add `@UseGuards(JwtAuthGuard, RolesGuard)` to UsersController and PrescriptionsController
2. **[HIGH]** Add `GET /visits/:id` endpoint to VisitsController
3. **[MEDIUM]** Add `PATCH /visits/:id/status` for receptionist cancellation flow
4. **[MEDIUM]** Add `PATCH /users/:id/status` for user activation/deactivation
5. **[LOW]** Add typed DTOs to UsersController (replace `Record<string, unknown>`)
6. **[LOW]** Clean up PrescriptionsController — consolidate or secure
