# RBAC Matrix — 4N Clinic Management System

> Source of truth: backend `@Roles()` decorators on each route.
> Frontend RBAC improves UX only. Backend is the security source of truth.
> Last audited: 2026-05-18.

---

## Role Definitions

| Role | Vietnamese | Main responsibility |
|------|-----------|---------------------|
| ADMIN | Quản trị viên | Full system access, config, catalogs, user management |
| RECEPTIONIST | Lễ tân | Patient records, visit creation, reception queue |
| DOCTOR | Bác sĩ | Open exam, diagnose, prescribe, complete exam |
| CASHIER | Thu ngân | Invoice creation, payment recording, invoice search |
| MANAGER | Quản lý | Reports, read-only operational overview |

---

## Sidebar Menu Visibility by Role

| Menu Item | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER |
|-----------|:-----:|:------------:|:------:|:-------:|:-------:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Patients | ✓ | ✓ | ✓ (read) | — | ✓ (read) |
| Visits | ✓ | ✓ | ✓ | — | ✓ (read) |
| Examinations | ✓ | — | ✓ | — | — |
| Invoices | ✓ | — | — | ✓ | ✓ (read) |
| Reports | ✓ | — | — | — | ✓ |
| Disease Catalog | ✓ | — | ✓ (read) | — | ✓ (read) |
| Medicine Catalog | ✓ | — | ✓ (read) | — | ✓ (read) |
| Regulations | ✓ | — | — | — | — |
| User Management | ✓ | — | — | — | — |

---

## API Endpoint Access Matrix

### Auth
| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER | PUBLIC |
|----------|:-----:|:------------:|:------:|:-------:|:-------:|:------:|
| POST /auth/login | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /auth/me | ✓ | ✓ | ✓ | ✓ | ✓ | — |

### Users
| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER |
|----------|:-----:|:------------:|:------:|:-------:|:-------:|
| GET /users | ✓ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| POST /users | ✓ | — | — | — | — |
| PUT /users/:id/roles | ✓ | — | — | — | — |

> ⚠️ = Backend currently has no guard; frontend must restrict to ADMIN only.

### Patients
| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER |
|----------|:-----:|:------------:|:------:|:-------:|:-------:|
| GET /patients | ✓ | ✓ | ✓ | — | ✓ |
| POST /patients | ✓ | ✓ | — | — | — |
| GET /patients/:id | ✓ | ✓ | ✓ | — | ✓ |
| GET /patients/:id/medical-history | ✓ | — | ✓ | — | ✓ |

### Visits
| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER |
|----------|:-----:|:------------:|:------:|:-------:|:-------:|
| POST /visits | ✓ | ✓ | — | — | — |
| GET /visits | ✓ | ✓ | ✓ | — | ✓ |
| POST /visits/:id/open-examination | ✓ | — | ✓ | — | — |

### Examinations
| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER |
|----------|:-----:|:------------:|:------:|:-------:|:-------:|
| GET /examinations/:id | ✓ | — | ✓ | — | ✓ |
| PATCH /examinations/:id | ✓ | — | ✓ | — | — |
| POST /examinations/:id/prescription | ✓ | — | ✓ | — | — |
| PUT /examinations/:id/prescription | ✓ | — | ✓ | — | — |
| POST /examinations/:id/complete | ✓ | — | ✓ | — | — |

### Billing
| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER |
|----------|:-----:|:------------:|:------:|:-------:|:-------:|
| POST /visits/:visitId/invoice | ✓ | — | — | ✓ | — |
| GET /invoices | ✓ | — | — | ✓ | ✓ |
| GET /invoices/:id | ✓ | — | — | ✓ | ✓ |
| POST /invoices/:id/payments | ✓ | — | — | ✓ | — |

### Diseases
| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER |
|----------|:-----:|:------------:|:------:|:-------:|:-------:|
| GET /diseases | ✓ | ✓ | ✓ | — | ✓ |
| POST /diseases | ✓ | — | — | — | — |
| PATCH /diseases/:id | ✓ | — | — | — | — |

### Drugs
| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER |
|----------|:-----:|:------------:|:------:|:-------:|:-------:|
| GET /drugs | ✓ | — | ✓ | — | ✓ |
| POST /drugs | ✓ | — | — | — | — |
| PATCH /drugs/:id | ✓ | — | — | — | — |

### Regulations
| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER |
|----------|:-----:|:------------:|:------:|:-------:|:-------:|
| GET /regulations/current | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /regulations | ✓ | — | — | — | — |
| PATCH /regulations/:id/activate | ✓ | — | — | — | — |

### Reports
| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER |
|----------|:-----:|:------------:|:------:|:-------:|:-------:|
| GET /reports/monthly | ✓ | — | — | — | ✓ |

---

## Route Guard Rules (Frontend)

```
/login                     → Public (redirect to /app if already logged in)
/app/*                     → Requires authentication → redirect /login if not
/app/admin/*               → Requires ADMIN role → /403 if other role
/app/patients              → ADMIN, RECEPTIONIST, DOCTOR, MANAGER
/app/patients/new          → ADMIN, RECEPTIONIST
/app/visits                → ADMIN, RECEPTIONIST, DOCTOR, MANAGER
/app/visits/new            → ADMIN, RECEPTIONIST
/app/examinations/:id      → ADMIN, DOCTOR
/app/patients/:id/history  → ADMIN, DOCTOR, MANAGER
/app/invoices              → ADMIN, CASHIER, MANAGER
/app/reports/monthly       → ADMIN, MANAGER
/app/catalog/diseases      → ADMIN (edit), DOCTOR/MANAGER (read)
/app/catalog/medicines     → ADMIN (edit), DOCTOR/MANAGER (read)
/app/settings/regulations  → ADMIN
/403                       → Public (no auth required to view the error page)
/404                       → Public
```

---

## Action-Level RBAC (Button/UI visibility)

| Screen | Action | Visible to |
|--------|--------|------------|
| Patient list | "Add Patient" button | ADMIN, RECEPTIONIST |
| Patient detail | Edit fields | ADMIN, RECEPTIONIST |
| Visit list | "Create Visit" button | ADMIN, RECEPTIONIST |
| Visit detail | "Open Examination" button | ADMIN, DOCTOR |
| Examination | Edit symptoms/diagnosis/prescription | ADMIN, DOCTOR |
| Examination | "Complete Examination" button | ADMIN, DOCTOR |
| Invoice list | "Issue Invoice" button | ADMIN, CASHIER |
| Invoice detail | "Record Payment" button | ADMIN, CASHIER |
| Disease catalog | "Add Disease" / "Edit" buttons | ADMIN |
| Medicine catalog | "Add Medicine" / "Edit" buttons | ADMIN |
| Regulations | "Create Version" / "Activate" buttons | ADMIN |
| User management | All CRUD actions | ADMIN |

---

## Auth State Machine

```
Not authenticated
    → GET any /app/* route → redirect /login
    → POST /auth/login success → store token + user → redirect /app/dashboard

Authenticated (role insufficient)
    → GET /app/admin/* as non-ADMIN → redirect /403
    → Backend returns 403 → show permission error toast or redirect /403

Authenticated (token expired)
    → Backend returns 401 → clear tokens + user state → redirect /login
```

---

## Role Badge Colors (UI)

| Role | Badge color |
|------|------------|
| ADMIN | `clinic.sidebar` (#6D5BD0) |
| RECEPTIONIST | `clinic.secondary` (#A7D8DE) |
| DOCTOR | `clinic.success` (#A8D5BA) |
| CASHIER | `clinic.accent` (#F5C6AA) |
| MANAGER | `clinic.warning` (#F6D58E) |
