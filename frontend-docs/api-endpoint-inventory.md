# API Endpoint Inventory — 4N Clinic Management System

> Source of truth: backend controllers, DTOs, services, Prisma schema.
> Last audited: 2026-05-18 (Stage 0 backend scan).

---

## Auth

| Method | Path | Controller | Request DTO | Response shape | Roles | Frontend screen |
|--------|------|------------|-------------|----------------|-------|-----------------|
| POST | /auth/login | AuthController | `{ email, password }` | `{ accessToken, refreshToken?, user }` | PUBLIC | `/login` |
| GET | /auth/me | AuthController | — (Bearer token) | `{ id, email, fullName, role }` | Any authenticated | App bootstrap / Topbar |

---

## Users

| Method | Path | Controller | Request DTO | Response shape | Roles | Frontend screen |
|--------|------|------------|-------------|----------------|-------|-----------------|
| GET | /users | UsersController | — | `User[]` | ⚠️ No guard (should be ADMIN) | `/admin/users` |
| POST | /users | UsersController | `{ email, password, fullName, roleId }` | `User` | ⚠️ No guard (should be ADMIN) | `/admin/users` create dialog |
| PUT | /users/:id/roles | UsersController | `{ roleId }` | `User` | ⚠️ No guard (should be ADMIN) | `/admin/roles` assign dialog |

> **Note:** Users controller currently has no `@UseGuards`. See `missing-backend-endpoints.md`. Treat as ADMIN-only in frontend RBAC.

---

## Patients

| Method | Path | Controller | Request DTO | Response shape | Roles | Frontend screen |
|--------|------|------------|-------------|----------------|-------|-----------------|
| GET | /patients | PatientsController | `?keyword=` | `Patient[]` | RECEPTIONIST, DOCTOR, MANAGER, ADMIN | `/patients` list |
| POST | /patients | PatientsController | `CreatePatientDto` | `Patient` | RECEPTIONIST, ADMIN | `/patients/new` |
| GET | /patients/:id | PatientsController | — | `Patient` | RECEPTIONIST, DOCTOR, MANAGER, ADMIN | `/patients/:id` detail |
| GET | /patients/:id/medical-history | PatientsController | — | `Visit[]` with nested examinations | DOCTOR, MANAGER, ADMIN | `/patients/:id/history` |

**CreatePatientDto fields:**
- `fullName` (string, required)
- `dob` (ISO date string, optional)
- `gender` (optional)
- `phone` (optional)
- `citizenId` (optional, unique)
- `address` (optional)

---

## Visits

| Method | Path | Controller | Request DTO | Response shape | Roles | Frontend screen |
|--------|------|------------|-------------|----------------|-------|-----------------|
| POST | /visits | VisitsController | `CreateVisitDto` | `Visit` | RECEPTIONIST, ADMIN | `/visits/new` |
| GET | /visits | VisitsController | `?date=YYYY-MM-DD&status=` | `Visit[]` | RECEPTIONIST, DOCTOR, MANAGER, ADMIN | `/visits` list |
| POST | /visits/:id/open-examination | VisitsController | — (doctor from JWT) | `Examination` | DOCTOR, ADMIN | `/visits/:id` detail — "Open Examination" button |

**CreateVisitDto fields:**
- `patientId` (string uuid, required)
- `visitDate` (ISO date string, optional — defaults to today)
- `reason` (string, optional)

**QueryVisitsDto fields:**
- `date` (YYYY-MM-DD, optional)
- `status` (VisitStatus enum, optional): `REGISTERED | WAITING | IN_EXAMINATION | COMPLETED | CANCELLED`

---

## Examinations

| Method | Path | Controller | Request DTO | Response shape | Roles | Frontend screen |
|--------|------|------------|-------------|----------------|-------|-----------------|
| GET | /examinations/:id | ExaminationsController | — | `Examination` with diagnoses | DOCTOR, MANAGER, ADMIN | `/examinations/:id` |
| PATCH | /examinations/:id | ExaminationsController | `UpdateExaminationDto` | `Examination` | DOCTOR, ADMIN | `/examinations/:id` form |
| POST | /examinations/:id/prescription | ExaminationsController | `CreatePrescriptionDto` | `Prescription` | DOCTOR, ADMIN | `/examinations/:id` prescription section (first create) |
| PUT | /examinations/:id/prescription | ExaminationsController | `CreatePrescriptionDto` | `Prescription` | DOCTOR, ADMIN | `/examinations/:id` prescription section (replace-all) |
| POST | /examinations/:id/complete | ExaminationsController | — | `Examination` | DOCTOR, ADMIN | `/examinations/:id` — "Complete" button |

**UpdateExaminationDto fields:**
- `symptoms` (string, optional)
- `clinicalNotes` (string, optional)
- `conclusion` (string, optional)
- `diagnoses` (array of `{ diseaseId: string | null, isPrimary: boolean }`, optional)

**CreatePrescriptionDto fields:**
- `note` (string, optional)
- `items` (array of `{ drugId: string, quantity: number, dosage: string }`, required)

> **UC-12 pattern:** Use `POST` if no prescription exists yet; use `PUT` to replace an existing prescription entirely.

---

## Billing / Invoices / Payments

| Method | Path | Controller | Request DTO | Response shape | Roles | Frontend screen |
|--------|------|------------|-------------|----------------|-------|-----------------|
| POST | /visits/:visitId/invoice | BillingController | — | `Invoice` | CASHIER, ADMIN | `/visits/:id` or `/invoices` — "Issue Invoice" button |
| GET | /invoices | BillingController | `?keyword=&status=&date=` | `Invoice[]` | CASHIER, MANAGER, ADMIN | `/invoices` list |
| GET | /invoices/:id | BillingController | — | `Invoice` with items + payments | CASHIER, MANAGER, ADMIN | `/invoices/:id` detail |
| POST | /invoices/:id/payments | BillingController | `CreatePaymentDto` | `Payment` | CASHIER, ADMIN | `/invoices/:id` — payment dialog |

**CreatePaymentDto fields:**
- `amount` (number ≥ 1, required)
- `method` (`CASH | TRANSFER | CARD`, required)
- `note` (string, optional)

**QueryInvoicesDto fields:**
- `keyword` (string, optional)
- `status` (`DRAFT | ISSUED | PARTIALLY_PAID | PAID | VOID`, optional)
- `date` (YYYY-MM-DD, optional)

**Invoice statuses:** `DRAFT → ISSUED → PARTIALLY_PAID / PAID`. `VOID` for cancelled.

---

## Diseases

| Method | Path | Controller | Request DTO | Response shape | Roles | Frontend screen |
|--------|------|------------|-------------|----------------|-------|-----------------|
| GET | /diseases | DiseasesController | `?activeOnly=true` | `Disease[]` | ADMIN, MANAGER, DOCTOR, RECEPTIONIST | `/catalog/diseases` + examination disease picker |
| POST | /diseases | DiseasesController | `CreateDiseaseDto` | `Disease` | ADMIN | `/catalog/diseases` create dialog |
| PATCH | /diseases/:id | DiseasesController | `UpdateDiseaseDto` | `Disease` | ADMIN | `/catalog/diseases` edit dialog |

**CreateDiseaseDto:** `code` (string, max 20), `name` (string)

**UpdateDiseaseDto:** `name` (optional), `isActive` (optional boolean)

---

## Drugs / Medicines

| Method | Path | Controller | Request DTO | Response shape | Roles | Frontend screen |
|--------|------|------------|-------------|----------------|-------|-----------------|
| GET | /drugs | DrugsController | `?activeOnly=true` | `Drug[]` | ADMIN, MANAGER, DOCTOR | `/catalog/medicines` + prescription drug picker |
| POST | /drugs | DrugsController | `CreateDrugDto` | `Drug` | ADMIN | `/catalog/medicines` create dialog |
| PATCH | /drugs/:id | DrugsController | `UpdateDrugDto` | `Drug` | ADMIN | `/catalog/medicines` edit dialog |

**CreateDrugDto:** `name` (string, unique), `unit` (string), `price` (number > 0)

**UpdateDrugDto:** `name` (optional), `unit` (optional), `price` (optional, > 0), `isActive` (optional boolean)

---

## Regulations

| Method | Path | Controller | Request DTO | Response shape | Roles | Frontend screen |
|--------|------|------------|-------------|----------------|-------|-----------------|
| GET | /regulations/current | RegulationsController | — | `RegulationVersion` with items | All authenticated | `/settings/regulations` active view |
| POST | /regulations | RegulationsController | `CreateRegulationDto` | `RegulationVersion` | ADMIN | `/settings/regulations` create version |
| PATCH | /regulations/:id/activate | RegulationsController | — | `RegulationVersion` | ADMIN | `/settings/regulations` activate confirm dialog |

**CreateRegulationDto fields:**
- `note` (string, optional)
- `items` (array of `{ key: string, value: string }`)
  - Allowed keys: `MAX_PATIENTS_PER_DAY`, `CONSULTATION_FEE`

---

## Reports

| Method | Path | Controller | Request DTO | Response shape | Roles | Frontend screen |
|--------|------|------------|-------------|----------------|-------|-----------------|
| GET | /reports/monthly | ReportsController | `?month=YYYY-MM` | Monthly summary object | ADMIN, MANAGER | `/reports/monthly` |

---

## Health

| Method | Path | Roles | Frontend usage |
|--------|------|-------|----------------|
| GET | /health | PUBLIC (no guard) | Not used in UI |

---

## Enums Reference

```ts
enum VisitStatus   { REGISTERED, WAITING, IN_EXAMINATION, COMPLETED, CANCELLED }
enum ExaminationStatus { OPEN, COMPLETED, CANCELLED }
enum InvoiceStatus { DRAFT, ISSUED, PARTIALLY_PAID, PAID, VOID }
enum PaymentMethod { CASH, TRANSFER, CARD }
enum UserStatus    { ACTIVE, INACTIVE, LOCKED }
```

---

## Endpoint Count Summary

| Module | Endpoints |
|--------|-----------|
| Auth | 2 |
| Users | 3 |
| Patients | 4 |
| Visits | 3 |
| Examinations | 5 |
| Billing | 4 |
| Diseases | 3 |
| Drugs | 3 |
| Regulations | 3 |
| Reports | 1 |
| Health | 1 |
| **Total** | **32** |
