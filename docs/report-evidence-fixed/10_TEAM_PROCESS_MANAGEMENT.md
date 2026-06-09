# 10 — Quản lý Nhóm và Quy trình

> Audit date: 2026-06-07 | Nguồn: `git log`, `git shortlog`, `git branch -a`

---

## 1. Git Branch Evidence

Các branch hiện có (CONFIRMED — `git branch -a`):

```
local:
  chore/add-pr-template-and-contributing
  chore/init-backend-frontend-scaffold
  db/init-prisma-schema-draft
  develop
  docs/business-rules-v1
  docs/role-matrix-v1
  feature/UC07-08-09-10-11
  feature/UC07-20-with-frontend
* feature/phase2-clinical-modules  ← current
  main

remote:
  remotes/origin/develop
  remotes/origin/feature/UC01-02-03
  remotes/origin/feature/UC07-08-09-10-11
  remotes/origin/feature/UC07-20-with-frontend
  remotes/origin/feature/phase2-clinical-modules
  remotes/origin/feature/uc04-uc06
  remotes/origin/main
```

**Naming convention:** `feature/UC{XX}-{YY}`, `chore/`, `docs/`, `db/` — theo GitFlow cơ bản.

---

## 2. Git Log Timeline (80 commits gần nhất)

| Hash | Author | Date | Message |
|---|---|---|---|
| 04b65be | nguyennhan2006 | 2026-06-06 | feat(seed): comprehensive evaluation data for all modules |
| 3224541 | nguyennhan2006 | 2026-06-06 | fix(nav): remove dead /app/examinations sidebar link causing 404 |
| 7da9030 | nguyennhan2006 | 2026-06-05 | fix(examination): 4 bug fixes + demo seed data for testing |
| cd72858 | nguyennhan2006 | 2026-06-05 | feat(phase2): implement full Phase 2 clinical modules — backend + frontend |
| a71aa99 | nguyennhan2006 | 2026-05-19 | new readme for version 1 |
| b836489 | nguyennhan2006 | 2026-05-19 | (Fix): solve merge conflict |
| d28c03a | nguyennhan2006 | 2026-05-19 | Merge pull request #3 from nguyennhan2006/feature/UC01-02-03 |
| 8f4480c | Nguyễn Trọng Phan Nhật | 2026-05-19 | . |
| 0e3c231 | nguyennhan2006 | 2026-05-17 | feat(E4E5): implement UC-07 to UC-11 — visit intake & examination flow |
| 373ff92 | nguyennhan2006 | 2026-04-27 | feat(backend): implement P1 clinic flow with Prisma schema, seed data, and module wiring |
| 8d1cef6 | nguyennhan2006 | 2026-04-19 | chore(init): create base repo structure and project docs |
| ae3c5d2 | nguyennhan2006 | 2026-03-24 | Initial structure for project |
| c8eba2f | nguyennhan2006 | 2026-03-14 | Merge pull request #2 |
| 68bac19 | nguyennhan2006 | 2026-03-14 | Add iostream include to main.cpp |
| 416d599 | nguyennhan2006 | 2026-03-12 | Initial commit |

---

## 3. Git Contributors

**CONFIRMED từ `git shortlog`:**

| Account | Số commit | Ghi chú |
|---|---|---|
| nguyennhan2006 | ~14 commits chính | Commit author chính |
| Nguyễn Trọng Phan Nhật | 1 commit (8f4480c — "." — chỉ là placeholder) | 1 commit nhỏ |

> **Quan trọng:** Git history xác nhận **2 contributor accounts**. Nếu nhóm có 4 thành viên, các thành viên còn lại có thể đóng góp qua: pair programming, code review, documentation, testing thủ công, viết báo cáo, hoặc commit qua account chung. **Nhóm cần giải thích rõ trong báo cáo.**

**Không được ghi:** "4 thành viên commit đều nhau" — git không xác nhận điều này.

---

## 4. Timeline phát triển (từ commit history)

| Giai đoạn | Thời gian | Nội dung |
|---|---|---|
| Khởi tạo | 2026-03-12 → 2026-03-14 | Initial commit, cấu trúc ban đầu |
| Setup project | 2026-04-19 | Cấu trúc backend, docs |
| Phase 1 backend core | 2026-04-27 | Prisma schema + P1 modules + seed |
| Phase 1 UC07–UC11 | 2026-05-17 | Visit + examination flow |
| Phase 1 UC01–UC03 + frontend | 2026-05-19 | Auth, users, RBAC + merge |
| Phase 1 baseline (v1) | 2026-05-19 | README v1 — commit `a71aa99` |
| Phase 2 full implementation | 2026-06-05 | Backend + frontend Phase 2 — commit `cd72858` |
| Bug fixes + seed | 2026-06-05 → 2026-06-06 | 4 examination bug fixes, comprehensive seed |

---

## 5. Phân vai nhóm đề xuất (dựa trên git + codebase)

> **Lưu ý:** Phân vai này là **đề xuất dựa trên codebase**, không phải từ bằng chứng git commit của từng người. Nhóm cần xác nhận và điều chỉnh cho đúng thực tế.

| Vai trò | Trách nhiệm chính | Bằng chứng gợi ý |
|---|---|---|
| **Project Lead / BA / Documentation** | Quản lý tiến độ, đặc tả yêu cầu, viết báo cáo, tài liệu thiết kế | docs/, CLAUDE.md, ADR |
| **Backend & Database Lead** | Prisma schema, NestJS modules, business rules, migrations | backend/src/modules/, schema.prisma |
| **Frontend & UI/UX Lead** | React pages, components, RBAC UI, design system | frontend/src/ |
| **QA / Integration / DevOps Lead** | E2E tests, seed data, manual testing, README | backend/test/, seed.ts |

---

## 6. RACI Matrix

| Hoạt động | Project Lead | Backend Lead | Frontend Lead | QA Lead |
|---|---|---|---|---|
| Phân tích yêu cầu | R/A | C | C | I |
| Thiết kế database schema | C | R/A | I | I |
| Implement backend modules | I | R/A | I | C |
| Implement frontend pages | I | I | R/A | C |
| Viết E2E tests | I | C | I | R/A |
| Seed data demo | I | C | I | R/A |
| Code review | A | R | R | R |
| Viết báo cáo | R/A | C | C | C |
| Demo/presentation | R/A | C | C | C |

R = Responsible, A = Accountable, C = Consulted, I = Informed

---

## 7. Scrum-lite Workflow (đề xuất từ branch naming)

Dựa trên branch naming và commit history, nhóm theo quy trình:
1. Branch `feature/UCxx-yy` cho mỗi sprint
2. Code → commit → push → Pull Request → merge to develop/main
3. Evidence: 5 remote feature branches + 1 remote develop branch

---

## 8. Rủi ro quản lý nhóm

| Rủi ro | Mô tả | Khuyến nghị |
|---|---|---|
| Chỉ 2 git accounts | Git không thể xác minh đóng góp của 2 thành viên còn lại | Nhóm giải thích trong báo cáo: pair programming, review, docs, testing |
| Commit chủ yếu từ 1 account | Có thể gây impression 1 người làm tất cả | Cần narrative rõ ràng về phân công |
