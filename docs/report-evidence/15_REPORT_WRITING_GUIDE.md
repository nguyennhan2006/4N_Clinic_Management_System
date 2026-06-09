# 15 — Hướng dẫn Viết Báo cáo

---

## 1. Bản đồ Chương → File evidence

| Chương báo cáo | Nội dung | File evidence chính | File evidence phụ |
|---|---|---|---|
| Trang bìa | Tên dự án, nhóm, môn học | — | Nhóm tự viết |
| Lời cảm ơn | Cảm ơn giảng viên, người hỗ trợ | — | Nhóm tự viết |
| Mở đầu | Lý do chọn đề tài, mục tiêu, phạm vi | `00_EXECUTIVE_SUMMARY.md` | `08_REQUIREMENT_CUSTOMER_ALIGNMENT.md` (mục 4 in-scope) |
| **Chương 1: Đặc tả yêu cầu** | UC, actor, yêu cầu | `08_REQUIREMENT_CUSTOMER_ALIGNMENT.md`, `09_TRACEABILITY_MATRIX.md` | `03_PHASE1_PHASE2_MODULE_INVENTORY.md` |
| **Chương 2: Thiết kế hệ thống** | Kiến trúc, diagram, công nghệ | `02_TECH_STACK_AND_ARCHITECTURE.md` | `00_EXECUTIVE_SUMMARY.md` (mục số liệu) |
| **Chương 3: Thiết kế phần mềm — Dữ liệu** | ERD, models, enums | `04_DATABASE_DESIGN_EVIDENCE.md` | Schema.prisma trực tiếp |
| **Chương 3: Thiết kế phần mềm — Xử lý** | API, business rules, sequence | `05_API_INVENTORY.md`, `07_BUSINESS_RULES_EVIDENCE.md` | `11_PHASE_PROCESS_DESIGN.md` (workflow) |
| **Chương 3: Thiết kế phần mềm — Giao diện** | Wireframe, màn hình, UX | `06_FRONTEND_UI_EVIDENCE.md` + Screenshots | Design style trong CLAUDE.md |
| **Chương 4: Hiện thực** | Code structure, module, kết quả | `03_PHASE1_PHASE2_MODULE_INVENTORY.md`, `01_CODEBASE_OVERVIEW.md` | File code trực tiếp |
| **Chương 5: Kiểm thử** | Test plan, test cases, kết quả | `12_TESTING_EVIDENCE_AND_PLAN.md` | E2E test files |
| **Chương 6: Triển khai và vận hành** | Cài đặt, chạy, tài khoản demo | `13_DEPLOYMENT_OPERATION_GUIDE.md` | `14_RISKS_AND_MISSING_EVIDENCE.md` |
| Kết luận | Tự đánh giá, hướng phát triển | `14_RISKS_AND_MISSING_EVIDENCE.md`, `00_EXECUTIVE_SUMMARY.md` | — |
| Tài liệu tham khảo | Library docs, standards | `02_TECH_STACK_AND_ARCHITECTURE.md` | package.json |
| Phụ lục | ERD đầy đủ, code sample | `04_DATABASE_DESIGN_EVIDENCE.md` + ERD render | — |

---

## 2. Gợi ý cách viết từng chương

### Mở đầu
- Đặt vấn đề: phòng mạch tư hiện quản lý thủ công → rủi ro sai sót, khó tra cứu
- Mục tiêu: xây dựng hệ thống web nội bộ cho phòng mạch tư nhân quy mô nhỏ-vừa
- Phạm vi: Phase 1 (20 UC cốt lõi) + Phase 2 (10 UC mở rộng)
- Cấu trúc báo cáo: tóm tắt từng chương

### Chương 1 — Đặc tả yêu cầu
- Lấy bảng "Khảo sát khách hàng" từ file 08 — viết thành narrative 1 trang
- Lấy "Bảng chốt yêu cầu" → trình bày theo actor + UC
- Lấy "In-scope / Out-of-scope" → trình bày rõ giới hạn hệ thống
- Đặc biệt: vẽ Use Case Diagram (ít nhất 1 cho Phase 1, 1 cho Phase 2)
- Mô tả từng UC: actor, mục tiêu, luồng chính, luồng thay thế

### Chương 2 — Thiết kế hệ thống
- Vẽ System Context Diagram (mức C4 level 1): Actor → Browser → API → DB
- Vẽ Container Diagram (mức C4 level 2): Frontend SPA + API Server + PostgreSQL
- Trình bày kiến trúc: Client-Server + Modular Monolith + Layered (3 tầng)
- Trình bày tech stack theo bảng từ file 02
- Trình bày JWT auth flow (sequence diagram)

### Chương 3 — Thiết kế dữ liệu
- Đưa ERD (render từ .mmd file) — ít nhất ERD Phase 1
- Trình bày bảng model inventory theo nhóm nghiệp vụ
- Trình bày enum và state machine (VisitStatus, ExaminationStatus, InvoiceStatus)
- Đặc biệt: giải thích các quyết định thiết kế (UUID PK, soft-delete với isActive, snapshot trong PrescriptionItem)

### Chương 3 — Thiết kế xử lý
- Lấy business rules từ file 07 → trình bày theo module
- Vẽ sequence diagrams cho các luồng quan trọng:
  - Luồng tạo lượt khám (BR-05, BR-06, BR-07)
  - Luồng hoàn tất khám + lập hóa đơn
  - Luồng thanh toán
  - Luồng cấp phát thuốc (FEFO)
- Trình bày danh sách API endpoints theo module

### Chương 3 — Thiết kế giao diện
- Trình bày design system: palette, typography, layout (sidebar + main)
- Mỗi màn hình: screenshot + mô tả chức năng + actor
- Sắp xếp theo UC: UC01 Login → UC02 Users → ... → UC20 Report
- Đặc biệt: trình bày states (loading, empty, error, success)

### Chương 4 — Hiện thực
- Cấu trúc code: cây thư mục rút gọn từ file 01
- Trình bày mã nguồn ví dụ cho business rule quan trọng (ví dụ: quota check, payment validation)
- Trình bày kết quả: số module, endpoint, model, page
- Ghi rõ Phase 1 vs Phase 2 implementation order

### Chương 5 — Kiểm thử
- Lấy test plan từ file 12
- Điền kết quả test thực tế vào bảng template
- Đính kèm screenshots của test cases quan trọng
- Ghi chú trung thực: E2E cho Phase 1, manual cho Phase 2

### Chương 6 — Triển khai
- Copy hướng dẫn từ file 13
- Đính kèm screenshot Swagger UI
- Đính kèm danh sách tài khoản demo
- Ghi rõ: môi trường development local, chưa có production deploy

### Kết luận
- Tự đánh giá: đã đạt được gì so với mục tiêu ban đầu
- Hạn chế: không có CI/CD, unit test chưa đủ, chưa deploy production
- Hướng phát triển tương lai: patient portal, online booking, multi-branch, analytics

---

## 3. Câu từ nên dùng

| Nên dùng | Lý do |
|---|---|
| "Hệ thống được xây dựng theo kiến trúc Client-Server..." | Chính xác, có evidence |
| "Business rules được enforce tại tầng service..." | Đúng với codebase |
| "Nhóm thực hiện kiểm thử E2E cho Phase 1 với 3 test files..." | Đúng, có evidence |
| "Kết quả kiểm thử: [số] test case, [số] pass, [số] fail" | Sau khi chạy test |
| "Phiên bản hiện tại hỗ trợ triển khai local trên môi trường development..." | Trung thực |

---

## 4. Câu từ nên tránh

| Tránh dùng | Lý do |
|---|---|
| "Hệ thống đã deploy lên production" | Không có evidence |
| "Hệ thống đã được kiểm thử toàn diện" | Unit test chưa đủ |
| "Hiệu suất hệ thống đạt X request/second" | Chưa có load test |
| "Khách hàng đã phản hồi tích cực" | Khách hàng giả định |
| "Tất cả 4 thành viên đóng góp đều nhau" | Git không confirm |
| "Hệ thống có thể mở rộng cho phòng khám lớn" | Chưa verify |

---

## 5. Danh sách Hình và Bảng đề xuất

### Hình (Figures)
- Hình 1: System Context Diagram
- Hình 2: Container Diagram
- Hình 3: Component Diagram (backend modules)
- Hình 4: ERD Phase 1
- Hình 5: ERD Phase 2 Delta (các model mới)
- Hình 6: VisitStatus State Machine
- Hình 7: Sequence Diagram — Luồng tạo lượt khám
- Hình 8: Sequence Diagram — Luồng khám và kê đơn
- Hình 9: Sequence Diagram — Luồng thanh toán
- Hình 10: Sequence Diagram — Luồng cấp phát thuốc (FEFO)
- Hình 11-38: Screenshots UI (theo checklist file 06)

### Bảng (Tables)
- Bảng 1: Danh sách yêu cầu khách hàng (REQ-01 → REQ-30)
- Bảng 2: Use Case list Phase 1 + Phase 2
- Bảng 3: Tech stack
- Bảng 4: Module inventory
- Bảng 5: API inventory tóm tắt
- Bảng 6: Model inventory Phase 1
- Bảng 7: Model inventory Phase 2
- Bảng 8: Enum inventory
- Bảng 9: Business rules (BR-01 → BR-29)
- Bảng 10: Ma trận RBAC
- Bảng 11: Test cases + kết quả
- Bảng 12: Phân công nhóm
- Bảng 13: Tài khoản demo

---

## 6. Checklist trước khi nộp báo cáo

```
□ Tất cả hình có caption và số thứ tự
□ Tất cả bảng có caption và số thứ tự
□ Tài liệu tham khảo đúng format IEEE hoặc theo yêu cầu
□ Không có "Hình X" trong text nhưng hình không tồn tại
□ Không khai thông tin không có evidence
□ Screenshots đủ 25+ màn hình
□ ERD đã render và rõ ràng
□ Kết quả test được điền đầy đủ
□ Không hiển thị mật khẩu thật trong báo cáo
□ Chương 6 có hướng dẫn cài đặt đủ để người khác chạy được
□ Kết luận tự đánh giá trung thực và có chiều sâu
□ Phân công nhóm được xác nhận bởi tất cả thành viên
□ Trang bìa đúng format của khoa
□ Lỗi chính tả và ngữ pháp đã được review
□ File báo cáo đúng định dạng (Word + PDF)
```
