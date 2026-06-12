# 10 — Quản lý Nhóm và Tiến trình Phát triển

---

## 1. Bằng chứng từ Git History

### Branches theo thứ tự phát triển

```
main                          → Nhánh ổn định ban đầu
develop                       → Nhánh phát triển tổng hợp
chore/init-backend-frontend-scaffold  → Khởi tạo cấu trúc
db/init-prisma-schema-draft   → Schema database ban đầu
docs/business-rules-v1        → Tài liệu business rules
docs/role-matrix-v1           → Ma trận phân quyền
feature/UC01-02-03            → Auth, Users, RBAC
feature/uc04-uc06             → Patients (search, create, update)
feature/UC07-08-09-10-11      → Visits, Examinations, Prescription
feature/UC07-20-with-frontend → Toàn bộ Phase 1 + Frontend
feature/phase2-clinical-modules → Phase 2 (appointments, lab, pharmacy...)
```

### Timeline theo git log

| Giai đoạn | Git evidence | Hoạt động | Bằng chứng |
|---|---|---|---|
| Khởi tạo | `ae3c5d2 Initial structure` | Tạo repo | git log |
| Scaffold | `8d1cef6 chore(init): create base repo structure` | Cấu trúc BE + FE | git log |
| Schema + Seed | `373ff92 feat(backend): implement P1 clinic flow` | Prisma schema + seed | git log |
| Phase 1 UC01-03 | `d28c03a Merge PR #3 feature/UC01-02-03` | Auth, Users, RBAC | git log |
| Phase 1 UC04-06 | `origin/feature/uc04-uc06` | Patients module | git log |
| Phase 1 UC07-11 | `0e3c231 feat(E4E5): implement UC-07 to UC-11` | Visits + Examinations | git log |
| Phase 1 Frontend | `a71aa99 new readme for version 1` | Frontend hoàn thành | git log |
| Phase 2 Backend+FE | `cd72858 feat(phase2): implement full Phase 2` | Appointments, Lab, Pharmacy... | git log |
| Bug fixes | `7da9030 fix(examination): 4 bug fixes` | Hotfix + seed data | git log |
| Seed comprehensive | `04b65be feat(seed): comprehensive evaluation data` | Demo data đầy đủ | git log (HEAD) |

### Contributors

| Tài khoản | Số commits | Ghi chú |
|---|---|---|
| nguyennhan2006 | 17 | Contributor chính |
| Nguyễn Trọng Phan Nhật | 1 | — |
| Tran Duc Nguyen | 1 | — |

> **Ghi chú**: Git chỉ thấy 3 tài khoản. Nhóm có 4 thành viên — cần xác nhận ai contribute qua cách khác (Google Meet, trao đổi trực tiếp).

---

## 2. Phân vai nhóm đề xuất (4 thành viên)

| Vai trò | Trách nhiệm chính | Work package | Bằng chứng code/docs | Ghi chú |
|---|---|---|---|---|
| **Project Lead / BA / Documentation** | Quản lý tiến độ, viết đặc tả yêu cầu, viết báo cáo, tổng hợp tài liệu | - Viết CLAUDE.md, docs/ - Quản lý PR - Review code - Viết báo cáo | `CLAUDE.md`, `docs/adr/`, `docs/phase2-tasks/` | NEED_MANUAL_CONFIRMATION: xác nhận thành viên cụ thể |
| **Backend & Database Lead** | Thiết kế schema, implement backend modules, business rules, e2e tests | - Prisma schema + migrations - NestJS modules (Phase 1 + 2) - Business rules - E2E tests | `backend/prisma/schema.prisma`, `backend/src/modules/`, `backend/test/` | NEED_MANUAL_CONFIRMATION |
| **Frontend & UI/UX Lead** | Thiết kế giao diện, implement React pages, integration với API | - React feature pages - API client integration - UI states, form validation - Theme system | `frontend/src/features/`, `frontend/src/components/`, `frontend/src/lib/` | NEED_MANUAL_CONFIRMATION |
| **QA / Integration / DevOps Lead** | Kiểm thử, seed data, tích hợp hệ thống, hướng dẫn triển khai | - Seed data - Manual testing - E2E test execution - README, deployment guide | `backend/prisma/seed.ts`, `backend/test/`, bug fix commits | NEED_MANUAL_CONFIRMATION |

---

## 3. RACI Matrix

| Hoạt động | Project Lead | Backend Lead | Frontend Lead | QA/Devops Lead |
|---|---|---|---|---|
| Phân tích yêu cầu | **R** | A | A | — |
| Thiết kế DB schema | A | **R** | — | A |
| Implement backend API | — | **R** | — | A |
| Implement frontend pages | — | — | **R** | A |
| Viết E2E test | — | A | — | **R** |
| Seed dữ liệu demo | — | A | — | **R** |
| Review code (PR) | **R** | A | A | — |
| Viết báo cáo | **R** | C | C | C |
| Deploy / hướng dẫn chạy | — | C | — | **R** |

> R = Responsible (thực hiện), A = Accountable (chịu trách nhiệm), C = Consulted (tư vấn), — = không tham gia

---

## 4. Quy trình phát triển (Scrum-lite)

Dựa trên cấu trúc branch và commit, nhóm áp dụng workflow sau:

```
1. Tạo branch từ develop (feature/UC-xx)
2. Implement feature
3. Push + tạo PR
4. Review + merge vào develop
5. Test integrated
6. Merge develop → main khi ổn định
```

**Bằng chứng**: Có PR #1, #2, #3 đã merge theo git log; có feature branch theo UC ID.

---

## 5. Nhận xét về quy trình cho báo cáo

- **Điểm mạnh**: Branch naming rõ ràng theo UC, commit message có convention (`feat:`, `fix:`, `chore:`), có PR-based workflow
- **Điểm cần trình bày trung thực**: Số lượng contributor trong git chỉ là 3; nhóm cần bổ sung giải thích (pair programming, code review không commit)
- **Gợi ý Chương 10**: Vẽ sơ đồ Gantt đơn giản theo timeline git; trình bày phân công theo RACI matrix
