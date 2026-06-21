# Prompt cho Claude Code — Audit phương pháp luận đầu-cuối + sửa LaTeX compile được ngay

> Copy toàn bộ khối dưới đây dán vào Claude Code (chạy tại thư mục gốc repo `4N_Clinic_Management_System`).

---

```text
Bạn là Senior Software Engineer + QA Lead + Technical Writer cho đồ án SE104 "4N Clinic Management System".

NHIỆM VỤ: Audit toàn bộ PHƯƠNG PHÁP LUẬN của dự án từ đầu đến cuối, đối chiếu với phần HIỆN THỰC thật trong code để đảm bảo đồng bộ, rồi đưa ra hướng dẫn sửa và TRỰC TIẾP sửa LaTeX sao cho biên dịch được ngay.

═══════════════════════════════════════════════
NGUYÊN TẮC BẤT BIẾN
═══════════════════════════════════════════════
1. CODEBASE LÀ NGUỒN SỰ THẬT. Không lấy báo cáo làm nguồn sự thật khi chưa đối chiếu code.
   Thứ tự ưu tiên nguồn: (1) code thật → (2) backend/prisma/schema.prisma + migrations →
   (3) controllers/services/DTO → (4) frontend routes/pages → (5) test files + test log →
   (6) README/Swagger/seed → (7) báo cáo LaTeX.
2. KHÔNG bịa: không thêm endpoint/model/role/test/màn hình/quy trình mà code không có.
   Mỗi khẳng định trong báo cáo phải truy được về file/dòng cụ thể.
3. Phân mức khẳng định: "đã hiện thực" (có code+API+UI), "hiện thực một phần",
   "đã thiết kế chưa hiện thực", "định hướng phát triển". Dùng đúng mức.
4. ĐÃ có sẵn 2 file audit tham chiếu: frontend-docs/CODEBASE_AUDIT.md và
   frontend-docs/REPORT_MISMATCHES.md. Đọc trước, kế thừa, cập nhật chứ không làm lại từ đầu.

═══════════════════════════════════════════════
PHẦN A — AUDIT PHƯƠNG PHÁP LUẬN ĐẦU–CUỐI
═══════════════════════════════════════════════
Kiểm tra tính nhất quán và tính trung thực của TỪNG giai đoạn phương pháp luận. Với mỗi mục:
ghi rõ "báo cáo nói gì" → "bằng chứng trong repo" → "khớp/lệch" → "đề xuất".

A1. Khảo sát & đặc tả yêu cầu (ch00_mo_dau, ch01_dac_ta_yeu_cau)
    - Có bằng chứng khảo sát khách hàng/phòng mạch không (phỏng vấn, survey, persona,
      user story, bảng yêu cầu)? Nếu chỉ là giả định thì phải ghi trung thực là "giả định
      nghiệp vụ", không tô thành "khảo sát thực địa".
    - Use case (UC1–UC20 Phase 1 + UC Phase 2) có ánh xạ đúng tới endpoint/màn hình thật không?

A2. Tổ chức nhóm & quy trình phát triển
    - Báo cáo mô tả mô hình gì (Agile/Scrum, Waterfall, hay lai "thác nước có lặp")?
    - Đối chiếu với bằng chứng thật trong repo: git log (số commit, nhịp commit, nhánh),
      .github/ISSUE_TEMPLATE, pull_request_template, PLAN.md, SPRINT_*, TASK_TRACKING_LOG.md,
      PROGRESS_LOG.md, các mốc ngày trong ch04. Mô hình mô tả có khớp dấu vết thật không?
    - Nếu dự án thực tế chạy kiểu "thiết kế trước (waterfall) cho schema/kiến trúc + lặp
      theo sprint (agile) khi implement module" thì phải mô tả đúng mô hình LAI đó, kèm
      dẫn chứng (ví dụ quy tắc "Design→Approve→Migration→Implement" trong CLAUDE.md, các
      MODE A/A.1/C trong docs/software-design-workspace). Không gán nhãn Scrum thuần nếu
      không có sprint backlog/standup/retro thực.

A3. Phân tích & thiết kế hệ thống (ch02) và phần mềm (ch03)
    - Sơ đồ kiến trúc (container/component/sequence), ERD, state machine có khớp code thật:
      37 models, 12 enums, 3 migrations, 92 endpoints nghiệp vụ, 8 role RBAC.
    - Quan hệ Visit–Examination–Invoice–Payment, Prescription–Drug, Lab/Inventory/Pharmacy
      trong sơ đồ có đúng schema.prisma không?

A4. Hiện thực (ch04)
    - 21 feature folders, 20 controller có route, số service files, 41/51 split endpoint:
      đếm lại từ code và xác nhận.
    - Business rules (BR) liệt kê trong báo cáo có thật trong service không (visits trùng
      ngày, quota/ngày, queueNumber, diagnosis bắt buộc khi complete, chỉ lập hóa đơn từ
      visit COMPLETED, không thanh toán vượt remaining, FEFO/expiry khi phát thuốc, lab
      state machine). Cái nào chỉ thiết kế mà chưa code → hạ mức khẳng định.

A5. Kiểm thử (ch05)
    - 7 file e2e, ~215 case tĩnh + it.each ≈ 220. Phân loại hộp đen/xám/trắng có đúng không.
    - Bổ sung các phương pháp ĐÃ áp dụng nhưng báo cáo chưa nêu (suy ra từ code, kèm dẫn
      chứng file): seed fixtures, negative RBAC/403, state-machine testing, transaction
      testing, DTO boundary validation (class-validator), price snapshot testing.
    - Nêu trung thực phần còn thiếu: unit hộp trắng (mới có billing.service.spec.ts mẫu),
      Vitest frontend (mẫu), DB constraint test (mẫu), CI (ci.yml mẫu) — đều ở mức scaffold,
      cần chạy thật. Con số 220/220 phải ghi "theo log nhóm", kèm screenshot/log khi nộp.

A6. Triển khai/vận hành (ch06) & Kết luận (ch06/ch07)
    - Xác nhận: KHÔNG có Dockerfile/compose/production của dự án; CI chỉ mới có ci.yml mẫu.
      Báo cáo không được khẳng định đã có production/CI/CD hoàn chỉnh.
    - Rà mọi con số ở ch07/ch06 cho khớp ch00/ch03/ch04/ch05.

═══════════════════════════════════════════════
PHẦN B — KIỂM TRA ĐỒNG BỘ (CROSS-CONSISTENCY)
═══════════════════════════════════════════════
Lập bảng "claim vs codebase truth vs các chương khác". Truy ít nhất các mâu thuẫn đã biết
trong REPORT_MISMATCHES.md và tự tìm thêm:
- Số e2e files: ch07 ghi "3" trong khi ch00/05/06 ghi "7" → phải thống nhất = 7.
- Service files: báo cáo "21" vs code "24" → thống nhất (ghi rõ 21 nghiệp vụ + 3 hạ tầng).
- "5 roles chính" (ch05) vs "8 vai trò" (ch01/06/07) → làm rõ 5 core + 3 Phase 2.
- Enum PaymentMethod: phải là CASH/TRANSFER/CARD (KHÔNG BANK_TRANSFER); đính chính cả
  database/schema.sql nếu lệch với Prisma.
- FEFO: diễn đạt "ưu tiên lô hết hạn sớm + chặn lô hết hạn", KHÔNG nói auto phân bổ.
- Trạng thái CI: sau khi thêm ci.yml, ch05 và ch06 phải mô tả thống nhất (scaffold).
Mọi con số xuất hiện ở nhiều chương (models/enums/migrations/endpoints/roles/tests) phải
GIỐNG NHAU tuyệt đối giữa các chương.

═══════════════════════════════════════════════
PHẦN C — SỬA LATEX COMPILE ĐƯỢC NGAY
═══════════════════════════════════════════════
Thư mục báo cáo: "se104 (1)/". Entry: main.tex. Engine: pdfLaTeX với inputenc utf8 +
babel vietnamese (cần gói vntex/T5). Có sẵn lệnh custom: \code{}, \ReportFigure{}{}{},
\WideFigure, \path{}; dùng listings (style "code"), tabularx, longtable, float [H].

Yêu cầu khi sửa:
1. Sửa TRỰC TIẾP các file .tex theo kết luận Phần A/B (ưu tiên: ch07 "3→7"; đồng bộ số
   service; chú thích 5↔8 role; enum PaymentMethod; FEFO; CI ch06). Mỗi lần sửa nêu rõ
   file + dòng + lý do, gắn với bằng chứng code.
2. RÀNG BUỘC để compile được:
   - Nội dung TRONG \begin{lstlisting}...\end{lstlisting} chỉ dùng ASCII (không dấu tiếng
     Việt, không ký tự ₫ — em dash; nếu cần thì chú thích bằng ASCII).
   - Mọi môi trường begin/end phải cân bằng (table, tabularx, longtable, lstlisting,
     itemize). Mọi ký tự đặc biệt phải escape (& % _ # $ ^ ~ \\).
   - Không tham chiếu figure không tồn tại trong "se104 (1)/figures/"; nếu cần hình mới,
     hoặc tạo placeholder hợp lệ hoặc bỏ \ReportFigure đó.
   - Giữ nguyên phong cách bảng/lệnh hiện có; không đổi preamble trừ khi bắt buộc.
3. BIÊN DỊCH THẬT để xác minh:
   - Chạy: cd "se104 (1)" && latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex
   - Nếu thiếu gói (ví dụ t5enc.def/vntex) trong môi trường: thử cài qua tlmgr; nếu không
     được, ghi rõ đây là giới hạn môi trường và xác minh cú pháp chương đã sửa bằng cách
     biên dịch riêng từng chương với preamble tối thiểu (T1 + lmodern) để bắt lỗi cấu trúc.
   - Lặp sửa cho đến khi log không còn Error; báo cáo số trang PDF và mọi cảnh báo còn lại.

═══════════════════════════════════════════════
ĐẦU RA BẮT BUỘC
═══════════════════════════════════════════════
1. frontend-docs/METHODOLOGY_AUDIT.md — kết quả Phần A (theo từng giai đoạn A1–A6), kèm
   dẫn chứng file/dòng và mức khẳng định.
2. Cập nhật frontend-docs/REPORT_MISMATCHES.md — bảng đối chiếu đầy đủ + mọi mâu thuẫn mới.
3. Danh sách thay đổi LaTeX theo từng chương (file, dòng, trước→sau, lý do).
4. Log biên dịch: lệnh đã chạy, kết quả (PASS/biên dịch ra PDF bao nhiêu trang, hoặc lỗi
   môi trường nếu có) và cách đã xác minh cú pháp.
5. Mục "Phương pháp đã áp dụng nhưng chưa nêu" để bổ sung vào ch05.

Thực hiện theo thứ tự: đọc 2 file audit có sẵn → Phần A → Phần B → sửa LaTeX (Phần C) →
biên dịch xác minh → xuất đầu ra. KHÔNG sửa LaTeX trước khi hoàn tất đối chiếu A+B.
```

---

## Ghi chú khi dùng

- Chạy prompt này tại thư mục gốc repo để Claude Code thấy cả `backend/`, `frontend/`, `se104 (1)/` và `frontend-docs/`.
- Nếu máy bạn có TeX Live đầy đủ (vntex/T5) hoặc dùng Overleaf, bước biên dịch sẽ chạy trọn vẹn; nếu môi trường thiếu gói tiếng Việt, Claude Code sẽ xác minh cú pháp và báo rõ giới hạn.
- Bạn có thể tách làm 2 lượt nếu muốn kiểm soát: lượt 1 chỉ Phần A+B (audit, chưa sửa); lượt 2 mới Phần C (sửa + compile).
