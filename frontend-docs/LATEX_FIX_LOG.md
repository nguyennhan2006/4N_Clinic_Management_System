# LATEX_FIX_LOG.md — Log sửa đổi LaTeX

> Ngày: 15/06/2026
> Auditor: Claude Code
> Phương pháp: đọc từng file .tex, đối chiếu với codebase, sửa lỗi có bằng chứng.

---

## File đã đọc

| File | Đã đọc | Lỗi tìm thấy |
|---|---|---|
| `se104 (2)/main.tex` | Có | Không có lỗi nội dung; compiler = pdfLaTeX |
| `se104 (2)/chapters/00_mo_dau.tex` | Có | Không có lỗi (số liệu đã đúng từ audit trước) |
| `se104 (2)/chapters/04_hien_thuc.tex` | Có | 2 lỗi code fence Markdown |
| `se104 (2)/chapters/05_kiem_thu.tex` | Có | 1 lỗi code fence + 3 ô "Cần xác minh" + số billing sai |
| `se104 (2)/chapters/06_trien_khai_van_hanh.tex` | Có | Không có lỗi |
| `se104 (2)/chapters/07_ket_luan.tex` | Có | Không có lỗi (đã sửa từ audit trước) |

---

## Sửa đổi đã thực hiện (audit lần 3, 15/06/2026)

### FIX-001 — Code fence Markdown trong ch04 (dòng 11)

- **File:** `se104 (2)/chapters/04_hien_thuc.tex`
- **Dòng gốc:** 11
- **Từ:** `` ```latex `` (trên một dòng riêng trước `\section{Cơ sở kiểm chứng codebase}`)
- **Thành:** (xóa hoàn toàn dòng đó)
- **Lý do:** Ký tự `` ``` `` là Markdown code fence, không phải LaTeX; sẽ gây lỗi compilation với pdfLaTeX hoặc xelatex.

### FIX-002 — Code fence Markdown trong ch04 (dòng 72)

- **File:** `se104 (2)/chapters/04_hien_thuc.tex`
- **Dòng gốc:** 72
- **Từ:** `` ``` `` (dòng riêng sau `\end{longtable}` trong mục "Quy trình hiện thực theo use case")
- **Thành:** (xóa hoàn toàn dòng đó)
- **Lý do:** Là closing fence của block Markdown sót lại không đúng ngữ cảnh LaTeX.

### FIX-003 — Code fence Markdown trong ch05 (dòng 225)

- **File:** `se104 (2)/chapters/05_kiem_thu.tex`
- **Dòng gốc:** 225
- **Từ:** `` ``` `` (dòng riêng sau đoạn văn trong mục Kết quả kiểm thử tự động)
- **Thành:** (xóa hoàn toàn dòng đó)
- **Lý do:** Là code fence sót; không có `` ```latex `` hay `` ```text `` mở tương ứng ở trên, gây lỗi LaTeX.

### FIX-004 — "Cần xác minh" trong bảng unit tests ch05 (dòng 20–24)

- **File:** `se104 (2)/chapters/05_kiem_thu.tex`
- **Dòng gốc:** 20, 22, 24
- **Từ:**
  - visits: `Cần xác minh`
  - examinations: `Cần xác minh`
  - patients: `Cần xác minh`
  - tổng: `60 theo log hoặc cập nhật theo log mới nhất`
  - ghi chú tổng: `Cần đối chiếu lại với kết quả npm test.`
- **Thành:**
  - visits: `13`
  - examinations: `24`
  - patients: `13`
  - tổng: `59`
  - ghi chú tổng: `Đã đếm trực tiếp từ mã nguồn; tất cả pass khi chạy npm test không cần database.`
- **Lý do/Bằng chứng:**
  - `visits.service.spec.ts`: đếm trực tiếp bằng Grep → **13** instances `it(`
  - `examinations.service.spec.ts`: đếm → **24** instances
  - `patients.service.spec.ts`: đếm → **13** instances
  - `billing.service.spec.ts`: đếm → **9** instances (xem FIX-005)
  - Tổng = 9 + 13 + 24 + 13 = **59** (không phải 60)

### FIX-005 — Số billing unit tests: 8 → 9

- **File:** `se104 (2)/chapters/05_kiem_thu.tex`
- **Dòng gốc:** 18
- **Từ:** `\code{billing.service.spec.ts} & 8 &`
- **Thành:** `\code{billing.service.spec.ts} & 9 &` (cũng mở rộng mô tả: thêm "404 invoice/visit không tồn tại")
- **Lý do:** Đếm trực tiếp: billing.service.spec.ts có 9 `it(` block (7 trong describe createPayment + 2 ngoài cho createInvoice).

---

## Kết quả build LaTeX

- `pdflatex`, `xelatex`, `latexmk`: **KHÔNG CÓ** trong môi trường hiện tại (Windows, không cài TeX)
- Build PDF chưa chạy được — nhóm cần cài TeX Live hoặc MiKTeX và chạy: `pdflatex main.tex` (2 lần) hoặc `latexmk -pdf main.tex`
- Các lỗi cần kiểm tra sau khi cài TeX và build:
  - Missing figures: `figures/ch00-overview/process-overview.pdf`, `figures/ch05-testing/testing-strategy.pdf`, `figures/ch06-deployment/local-deployment.pdf`, `figures/screenshots/dashboard-admin.png`, `figures/screenshots/dashboard-doctor.png`
  - Các `\ReportFigure` references cần có file hình thật

---

---

## Sửa đổi đã thực hiện (audit lần 4, 15/06/2026 — Chương 1 rewrite)

### FIX-006 — Viết lại hoàn toàn ch01 (01_dac_ta_yeu_cau.tex)

- **File:** `se104 (2)/chapters/01_dac_ta_yeu_cau.tex`
- **Lý do:** Chương 1 cũ thiếu nhiều mục quan trọng: không có bảng BR, không có đặc tả UC chi tiết dạng tabularx, AC chưa có format Given/When/Then, ma trận truy vết quá rút gọn (8 dòng gộp nhóm), thiếu bảng giả định, thiếu quy trình nghiệp vụ, thiếu NFR có ID.
- **Phạm vi thay đổi:**
  - Thêm 15 sections (từ 9 sections cũ)
  - Bổ sung bảng giả định A1--A7
  - Mở rộng bảng REQ-01--REQ-30 thêm cột Trạng thái (từ audit codebase)
  - Thêm bảng NFR-01--NFR-08 với cột Phương pháp kiểm chứng
  - Thêm longtable BR-01--BR-29 đầy đủ
  - Thêm danh sách UC01--UC30 đầy đủ
  - Thêm 20 bảng đặc tả UC chi tiết (tabularx) cho UC quan trọng + compact tables cho UC đơn giản
  - Mở rộng AC: 17 → 26 AC với format Given/When/Then
  - Ma trận truy vết: 8 dòng gộp → 30 dòng đầy đủ REQ-01--REQ-30
  - Thêm 9 demo (từ 4 demo cũ)
  - Thêm 2 luồng quy trình nghiệp vụ (Phase 1 + Phase 2)
  - Viết lại kết luận chương
- **LaTeX validity:** Chỉ dùng packages đã có trong main.tex (longtable, tabularx, tabular, float, array); không dùng ký tự Markdown; escape đúng các ký tự đặc biệt; dùng `\verb|prisma.$transaction()|` cho ký tự `$`.
- **Số liệu:** Tất cả số liệu lấy từ CODEBASE_AUDIT.md (audit 15/06/2026); không phóng đại; trạng thái BR ghi trung thực (CONFIRMED/PARTIAL/NEED\_VERIFICATION).

---

## Các điểm CHƯA sửa (cần bằng chứng thêm hoặc quyết định nhóm)

| # | Điểm | Lý do chưa sửa |
|---|---|---|
| 1 | `database/schema.sql` dùng `BANK_TRANSFER` | File tài liệu phụ, không ảnh hưởng compilation; nhóm cần quyết định có sync không |
| 2 | METHODOLOGY_AUDIT.md bảng A5 ghi số cũ (billing=8, visits=18, examinations=25, patients=17) | File không được include vào LaTeX; ghi chú trong REPORT_MISMATCHES.md đã đủ |
| 3 | `phase2-clinical -integration.e2e-spec.ts` (có khoảng trắng trong tên) trong ch05 | Cần xác minh tên file thật; nếu đúng là `phase2-clinical-integration.e2e-spec.ts` thì `\path{}` sẽ gây lỗi |
