# 01 — Tổng quan Codebase

---

## 1. Cây thư mục rút gọn

```text
4N_Clinic_Management_System/
├── backend/                          # NestJS API server
│   ├── prisma/
│   │   ├── schema.prisma             # Single source of truth — 37 models, 9 enums
│   │   ├── seed.ts                   # Demo data đầy đủ
│   │   └── migrations/               # Migration history
│   ├── src/
│   │   ├── app.module.ts             # Root module
│   │   ├── main.ts                   # Bootstrap + Swagger setup
│   │   ├── common/
│   │   │   ├── constants/            # roles.constant.ts, app.constants.ts
│   │   │   ├── decorators/           # @Roles(), @GetUser()
│   │   │   ├── filters/              # PrismaExceptionFilter
│   │   │   └── guards/               # JwtAuthGuard, RolesGuard
│   │   ├── health/                   # Health check endpoint
│   │   ├── prisma/                   # PrismaService (singleton)
│   │   └── modules/                  # 20 feature modules
│   │       ├── auth/                 # Phase 1 — Login, JWT, Refresh, Me
│   │       ├── users/                # Phase 1 — User CRUD
│   │       ├── rbac/                 # Phase 1 — Roles/Permissions
│   │       ├── patients/             # Phase 1 — Patient CRUD + history
│   │       ├── visits/               # Phase 1 — Visit intake + open exam
│   │       ├── examinations/         # Phase 1 — Examination + prescription
│   │       ├── prescriptions/        # Phase 1 — Prescription service (shared)
│   │       ├── diseases/             # Phase 1 — Disease catalog
│   │       ├── drugs/                # Phase 1 — Drug catalog
│   │       ├── billing/              # Phase 1 — Invoice + payment
│   │       ├── regulations/          # Phase 1 — Regulation versions
│   │       ├── reports/              # Phase 1+2 — Monthly + revenue breakdown
│   │       ├── appointments/         # Phase 2 — Appointment scheduling
│   │       ├── queue/                # Phase 2 — Queue management
│   │       ├── vitals/               # Phase 2 — Vital signs
│   │       ├── services/             # Phase 2 — Service catalog + orders
│   │       ├── lab/                  # Phase 2 — Lab orders/samples/results
│   │       ├── inventory/            # Phase 2 — Stock lots + movements
│   │       ├── pharmacy/             # Phase 2 — Dispense
│   │       ├── organization/         # Phase 2 — Department/Room/Doctor/Schedule
│   │       └── audit/                # Phase 2 — Audit logs
│   ├── test/
│   │   ├── auth.e2e-spec.ts          # Auth flow e2e
│   │   ├── clinic-flow.e2e-spec.ts   # UC-07→UC-11 e2e
│   │   └── billing-catalog-flow.e2e-spec.ts
│   ├── .env.example
│   └── package.json
│
├── frontend/                         # React + Vite SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── router.tsx            # React Router v7 setup
│   │   │   └── providers.tsx         # TanStack Query + Toaster
│   │   ├── components/common/        # Shared components (Sidebar, Topbar, etc.)
│   │   ├── config/
│   │   │   ├── navigation.ts         # Role-based menu config
│   │   │   └── permissions.ts        # RBAC permissions map
│   │   ├── features/                 # Feature-based folders (30+ pages)
│   │   ├── hooks/                    # useTheme
│   │   ├── lib/                      # api-client, money, date, errors
│   │   └── styles/globals.css        # Dark/light theme CSS variables
│   └── package.json
│
├── docs/
│   ├── adr/                          # Architecture Decision Records
│   ├── phase2-tasks/                 # Phase 2 task specs
│   ├── reports_evidence/             # Prompt này
│   ├── report-evidence/              # Output của audit (thư mục này)
│   └── software-design-workspace/   # SDD, ERD, audit files
│
├── CLAUDE.md                         # Hướng dẫn cho AI assistant
├── AGENTS.md
└── CLAUDE_PHASE2.md
```

---

## 2. Bảng tổng quan file/thư mục quan trọng

| Khu vực | File/thư mục | Vai trò | Nhận xét | Trạng thái |
|---|---|---|---|---|
| Backend schema | `backend/prisma/schema.prisma` | Định nghĩa toàn bộ data model | 37 models, 9 enums, đầy đủ constraints | CONFIRMED |
| Backend seed | `backend/prisma/seed.ts` | Dữ liệu demo | Có demo accounts, patients, visits, drugs | CONFIRMED |
| Backend main | `backend/src/main.ts` | Bootstrap + Swagger | Port 3000, API prefix `/api`, Swagger tại `/api/docs` | CONFIRMED |
| Backend modules | `backend/src/modules/` | 20 feature modules | Đầy đủ Phase 1 + Phase 2 | CONFIRMED |
| Common guards | `backend/src/common/guards/` | JWT + Role guards | Bảo vệ toàn bộ route | CONFIRMED |
| Frontend router | `frontend/src/app/router.tsx` | React Router v7 | Có ProtectedRoute, lazy loading | CONFIRMED |
| Frontend features | `frontend/src/features/` | 17 feature folders | Đầy đủ phase 1 + 2 pages | CONFIRMED |
| Frontend API client | `frontend/src/lib/api-client.ts` | HTTP client centralized | Bearer token, error normalization | CONFIRMED |
| Frontend navigation | `frontend/src/config/navigation.ts` | Role-based sidebar | Menu theo role, icon | CONFIRMED |
| Env example | `backend/.env.example` | Cấu hình môi trường | DATABASE_URL, JWT secrets, PORT | CONFIRMED |
| E2E tests | `backend/test/*.e2e-spec.ts` | Integration tests | 3 files: auth, clinic-flow, billing | CONFIRMED |
| ADR docs | `docs/adr/` | Architecture decisions | Có README và các ADR files | CONFIRMED |

---

## 3. Scripts quan trọng

### Backend (`backend/package.json`)

```json
"start:dev": "nest start --watch"      // Dev server, hot reload
"build":    "nest build"               // Production build
"lint":     "eslint ... --fix"         // Linting
"test":     "jest"                     // Unit tests
"test:e2e": "jest --config ./test/jest-e2e.json"  // E2E tests
```

### Frontend (`frontend/package.json`)

```json
"dev":   "vite"              // Dev server port 5173
"build": "tsc -b && vite build"  // Production build
"lint":  "eslint ."          // Linting
```

### Database

```bash
npx prisma migrate dev       # Apply schema changes
npx prisma db seed           # Run seed
npx prisma studio            # GUI browser
npx prisma validate          # Validate schema
```

---

## 4. Nhận xét tổng quan codebase

**Điểm mạnh:**
- Cấu trúc thư mục rõ ràng, nhất quán theo convention NestJS và feature-based React
- Schema database được tổ chức tốt, phân nhóm theo nghiệp vụ bằng comment
- Frontend và backend tách hoàn toàn, giao tiếp qua REST API
- Có documentation trong CLAUDE.md rất chi tiết

**Điểm cần lưu ý cho báo cáo:**
- PARTIAL: Chưa có Docker/docker-compose — cần trình bày triển khai local trong Chương 6
- PARTIAL: Unit test chỉ có 1 file (`app.controller.spec.ts`) — e2e tests tốt hơn nhưng cần ghi trung thực
- CONFIRMED: Không có CI/CD pipeline — chấp nhận được cho dự án môn học
