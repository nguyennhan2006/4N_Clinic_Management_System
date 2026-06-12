# MASTER PROMPT — Codebase Audit & Report Evidence Package

> Dùng file này để paste vào Claude Code trong VSCode tại root repository của dự án **4N Clinic Management System**.  
> Mục tiêu: kiểm tra codebase, gom bằng chứng kỹ thuật, phân loại Phase 1/Phase 2, tạo dữ liệu nền để viết báo cáo toàn văn SE104.

---

## 0. Vai trò của bạn

Bạn là **Senior Software Engineering Auditor, Software Architect, Technical Writer và QA Lead** cho dự án:

**4N Clinic Management System — Hệ thống quản lý phòng mạch tư nhân**  
Môn học: **SE104 — Nhập môn Công nghệ phần mềm**

Bạn đang làm việc trong VSCode với quyền đọc toàn bộ repository hiện tại. Nhiệm vụ của bạn là **đọc, kiểm tra, tổng hợp và tạo bộ bằng chứng kỹ thuật phục vụ viết báo cáo toàn văn**.

---

## 1. Nguyên tắc bắt buộc

### 1.1. Không sửa code

Bạn **KHÔNG được sửa code**, không refactor, không format, không chạy migration làm thay đổi database, không tự tạo file trong source nếu không được yêu cầu ở phần output.

Chỉ được:

- Đọc codebase.
- Phân tích file.
- Chạy lệnh kiểm tra an toàn nếu cần, ví dụ: `git status`, `git log`, `npm run build`, `npm run lint`, `npm test`, `npx prisma validate`, `npx prisma format --check` nếu project hỗ trợ.
- Tạo báo cáo Markdown trong thư mục `docs/report-evidence/` nếu được phép ghi file.

### 1.2. Không bịa thông tin

Mọi nhận định kỹ thuật phải có bằng chứng từ codebase hoặc tài liệu trong repository.

Bất kỳ phần nào không tìm thấy bằng chứng phải đánh dấu:

- `CONFIRMED`: có bằng chứng rõ ràng.
- `PARTIAL`: có một phần bằng chứng nhưng chưa đầy đủ.
- `MISSING`: không có trong codebase.
- `RISK`: có nhưng có rủi ro thiết kế/kiểm thử/bảo mật/tích hợp.
- `NEED_MANUAL_CONFIRMATION`: cần nhóm xác nhận thủ công.

### 1.3. Mỗi nhận định phải có file path

Ví dụ cách ghi:

```md
- CONFIRMED: Auth module có controller xử lý đăng nhập tại `backend/src/modules/auth/auth.controller.ts`.
- RISK: UsersController có endpoint nhưng chưa thấy guard tại `backend/src/modules/users/users.controller.ts`.
```

Không được kết luận kiểu chung chung nếu không chỉ ra file.

### 1.4. Tách rõ báo cáo và đề xuất

Khi viết output, tách thành hai loại:

- **Evidence from codebase**: điều đã có thật.
- **Recommendation for report**: cách nên trình bày trong báo cáo.

---

## 2. Bối cảnh dự án cần hiểu

Dự án là hệ thống web quản lý phòng mạch tư nhân, định hướng kiến trúc:

- Frontend: React / Vite / Tailwind nếu codebase xác nhận.
- Backend: NestJS / TypeScript nếu codebase xác nhận.
- Database: PostgreSQL / Prisma nếu codebase xác nhận.
- Kiến trúc mong muốn: Client–Server, Modular Monolith, Layered/Clean Architecture.
- Phân quyền mong muốn: JWT + RBAC theo vai trò.

Các vai trò nghiệp vụ dự kiến:

- ADMIN
- DOCTOR
- RECEPTIONIST
- CASHIER
- MANAGER
- Các vai trò mở rộng nếu có trong codebase: NURSE, LAB_TECHNICIAN, PHARMACIST.

---

## 3. Mục tiêu cuối cùng của audit

Bạn cần tạo một **bộ tài liệu bằng chứng** để nhóm có thể viết báo cáo toàn văn theo cấu trúc:

1. Trang bìa
2. Lời cảm ơn
3. Mở đầu
4. Chương 1: Đặc tả yêu cầu phần mềm
5. Chương 2: Thiết kế hệ thống
6. Chương 3: Thiết kế phần mềm
   - Thiết kế dữ liệu
   - Thiết kế xử lý
   - Thiết kế giao diện
7. Chương 4: Hiện thực
8. Chương 5: Kiểm thử phần mềm
9. Chương 6: Triển khai và vận hành
10. Kết luận
11. Tài liệu tham khảo
12. Phụ lục

Bộ tài liệu audit phải giúp trả lời các câu hỏi:

- Hệ thống hiện tại có những module nào?
- Module nào thuộc Phase 1, module nào thuộc Phase 2?
- Mỗi module có API, database model, frontend page, test evidence nào?
- Yêu cầu khách hàng nào đã được đáp ứng?
- Business rules nào đang được enforce trong code?
- Kiến trúc hiện tại có đúng với định hướng báo cáo không?
- Có rủi ro nào cần ghi trung thực trong báo cáo không?
- Cần chụp screenshot hoặc bổ sung minh chứng nào?

---

## 4. Định nghĩa Phase 1 và Phase 2

### 4.1. Phase 1 — Nền tảng nghiệp vụ lõi

Phase 1 là giai đoạn xây dựng hệ thống lõi để phòng mạch tư có thể vận hành cơ bản.

Các nhóm chức năng Phase 1 gồm:

- Auth / Login
- RBAC / Role-based access control
- User management nếu có
- Patient management
- Visit intake / tiếp nhận lượt khám
- Examination / phiên khám
- Diagnosis / chẩn đoán
- Disease catalog / danh mục bệnh
- Drug catalog / danh mục thuốc
- Prescription / đơn thuốc
- Prescription item / chi tiết đơn thuốc
- Invoice / hóa đơn
- Payment / thanh toán
- Regulation / quy định
- Monthly report / báo cáo tháng

### 4.2. Phase 2 — Mở rộng quy trình vận hành phòng khám

Phase 2 là giai đoạn mở rộng hệ thống từ phòng mạch cơ bản sang quy trình phòng khám đầy đủ hơn.

Các nhóm chức năng Phase 2 gồm:

- Appointment / lịch hẹn
- Queue / hàng đợi khám
- Vitals / sinh hiệu
- Services / dịch vụ cận lâm sàng
- Lab / xét nghiệm
- Inventory / kho thuốc
- Pharmacy / cấp phát thuốc
- Billing multi-item / hóa đơn nhiều khoản mục
- Revenue by type / báo cáo doanh thu theo loại
- Các module mở rộng khác nếu có trong codebase

### 4.3. Quy tắc phân loại

Nếu một module chưa chắc thuộc phase nào, hãy phân loại theo mục đích nghiệp vụ và đánh dấu `NEED_MANUAL_CONFIRMATION`.

Ví dụ:

```md
| Module | Phase | Lý do | Trạng thái |
|---|---|---|---|
| appointments | Phase 2 | Lịch hẹn là chức năng mở rộng sau nghiệp vụ tiếp nhận lõi | CONFIRMED |
| patients | Phase 1 | Quản lý bệnh nhân là nghiệp vụ lõi | CONFIRMED |
```

---

## 5. Nhiệm vụ audit chi tiết

## 5.1. Audit cấu trúc repository

Hãy kiểm tra:

- Root structure.
- Backend folder.
- Frontend folder.
- Docs folder.
- Prisma folder.
- Package manager.
- Environment files.
- README.
- Scripts build/lint/test.

Output bảng:

```md
| Khu vực | File/thư mục | Vai trò | Nhận xét | Trạng thái |
|---|---|---|---|---|
```

Ngoài bảng, tạo cây thư mục rút gọn:

```text
repo-root/
├── backend/
├── frontend/
├── docs/
└── ...
```

---

## 5.2. Audit công nghệ sử dụng

Đọc `package.json`, config files, prisma schema, frontend config, backend config.

Output bảng:

```md
| Lớp | Công nghệ/thư viện | Bằng chứng file path | Vai trò trong hệ thống | Trạng thái |
|---|---|---|---|---|
```

Các lớp cần kiểm tra:

- Frontend framework
- UI library / styling
- Routing
- State management
- Form validation
- HTTP client
- Backend framework
- ORM
- Database
- Authentication
- Authorization
- Validation
- API documentation
- Testing
- Build/lint tooling

---

## 5.3. Audit kiến trúc hệ thống

Kiểm tra hệ thống có thể trình bày theo kiến trúc nào:

- Client–Server
- Modular Monolith
- Layered Architecture
- REST API
- Database-centric information system

Output:

```md
### Architecture Evidence

| Kiến trúc/Pattern | Có phù hợp không? | Bằng chứng | Cách trình bày trong báo cáo | Rủi ro |
|---|---|---|---|---|
```

Cần nhận xét:

- Frontend gọi backend qua API như thế nào?
- Backend chia module ra sao?
- Controller, service, DTO, module có tách rõ không?
- ORM/database được truy cập ở tầng nào?
- Có dấu hiệu controller gọi trực tiếp database không?
- Có module nào phá vỡ layering không?

---

## 5.4. Audit backend module inventory

Đọc toàn bộ backend, đặc biệt là `src/modules` nếu có.

Output bảng:

```md
| Module | Phase | Mục đích | Controller | Service | DTO | Guards/Roles | Prisma models liên quan | API chính | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|---|
```

Cần kiểm tra tối thiểu:

- auth
- users
- patients
- visits
- examinations
- prescriptions
- billing / invoices / payments
- reports
- regulations
- drugs
- diseases
- appointments
- queue
- vitals
- services
- lab
- inventory
- pharmacy

Nếu module không tồn tại, ghi `MISSING`, không bỏ qua.

---

## 5.5. Audit API inventory

Đọc tất cả controller.

Output bảng:

```md
| Method | Endpoint | Module | Phase | Controller method | DTO/Input | Output/Response | Roles/Guard | Business rule chính | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|
```

Cần đánh dấu rủi ro nếu:

- Endpoint không có guard.
- Endpoint thiếu role.
- Endpoint thiếu DTO validation.
- Endpoint chưa có error handling rõ.
- Endpoint trùng chức năng.
- Endpoint có thể làm lộ dữ liệu nhạy cảm.

---

## 5.6. Audit database design

Đọc:

- `prisma/schema.prisma`
- migrations
- seed
- database docs nếu có

Output các bảng sau.

### 5.6.1. Model inventory

```md
| Model | Phase | Nhóm nghiệp vụ | Field quan trọng | Relation | Index/Unique | Enum liên quan | Ghi chú thiết kế |
|---|---|---|---|---|---|---|---|
```

### 5.6.2. Enum inventory

```md
| Enum | Giá trị | Dùng ở model nào | Ý nghĩa nghiệp vụ | Rủi ro nếu có |
|---|---|---|---|---|
```

### 5.6.3. Relationship summary

```md
| Quan hệ | Loại quan hệ | Ý nghĩa | Bằng chứng | Ghi chú báo cáo |
|---|---|---|---|---|
```

### 5.6.4. Constraint and integrity audit

```md
| Constraint/Index | Model | Mục đích | Bằng chứng | Trạng thái |
|---|---|---|---|---|
```

Cần kiểm tra:

- Unique patient code nếu có.
- Unique email/account nếu có.
- Foreign key giữa Visit và Patient.
- Foreign key giữa Examination và Visit.
- Prescription và PrescriptionItem.
- Invoice và Payment.
- Inventory lot nếu có.
- Queue ticket nếu có.
- Lab result nếu có.

---

## 5.7. Audit business rules

Đọc toàn bộ service layer để trích xuất business rules.

Output bảng:

```md
| Rule ID | Phase | Module | Mô tả rule | Điều kiện kích hoạt | Cách enforce trong code | Error/status nếu vi phạm | File path | Test case đề xuất | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|
```

Gợi ý các rule cần tìm:

### Phase 1

- Đăng nhập sai trả lỗi 401.
- Người dùng không có quyền bị chặn.
- Không tạo bệnh nhân thiếu thông tin bắt buộc.
- Không tạo lượt khám cho bệnh nhân không tồn tại.
- Không tạo trùng lượt khám trong cùng ngày cho cùng bệnh nhân nếu code có rule này.
- Không vượt quá quota lượt khám trong ngày nếu có regulation.
- Chỉ bác sĩ/admin được mở phiên khám nếu có.
- Không hoàn tất khám nếu thiếu dữ liệu bắt buộc nếu có.
- Đơn thuốc phải có ít nhất một dòng thuốc nếu có.
- Không lập hóa đơn sai trạng thái nếu có.
- Báo cáo tháng lấy dữ liệu theo khoảng thời gian.

### Phase 2

- Appointment không được trùng lịch nếu có.
- Queue state transition hợp lệ nếu có.
- Vitals tính BMI nếu có.
- Lab flow: collect sample → result → verify nếu có.
- Không hoàn tất khám nếu còn service/lab bắt buộc pending nếu có.
- Inventory dùng FEFO nếu có.
- Pharmacy dispense trừ kho atomic nếu có.
- Billing multi-item phân loại item nếu có.

---

## 5.8. Audit frontend inventory

Đọc frontend codebase.

Output bảng:

```md
| Page/Component | Route | Phase | Actor/Role dùng | API gọi tới | Form validation | UI state chính | File path | Trạng thái |
|---|---|---|---|---|---|---|---|---|
```

Cần kiểm tra:

- Router setup.
- ProtectedRoute.
- Role-based navigation/sidebar.
- Login page.
- Dashboard.
- Patient pages.
- Visit pages.
- Examination pages.
- Prescription UI.
- Billing/payment UI.
- Report UI.
- Phase 2 pages nếu có.
- API client / services.
- Form schema validation.
- Error display.
- Loading state.
- Empty state.

---

## 5.9. Audit UI/UX và screenshot checklist

Tạo checklist ảnh cần chụp để đưa vào báo cáo.

Output:

```md
| Screenshot ID | Màn hình | Mục đích trong báo cáo | Actor | Dữ liệu demo cần chuẩn bị | Trạng thái |
|---|---|---|---|---|---|
```

Gợi ý ảnh cần có:

- Login page.
- Dashboard theo role.
- Sidebar role-based.
- Danh sách bệnh nhân.
- Form tạo/sửa bệnh nhân.
- Danh sách lượt khám.
- Tạo lượt khám.
- Mở phiên khám.
- Phiếu khám/chẩn đoán.
- Kê đơn thuốc.
- Hóa đơn/thanh toán.
- Báo cáo tháng.
- Queue/appointment/lab/inventory/pharmacy nếu thuộc Phase 2.

---

## 5.10. Audit requirement/customer alignment

Tạo phần giúp báo cáo đúng ý khách hàng.

Dựa trên codebase và phạm vi dự án, tạo bảng chốt yêu cầu khách hàng. Phân biệt rõ:

- Yêu cầu đã chốt Phase 1.
- Yêu cầu mở rộng Phase 2.
- Yêu cầu chưa có bằng chứng code.
- Yêu cầu cần nhóm xác nhận lại.

Output bảng 1 — khảo sát khách hàng giả định:

```md
| Đối tượng | Nhu cầu chính | Vấn đề hiện tại | Yêu cầu mong muốn | Ghi chú cho báo cáo |
|---|---|---|---|---|
```

Output bảng 2 — chốt yêu cầu:

```md
| Requirement ID | Nội dung yêu cầu | Actor | Mức ưu tiên | Phase | Bằng chứng codebase | Trạng thái chốt | Ghi chú |
|---|---|---|---|---|---|---|---|
```

Output bảng 3 — acceptance criteria:

```md
| Use case / Luồng nghiệp vụ | Actor | Điều kiện chấp nhận | Bằng chứng cần có | Trạng thái |
|---|---|---|---|---|
```

Các actor cần xét:

- Chủ phòng mạch / quản lý.
- Lễ tân.
- Bác sĩ.
- Thu ngân.
- Quản trị viên.
- Vai trò mở rộng nếu có.

---

## 5.11. Audit use case and traceability matrix

Tạo ma trận truy vết từ yêu cầu đến thiết kế, code và test.

Output:

```md
| UC ID | Use case | Actor | Requirement ID | Phase | Backend endpoint/module | Database model | Frontend page/component | Business rule | Test case đề xuất | Evidence path | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|---|---|
```

Use case Phase 1 tối thiểu:

- UC01 Login
- UC02 Manage users nếu có
- UC03 Manage roles/RBAC nếu có
- UC04 Manage patients
- UC05 Search patient
- UC06 Update patient
- UC07 Create visit/intake
- UC08 View visit list/queue basic
- UC09 Open examination
- UC10 Update examination / diagnosis
- UC11 View medical history
- UC12 Create prescription
- UC13 Create invoice
- UC14 Record payment
- UC15 Manage drugs/diseases/regulations
- UC16 View monthly report

Use case Phase 2 nếu có:

- Appointment booking/check-in
- Queue state management
- Record vitals
- Order services
- Lab sample/result/verify
- Receive stock lot
- Dispense medicine
- Multi-item invoice
- Revenue by type report

---

## 5.12. Audit team management and process evidence

Đọc git history và tài liệu nội bộ nếu có.

Output bảng timeline:

```md
| Giai đoạn | Thời điểm/git evidence | Hoạt động | Module liên quan | Bằng chứng | Ghi chú báo cáo |
|---|---|---|---|---|---|
```

Output bảng phân công đề xuất cho nhóm 4 thành viên:

```md
| Vai trò | Trách nhiệm chính | Work package liên quan | Bằng chứng code/docs | Ghi chú |
|---|---|---|---|---|
```

Vai trò đề xuất:

1. Project Lead / BA / Documentation
2. Backend & Database Lead
3. Frontend & UI/UX Lead
4. QA / Integration / DevOps Lead

Nếu git log chứng minh được tác giả commit, hãy ghi bằng chứng. Nếu không, không gán tên thành viên cụ thể; chỉ gợi ý theo vai trò.

---

## 5.13. Audit process design for Phase 1 and Phase 2

Tạo hai bản thiết kế quy trình thực hiện.

### Phase 1 Process Design

Output:

```md
| Bước | Mục tiêu | Input | Hoạt động | Output | Người phụ trách đề xuất | Bằng chứng code/docs | Tiêu chí hoàn thành |
|---|---|---|---|---|---|---|---|
```

Bước tối thiểu:

1. Khảo sát nghiệp vụ.
2. Đặc tả yêu cầu Phase 1.
3. Thiết kế dữ liệu lõi.
4. Thiết kế backend module.
5. Thiết kế giao diện lõi.
6. Hiện thực Auth/RBAC.
7. Hiện thực Patient/Visit/Examination.
8. Hiện thực Prescription/Billing/Report.
9. Kiểm thử Phase 1.
10. Chốt baseline Phase 1.

### Phase 2 Process Design

Output:

```md
| Bước | Mục tiêu | Input | Hoạt động | Output | Người phụ trách đề xuất | Bằng chứng code/docs | Tiêu chí hoàn thành |
|---|---|---|---|---|---|---|---|
```

Bước tối thiểu:

1. Đánh giá baseline Phase 1.
2. Xác định yêu cầu mở rộng.
3. Phân tích tác động DB/API/UI/Test.
4. Mở rộng database.
5. Thiết kế workflow nâng cao.
6. Hiện thực Appointment + Queue.
7. Hiện thực Vitals + Services + Lab.
8. Hiện thực Inventory + Pharmacy.
9. Mở rộng Billing/Report.
10. Kiểm thử hồi quy và tích hợp.
11. Chốt phiên bản Phase 2.

---

## 5.14. Audit Phase 2 dependency and impact analysis

Output bảng:

```md
| Module Phase 2 | Phụ thuộc module Phase 1 | Lý do phụ thuộc | DB impact | API impact | UI impact | Test impact | Rủi ro |
|---|---|---|---|---|---|---|---|
```

Gợi ý:

- Appointment phụ thuộc Patient/User.
- Queue phụ thuộc Visit/Patient.
- Vitals phụ thuộc Visit/Examination.
- Services phụ thuộc Visit/Examination/Billing.
- Lab phụ thuộc Services/Visit/Examination.
- Inventory phụ thuộc Drug.
- Pharmacy phụ thuộc Prescription/Drug/Inventory.
- Billing multi-item phụ thuộc Invoice/Payment/Visit.
- Report mở rộng phụ thuộc Billing/Services/Pharmacy.

---

## 5.15. Audit testing evidence

Đọc test files, scripts, README, CI nếu có.

Output:

```md
| Test ID | Phase | Module | Loại test | Mục tiêu | Input | Expected result | Evidence file/log | Trạng thái |
|---|---|---|---|---|---|---|---|---|
```

Phân loại test:

- Unit test
- API test
- Integration test
- UI manual test
- Regression test
- Build/lint validation

Nếu không có test tự động đầy đủ, ghi trung thực:

```md
PARTIAL: Codebase có script build/lint nhưng chưa thấy test case tự động đầy đủ cho toàn bộ business rules.
```

Đề xuất test case cho từng module chính.

---

## 5.16. Audit deployment and operation

Kiểm tra cách chạy hệ thống.

Output:

```md
| Nội dung | Lệnh/file cấu hình | Mục đích | Trạng thái | Ghi chú báo cáo |
|---|---|---|---|---|
```

Cần tìm:

- `.env.example`
- `DATABASE_URL`
- `JWT_SECRET`
- Backend start command
- Frontend start command
- Prisma migrate command
- Prisma seed command
- Swagger/OpenAPI URL nếu có
- Docker/docker-compose nếu có
- README hướng dẫn chạy

Tạo thêm mục:

```md
### Suggested Operation Guide for Report
```

Trong đó ghi cách chạy backend, frontend, migrate, seed, tài khoản demo nếu tìm thấy.

---

## 5.17. Audit risks and missing evidence

Tạo bảng rủi ro tổng hợp:

```md
| Risk ID | Khu vực | Mô tả rủi ro | Mức độ | Bằng chứng | Ảnh hưởng đến báo cáo | Khuyến nghị xử lý |
|---|---|---|---|---|---|---|
```

Rủi ro cần tìm:

- Thiếu guard/role ở endpoint quan trọng.
- Thiếu validation DTO.
- Thiếu test tự động.
- FE có route nhưng BE thiếu API.
- BE có API nhưng FE chưa có page.
- DB có model nhưng chưa có service.
- Business rule chỉ enforce ở frontend.
- Phase 2 chưa đủ UI.
- Tài liệu cũ không khớp code.
- Seed thiếu dữ liệu demo.
- README chưa đủ hướng dẫn chạy.

---

## 6. Output bắt buộc

Hãy tạo thư mục:

```text
docs/report-evidence/
```

Nếu thư mục chưa có thì tạo mới.

Tạo các file Markdown sau:

```text
docs/report-evidence/00_EXECUTIVE_SUMMARY.md
docs/report-evidence/01_CODEBASE_OVERVIEW.md
docs/report-evidence/02_TECH_STACK_AND_ARCHITECTURE.md
docs/report-evidence/03_PHASE1_PHASE2_MODULE_INVENTORY.md
docs/report-evidence/04_DATABASE_DESIGN_EVIDENCE.md
docs/report-evidence/05_API_INVENTORY.md
docs/report-evidence/06_FRONTEND_UI_EVIDENCE.md
docs/report-evidence/07_BUSINESS_RULES_EVIDENCE.md
docs/report-evidence/08_REQUIREMENT_CUSTOMER_ALIGNMENT.md
docs/report-evidence/09_TRACEABILITY_MATRIX.md
docs/report-evidence/10_TEAM_PROCESS_MANAGEMENT.md
docs/report-evidence/11_PHASE_PROCESS_DESIGN.md
docs/report-evidence/12_TESTING_EVIDENCE_AND_PLAN.md
docs/report-evidence/13_DEPLOYMENT_OPERATION_GUIDE.md
docs/report-evidence/14_RISKS_AND_MISSING_EVIDENCE.md
docs/report-evidence/15_REPORT_WRITING_GUIDE.md
```

Nếu không được phép tạo nhiều file, hãy tạo duy nhất:

```text
docs/report-evidence/FULL_REPORT_EVIDENCE_PACKAGE.md
```

Trong trường hợp đó, gom tất cả các mục trên vào một file.

---

## 7. Nội dung từng file

### 00_EXECUTIVE_SUMMARY.md

Cần có:

- Tóm tắt hệ thống hiện tại.
- Phase 1 có gì.
- Phase 2 có gì.
- Mức độ sẵn sàng để viết báo cáo.
- 10 bằng chứng quan trọng nhất.
- 10 việc nhóm cần bổ sung thủ công.

### 01_CODEBASE_OVERVIEW.md

Cần có:

- Cây thư mục.
- Package/scripts.
- Backend/frontend/docs/prisma.
- File quan trọng.
- Nhận xét tổng quan.

### 02_TECH_STACK_AND_ARCHITECTURE.md

Cần có:

- Tech stack table.
- Architecture evidence.
- Client-server explanation.
- Modular monolith evidence.
- Layered architecture evidence.
- Recommendation for Chapter 2.

### 03_PHASE1_PHASE2_MODULE_INVENTORY.md

Cần có:

- Module inventory.
- Phase classification.
- Done/partial/missing/risk.
- Dependency summary.

### 04_DATABASE_DESIGN_EVIDENCE.md

Cần có:

- Model inventory.
- Enum inventory.
- Relationship summary.
- Constraint/index audit.
- ERD recommendation.
- Database design writing notes.

### 05_API_INVENTORY.md

Cần có:

- Endpoint inventory.
- Guard/role check.
- DTO validation check.
- Missing/risk endpoints.
- API writing notes.

### 06_FRONTEND_UI_EVIDENCE.md

Cần có:

- Route inventory.
- Page/component inventory.
- Role-based UI evidence.
- API client evidence.
- Screenshot checklist.
- UI/UX writing notes.

### 07_BUSINESS_RULES_EVIDENCE.md

Cần có:

- Business rules table.
- Rule enforcement evidence.
- Error/status mapping.
- Suggested test cases.
- Business rule writing notes.

### 08_REQUIREMENT_CUSTOMER_ALIGNMENT.md

Cần có:

- Khảo sát khách hàng giả định.
- Bảng nhu cầu theo actor.
- Bảng chốt yêu cầu khách hàng.
- Acceptance criteria.
- In-scope/out-of-scope.
- Phase 1/Phase 2 scope justification.

### 09_TRACEABILITY_MATRIX.md

Cần có:

- Requirement → Use case → Backend → DB → Frontend → Business rule → Test.
- Đánh dấu thiếu bằng chứng.

### 10_TEAM_PROCESS_MANAGEMENT.md

Cần có:

- Quy trình Scrum-lite.
- Phân vai nhóm 4 thành viên.
- RACI matrix hoặc P/S/R/A matrix.
- Git workflow evidence.
- Changelog/timeline evidence nếu có.
- Recommendation for report.

### 11_PHASE_PROCESS_DESIGN.md

Cần có:

- Phase 1 process design.
- Phase 2 process design.
- Phase 2 dependency and impact analysis.
- Criteria để chuyển từ Phase 1 sang Phase 2.
- Suggested diagrams.

### 12_TESTING_EVIDENCE_AND_PLAN.md

Cần có:

- Existing test evidence.
- Build/lint/test script evidence.
- Test plan theo module.
- Regression test cho Phase 2.
- Manual UI test checklist.
- Test result table template.

### 13_DEPLOYMENT_OPERATION_GUIDE.md

Cần có:

- Environment variables.
- How to run backend.
- How to run frontend.
- How to migrate/seed database.
- Swagger/API docs if any.
- Demo account if any.
- Operation notes.

### 14_RISKS_AND_MISSING_EVIDENCE.md

Cần có:

- Risk table.
- Missing evidence table.
- What to fix in code.
- What to clarify in report.
- What to avoid claiming.

### 15_REPORT_WRITING_GUIDE.md

Cần có:

- Chương nào lấy thông tin từ file nào.
- Gợi ý cách viết từng chương.
- Câu chữ nên dùng.
- Câu chữ nên tránh.
- Danh sách hình/bảng nên đưa vào báo cáo.
- Checklist trước khi viết bản cuối.

---

## 8. Yêu cầu về văn phong output

Viết bằng **tiếng Việt học thuật, rõ ràng, dễ hiểu**, phù hợp báo cáo môn SE104.

Không viết quá hoa mỹ. Ưu tiên:

- Bảng rõ ràng.
- File path cụ thể.
- Nhận định ngắn gọn.
- Phân loại trạng thái minh bạch.
- Có khuyến nghị viết báo cáo.

Tránh:

- Bịa chức năng không có trong code.
- Nói “hoàn thiện đầy đủ” nếu chưa test.
- Gộp Phase 1 và Phase 2 lẫn lộn.
- Viết như quảng cáo sản phẩm.
- Chỉ liệt kê code mà không giải thích ý nghĩa báo cáo.

---

## 9. Lệnh kiểm tra gợi ý

Trước khi chạy lệnh, hãy xem cấu trúc repo để biết backend/frontend nằm ở đâu.

Có thể dùng các lệnh an toàn sau nếu phù hợp:

```bash
git status
git log --oneline --decorate --graph --all -n 80
git branch --all
find . -maxdepth 3 -type f -name "package.json"
find . -maxdepth 4 -type f -name "schema.prisma"
find . -maxdepth 5 -type f \( -name "*.controller.ts" -o -name "*.service.ts" -o -name "*.module.ts" -o -name "*.dto.ts" \)
find . -maxdepth 5 -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" \) | head -n 200
```

Nếu có backend:

```bash
cd backend
npm run build
npm run lint
npm test
npx prisma validate
```

Nếu có frontend:

```bash
cd frontend
npm run build
npm run lint
npm test
```

Nếu lệnh fail, ghi rõ:

- Lệnh đã chạy.
- Lỗi chính.
- File/log liên quan.
- Ảnh hưởng đến báo cáo.
- Khuyến nghị xử lý.

---

## 10. Tiêu chí hoàn thành audit

Audit được xem là hoàn thành khi có đủ:

- Module inventory Phase 1/Phase 2.
- API inventory.
- Database evidence.
- Frontend route/page evidence.
- Business rules evidence.
- Customer requirement alignment.
- Traceability matrix.
- Team/process management evidence.
- Phase 1/Phase 2 process design.
- Testing evidence and test plan.
- Deployment guide.
- Risk/missing evidence table.
- Report writing guide.

Cuối cùng, in ra một checklist:

```md
## Final Audit Checklist

| Hạng mục | Đủ chưa? | File evidence | Cần nhóm bổ sung gì? |
|---|---|---|---|
```

---

## 11. Câu trả lời cuối cùng sau khi tạo file

Sau khi tạo xong các file, hãy trả lời ngắn gọn:

```md
Đã hoàn thành audit package trong `docs/report-evidence/`.

Các file quan trọng nhất để bắt đầu viết báo cáo:
1. `00_EXECUTIVE_SUMMARY.md`
2. `08_REQUIREMENT_CUSTOMER_ALIGNMENT.md`
3. `09_TRACEABILITY_MATRIX.md`
4. `11_PHASE_PROCESS_DESIGN.md`
5. `15_REPORT_WRITING_GUIDE.md`

Các phần cần nhóm xác nhận thủ công:
- ...
```

---

## 12. Bắt đầu thực hiện

Bây giờ hãy bắt đầu từ việc đọc cấu trúc repository, sau đó thực hiện audit theo toàn bộ yêu cầu trên.  
Không sửa code.  
Không bịa thông tin.  
Tạo đầy đủ Markdown evidence package để nhóm tiếp tục viết báo cáo toàn văn.
