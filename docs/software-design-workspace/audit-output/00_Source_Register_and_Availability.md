# A0 — Source Register and Availability
## 4N Clinic Management System — Pre-Writing Audit

**Ngày audit:** 2026-05-27  
**Mode:** PRE-WRITING AUDIT ONLY  
**Root path:** `c:\Users\ASUS\SinhVienCNhan\SE104\temp\4N_Clinic_Management_System`  
**Branch:** `feature/UC07-20-with-frontend`  
**Commit:** `a71aa9909b4dee56c7651f8fa0c7f14386b3c216`  
**Working tree:** DIRTY — có uncommitted changes (xem mục 3)

---

## 1. Control Files

| ID | File | Tình trạng | Version |
|---|---|---|---|
| CTRL-001 | `00_HUONG_DAN_SU_DUNG_PROMPT_VA_CONG_NGUON.md` | Nhận qua conversation | v2.0 Final Baseline |
| CTRL-002 | `01_PHASE2_DECISION_BASELINE_FORM.md` | Nhận qua conversation | v2.0 APPROVED |
| CTRL-003 | `02_SOURCE_CHECKLIST_CONFLICT_REGISTER_FOR_CLAUDE.md` | Nhận qua conversation | v2.0 |
| CTRL-004 | `03_MASTER_PROMPT_GENERATE_SOFTWARE_DESIGN_PACKAGE.md` | Nhận qua conversation | v2.0 |
| CTRL-005 | `04_PHASE2A_TEAM_EXECUTION_AND_CLAUDE_CODE_GUIDE.md` | ✅ Đã copy vào workspace/control/ | v1.0 |
| CTRL-README | `README_FIRST.md` | Nhận qua conversation | v2.0 |
| CTRL-HANDBOOK | `PHASE1_IMPLEMENTATION_HANDBOOK.md` | ✅ Đã copy vào workspace/control/ | v1.0 |

> **Cập nhật 2026-05-27:** CTRL-005 và CTRL-HANDBOOK đã được lưu vào `docs/software-design-workspace/control/`. MODE_C_CONTEXT.md đã được tạo tại `docs/software-design-workspace/`. Gate D0 đã đủ điều kiện để chạy Mode C.

> **Còn thiếu:** CTRL-001 (usage guide), CTRL-002 (Decision Baseline v2.0 full text), CTRL-003 (source checklist), CTRL-README — cần copy từ conversation nếu cần Mode C output đầy đủ authority chain. Tuy nhiên, content từ Baseline v2.0 đã được extract vào `MODE_C_CONTEXT.md` từ A2 audit.

---

## 2. Repository Evidence

| ID | Evidence | Path | Tình trạng | Ghi chú |
|---|---|---|---|---|
| P1-E01 | Branch/commit/status | `git` output | ✅ Confirmed | Branch: `feature/UC07-20-with-frontend`, commit: `a71aa99` |
| P1-E02 | Backend module tree | `backend/src/modules/` | ✅ Readable | 14 modules identified |
| P1-E03 | Prisma schema | `backend/prisma/schema.prisma` | ✅ Read | Phase 1 + Phase 2A foundation present |
| P1-E03b | Migrations | `backend/prisma/migrations/` | ✅ Read | 3 migrations: baseline, identity-access, phase2a_foundation |
| P1-E03c | Seed | `backend/prisma/seed.ts` | ✅ Read | Phase 1 + Phase 2 seed data |
| P1-E04 | Controllers/services/DTO | `backend/src/modules/**` | ✅ Inventoried | 12 feature controllers |
| P1-E04b | Guards/decorators | `backend/src/common/` | ✅ Confirmed | JwtAuthGuard, RolesGuard, @Roles, @CurrentUser |
| P1-E05 | Frontend router | `frontend/src/app/router.tsx` | ✅ Read | 18 routes, RequireRole guards |
| P1-E05b | Frontend pages | `frontend/src/features/**` | ✅ Inventoried | 28 page/component/api files |
| P1-E06 | Build evidence | `npm run build` executed | ✅ PASS | Backend: `nest build` clean; Frontend: `vite build` 3.60s, chunk size warning only |
| P1-E07 | Swagger/OpenAPI | Not exported | ⚠️ MISSING | Swagger UI at `:3000/api/docs` when running; no static export found |
| P1-E08 | Runtime/DB version | `.env` not read (sensitive) | ⚠️ Partial | PostgreSQL database confirmed via `schema.prisma` datasource config |
| P1-E09 | Prior audit/changelog | `docs/evaluation-report-2026-05-20.md` | ✅ Read | Comprehensive evaluation report present |

---

## 3. Uncommitted Working Tree Changes

Các file đã sửa nhưng chưa commit (từ session hardening Phase 1):

| File | Change | Significance |
|---|---|---|
| `backend/prisma/schema.prisma` | Phase 2A models added | CRITICAL — schema không ở commit HEAD |
| `backend/prisma/seed.ts` | Phase 2 seed data added | Relevant |
| `backend/src/common/constants/roles.constant.ts` | NURSE, LAB_TECHNICIAN, PHARMACIST added | Relevant |
| `backend/src/modules/auth/auth.service.ts` | AuditService injected | Hardening |
| `backend/src/modules/billing/billing.{controller,module,service}.ts` | AuditService, CurrentUser | Hardening |
| `backend/src/modules/examinations/examinations.{controller,module,service}.ts` | AuditService, complete() | Hardening |
| `backend/src/modules/patients/patients.{controller,module,service}.ts` | AuditService, CurrentUser | Hardening |
| `backend/src/modules/prescriptions/prescriptions.controller.ts` | **DELETED** | CRITICAL security fix |
| `backend/src/modules/visits/visits.{controller,module,service}.ts` | hasInvoice filter, CASHIER role, AuditService | Hardening |
| `frontend/src/features/invoices/InvoiceListPage.tsx` | Cashier pending-invoice tab | UC14 fix |
| `frontend/src/features/users/RoleManagementPage.tsx` | Real API calls | UC03 fix |
| `frontend/src/app/providers.tsx` | Sonner Toaster | Infra |
| `frontend/package.json` | sonner dependency | Infra |

> **Nhận xét quan trọng:** Migration `20260520192733_phase2a_foundation` tồn tại dưới dạng untracked (`??`), có nghĩa migration file chưa commit nhưng đã được apply vào DB. Schema và DB hiện tại **vượt trước** commit HEAD. Phase 1 as-built phải mô tả **working tree hiện tại**, không phải HEAD commit.

---

## 4. Reference/Proposal Inputs

| ID | File | Tình trạng | Authority |
|---|---|---|---|
| REF-001 | Phase 1 SRS/System Design baseline | ⚠️ Không có trong workspace | P1-3 (low) |
| REF-002 | Software_Engineering_TENT.pdf | ⚠️ Không có trong workspace | Optional |
| REF-003 | Phase 2 Specification document | ⚠️ Không có trong workspace | Required for full SDD |
| PROP-001 | Phase 2A task plans | ✅ `docs/phase2-tasks/` (00–07) | P2-5 |
| EVAL-001 | Evaluation report 2026-05-20 | ✅ `docs/evaluation-report-2026-05-20.md` | P1-2 (audit supplement) |
| PROP-002 | AGENTS.md, CLAUDE_PHASE2.md | Present as untracked | Low authority |

---

## 5. Source Authority Ranking (Active)

```
Phase 1 as-built:
  Working tree code + schema (HIGHEST — reflects actual DB state)
  > Migration files + seed
  > Evaluation report 2026-05-20
  > Phase 2A task plans (docs/phase2-tasks/)
  > Missing: SRS baseline, Swagger export

Phase 2A target:
  01_PHASE2_DECISION_BASELINE_FORM.md v2.0 (HIGHEST)
  > Working tree Phase 2A schema additions
  > docs/phase2-tasks/ proposals
  > Evaluation report recommendations
```

---

## 6. Missing Evidence Summary

| Gap | Impact | Blocking? |
|---|---|---|
| SRS/System Design Phase 1 baseline không có trong workspace | Không thể so sánh intended vs. implemented | Không — có evaluation report thay thế |
| Swagger/OpenAPI export tĩnh không có | API contract phải reconstruct từ controllers | Không — controllers readable |
| Commit HEAD không reflect working tree (schema + hardening chưa commit) | Phase 1 As-Built phải dựa trên working tree, không HEAD | Không — working tree readable |
| Không có test coverage report | Không thể claim coverage percentage | Không — `npm run build` pass là minimum evidence |
| Phase 2 Specification document (business requirements doc) | Phase 2A motivation và FR/NFR context thiếu nguồn chính thức | Không — Decision Baseline v2.0 đủ |
