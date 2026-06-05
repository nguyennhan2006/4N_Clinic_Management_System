# Validation Report — Sequence Diagrams
## 4N Clinic Management System — SE104
**Ngày:** 2026-06-04 · **Phạm vi:** chỉ tài liệu/diagram (không sửa code/schema/migration)

---

## 1. Danh sách file .mmd đã tạo (15 FULL + 16 A4 = 31)

Thư mục: `docs/software-design-workspace/final-output/04_DIAGRAM_SOURCES/`

**Hai bản mỗi diagram:** `SEQ_*.mmd` = FULL (kỹ thuật, review) · `SEQ_*_A4_REPORT.mmd` = A4 (chèn DOCX,
nền trắng + init theme, alias/label rút gọn, giữ nguyên logic + happy path + nhánh lỗi chính). Lab P2-03 tách
`_A4_REPORT_PART1` (order→collect→result) + `_A4_REPORT_PART2` (review). FULL P2-03 vẫn là 1 file.

**Bảng dưới là 15 bản FULL** (mỗi dòng có A4 tương ứng):

| File | Trust | Nguồn đối chiếu |
|---|---|---|
| SEQ_P1_01_CreateVisit.mmd | AS-BUILT | visits.service.ts::create |
| SEQ_P1_02_OpenExamination.mmd | AS-BUILT | visits.service.ts::openExamination |
| SEQ_P1_03_UpdateExamination.mmd | AS-BUILT | examinations.service.ts::update |
| SEQ_P1_04_UpsertPrescription.mmd | AS-BUILT | examinations.service.ts::upsertPrescription |
| SEQ_P1_05_CompleteExamination.mmd | AS-BUILT | examinations.service.ts::complete |
| SEQ_P1_06_CreateInvoice.mmd | AS-BUILT | billing.service.ts::createInvoiceFromVisit |
| SEQ_P1_07_RecordPayment.mmd | AS-BUILT | billing.service.ts::createPayment |
| SEQ_P1_08_Login.mmd | AS-BUILT | auth.service.ts::login |
| SEQ_P1_09_ActivateRegulation.mmd | AS-BUILT | regulations.service.ts::activate |
| SEQ_P1_OV_DoctorToCashierOverview.mmd | AS-BUILT (overview) | multi |
| SEQ_P2_01_AppointmentCheckinQueue.mmd | PLANNED | MODE_C_CONTEXT §3.7/§3.8 |
| SEQ_P2_02_DispenseFEFO.mmd | PLANNED | MODE_C_CONTEXT BR-P2-09/10/11 |
| SEQ_P2_03_LabOrderResultReview.mmd | PLANNED | MODE_C_CONTEXT BR-P2-06/07/08 |
| SEQ_P2_04_DispenseReversal.mmd | PLANNED | MODE_C_CONTEXT BR-P2-12 |
| SEQ_P2_05_MultiSourceInvoice.mmd | PLANNED | MODE_C_CONTEXT BR-P2-13/14/15 |

---

## 2. Kết quả render

**Trạng thái: THẤT BẠI trong môi trường này — KHÔNG có ảnh PNG/SVG được sinh.**

| Bước | Kết quả |
|---|---|
| node v24.11.0 | ✅ có |
| npx | ✅ có |
| `mmdc` (mermaid-cli global) | ❌ không cài |
| `npx @mermaid-js/mermaid-cli` (default) | ❌ exit 1, không sinh file |
| + puppeteer config trỏ Chrome (`--no-sandbox`) | ❌ exit 1, không sinh file |
| chạy qua bash | ❌ exit 1 |
| pandoc (cho .docx) | ❌ không cài |

**Nguyên nhân:** mermaid-cli cần headless browser (puppeteer/Chromium). Quá trình tải package kèm cảnh báo
`EPERM rmdir` (khả năng do Defender/antivirus khoá thư mục `npm-cache`), và lần chạy render không khởi động được
browser trong sandbox (kể cả khi trỏ sang Chrome hệ thống). Lỗi bị nuốt, chỉ trả exit code 1.

**Đã thử (genuine attempts), KHÔNG im lặng bỏ qua:** 3 cách render khác nhau như bảng trên.

### Cách render thủ công (khuyến nghị — xem thêm `04_DIAGRAM_SOURCES/GUIDE_Add_Diagrams_to_Document.md`)
1. **Mermaid Live** — https://mermaid.live → paste nội dung từng `SEQ_*.mmd` → Export PNG/SVG vào `04_DIAGRAM_SOURCES/rendered/`.
2. **VS Code** — cài extension `bierner.markdown-mermaid` hoặc `Mermaid Markdown` → preview → export.
3. **CLI khi máy có Chromium ổn định:**
   ```powershell
   npx -y @mermaid-js/mermaid-cli -i SEQ_P1_01_CreateVisit.mmd -o rendered/SEQ_P1_01_CreateVisit.svg
   ```
   Quy ước tên file ảnh: `rendered/<tên .mmd>.svg` (hoặc `.png`).

### .docx
`pandoc` không có nên **chưa sinh `SEQUENCE_DIAGRAM_REPORT.docx`**. Khi cài pandoc:
```powershell
pandoc docs/sequence-diagrams/SEQUENCE_DIAGRAM_REPORT.md -o docs/sequence-diagrams/SEQUENCE_DIAGRAM_REPORT.docx
```
Hiện báo cáo được cung cấp đầy đủ ở dạng `.md` (nguồn chuyển đổi).

---

## 3. Phân loại AS-BUILT vs PLANNED

- **AS-BUILT (10):** SEQ_P1_01..09 + SEQ_P1_OV — đối chiếu trực tiếp service/controller thật.
- **PLANNED (5):** SEQ_P2_01..05 — controller/service chưa tồn tại (gate STOP-IMPLEMENTATION). Mỗi diagram có
  note `PLANNED Phase 2A — not implemented in current backend`.

**Module thực tế trên đĩa:** 12 controller Phase 1 (auth, patients, visits, examinations, billing, diseases,
drugs, regulations, users, rbac, audit, reports) + `organization` (Phase 2A foundation: Department/Room/
DoctorProfile/StaffSchedule — có controller/service nhưng KHÔNG nằm trong 5 luồng P2A được vẽ).
Các module appointments/queue/pharmacy/lab/services/vitalsigns: **chưa tồn tại**.

---

## 4. Sai khác giữa CODE và "Rule Baseline" / mô tả ban đầu — đã sửa diagram theo CODE

| # | Điểm | Rule/giả định ban đầu | THỰC TẾ CODE | Xử lý trong diagram |
|---|---|---|---|---|
| D-1 | Hoàn tất khám (UC13) | "cần ≥1 diagnosis" | cần **PRIMARY** diagnosis (`isPrimary`) | Vẽ nhánh 400 "Primary diagnosis is required" |
| D-2 | UC13 validation | đặt ngoài tx | validation **INSIDE** `$transaction` | Vẽ findUnique + checks trong tx |
| D-3 | Lập hóa đơn (UC14) | "$transaction invoice + items" | **không** $transaction; single `invoice.create` nested items | Vẽ nested create + note atomic; KHÔNG vẽ rect $tx |
| D-4 | UC14 unique invoice (BR-05) | "409 nếu trùng" | trả **existing invoice** (idempotent) | Vẽ nhánh trả existing, không 409 |
| D-5 | UC14 invoice status | "DRAFT → ISSUED" | tạo thẳng **ISSUED** | Vẽ none → ISSUED |
| D-6 | Thanh toán vượt (UC15) | "409/400" | **400** BadRequest | Vẽ 400 |
| D-7 | Login (UC01) | "email; 401" | key theo **username**; LOCKED/INACTIVE → **403** | Vẽ 403 cho locked/inactive, 401 cho no-user/bad-pass |
| D-8 | Audit regulation (UC17) | "BR-09 $transaction + audit" | activate() **không** log audit | KHÔNG vẽ AuditService; ghi RECOMMENDED |
| D-9 | VisitStatus.REGISTERED | (state machine cũ có REGISTERED→WAITING) | enum có REGISTERED nhưng **create → WAITING thẳng** | P1 bắt đầu WAITING; REGISTERED ghi "reserved Phase 2A" |

> Các điểm D-3/D-4/D-8 nên cập nhật lại `SEQUENCE_DIAGRAM_RULES.md §4/§6` cho khớp code (xem TODO §7).

---

## 5. Điểm KHÔNG verify được từ code (giả định/đánh dấu)

| ID | Nội dung | Trạng thái |
|---|---|---|
| A-1 | Toàn bộ luồng Phase 2A (check-in, dispense, lab, reversal, multi-invoice) | PLANNED — dựa MODE_C_CONTEXT, chưa có code |
| A-2 | Tên controller/service Phase 2A (PharmacyController, AppointmentsService, LabService…) | Giả định theo API contract §3.8 — chưa tồn tại |
| A-3 | Tên action audit Phase 2A (CHECKIN, DISPENSE, STOCK_MOVEMENT, LAB_RESULT_ENTERED) | Đề xuất — chưa có trong code |
| A-4 | Canonical names sau CF-001..009 (REVIEWED, reviewedById, scheduledStartAt…) | Theo baseline; schema working-tree hiện vẫn có VERIFIED/verifiedById (chưa migrate — CF-001/002) |
| A-5 | Walk-in queue flow (BR-P2-01) | Ghi dạng note trong SEQ_P2_01, chưa tách diagram riêng |

---

## 5b. Bản A4 cho DOCX — quy ước đã áp dụng

| Quy ước | Áp dụng |
|---|---|
| Init theme nền trắng/chữ đen/line xám | ✅ block `%%{init: ...}%%` đầu mỗi `*_A4_REPORT.mmd` |
| Alias ngắn | Guard, VisitsCtrl, VisitsSvc, Prisma Tx, PostgreSQL, Audit, React SPA |
| Label ngắn (≤ ~45 ký tự) | ✅ vd `get active daily cap`, `409 daily cap reached` |
| Payload `{dto}` | ✅ (giữ field quan trọng khi cần) |
| Giữ happy path + nhánh lỗi nghiệp vụ chính | ✅ (gộp VOID/PAID → "not payable" để tiết kiệm chiều cao) |
| Layer + exception propagation (TX→SV→CT→FE) | ✅ giữ nguyên |
| BEGIN/COMMIT + audit sau commit | ✅ giữ nguyên |
| Tách diagram quá dài | ✅ Lab P2-03 → PART1/PART2 |
| Không gộp nhiều UC | ✅ |

**Khi đưa vào DOCX:** trang A4 **landscape**, lề 1.2–1.5cm, ảnh **SVG** (hoặc PNG ≥ 2500px ngang), nền trắng,
font 13–16px. Giải thích dài viết **dưới hình**, không nhồi vào message. Quyết định **giữ FULL không đổi tên**
(không thêm hậu tố `_FULL`) để không phá ~15 cross-reference đã có; nếu cần đúng spec `_FULL`, rename + sửa link.

---

## 6. Tiêu chí hoàn thành — đối chiếu

| Tiêu chí | Đạt? |
|---|---|
| Không có diagram gộp thay diagram chi tiết | ✅ (SEQ_P1_OV chỉ overview, có nhãn rõ) |
| Không bịa participant cho Phase 1 | ✅ (tên khớp file thật) |
| Phase 2A đánh dấu PLANNED rõ | ✅ (note đầu mỗi diagram) |
| Không exception nhảy tắt DB/TX → FE | ✅ (đều propagate SV→CT→FE) |
| Không 400 DTO ở Service | ✅ (400 DTO ở Controller/Pipe) |
| Không vẽ REGISTERED ở Phase 1 | ✅ |
| Mỗi diagram có happy + alt lỗi nghiệp vụ chính | ✅ |
| Báo cáo có ảnh diagram | ⚠️ KHÔNG render được — báo cáo nhúng mã Mermaid + hướng dẫn render thủ công |

---

## 7. TODO cần con người duyệt

1. **Render ảnh** 15 `.mmd` (Mermaid Live / VS Code) → `rendered/`, rồi nhúng vào báo cáo/`.docx`.
2. **Cập nhật `SEQUENCE_DIAGRAM_RULES.md`** theo D-3 (invoice không $tx), D-4 (idempotent), D-8 (regulation audit) để rule khớp code.
3. **Quyết định** có thêm audit `REGULATION_ACTIVATE` ở Phase 1 (hardening) hay để Phase 2A (D-8).
4. **Sinh `.docx`** sau khi cài pandoc (lệnh ở §2).
5. **Xác nhận** tên controller/service/audit Phase 2A khi bắt đầu implement (A-2/A-3) để cập nhật diagram.
6. **CF-001..009 migration** phải chạy trước khi các diagram Phase 2A trở thành AS-BUILT (A-4).
