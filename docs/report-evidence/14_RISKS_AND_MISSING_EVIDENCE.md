# 14 — Rủi ro và Bằng chứng còn thiếu

---

## 1. Bảng Rủi ro tổng hợp

| Risk ID | Khu vực | Mô tả rủi ro | Mức độ | Bằng chứng | Ảnh hưởng đến báo cáo | Khuyến nghị xử lý |
|---|---|---|---|---|---|---|
| R-01 | Testing | Chỉ có E2E tests cho Phase 1, không có unit tests đầy đủ, không có tests cho Phase 2 | Trung bình | `backend/test/` — 3 files, `backend/src/*.spec.ts` — 1 file boilerplate | Chương 5 cần trình bày trung thực | Viết manual test report cho Phase 2; không khai là đã test tự động đủ |
| R-02 | Deployment | Không có Docker, docker-compose, CI/CD pipeline | Thấp | Không có `Dockerfile`, `.github/workflows/` | Chương 6 phải trình bày triển khai local | Ghi rõ "triển khai môi trường development local" |
| R-03 | Team | Git log chỉ thấy 3 contributor thay vì 4 | Thấp | `git shortlog` — 3 tài khoản | Chương quản lý nhóm | Nhóm bổ sung giải thích pair-programming hoặc review không commit |
| R-04 | RBAC | Một số endpoint có thể thiếu @Roles() cụ thể — chỉ có JwtGuard chung | Thấp | Cần đọc kỹ toàn bộ controllers | An toàn ở mức Auth, nhưng RBAC chi tiết có thể không đủ | NEED_MANUAL_CONFIRMATION: scan lại từng controller |
| R-05 | Business Logic | POST /examinations/:id/complete không check pending lab orders | Trung bình | `examinations.service.ts:269` — không có check ServiceOrder pending | Chương 4 — ghi là limitation | Ghi rõ: "trong scope hiện tại, bác sĩ tự quyết định hoàn tất" |
| R-06 | Data | Seed data comprehensive nhưng chưa chắc cover mọi flow demo cần cho báo cáo | Thấp | `backend/prisma/seed.ts` | Screenshots có thể thiếu data | Nhóm seed thêm data nếu cần screenshot cụ thể |
| R-07 | Frontend | Một số Phase 2 frontend component được embed trong trang khác (e.g., VitalSignSection trong ExaminationPage) — không có route riêng | Thấp | `frontend/src/features/services/ServiceOrderSection.tsx` | Chương thiết kế giao diện | Trình bày như "component embedded trong examination flow" |
| R-08 | Documentation | README.md chưa đủ hướng dẫn cài đặt đầy đủ | Thấp | Xem README tại root | Chương 6 | Dùng nội dung từ file 13 này để bổ sung |
| R-09 | Scope Creep | Phase 2 đã implement nhưng không có trong đề cương SE104 ban đầu | Thấp | Phân tích UC list vs. CLAUDE.md | Cần trình bày rõ P1 là "yêu cầu cốt lõi", P2 là "mở rộng tự nguyện" | Định nghĩa rõ scope trong báo cáo |
| R-10 | Security | JWT refresh token lưu hash, không rotate double-token | Thấp | `auth.service.ts` | Không ảnh hưởng báo cáo môn học | Ghi chú như limitation nếu cần |

---

## 2. Bảng Bằng chứng còn thiếu

| Hạng mục | Trạng thái | Thiếu gì | Khuyến nghị |
|---|---|---|---|
| Screenshots UI (28 màn hình) | MISSING | Chưa có ảnh nào | Nhóm chụp theo checklist file 06 |
| E2E test results (log) | MISSING | Chưa có log chạy test | Chạy `npm run test:e2e` và copy output |
| ERD diagram (visual) | MISSING | Có .mmd file nhưng chưa render | Mở draw.io, paste file ERD_03_Full_Schema.mmd |
| Sequence diagrams | MISSING | Không có sơ đồ tuần tự | Vẽ ít nhất: login flow, visit-exam flow, payment flow |
| Deployment diagram | MISSING | Không có sơ đồ triển khai | Vẽ: Browser → SPA → API → DB |
| Khảo sát khách hàng (text) | MISSING | Chỉ có table giả định | Nhóm viết narrative 1–2 trang |
| Gantt chart tiến độ | MISSING | Có git log nhưng chưa có chart | Tạo từ git history |
| Phase 2 test evidence | MISSING | Không có test tự động P2 | Manual test + chụp màn hình |
| Lời cảm ơn | MISSING | Chưa có | Nhóm viết |
| Trang bìa | MISSING | Chưa có | Nhóm viết theo template HCMUS |

---

## 3. Những điều KHÔNG nên khai trong báo cáo

| Điều không nên khai | Lý do | Thực tế |
|---|---|---|
| "Hệ thống đã kiểm thử đầy đủ tự động" | Không đúng sự thật | Chỉ có E2E cho Phase 1, không có unit test đủ |
| "Hệ thống đã deploy lên server" | Không có evidence | Chỉ chạy local |
| "Hệ thống có CI/CD" | Không có | Không có pipeline |
| "Cả 4 thành viên đều commit đều nhau" | Git chỉ thấy 3 | Giải thích bằng cách khác |
| "Hệ thống đã test với khách hàng thực tế" | Không có evidence | Khách hàng giả định |

---

## 4. Những điều CÓ THỂ khai tự tin

| Điều có thể khai | Bằng chứng |
|---|---|
| "Hệ thống có 37 database models, 9 enums, đủ cho Phase 1+2" | `schema.prisma` |
| "Có ~85 API endpoints được bảo vệ bởi JWT Guard" | Controller files |
| "E2E test cho Phase 1 covering UC-07→UC-11, auth flow, billing flow" | `backend/test/` |
| "Frontend có 30+ trang, đầy đủ cho 20 UC Phase 1 và 10 UC Phase 2" | `frontend/src/features/` |
| "Business rules enforce tại service layer, không ở controller" | Service files |
| "Prisma transaction đảm bảo tính atomic cho Visit creation, Payment, Regulation activation" | Service files |
| "RBAC enforce tại backend — frontend chỉ hide UI, không thay thế security" | Guards + controllers |
| "Dark/light mode toggle với localStorage persistence" | `lib/theme.ts`, `globals.css` |
