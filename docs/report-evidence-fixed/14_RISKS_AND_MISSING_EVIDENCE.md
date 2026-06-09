# 14 — Rủi ro và Bằng chứng còn thiếu

> Audit date: 2026-06-07

---

## 1. Bảng Rủi ro tổng hợp

| Risk ID | Khu vực | Mô tả rủi ro | Mức độ | Bằng chứng | Ảnh hưởng báo cáo | Khuyến nghị |
|---|---|---|---|---|---|---|
| R-01 | Testing | Chỉ có 3 E2E files cho Phase 1; không có unit test service layer; không có test Phase 2; không có CI/CD | Trung bình | `backend/test/` — 4 files (3 meaningful), `backend/src/app.controller.spec.ts` — boilerplate | Chương 5 cần trình bày trung thực | Viết manual test report Phase 2; không khai là đã test tự động đủ |
| R-02 | Deployment | Không có Docker, docker-compose, CI/CD pipeline | Thấp | Không tìm thấy `Dockerfile`, `.github/workflows/` | Chương 6 phải trình bày là local development | Ghi rõ "triển khai môi trường development local" |
| R-03 | Team | Git log xác nhận 2 accounts; nhóm có thể nhiều hơn | Thấp | `git shortlog`: nguyennhan2006 (~14 commits), Nguyễn Trọng Phan Nhật (1 commit "." ) | Chương quản lý nhóm | Nhóm giải thích pair-programming, code review, docs, testing thủ công |
| R-04 | RBAC Backend | @Roles() cụ thể chưa xác nhận từng endpoint — chỉ verify JwtGuard chung | Thấp | Cần đọc kỹ từng controller method | Security ổn ở mức auth; RBAC chi tiết cần confirm | NEED_MANUAL_CONFIRMATION: scan @Roles() từng method |
| R-05 | Business Logic | `POST /examinations/:id/complete` không check pending service/lab orders | Trung bình | `examinations.service.ts` — không có ServiceOrder pending check | Chương 4 — ghi là limitation | Ghi rõ: "Trong scope hiện tại, bác sĩ tự quyết định hoàn tất mà không cần chờ lab" |
| R-06 | Data/Demo | Seed data comprehensive nhưng cần confirm đủ cho demo mọi flow | Thấp | `backend/prisma/seed.ts` — commit `04b65be` | Screenshots có thể thiếu data | Thêm seed data nếu cần screenshot cụ thể |
| R-07 | Frontend | VitalSignSection và ServiceOrderSection là embedded component, không có route độc lập | Thấp | `features/vitals/VitalSignSection.tsx`, `features/services/ServiceOrderSection.tsx` | Chương giao diện | Trình bày như "component embedded trong examination flow" |
| R-08 | Documentation | README chưa đủ chi tiết setup | Thấp | Xem `README.md` | Chương 6 | Dùng nội dung file 13 để bổ sung |
| R-09 | Scope | Phase 2 được implement nhưng không có trong đề cương SE104 ban đầu | Thấp | Phân tích UC list vs CLAUDE.md | Cần trình bày rõ P1 là "yêu cầu cốt lõi", P2 là "mở rộng tự nguyện" | Định nghĩa rõ scope trong báo cáo |
| R-10 | Security | JWT refresh token lưu hash (bcrypt) trong DB — không có double-token rotation | Thấp | `backend/src/modules/auth/auth.service.ts` | Không ảnh hưởng báo cáo môn học | Ghi chú nếu cần: "security đủ cho phạm vi đồ án" |

---

## 2. Bằng chứng còn thiếu

| Hạng mục | Trạng thái | Thiếu gì | Khuyến nghị |
|---|---|---|---|
| Screenshots UI (30+ màn hình) | MISSING | Chưa có ảnh nào | Chụp theo checklist file 06 |
| E2E test results (log) | MISSING | Chưa có output thực tế | Chạy `npm run test:e2e` và paste output |
| ERD diagram (render) | MISSING | Có `.mmd` files nhưng chưa render thành hình | Mở draw.io → Extras → Edit Diagram → Mermaid → paste `ERD_03_Full_Schema.mmd` |
| Sequence diagrams | MISSING | Không có sơ đồ tuần tự | Vẽ ít nhất: login, visit-exam, payment, FEFO flow |
| Deployment diagram | MISSING | Không có sơ đồ triển khai | Vẽ: Browser → SPA → API → DB |
| Khảo sát khách hàng (narrative) | MISSING | Chỉ có bảng giả định | Nhóm viết narrative 1–2 trang |
| Gantt chart tiến độ | MISSING | Có git log nhưng chưa có chart | Tạo từ git history |
| Phase 2 test evidence (log/screenshot) | MISSING | Không có automated test P2 | Manual test + chụp màn hình |
| Lời cảm ơn | MISSING | Chưa có | Nhóm viết |
| Trang bìa | MISSING | Chưa có | Nhóm viết theo template khoa |
| @Roles() confirmation | MISSING | Chưa scan chi tiết từng method | Đọc từng controller, điền vào bảng 05 |

---

## 3. Những điều KHÔNG nên khai trong báo cáo

| Điều không nên khai | Lý do | Thực tế |
|---|---|---|
| "Hệ thống đã kiểm thử đầy đủ tự động" | Không đúng | Chỉ có 3 E2E files P1, không có unit test service layer |
| "Hệ thống đã deploy lên server/production" | Không có evidence | Chỉ chạy local development |
| "Hệ thống có Docker/CI-CD" | Không tìm thấy | Không có Dockerfile, không có .github/ |
| "Cả 4 thành viên commit đều nhau" | Git không confirm | Chỉ thấy 2 accounts trong git history |
| "Hệ thống đã test với khách hàng thực tế" | Không có evidence | Khách hàng giả định / phân tích nghiệp vụ |
| "9 enums" hoặc số sai | Số sai | Chính xác: **12 enums** |
| "API prefix là /api" | Sai | Chính xác: **`/api/v1`** |
| "Hệ thống sẵn sàng production" | Chưa đủ điều kiện | Thiếu Docker, CI/CD, HTTPS, load test |

---

## 4. Những điều CÓ THỂ khai tự tin

| Điều có thể khai | Bằng chứng |
|---|---|
| "Hệ thống có 37 database models, 12 enums đủ cho Phase 1 + Phase 2" | `backend/prisma/schema.prisma` — đếm chính xác |
| "Có 92 API endpoints (41 P1, 51 P2) với API prefix `/api/v1`" | Controller scan — đếm HTTP decorators |
| "E2E tests cover Phase 1 core flows: auth, clinic-flow (UC07–UC13), billing+catalog" | `backend/test/` — 3 files |
| "Frontend có 33 page files, 36 routes với RequireRole guard" | `frontend/src/app/router.tsx` |
| "Business rules enforce tại service layer, không ở controller" | `visits.service.ts`, `billing.service.ts`, `pharmacy.service.ts` |
| "Prisma transaction đảm bảo atomic cho: visit creation, payment, regulation activation, pharmacy dispense" | Service files — `prisma.$transaction()` calls |
| "RBAC 2 lớp: backend guards + frontend RequireRole/navigation" | `guards/`, `RequireRole.tsx`, `navigation.ts` |
| "Dark/light mode với localStorage persistence" | `frontend/src/lib/theme.ts`, `globals.css` |
| "8 demo accounts với 8 roles khác nhau" | `backend/prisma/seed.ts` |
| "3 database migrations: baseline, identity-access, phase2a-foundation" | `backend/prisma/migrations/` |

---

## 5. Khuyến nghị xử lý trước khi viết báo cáo

1. **Chạy `npm run test:e2e`** và copy toàn bộ output vào báo cáo Chương 5
2. **Chụp ≥30 screenshots** theo checklist file 06
3. **Render ERD** từ `docs/software-design-workspace/final-output/04_DIAGRAM_SOURCES/ERD_03_Full_Schema.mmd`
4. **Vẽ 4 sequence diagrams**: login flow, visit-exam flow, payment flow, FEFO dispense
5. **Xác nhận phân công nhóm** và viết narrative giải thích git history
6. **Viết narrative khảo sát** (1-2 trang) dựa trên bảng yêu cầu file 08
7. **Scan @Roles() từng controller** và điền vào bảng API inventory file 05
