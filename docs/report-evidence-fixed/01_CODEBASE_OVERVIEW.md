# 01 — Tổng quan Codebase

> Audit date: 2026-06-07 | Nguồn: cấu trúc thư mục thật

---

## 1. Cây thư mục rút gọn (thật)

```text
4N_Clinic_Management_System/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 37 models, 12 enums — source of truth DB
│   │   ├── seed.ts                # Seed data demo cho P1+P2
│   │   └── migrations/            # 3 migrations (baseline, identity, phase2a)
│   ├── src/
│   │   ├── main.ts                # Bootstrap NestJS, API prefix /api/v1, Swagger /api/docs
│   │   ├── app.module.ts          # Root module wiring 21 feature modules
│   │   ├── common/
│   │   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   │   ├── decorators/        # @Roles(), @CurrentUser()
│   │   │   └── filters/           # PrismaExceptionFilter
│   │   ├── prisma/                # PrismaModule, PrismaService (shared)
│   │   └── modules/               # 21 feature folders
│   │       ├── auth/              # P1 — JWT login/refresh/logout/me
│   │       ├── users/             # P1 — user CRUD, lock, assign roles
│   │       ├── rbac/              # P1 — roles, permissions
│   │       ├── patients/          # P1 — patient CRUD, medical history
│   │       ├── visits/            # P1 — visit creation, open examination
│   │       ├── examinations/      # P1 — examination, diagnosis, complete
│   │       ├── prescriptions/     # P1 — service-only (no controller), called by examinations
│   │       ├── diseases/          # P1 — disease catalog
│   │       ├── drugs/             # P1 — drug catalog
│   │       ├── billing/           # P1 — invoice, payment
│   │       ├── regulations/       # P1 — regulation versions, activate
│   │       ├── reports/           # P1+P2 — monthly report + revenue breakdown
│   │       ├── appointments/      # P2 — appointment CRUD, checkin
│   │       ├── queue/             # P2 — queue state management
│   │       ├── vitals/            # P2 — vital signs per visit
│   │       ├── services/          # P2 — service catalog + service orders
│   │       ├── lab/               # P2 — lab orders, samples, results
│   │       ├── inventory/         # P2 — stock lots, movements
│   │       ├── pharmacy/          # P2 — dispense (FEFO)
│   │       ├── organization/      # P2 — departments, rooms, doctors, schedules
│   │       └── audit/             # P2 — audit log
│   ├── test/                      # 4 e2e test files
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── router.tsx         # 36 named routes + error fallback
│   │   │   └── providers.tsx      # QueryClient, ThemeProvider
│   │   ├── components/common/     # Shared UI: Sidebar, Topbar, AppShell, DataTable, etc.
│   │   ├── config/
│   │   │   ├── navigation.ts      # Role-based sidebar nav config
│   │   │   └── permissions.ts     # Frontend permission helpers
│   │   ├── features/              # 20 feature folders (one per domain)
│   │   ├── lib/                   # api-client.ts, query-client.ts, theme.ts, money.ts, date.ts
│   │   ├── pages/                 # ForbiddenPage.tsx, NotFoundPage.tsx
│   │   └── styles/globals.css     # Tailwind v4 @theme + dark/light mode
│   └── package.json
│
├── docs/
│   ├── adr/                       # Architecture Decision Records
│   ├── software-design-workspace/ # Audit A0–A6, SDD, ERD .mmd files
│   ├── phase2-tasks/              # Task specs cho P2 implementation
│   ├── report-evidence/           # Bộ evidence cũ (draft)
│   ├── report-evidence-fixed/     # Bộ evidence này (fixed, source of truth)
│   └── template-UI/               # UI mockup templates
│
├── CLAUDE.md                      # Project instructions cho Claude Code
└── README.md
```

---

## 2. Bảng file/thư mục quan trọng

| Path | Vai trò | Status |
|---|---|---|
| `backend/prisma/schema.prisma` | Source of truth DB — 37 models, 12 enums | CONFIRMED |
| `backend/src/main.ts` | Bootstrap: API prefix `/api/v1`, Swagger `/api/docs`, port 3000 | CONFIRMED |
| `backend/src/app.module.ts` | Wiring 21 feature modules | CONFIRMED |
| `backend/src/common/guards/` | JwtAuthGuard + RolesGuard | CONFIRMED |
| `backend/src/common/decorators/` | @Roles(), @CurrentUser() | CONFIRMED |
| `backend/src/common/filters/` | PrismaExceptionFilter — map Prisma errors → HTTP | CONFIRMED |
| `backend/test/` | 4 e2e files (3 meaningful + 1 boilerplate) | CONFIRMED |
| `backend/.env.example` | Template env vars | CONFIRMED |
| `frontend/src/app/router.tsx` | 36 routes với ProtectedRoute + RequireRole | CONFIRMED |
| `frontend/src/app/providers.tsx` | QueryClientProvider, ThemeProvider | CONFIRMED |
| `frontend/src/config/navigation.ts` | Sidebar nav config theo role | CONFIRMED |
| `frontend/src/lib/api-client.ts` | HTTP client với Bearer token, error mapping | CONFIRMED |
| `frontend/src/lib/theme.ts` | Dark/light mode toggle, localStorage | CONFIRMED |
| `frontend/src/styles/globals.css` | Tailwind v4 @theme, clinic color palette | CONFIRMED |

---

## 3. Scripts quan trọng

### Backend (`backend/package.json`)

| Script | Lệnh | Mục đích |
|---|---|---|
| dev server | `npm run start:dev` | Chạy NestJS với watch mode |
| build | `npm run build` | Compile TypeScript → dist/ |
| lint | `npm run lint` | ESLint check |
| test (unit) | `npm run test` | Jest unit tests |
| test e2e | `npm run test:e2e` | E2E tests (cần DB thật) |
| migrate | `npx prisma migrate dev` | Apply schema migrations |
| seed | `npx prisma db seed` | Seed demo data |
| studio | `npx prisma studio` | DB GUI tại port 5555 |

### Frontend (`frontend/package.json`)

| Script | Lệnh | Mục đích |
|---|---|---|
| dev server | `npm run dev` | Vite dev server tại port 5173 |
| build | `npm run build` | Vite production build |
| lint | `npm run lint` | ESLint check |
| preview | `npm run preview` | Preview production build |

---

## 4. Phân loại module backend (quan trọng)

| Loại | Module | Ghi chú |
|---|---|---|
| **Feature với controller + service** | auth, users, rbac, patients, visits, examinations, billing, diseases, drugs, regulations, reports, appointments, queue, vitals, services, lab, inventory, pharmacy, organization, audit | 20 controllers, 20 services |
| **Service-only (không có controller)** | prescriptions | Được gọi từ `examinations.service.ts`, không có route trực tiếp |
| **Shared/common** | prisma (PrismaModule/PrismaService) | Không phải feature module |

> **Lưu ý:** `prescriptions` là service-only module. Không được tính là module có API route độc lập.

---

## 5. Điểm mạnh codebase

- Schema rõ ràng, normalize tốt — 37 models với UUID PK, soft-delete (isActive), snapshot (PrescriptionItem)
- Tách biệt rõ ràng Phase 1 (nghiệp vụ lõi) và Phase 2 (mở rộng)
- Business rules tại service layer — không leak xuống controller hoặc lên frontend
- Frontend feature-based structure rõ ràng theo domain
- RBAC 2 lớp: backend guards + frontend RequireRole
- Dark/light mode hoàn chỉnh với Tailwind v4 CSS custom properties

## 6. Điểm cần lưu ý

- Không có Docker, CI/CD pipeline
- Unit test coverage thấp — chủ yếu E2E
- Chỉ 2 git contributor accounts (nhóm 4 người nhưng chủ yếu 1 người commit)
- Một số endpoint Phase 2 chưa có RBAC chi tiết (cần xác nhận thủ công)
- README chưa đủ chi tiết hướng dẫn setup
