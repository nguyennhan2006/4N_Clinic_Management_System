# REPORT_MISMATCHES.md — Đối chiếu báo cáo vs codebase

> Đối chiếu nội dung báo cáo LaTeX (`se104 (1)/chapters/*.tex`) với `CODEBASE_AUDIT.md`.
> Mức độ: ✅ khớp · ⚠️ lệch nhỏ/cần làm rõ · ❌ sai/mâu thuẫn cần sửa.

## A. Bảng đối chiếu claim vs truth

| Mục kiểm tra | Báo cáo đang nói | Codebase thật | Khớp | Cần sửa |
|---|---|---|---|---|
| Roles | 8 vai trò (ch01, ch06, ch07); "5 roles chính" (ch05) | 8 role thật, đều enforce trong `@Roles` | ✅ / ⚠️ | Làm rõ ở ch05: 5 core + 3 Phase 2, tránh hiểu nhầm chỉ có 5 |
| Models | 37 models | 37 | ✅ | Giữ |
| Enums | 12 enums | 12 | ✅ | Giữ |
| Migrations | 3 migrations | 3 | ✅ | Giữ |
| Feature folders | 21 | 21 | ✅ | Giữ |
| Controllers có route | 20 | 20 (+2 boilerplate) | ✅ | Giữ |
| Service files | 21 | **24** | ⚠️ | Sửa 21 → 24 (hoặc ghi "21 service nghiệp vụ + 3 service hạ tầng") |
| Endpoints | 92 (41 P1 + 51 P2) | 92 nghiệp vụ (94 gồm boilerplate) | ✅ | Giữ; kiểm lại split 41/51 nếu cần |
| Enum PaymentMethod | (ngầm) BANK_TRANSFER xuất hiện trong listing test mẫu | Prisma: `CASH/TRANSFER/CARD` | ❌ | Đã sửa listing ch05 và file test → `TRANSFER` |
| Số e2e files | 7 (ch00, ch05, ch06) **nhưng** "3 e2e test files có ý nghĩa" (ch07) | 7 file | ❌ | Sửa ch07: 7 file (không phải 3) |
| Test result | 220/220 pass | 215 case tĩnh + it.each ≈ 220, **chưa chạy lại được trong audit** | ⚠️ | Giữ cách diễn đạt "theo log nhóm cung cấp"; bắt buộc kèm screenshot/log |
| Phase 2 modules | Đã hiện thực (lab, inventory, pharmacy, queue, appointments, vitals, services, organization, audit) | Có controller + service + frontend | ✅ | Giữ |
| FEFO | "cấp phát theo FEFO" | Chặn lô hết hạn + liệt kê lô theo expiry asc; lot chọn explicit, KHÔNG auto-allocate | ⚠️ | Diễn đạt lại: "FEFO có hướng dẫn — ưu tiên lô hết hạn sớm + chặn lô hết hạn", không khẳng định auto phân bổ |
| Frontend pages | Login, Patients, Visits, Examinations, Invoices, Reports, Appointments, Queue, Lab, Inventory, Pharmacy... | Đều có (Lab/Pharmacy/Vitals là worklist/section, không đặt tên *Page) | ✅ | Giữ |
| Docker/CI/CD/production | ch06: "chưa có Docker/CI/CD/production" | Đúng tại thời điểm trước audit; **nay đã thêm `ci.yml`** | ⚠️ | Đồng bộ: ch06 nên ghi "CI mới ở mức scaffold (`ci.yml`), chưa có Docker/production" để khớp ch05 |

## B. Mâu thuẫn nội bộ trong báo cáo (ưu tiên sửa)

1. **❌ Số e2e files: 3 vs 7.** `07_ket_luan.tex` dòng 16 viết "3 e2e test files có ý nghĩa", trong khi `00_mo_dau.tex`, `05_kiem_thu.tex`, `06_ket_luan.tex` đều nói 7 file. → Sửa ch07 thành 7 file (đúng với code). Nếu ý ban đầu là "3 file lõi Phase 1", phải viết rõ "3 file cho luồng lõi Phase 1 trong tổng số 7 file".

2. **⚠️ "5 roles" vs "8 roles".** `05_kiem_thu.tex` dòng 179 ("5 roles chính") dễ bị hiểu là hệ thống chỉ có 5 role. → Thêm chú thích: kiểm thử UI tập trung 5 role core Phase 1; hệ thống có 8 role (RBAC enforce đủ 8).

3. **⚠️ Trạng thái CI sau khi thêm `ci.yml`.** ch05 (bản đã mở rộng) nói "đã bổ sung CI", ch06 vẫn nói "chưa có CI/CD". → Đồng bộ hai chương.

## C. Đề xuất sửa theo từng chương

- **ch00 (Mở đầu):** giữ nguyên số liệu; chỉ sửa "21 service files" → "24" cho nhất quán (hoặc tách rõ).
- **ch01 (Đặc tả):** ✅ 8 vai trò đúng. Không đổi.
- **ch03 (Thiết kế phần mềm):** ✅ 37 models / 12 enums / 92 endpoints đúng. Có thể thêm 1 câu: enum PaymentMethod = CASH/TRANSFER/CARD (đính chính so với `schema.sql`).
- **ch04 (Hiện thực):** sửa "21 service files" → "24" (hoặc ghi rõ 21 nghiệp vụ). ✅ 92/41/51 giữ.
- **ch05 (Kiểm thử):** đã sửa enum trong listing; thêm chú thích 5↔8 role; diễn đạt lại FEFO; đảm bảo khớp ch06 về CI.
- **ch06 (Triển khai):** cập nhật mục CI/CD: "đã thêm `ci.yml` ở mức scaffold; chưa có Docker/production" — thay vì "chưa có CI/CD" tuyệt đối.
- **ch07 (Kết luận):** ❌ sửa "3 e2e test files" → "7 e2e test files"; rà lại để mọi con số trùng với ch00/ch06.

## D. Phương pháp kiểm thử ĐÃ thực sự áp dụng nhưng chưa nêu (suy ra từ code)

Báo cáo có thể bổ sung các phương pháp sau vì code chứng minh chúng đã được dùng thật:

1. **Test fixtures qua seed dữ liệu** (`prisma/seed.ts`): tạo 8 user/role, danh mục bệnh/thuốc, dữ liệu nền — đây là chiến lược chuẩn bị dữ liệu kiểm thử (test data setup) cho e2e.
2. **Kiểm thử phân quyền tiêu cực (negative RBAC / 403)**: `auth.e2e-spec.ts` và các e2e khác kiểm tra truy cập trái role → 401/403. Đây là security/authorization testing đã áp dụng.
3. **Kiểm thử máy trạng thái (state-machine testing)**: queue (WAITING→CALLED→IN_SERVICE→DONE), lab (ORDERED→SAMPLE_COLLECTED→RESULT_ENTERED→VERIFIED), service order, appointment — e2e xác nhận chuyển trạng thái hợp lệ/không hợp lệ.
4. **Kiểm thử tính nguyên tử/giao dịch (transaction testing)**: tạo visit + queueNumber và ghi payment dùng `$transaction`; e2e xác nhận không tạo trùng số thứ tự, không double-pay — gray-box.
5. **Kiểm thử biên qua DTO validation (class-validator + ValidationPipe)**: các DTO có `@Min`, `@IsEnum`, `@IsNotEmpty`... e2e gửi payload sai để nhận 400 — boundary/negative input testing.
6. **Kiểm thử snapshot giá**: PrescriptionItem/InvoiceItem lưu `unitPrice`/`priceSnapshot`; test xác nhận giá lịch sử không đổi khi danh mục đổi giá.

Các phương pháp này nên được đưa vào mục "Chiến lược kiểm thử" của ch05 dưới dạng đã áp dụng, kèm dẫn chứng file, thay vì chỉ liệt kê hộp đen/hộp xám chung chung.

## E. Việc đã thực hiện trong vòng audit này

**Audit lần 1 (trước đây):**
- Đã sửa `backend/src/modules/billing/billing.service.spec.ts` và listing ch05: `BANK_TRANSFER` → `TRANSFER` (khớp enum thật).
- Đã tạo `CODEBASE_AUDIT.md` (nguồn sự thật) và file này.
- Đã sửa ch00/ch05/ch06_ket_luan: "3 e2e" → "7 e2e"; hộp đen/xám/trắng table; FEFO diễn đạt lại.

**Audit lần 2 (13/06/2026 — bổ sung unit tests + methodology audit):**
- Tạo `frontend-docs/METHODOLOGY_AUDIT.md` — audit đầu-cuối A1–A6.
- Viết và chạy thật 3 unit test files hộp trắng mới:
  - `backend/src/modules/visits/visits.service.spec.ts` — 18 test
  - `backend/src/modules/examinations/examinations.service.spec.ts` — 25 test
  - `backend/src/modules/patients/patients.service.spec.ts` — 17 test
- Kết quả chạy: **60/60 pass** (4 file hộp trắng, không cần DB) — ngày 13/06/2026.
- Xác nhận service files = **24** (21 nghiệp vụ + prisma.service + app.service + health.service).
- Xác nhận CI (`ci.yml`) đã có ở mức scaffold — ch06 cần cập nhật "chưa có CI" → "CI scaffold".

## F. Mâu thuẫn mới phát hiện trong audit lần 2

| # | Mâu thuẫn | File nguồn | Hiện trạng |
|---|---|---|---|
| F1 | "21 service files" vs thực tế 24 | ch00 dòng 68, ch04 | ✅ Đã sửa trong cả hai chương |
| F2 | Named routes "32" vs code thực "36" | ch04 | ✅ Đã đồng bộ (36 routes) |
| F3 | ch06_trien_khai nói "chưa có CI/CD" | ch06_trien_khai.tex | ✅ Đã cập nhật: "CI scaffold, chưa có Docker/production" |
| F4 | `database/schema.sql` dùng `BANK_TRANSFER` vs Prisma dùng `TRANSFER` | `database/schema.sql` | ❌ Tài liệu phụ lệch Prisma; Prisma là nguồn chốt |
| F5 | Unit tests: báo cáo chưa có mục hộp trắng đầy đủ | ch05 | ✅ Đã thêm 4 file thật — xem G. bên dưới để biết số thật |

## G. Mâu thuẫn phát hiện trong audit lần 3 (15/06/2026)

| # | Mâu thuẫn | File nguồn | Hiện trạng |
|---|---|---|---|
| G1 | `` ```latex `` code fence bên trong ch04 (dòng 11) | `04_hien_thuc.tex` | ✅ Đã xóa |
| G2 | `` ``` `` code fence sót bên trong ch04 (dòng 72) | `04_hien_thuc.tex` | ✅ Đã xóa |
| G3 | `` ``` `` code fence sót bên trong ch05 (dòng 225) | `05_kiem_thu.tex` | ✅ Đã xóa |
| G4 | "Cần xác minh" trong bảng unit tests ch05 (visits/examinations/patients) | `05_kiem_thu.tex` dòng 20–26 | ✅ Đã thay bằng số đếm thật: 13, 24, 13 |
| G5 | Billing unit tests: bảng ch05 ghi "8" nhưng thực tế 9 tests | `05_kiem_thu.tex` dòng 18 | ✅ Đã sửa thành 9 |
| G6 | Tổng unit tests: METHODOLOGY_AUDIT ghi "60/60" nhưng thực tế 9+13+24+13=59 | METHODOLOGY_AUDIT.md, ch05 tổng | ✅ Đã sửa ch05 tổng thành 59; METHODOLOGY_AUDIT cần ghi chú |
| G7 | METHODOLOGY_AUDIT A5 bảng ghi billing=8, visits=18, examinations=25, patients=17 | METHODOLOGY_AUDIT.md | ⚠️ Số cũ từ audit lần 2; thực tế: 9/13/24/13 (đếm trực tiếp 15/06/2026) |
