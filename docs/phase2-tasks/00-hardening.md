# Task 00 — Phase 1 Hardening (bắt buộc làm trước mọi Phase 2)

> Branch: `fix/phase1-hardening`  
> Merge vào: `develop`  
> Phụ thuộc: không có — task này độc lập hoàn toàn  
> Review bởi: toàn team trước khi merge

---

## Mục tiêu

Khép lỗ hổng security, hoàn thiện 2 UC còn gap, mở rộng audit coverage.  
Sau task này, Phase 1 đạt 95/100 và codebase sẵn sàng nhận Phase 2 migration.

---

## Subtask 00-A — Xóa PrescriptionsController

**Files được sửa:**
- `backend/src/modules/prescriptions/prescriptions.controller.ts` — xóa file
- `backend/src/modules/prescriptions/prescriptions.module.ts` — xóa controller khỏi providers/controllers
- `backend/src/app.module.ts` — xóa PrescriptionsModule nếu không còn dùng
- `backend/src/modules/examinations/examinations.controller.ts` — thêm `GET /examinations/:id/prescription` nếu chưa có

**Không được sửa:** bất kỳ file nào khác

**Kiểm tra:**
```bash
cd backend
grep -rn "PrescriptionsController\|PrescriptionsModule" src/
# Kết quả phải rỗng
npm run build
```

**Test phải pass:**
- `POST /examinations/:id/prescription` (từ ExaminationsController) → 200 với DOCTOR token
- `GET /prescriptions/fake-id` → 404 (route không còn tồn tại)
- `POST /examinations/fake-id/prescription` không có token → 401

---

## Subtask 00-B — UC03 RoleManagementPage gọi API thật

**Files được sửa:**
- `frontend/src/features/users/RoleManagementPage.tsx` — viết lại
- `frontend/src/features/users/api.ts` — đã có `rbacApi`, không cần sửa

**Contract:**

```typescript
// GET /rbac/roles → RoleItem[]
interface RoleItem {
  id: string
  code: string
  name: string
  permissions: PermissionItem[]
}

// GET /rbac/permissions → PermissionItem[]
interface PermissionItem {
  id: string
  code: string
  name: string
}

// PATCH /rbac/roles/:id/permissions → RoleItem
// body: { permissionIds: string[] }
```

**UI cần có:**
- Load roles + permissions bằng `useQuery`
- Hiển thị bảng: rows = roles, columns = permissions, ô = checkbox
- Khi tick/untick → gọi `rbacApi.updateRolePermissions(roleId, newPermissionIds)` với toàn bộ permissions hiện tại của role đó
- Loading skeleton khi fetch, toast thành công/thất bại
- Chỉ ADMIN mới thấy trang này (route guard đã có)

**Không được sửa:** `users/api.ts`, `users/types.ts`, router.tsx

**Kiểm tra:**
```bash
cd frontend && npm run build && npm run lint
```

---

## Subtask 00-C — UC14 Cashier Invoice Flow

**Files được sửa:**

Backend:
- `backend/src/modules/visits/dto/query-visits.dto.ts` — thêm `hasInvoice?: boolean`
- `backend/src/modules/visits/visits.service.ts` — thêm filter `hasInvoice` vào `findAll()`

Frontend:
- `frontend/src/features/invoices/InvoiceListPage.tsx` — thêm tab/section "Chờ lập hóa đơn"
- `frontend/src/features/visits/api.ts` — thêm param `hasInvoice` vào `list()`
- `frontend/src/features/visits/types.ts` — thêm `hasInvoice` vào `QueryVisitsParams`

**Logic backend `findAll()` bổ sung:**
```typescript
// Nếu hasInvoice = false
where.invoice = { is: null }
// Nếu hasInvoice = true
where.invoice = { isNot: null }
```

**UI cần có:**
- Tab "Chờ lập hóa đơn": `GET /visits?status=COMPLETED&hasInvoice=false`
- Mỗi row có nút "Tạo hóa đơn" → gọi `POST /visits/:id/invoice` → navigate sang `/app/invoices/:newInvoiceId`
- Loading + error handling

**Không được sửa:** billing.service.ts, invoice schema, payment logic

**Kiểm tra:**
```bash
cd backend && npm run build
cd frontend && npm run build && npm run lint
```

---

## Subtask 00-D — Mở rộng AuditService Coverage

**Files được sửa:**
- `backend/src/modules/patients/patients.service.ts` — thêm `log()` sau create/update
- `backend/src/modules/visits/visits.service.ts` — thêm `log()` sau create, openExamination
- `backend/src/modules/examinations/examinations.service.ts` — thêm `log()` sau complete
- `backend/src/modules/billing/billing.service.ts` — thêm `log()` sau createInvoice, createPayment
- `backend/src/modules/auth/auth.service.ts` — thêm `log()` sau login success và login fail

**Pattern chuẩn:**
```typescript
// Sau mỗi operation thành công
await this.auditService.log({
  actorId: userId,           // người thực hiện
  action: 'CREATE_PATIENT',  // ALL_CAPS snake case
  entityType: 'Patient',
  entityId: patient.id,
  after: { fullName: patient.fullName, patientCode: patient.patientCode },
})
```

**Login fail audit:**
```typescript
await this.auditService.log({
  actorId: undefined,
  action: 'LOGIN_FAILED',
  entityType: 'Auth',
  after: { username: dto.username, reason: 'invalid_credentials' },
})
```

**Không được sửa:** AuditService, AuditController, schema

**Kiểm tra:**
```bash
cd backend && npm run build && npm run test
# Kiểm tra AuditLog được tạo sau mỗi action
```

---

## Seed cần cập nhật sau 00-A..D

Thêm 3 role mới và demo users vào `backend/prisma/seed.ts`:

```typescript
const newRoles = [
  { code: 'NURSE', name: 'Điều dưỡng' },
  { code: 'LAB_TECHNICIAN', name: 'Kỹ thuật viên xét nghiệm' },
  { code: 'PHARMACIST', name: 'Dược sĩ' },
]

const newUsers = [
  { username: 'nurse', fullName: 'Điều dưỡng Demo', email: 'nurse@clinic.local', password: 'Nurse@123456', roleCode: 'NURSE' },
  { username: 'labtech', fullName: 'Kỹ thuật viên Demo', email: 'labtech@clinic.local', password: 'Labtech@123456', roleCode: 'LAB_TECHNICIAN' },
  { username: 'pharmacist', fullName: 'Dược sĩ Demo', email: 'pharmacist@clinic.local', password: 'Pharma@123456', roleCode: 'PHARMACIST' },
]
```

Cập nhật `ROLES` constant:
```typescript
// backend/src/common/constants/roles.constant.ts
export const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  RECEPTIONIST: 'RECEPTIONIST',
  CASHIER: 'CASHIER',
  MANAGER: 'MANAGER',
  NURSE: 'NURSE',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  PHARMACIST: 'PHARMACIST',
} as const
```

```bash
cd backend && npx prisma db seed
```

## Definition of Done

```
☐ PrescriptionsController không còn tồn tại
☐ GET /prescriptions/... trả 404
☐ RoleManagementPage gọi API thật, checkbox hoạt động
☐ Cashier thấy tab "Chờ lập hóa đơn", có thể tạo invoice
☐ AuditLog được tạo cho: patient create, visit create, exam complete, invoice create, payment, login
☐ 3 role + 3 user mới được seed
☐ npm run build PASS (backend + frontend)
☐ npm run lint PASS (frontend)
☐ npm run test PASS (backend)
```
