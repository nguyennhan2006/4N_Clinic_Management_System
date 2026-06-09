# 15 — Hướng dẫn Viết Báo cáo

> Audit date: 2026-06-07

---

## 1. Bản đồ Chương báo cáo → File evidence

| Chương báo cáo | Nội dung | File evidence chính | File evidence phụ |
|---|---|---|---|
| Trang bìa | Tên dự án, nhóm, môn học | — | Nhóm tự viết theo template khoa |
| Lời cảm ơn | Cảm ơn giảng viên, người hỗ trợ | — | Nhóm tự viết |
| Mở đầu | Lý do chọn đề tài, mục tiêu, phạm vi | `00_EXECUTIVE_SUMMARY.md` | `08_REQUIREMENT_CUSTOMER_ALIGNMENT.md` (in-scope/out-scope) |
| **Ch.1: Đặc tả yêu cầu** | UC, actor, yêu cầu, khảo sát | `08_REQUIREMENT_CUSTOMER_ALIGNMENT.md`, `09_TRACEABILITY_MATRIX.md` | `03_PHASE1_PHASE2_MODULE_INVENTORY.md` |
| **Ch.2: Thiết kế hệ thống** | Kiến trúc, diagram, tech stack | `02_TECH_STACK_AND_ARCHITECTURE.md` | `00_EXECUTIVE_SUMMARY.md` |
| **Ch.3: Thiết kế dữ liệu** | ERD, models, enums, state machines | `04_DATABASE_DESIGN_EVIDENCE.md` | `schema.prisma` trực tiếp |
| **Ch.3: Thiết kế xử lý** | API, business rules, sequence diagrams | `05_API_INVENTORY.md`, `07_BUSINESS_RULES_EVIDENCE.md` | `11_PHASE_PROCESS_DESIGN.md` |
| **Ch.3: Thiết kế giao diện** | Wireframe, screenshots, UX states | `06_FRONTEND_UI_EVIDENCE.md` + Screenshots | Design palette từ CLAUDE.md |
| **Ch.4: Hiện thực** | Code structure, module, kết quả | `03_PHASE1_PHASE2_MODULE_INVENTORY.md`, `01_CODEBASE_OVERVIEW.md` | Code trực tiếp |
| **Ch.5: Kiểm thử** | Test plan, test cases, kết quả | `12_TESTING_EVIDENCE_AND_PLAN.md` | E2E test files |
| **Ch.6: Triển khai & Vận hành** | Setup, demo accounts, vận hành | `13_DEPLOYMENT_OPERATION_GUIDE.md` | `14_RISKS_AND_MISSING_EVIDENCE.md` |
| Kết luận | Tự đánh giá, hạn chế, hướng phát triển | `14_RISKS_AND_MISSING_EVIDENCE.md`, `00_EXECUTIVE_SUMMARY.md` | — |
| Tài liệu tham khảo | Library docs, standards | `02_TECH_STACK_AND_ARCHITECTURE.md` | `backend/package.json`, `frontend/package.json` |
| Phụ lục | ERD đầy đủ, code sample | `04_DATABASE_DESIGN_EVIDENCE.md` + ERD render | — |

---

## 2. Gợi ý viết từng chương

### Mở đầu
- Đặt vấn đề: phòng mạch tư hiện quản lý thủ công → rủi ro sai sót, khó tra cứu
- Mục tiêu: xây dựng hệ thống web nội bộ cho phòng mạch tư nhân quy mô nhỏ–vừa
- Phạm vi: Phase 1 (20 UC cốt lõi) + Phase 2 (10 UC mở rộng)
- Cấu trúc báo cáo: tóm tắt 6 chương

### Chương 1 — Đặc tả yêu cầu
- Viết narrative khảo sát giả định (1–2 trang) dựa trên bảng actor + pain points file 08
- Bảng REQ-01 → REQ-30 (file 08 mục 4) → trình bày theo actor + UC
- Phân tích in-scope / out-of-scope
- Use Case Diagram: ít nhất 1 cho Phase 1, 1 cho Phase 2
- Mô tả chi tiết từng UC: actor, mục tiêu, luồng chính, luồng thay thế

### Chương 2 — Thiết kế hệ thống
- System Context Diagram (C4 L1): Actor → Browser → API → DB
- Container Diagram (C4 L2): React SPA + NestJS API + PostgreSQL
- Kiến trúc: Client-Server + Modular Monolith + Layered (3 tầng)
- Bảng tech stack (lấy từ file 02, version từ package.json)
- JWT auth flow (sequence diagram)

### Chương 3 — Thiết kế dữ liệu
- ERD Phase 1 (render từ `.mmd`) — ít nhất ERD Phase 1
- Bảng model inventory theo nhóm (file 04)
- Bảng 12 enums với values (file 04 mục 2)
- State machines: VisitStatus, ExaminationStatus, InvoiceStatus (file 04 mục 5)
- Design notes: UUID PK, soft-delete, snapshot, transaction (file 04 mục 6)

### Chương 3 — Thiết kế xử lý
- Business rules BR-01 → BR-29 theo module (file 07)
- Sequence diagrams cho 4 luồng quan trọng:
  - Luồng login + JWT
  - Luồng tạo lượt khám (BR-05, BR-06, BR-07)
  - Luồng hoàn tất khám + lập hóa đơn + thanh toán (BR-12–BR-19)
  - Luồng cấp phát thuốc FEFO (BR-21–BR-24)
- API inventory tóm tắt (file 05)

### Chương 3 — Thiết kế giao diện
- Design system: palette clinic, typography, layout sidebar+main
- Screenshots mỗi màn hình: screenshot + mô tả + actor
- Trình bày theo UC: UC01 Login → UC02 Users → ... → UC30 Audit
- States: loading, empty, error, success, confirm dialog

### Chương 4 — Hiện thực
- Cây thư mục rút gọn (file 01)
- Bảng module inventory (file 03): 21 module, 20 controllers, 91 service files
- Code mẫu: quota check trong visits.service.ts, FEFO trong pharmacy.service.ts
- Số liệu kết quả: 37 models, 12 enums, 92 endpoints, 33 pages, 36 routes

### Chương 5 — Kiểm thử
- Test plan từ file 12
- Điền kết quả thực tế vào bảng template
- Screenshots test cases quan trọng
- Ghi rõ: E2E cho Phase 1 (3 files), manual cho Phase 2

### Chương 6 — Triển khai & Vận hành
- Copy hướng dẫn từ file 13
- Screenshot Swagger UI tại `/api/docs`
- Bảng tài khoản demo (8 accounts)
- Ghi rõ: môi trường development local, chưa có production deploy

### Kết luận
- Đã đạt: 37 models, 92 endpoints, 33 pages, UC01–UC30 implemented
- Hạn chế: không CI/CD, unit test thấp, chưa deploy production, khách hàng giả định
- Hướng phát triển: patient portal, online booking, multi-branch, analytics, Docker/CI-CD

---

## 3. Câu từ nên dùng

| Nên dùng | Lý do |
|---|---|
| "Hệ thống được xây dựng theo kiến trúc Client-Server..." | Chính xác, có evidence |
| "Codebase hiện tại cho thấy..." | Trung thực, evidence-based |
| "Business rules được enforce tại tầng service, không ở controller..." | Đúng với codebase |
| "Nhóm thực hiện kiểm thử E2E cho Phase 1 với 3 test files..." | Đúng, có evidence |
| "Phiên bản hiện tại hỗ trợ triển khai local trên môi trường development..." | Trung thực |
| "Khách hàng trong phạm vi đồ án là khách hàng giả định..." | Bắt buộc ghi |
| "Trong phạm vi đồ án, nhóm..." | Framing đúng |
| "Phần này cần xác nhận thủ công..." | Thay cho các claim chưa verify |
| "Database có 37 models và 12 enums..." | Số đúng, đếm chính xác |
| "API prefix `/api/v1`..." | Đúng từ main.ts |

---

## 4. Câu từ nên tránh

| Tránh dùng | Lý do |
|---|---|
| "Hệ thống đã deploy lên production" | Không có evidence |
| "Hệ thống đã được kiểm thử toàn diện" | Unit test chưa đủ |
| "Hiệu suất hệ thống đạt X request/second" | Chưa có load test |
| "Khách hàng đã phản hồi tích cực" | Khách hàng giả định |
| "Tất cả 4 thành viên commit đều nhau" | Git không confirm |
| "Hệ thống có thể mở rộng cho hàng nghìn bệnh nhân" | Chưa load test |
| "Rất hoàn hảo" / "Đầy đủ 100%" | Văn phong quảng cáo |
| "9 enums" | Sai — chính xác là **12 enums** |
| "API prefix /api" | Sai — chính xác là **`/api/v1`** |
| "~85 endpoints" (nếu dùng số ước lượng) | Đếm được chính xác: **92 endpoints** |

---

## 5. Danh sách Hình đề xuất

| # | Hình | Nội dung |
|---|---|---|
| H1 | System Context Diagram | Actor → Browser → API Server → DB |
| H2 | Container Diagram | React SPA + NestJS + PostgreSQL |
| H3 | Component Diagram Backend | 21 modules + dependencies |
| H4 | ERD Phase 1 | 20 models Phase 1 |
| H5 | ERD Phase 2 Delta | 17 models mới Phase 2 |
| H6 | ERD Full | 37 models tổng |
| H7 | VisitStatus State Machine | REGISTERED→WAITING→IN_EXAMINATION→COMPLETED/CANCELLED |
| H8 | ExaminationStatus State Machine | OPEN→COMPLETED/CANCELLED |
| H9 | InvoiceStatus State Machine | DRAFT→ISSUED→PARTIALLY_PAID→PAID/VOID |
| H10 | JWT Auth Sequence Diagram | Login → token → request |
| H11 | Visit Creation Sequence | Receptionist → Visit + queue number |
| H12 | Examination Complete Sequence | Doctor → complete → invoice |
| H13 | Payment Sequence | Cashier → payment → invoice PAID |
| H14 | FEFO Dispense Sequence | Pharmacist → lot selection → stock deduct |
| H15+ | Screenshots UI (≥25) | Mỗi màn hình chính |
| H-SIDEBAR | Sidebar theo role | 5 screenshots (ADMIN/DOCTOR/RECEPTIONIST/CASHIER/MANAGER) |

---

## 6. Danh sách Bảng đề xuất

| # | Bảng | Nguồn |
|---|---|---|
| B1 | Danh sách yêu cầu REQ-01 → REQ-30 | file 08 |
| B2 | Use Case list Phase 1 + Phase 2 | file 09 |
| B3 | Tech stack với version | file 02 |
| B4 | Module inventory (21 modules) | file 03 |
| B5 | API inventory tóm tắt | file 05 |
| B6 | Model inventory Phase 1 | file 04 |
| B7 | Model inventory Phase 2 | file 04 |
| B8 | Enum inventory (12 enums) | file 04 |
| B9 | Business rules BR-01 → BR-29 | file 07 |
| B10 | RBAC matrix | file 07 |
| B11 | Test cases + kết quả | file 12 |
| B12 | Phân công nhóm (RACI) | file 10 |
| B13 | Tài khoản demo (8 accounts) | file 13 |

---

## 7. Checklist trước khi nộp báo cáo

```
□ Tất cả hình có caption và số thứ tự
□ Tất cả bảng có caption và số thứ tự
□ Tài liệu tham khảo đúng format IEEE hoặc theo yêu cầu khoa
□ Không có "Hình X" trong text mà hình không tồn tại
□ Không khai thông tin không có evidence
□ Screenshots đủ ≥30 màn hình
□ ERD đã render và rõ ràng
□ Kết quả test được điền đầy đủ (không để trống bảng)
□ Không hiển thị mật khẩu thật trong báo cáo (dùng demo password như Admin@123456)
□ Chương 6 có hướng dẫn cài đặt đủ để người khác chạy được
□ Kết luận tự đánh giá trung thực và có chiều sâu
□ Phân công nhóm được xác nhận bởi tất cả thành viên
□ Trang bìa đúng format của khoa
□ Lỗi chính tả và ngữ pháp đã review
□ Số liệu thống nhất (37 models, 12 enums, 92 endpoints) — không có mâu thuẫn
□ File báo cáo đúng định dạng (Word + PDF)
□ API prefix ghi đúng `/api/v1` (không phải `/api`)
□ Số enums ghi đúng 12 (không phải 9)
□ Deployment status ghi đúng: local development, chưa production
```

---

## 8. Cách sử dụng bộ evidence

```
docs/report-evidence-fixed/   ← bộ evidence này (FIXED — source of truth)
docs/report-evidence/         ← bản draft cũ (không nên dùng, có số liệu sai)

Thứ tự đọc:
1. 00_EXECUTIVE_SUMMARY.md    ← đọc trước để nắm canonical facts
2. Theo chương cần viết       ← xem bảng mapping mục 1 file này
3. Verify từ codebase khi cần ← đặc biệt cho @Roles(), test results
```

> Không được chỉ dẫn viết thông tin không có evidence trong bộ file này.
