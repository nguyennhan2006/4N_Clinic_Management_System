\# MASTER FIX PROMPT — Edit 16 Report Evidence Files with Consistency Audit



Bạn là \*\*Senior Software Engineering Auditor + Technical Writer\*\* cho dự án:



\*\*4N Clinic Management System — SE104 Nhập môn Công nghệ phần mềm\*\*

Mục tiêu: kiểm tra codebase thật, sửa lại và tái tạo bộ \*\*16 file evidence Markdown\*\* phục vụ viết báo cáo toàn văn.



\## 0. Nguyên tắc bắt buộc



1\. \*\*Không sửa codebase.\*\*

2\. Chỉ tạo/sửa tài liệu Markdown trong thư mục:



&#x20;  ```text

&#x20;  docs/report-evidence-fixed/

&#x20;  ```

3\. Codebase thật là \*\*source of truth cao nhất\*\*.

4\. Các file evidence cũ chỉ được xem là bản nháp, không được tin tuyệt đối.

5\. Không được bịa số liệu.

6\. Không được viết “CONFIRMED” nếu không có bằng chứng file path cụ thể.

7\. Mọi claim kỹ thuật phải có:



&#x20;  \* file path,

&#x20;  \* module liên quan,

&#x20;  \* trạng thái: `CONFIRMED`, `PARTIAL`, `MISSING`, `RISK`, hoặc `NEED\_MANUAL\_CONFIRMATION`.

8\. Nếu không kiểm chứng được bằng code, ghi rõ `NEED\_MANUAL\_CONFIRMATION`.

9\. Không dùng số ước lượng nếu có thể đếm chính xác.

10\. Nếu số lượng endpoint khó đếm tự động, ghi là “khoảng X” và giải thích cách tính.

11\. Phải thống nhất toàn bộ số liệu giữa 16 file.

12\. Không được ghi khách hàng thật nếu không có bằng chứng khảo sát thật. Phải ghi rõ:



```text

Khách hàng trong phạm vi đồ án là khách hàng giả định/phân tích nghiệp vụ giả định.

```



13\. Không được ghi hệ thống đã deploy production, có Docker, có CI/CD nếu codebase không có bằng chứng.

14\. Không được ghi “kiểm thử tự động đầy đủ” nếu chỉ có e2e test một phần.



\---



\## 1. Nhiệm vụ chính



Hãy audit toàn bộ codebase hiện tại, sau đó tạo lại bộ 16 file Markdown sau:



```text

00\_EXECUTIVE\_SUMMARY.md

01\_CODEBASE\_OVERVIEW.md

02\_TECH\_STACK\_AND\_ARCHITECTURE.md

03\_PHASE1\_PHASE2\_MODULE\_INVENTORY.md

04\_DATABASE\_DESIGN\_EVIDENCE.md

05\_API\_INVENTORY.md

06\_FRONTEND\_UI\_EVIDENCE.md

07\_BUSINESS\_RULES\_EVIDENCE.md

08\_REQUIREMENT\_CUSTOMER\_ALIGNMENT.md

09\_TRACEABILITY\_MATRIX.md

10\_TEAM\_PROCESS\_MANAGEMENT.md

11\_PHASE\_PROCESS\_DESIGN.md

12\_TESTING\_EVIDENCE\_AND\_PLAN.md

13\_DEPLOYMENT\_OPERATION\_GUIDE.md

14\_RISKS\_AND\_MISSING\_EVIDENCE.md

15\_REPORT\_WRITING\_GUIDE.md

```



Tất cả file phải nằm trong:



```text

docs/report-evidence-fixed/

```



\---



\## 2. Quy trình audit trước khi viết file



Trước khi tạo file, hãy thực hiện audit theo thứ tự sau.



\### 2.1. Audit cấu trúc thư mục



Kiểm tra:



```text

backend/

frontend/

docs/

backend/prisma/

backend/src/modules/

frontend/src/features/

frontend/src/app/

frontend/src/config/

frontend/src/components/

backend/test/

```



Cần ghi nhận:



\* backend module thật sự tồn tại,

\* frontend feature/page thật sự tồn tại,

\* file test thật sự tồn tại,

\* docs hiện có,

\* file env example,

\* package scripts.



\---



\### 2.2. Audit tech stack



Đọc trực tiếp:



```text

backend/package.json

frontend/package.json

backend/.env.example

frontend/package.json

frontend/tsconfig.json

```



Không được tự đoán version. Lấy version thật từ package files.



Cần xác định:



\* React version,

\* Vite version,

\* TypeScript version,

\* Tailwind version,

\* NestJS version,

\* Prisma version,

\* PostgreSQL provider,

\* JWT/Passport libraries,

\* testing libraries,

\* linting libraries.



\---



\### 2.3. Audit database schema



Đọc trực tiếp:



```text

backend/prisma/schema.prisma

backend/prisma/migrations/

backend/prisma/seed.ts

```



Bắt buộc đếm chính xác:



\* số `model`,

\* số `enum`,

\* danh sách enum và value,

\* số migration,

\* danh sách model theo nhóm nghiệp vụ,

\* unique constraint,

\* index,

\* relation quan trọng,

\* state machine liên quan.



Có thể dùng lệnh gợi ý:



```bash

grep -n "^model " backend/prisma/schema.prisma

grep -n "^enum " backend/prisma/schema.prisma

grep -n "@@unique\\|@unique\\|@@index\\|@@id" backend/prisma/schema.prisma

```



Kết quả cuối cùng phải chốt một con số thống nhất, ví dụ:



```text

Database models: <exact number>

Enums: <exact number>

```



Không được để file này ghi 12 enum còn file khác ghi 9 enum.



\---



\### 2.4. Audit backend modules, controllers, services, DTO



Kiểm tra:



```text

backend/src/modules/

backend/src/common/guards/

backend/src/common/decorators/

backend/src/common/filters/

backend/src/prisma/

backend/src/main.ts

backend/src/app.module.ts

```



Cần thống kê:



\* module folders,

\* controllers,

\* services,

\* DTO folders,

\* guards,

\* decorators,

\* filters,

\* endpoint prefix,

\* Swagger path,

\* API prefix.



Phân biệt rõ:



```text

Backend feature folder

Backend module with controller/API

Service-only module

Shared/common module

```



Nếu `prescriptions` chỉ là service-only, ghi rõ:



```text

prescriptions là service-only module, được gọi từ examinations, không có route trực tiếp.

```



Không được tính lẫn làm API module nếu không có controller.



\---



\### 2.5. Audit API endpoints



Đọc trực tiếp tất cả controller:



```text

backend/src/modules/\*\*/\*.controller.ts

```



Với mỗi endpoint, ghi:



\* Method,

\* Full path,

\* Controller,

\* controller method,

\* DTO/input nếu có,

\* guard,

\* role,

\* business rule chính,

\* phase,

\* status.



Cần kiểm tra:



```text

@Controller(...)

@Get(...)

@Post(...)

@Patch(...)

@Put(...)

@Delete(...)

@UseGuards(...)

@Roles(...)

```



Không được ghi endpoint nếu không thấy trong controller.



Nếu role guard chưa rõ, ghi:



```text

NEED\_MANUAL\_CONFIRMATION

```



\---



\### 2.6. Audit business rules



Đọc trực tiếp service files:



```text

backend/src/modules/\*\*/\*.service.ts

```



Tìm các rule:



\* login credentials,

\* refresh token revoke,

\* password hash,

\* patient unique citizenId,

\* no duplicate visit same patient/date,

\* quota per day,

\* doctor active,

\* visit status transition,

\* examination status,

\* prescription validation,

\* drug active,

\* invoice creation,

\* payment amount,

\* overpayment,

\* regulation active version,

\* appointment conflict,

\* queue state transition,

\* lab flow,

\* inventory stock,

\* FEFO,

\* stock transaction,

\* BMI calculation,

\* invoice items.



Mỗi rule cần có:



```text

Rule ID

Phase

Module

Description

Trigger

Enforcement logic

Error/status

File path

Test case suggestion

Status

```



Không ghi “enforced” nếu chỉ có DTO validation hoặc frontend validation mà không có service-layer logic.



\---



\### 2.7. Audit frontend



Đọc trực tiếp:



```text

frontend/src/app/router.tsx

frontend/src/features/

frontend/src/config/navigation.ts

frontend/src/config/permissions.ts

frontend/src/components/common/

frontend/src/lib/api-client.ts

frontend/src/features/auth/

```



Cần thống kê:



\* routes,

\* page component,

\* actor/role,

\* API calls,

\* form validation,

\* UI state,

\* file path,

\* screenshot cần chụp,

\* protected route,

\* role-based sidebar,

\* RequireRole,

\* auth store,

\* API client.



Không được ghi page nếu file không tồn tại.



\---



\### 2.8. Audit tests



Đọc:



```text

backend/test/

backend/src/\*\*/\*.spec.ts

frontend/

```



Cần xác định chính xác:



\* e2e test files,

\* unit test files,

\* frontend test có hay không,

\* test scripts,

\* test cần DB hay không,

\* Phase 1 coverage,

\* Phase 2 coverage.



Phải viết trung thực:



```text

E2E tests cover Phase 1 core flows.

Phase 2 currently relies on manual test plan unless automated tests are found.

```



Không được ghi “full test coverage”.



\---



\### 2.9. Audit deployment



Đọc:



```text

README.md

backend/.env.example

frontend/package.json

backend/package.json

Dockerfile

docker-compose.yml

.github/workflows/

```



Cần xác nhận:



\* local setup,

\* backend run command,

\* frontend run command,

\* database migration,

\* seed,

\* Swagger,

\* demo accounts,

\* Docker có hay không,

\* CI/CD có hay không.



Nếu không có Docker/CI, ghi rõ:



```text

MISSING: Docker/CI-CD not found.

Deployment scope: local development environment.

```



\---



\### 2.10. Audit Git/team process



Dùng git commands nếu có:



```bash

git branch -a

git log --oneline --decorate --graph --all --max-count=80

git shortlog -sn

git log --pretty=format:"%h%x09%an%x09%ad%x09%s" --date=short --max-count=80

```



Cần ghi:



\* branches,

\* commit timeline,

\* contributors theo git,

\* PR/merge evidence nếu có,

\* feature branch naming,

\* role đề xuất,

\* RACI matrix.



Nếu git chỉ thấy 3 tài khoản nhưng nhóm có 4 người, ghi:



```text

Git history confirms 3 contributor accounts. The fourth member’s contribution requires manual confirmation, possibly through documentation, review, pair work, testing, or report writing.

```



Không được ghi “4 thành viên commit đều nhau”.



\---



\## 3. Chuẩn thống nhất phải áp dụng cho tất cả file



Sau audit, tạo một phần nội bộ gọi là \*\*Canonical Facts\*\* và dùng thống nhất trong tất cả file.



Các mục Canonical Facts bắt buộc:



```text

Project name:

Course:

Audit date:

Backend stack:

Frontend stack:

Database:

ORM:

Architecture:

API prefix:

Swagger URL:

Number of database models:

Number of enums:

Number of backend feature folders:

Number of controllers:

Number of service files:

Number of API endpoints:

Number of frontend routes/pages:

Number of e2e test files:

Number of unit test files:

Deployment status:

Testing status:

Customer status:

Phase 1 scope:

Phase 2 scope:

Out-of-scope:

Main risks:

```



Quy tắc:



\* Nếu đếm chính xác được, dùng số chính xác.

\* Nếu chưa chắc, dùng:



&#x20; ```text

&#x20; NEED\_MANUAL\_CONFIRMATION

&#x20; ```

\* Nếu dùng số ước lượng, ghi:



&#x20; ```text

&#x20; estimated, based on controller decorators

&#x20; ```

\* Tất cả 16 file phải dùng cùng một con số.



\---



\## 4. Quy định trạng thái



Dùng đúng các trạng thái sau:



| Trạng thái                 | Ý nghĩa                                      |

| -------------------------- | -------------------------------------------- |

| `CONFIRMED`                | Có bằng chứng trực tiếp trong code/file path |

| `PARTIAL`                  | Có một phần bằng chứng, nhưng chưa đầy đủ    |

| `MISSING`                  | Không tìm thấy trong codebase                |

| `RISK`                     | Có khả năng ảnh hưởng báo cáo/sản phẩm       |

| `NEED\_MANUAL\_CONFIRMATION` | Cần nhóm xác nhận thủ công                   |



Không được dùng tùy tiện các trạng thái khác.



\---



\## 5. Nội dung yêu cầu cho từng file



\## 00\_EXECUTIVE\_SUMMARY.md



Cần có:



1\. Mô tả hệ thống hiện tại.

2\. Canonical Facts summary.

3\. Tổng quan Phase 1.

4\. Tổng quan Phase 2.

5\. Mức độ sẵn sàng cho từng chương báo cáo.

6\. 10 bằng chứng kỹ thuật quan trọng nhất.

7\. 10 việc nhóm cần bổ sung thủ công.

8\. Số liệu tổng hợp đã thống nhất.

9\. Ghi chú trung thực:



&#x20;  \* khách hàng giả định,

&#x20;  \* deployment local,

&#x20;  \* e2e Phase 1, manual Phase 2.



Không được mâu thuẫn với các file còn lại.



\---



\## 01\_CODEBASE\_OVERVIEW.md



Cần có:



1\. Cây thư mục rút gọn thật.

2\. Bảng file/thư mục quan trọng.

3\. Scripts backend/frontend/database.

4\. Nhận xét tổng quan codebase.

5\. Điểm mạnh.

6\. Điểm cần lưu ý.

7\. Không ghi sai số module.



Phân biệt rõ:



```text

feature folders

controllers

services

service-only modules

```



\---



\## 02\_TECH\_STACK\_AND\_ARCHITECTURE.md



Cần có:



1\. Bảng tech stack lấy version từ package files.

2\. Architecture evidence:



&#x20;  \* Client–Server,

&#x20;  \* Modular Monolith,

&#x20;  \* Layered Architecture,

&#x20;  \* REST API,

&#x20;  \* Feature-based Frontend,

&#x20;  \* JWT Stateless Auth,

&#x20;  \* RBAC.

3\. Luồng Frontend → Backend → DB.

4\. Backend module structure.

5\. Controller → Service → Prisma pattern.

6\. Authentication flow.

7\. Gợi ý diagram cho báo cáo.



Không được gọi là microservices.



\---



\## 03\_PHASE1\_PHASE2\_MODULE\_INVENTORY.md



Cần có:



1\. Bảng module inventory đầy đủ.

2\. Phân loại:



&#x20;  \* Phase 1 core,

&#x20;  \* Phase 2 extension,

&#x20;  \* shared/common,

&#x20;  \* service-only.

3\. Module nào có controller, service, DTO, Prisma models, API.

4\. Dependency giữa Phase 1 và Phase 2.

5\. Module missing/out-of-scope.

6\. Số module phải thống nhất với file 00/01.



Phase chuẩn:



```text

Phase 1: Auth/RBAC, Users, Patients, Visits, Examinations, Prescriptions, Diseases, Drugs, Billing, Regulations, Reports.

Phase 2: Appointments, Queue, Vitals, Services, Lab, Inventory, Pharmacy, Organization, Audit, Reports extension.

```



\---



\## 04\_DATABASE\_DESIGN\_EVIDENCE.md



Cần có:



1\. Exact model count.

2\. Exact enum count.

3\. Model inventory theo nhóm:



&#x20;  \* Identity \& Access,

&#x20;  \* Clinical Core,

&#x20;  \* Billing/Regulation/Reports,

&#x20;  \* Organization,

&#x20;  \* Appointment \& Queue,

&#x20;  \* Clinical Extended,

&#x20;  \* Lab \& Services,

&#x20;  \* Inventory \& Pharmacy.

4\. Enum inventory.

5\. Quan hệ quan trọng.

6\. Constraints/integrity.

7\. State machines.

8\. Design notes:



&#x20;  \* UUID PK nếu đúng,

&#x20;  \* soft-delete/isActive nếu đúng,

&#x20;  \* snapshot nếu đúng,

&#x20;  \* transaction support nếu đúng.



Không được ghi “9 enum” nếu bảng liệt kê 12 enum.



\---



\## 05\_API\_INVENTORY.md



Cần có:



1\. API prefix.

2\. Swagger URL.

3\. Auth rule.

4\. Phase 1 endpoints.

5\. Phase 2 endpoints.

6\. Public endpoints.

7\. Protected endpoints.

8\. Role-restricted endpoints.

9\. Endpoint risks.

10\. Endpoint count phải thống nhất.



Mỗi endpoint cần có:



```text

Method

Path

Controller method

DTO/Input

Guard/Role

Business rule

Status

```



Nếu chưa xác nhận role, ghi `NEED\_MANUAL\_CONFIRMATION`.



\---



\## 06\_FRONTEND\_UI\_EVIDENCE.md



Cần có:



1\. Route/page inventory.

2\. File path thật.

3\. Actor/role.

4\. API called.

5\. Form validation.

6\. UI state.

7\. ProtectedRoute evidence.

8\. RequireRole evidence.

9\. Role-based sidebar evidence.

10\. API client evidence.

11\. Screenshot checklist.



Không được ghi page nếu file không tồn tại.



\---



\## 07\_BUSINESS\_RULES\_EVIDENCE.md



Cần có:



1\. Business rules Phase 1.

2\. Business rules Phase 2.

3\. Transaction usage.

4\. RBAC matrix.

5\. Test case suggestions.

6\. Risk nếu rule chưa enforce.



Cần kiểm tra kỹ rule:



```text

POST /examinations/:id/complete có check pending service/lab order không?

```



Nếu không có, ghi:



```text

RISK / LIMITATION: examination completion does not enforce pending lab/service obligations.

```



Nếu có, ghi path và rule cụ thể.



\---



\## 08\_REQUIREMENT\_CUSTOMER\_ALIGNMENT.md



Cần có:



1\. Ghi rõ khách hàng giả định.

2\. Narrative khảo sát ngắn gọn.

3\. Stakeholder table.

4\. Pain points.

5\. Customer needs.

6\. REQ-01 → REQ-30 hoặc đúng theo codebase.

7\. Priority.

8\. Phase.

9\. Evidence codebase.

10\. Acceptance criteria.

11\. In-scope.

12\. Out-of-scope.



Không được viết như đã phỏng vấn khách hàng thật nếu không có bằng chứng.



Câu bắt buộc:



```text

Do đây là đồ án môn học, phần khảo sát khách hàng được mô phỏng dựa trên nghiệp vụ phòng mạch tư nhân quy mô nhỏ đến trung bình.

```



\---



\## 09\_TRACEABILITY\_MATRIX.md



Cần có ma trận:



```text

Requirement → Use Case → Actor → Phase → Backend endpoint → Database model → Frontend page → Business rule → Test evidence → Status

```



Cần có summary coverage:



```text

Phase 1 UC coverage

Phase 2 UC coverage

UC missing test evidence

UC missing frontend evidence

UC missing backend evidence

```



Không ghi “test evidence confirmed” nếu chưa có test file thật.



\---



\## 10\_TEAM\_PROCESS\_MANAGEMENT.md



Cần có:



1\. Git branch evidence.

2\. Git log timeline.

3\. Contributors.

4\. Giải thích nếu chỉ có 3 contributor nhưng nhóm 4 người.

5\. Phân vai nhóm đề xuất:



&#x20;  \* Project Lead / BA / Documentation,

&#x20;  \* Backend \& Database Lead,

&#x20;  \* Frontend \& UI/UX Lead,

&#x20;  \* QA / Integration / DevOps Lead.

6\. RACI matrix.

7\. Scrum-lite workflow.

8\. Evidence/risk.



Không được tự gán tên thành viên cụ thể nếu git không chứng minh.



\---



\## 11\_PHASE\_PROCESS\_DESIGN.md



Cần có:



1\. Phase 1 process design:



&#x20;  \* bước,

&#x20;  \* mục tiêu,

&#x20;  \* input,

&#x20;  \* hoạt động,

&#x20;  \* output,

&#x20;  \* người phụ trách,

&#x20;  \* bằng chứng,

&#x20;  \* tiêu chí hoàn thành.

2\. Phase 2 process design tương tự.

3\. Dependency và impact analysis.

4\. Tiêu chí chuyển từ Phase 1 sang Phase 2.

5\. Diagram đề xuất.



Cần ghi rõ:



```text

Phase 1 = nghiệp vụ lõi.

Phase 2 = mở rộng quy trình vận hành phòng khám.

```



\---



\## 12\_TESTING\_EVIDENCE\_AND\_PLAN.md



Cần có:



1\. Test files thật.

2\. Test scripts.

3\. Test plan Phase 1.

4\. Manual test plan Phase 2.

5\. UI manual checklist.

6\. Template bảng kết quả test.

7\. Nhận xét trung thực.



Câu bắt buộc:



```text

Codebase hiện có e2e tests cho các luồng lõi Phase 1. Phase 2 cần được bổ sung manual test evidence hoặc automated tests trong tương lai.

```



Không được viết “đã pass” nếu chưa chạy test thực tế. Ghi `NEED\_MANUAL\_CONFIRMATION`.



\---



\## 13\_DEPLOYMENT\_OPERATION\_GUIDE.md



Cần có:



1\. Môi trường yêu cầu.

2\. Env variables.

3\. Cài backend.

4\. Cài frontend.

5\. Database migrate/seed.

6\. Demo accounts từ seed.

7\. Swagger.

8\. Prisma Studio.

9\. Build/lint/test commands.

10\. Production notes.

11\. Ghi rõ deployment status.



Câu bắt buộc:



```text

Phiên bản hiện tại hỗ trợ triển khai local/development. Chưa có bằng chứng Docker, CI/CD hoặc production deployment.

```



\---



\## 14\_RISKS\_AND\_MISSING\_EVIDENCE.md



Cần có:



1\. Rủi ro tổng hợp.

2\. Bằng chứng còn thiếu.

3\. Những điều không nên khai.

4\. Những điều có thể khai tự tin.

5\. Limitation trung thực.

6\. Khuyến nghị xử lý trước khi viết báo cáo.



Phải bao gồm ít nhất:



```text

Testing limitation

Deployment limitation

Customer survey limitation

Team contribution limitation

RBAC confirmation risk nếu có

Business rule limitation nếu có

Screenshot missing

Diagram missing

```



\---



\## 15\_REPORT\_WRITING\_GUIDE.md



Cần có:



1\. Bản đồ chương báo cáo → file evidence.

2\. Gợi ý viết từng chương.

3\. Câu từ nên dùng.

4\. Câu từ nên tránh.

5\. Danh sách hình đề xuất.

6\. Danh sách bảng đề xuất.

7\. Checklist trước khi nộp báo cáo.

8\. Cách sử dụng bộ evidence.



Không được chỉ dẫn viết thông tin không có evidence.



\---



\## 6. Kiểm tra nhất quán sau khi tạo file



Sau khi tạo đủ 16 file, hãy tự kiểm tra các lỗi sau:



\### 6.1. Check số lượng



Tìm trong toàn bộ `docs/report-evidence-fixed/`:



```bash

grep -R "models\\|Enums\\|enum\\|controllers\\|endpoints\\|modules" docs/report-evidence-fixed/

```



Đảm bảo:



\* model count thống nhất,

\* enum count thống nhất,

\* controller count thống nhất,

\* endpoint count thống nhất,

\* module count không mâu thuẫn.



Nếu còn mâu thuẫn, sửa lại trước khi kết thúc.



\---



\### 6.2. Check các claim cấm



Tìm các cụm:



```text

production

Docker

CI/CD

full test

toàn diện

khách hàng thật

đã khảo sát thực tế

4 thành viên đều commit

```



Nếu xuất hiện, kiểm tra có bằng chứng không. Không có thì sửa thành limitation hoặc giả định.



\---



\### 6.3. Check trạng thái



Mọi bảng phải dùng đúng status:



```text

CONFIRMED

PARTIAL

MISSING

RISK

NEED\_MANUAL\_CONFIRMATION

```



Không dùng status khác.



\---



\### 6.4. Check file path



Mọi dòng `CONFIRMED` phải có file path hoặc bằng chứng rõ ràng.



Nếu thiếu file path, sửa thành `NEED\_MANUAL\_CONFIRMATION`.



\---



\## 7. Output cuối cùng bắt buộc



Sau khi hoàn thành, in ra:



```text

DONE: Generated 16 fixed evidence files in docs/report-evidence-fixed/



Summary:

\- Database models: ...

\- Enums: ...

\- Backend controllers: ...

\- Backend services: ...

\- API endpoints: ...

\- Frontend routes/pages: ...

\- E2E test files: ...

\- Unit test files: ...

\- Deployment status: local only / production / unknown

\- Customer survey status: simulated / real / unknown



Consistency issues fixed:

1\. ...

2\. ...

3\. ...



Remaining manual tasks:

1\. Capture UI screenshots

2\. Run build/lint/e2e test and paste logs

3\. Render ERD and diagrams

4\. Confirm team member assignments

5\. Write final customer survey narrative if needed

```



\---



\## 8. Chất lượng văn phong



Viết bằng tiếng Việt học thuật, rõ ràng, phù hợp báo cáo môn học.



Tránh văn phong quảng cáo.



Ưu tiên:



```text

Hệ thống được thiết kế...

Codebase hiện tại cho thấy...

Bằng chứng trong file...

Phần này cần xác nhận thủ công...

Trong phạm vi đồ án, nhóm...

```



Tránh:



```text

Rất hoàn hảo

Đầy đủ 100%

Sẵn sàng production

Khách hàng đã xác nhận

Kiểm thử toàn diện

```



\---



\## 9. Điều kiện hoàn thành



Task chỉ hoàn thành khi:



1\. Đã tạo đủ 16 file.

2\. Không còn mâu thuẫn số liệu lớn giữa các file.

3\. Tất cả claim kỹ thuật có evidence hoặc status phù hợp.

4\. Các limitation được ghi trung thực.

5\. Bộ file đủ dùng để viết báo cáo toàn văn theo cấu trúc:



&#x20;  \* Mở đầu,

&#x20;  \* Chương 1: Đặc tả yêu cầu,

&#x20;  \* Chương 2: Thiết kế hệ thống,

&#x20;  \* Chương 3: Thiết kế phần mềm,

&#x20;  \* Chương 4: Hiện thực,

&#x20;  \* Chương 5: Kiểm thử,

&#x20;  \* Chương 6: Triển khai \& vận hành,

&#x20;  \* Kết luận,

&#x20;  \* Tài liệu tham khảo.



