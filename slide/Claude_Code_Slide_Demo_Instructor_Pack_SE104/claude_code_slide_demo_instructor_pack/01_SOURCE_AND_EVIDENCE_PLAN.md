# KẾ HOẠCH ĐỌC TÀI NGUYÊN VÀ QUẢN LÝ BẰNG CHỨNG

## 1. Mục tiêu

Biến toàn bộ repository và tài liệu thành một tập bằng chứng có cấu trúc, để mọi nội dung trên slide có thể kiểm tra lại nhanh chóng.

## 2. Kiểm kê ban đầu

Claude Code cần chạy các lệnh đọc an toàn tương đương, điều chỉnh theo hệ điều hành và cấu trúc dự án:

```bash
pwd
git status --short
git branch --show-current
git log --oneline --decorate -n 80
find . -maxdepth 3 -type f | sort
find . -iname 'README*' -o -iname 'CLAUDE.md' -o -iname '*.pdf' -o -iname '*.docx' -o -iname '*.tex'
find . -iname 'package.json' -o -iname 'pnpm-lock.yaml' -o -iname 'yarn.lock' -o -iname 'package-lock.json'
find . -iname 'schema.prisma' -o -path '*/migrations/*' -o -iname '*seed*'
find . -path '*/test/*' -o -path '*/tests/*' -o -iname '*.spec.*' -o -iname '*.test.*'
```

Dùng `rg`/search để tìm:

```bash
rg -n "use case|UC[0-9]+|requirement|business rule|BR-|acceptance|sprint|backlog|phase|milestone|test case|RBAC|role|permission" .
rg -n "Controller|@Controller|router|Route|endpoint|Swagger|OpenAPI" backend frontend src apps packages
rg -n "TODO|FIXME|HACK|NotImplemented|throw new Error" .
```

Không đọc hoặc hiển thị giá trị secret từ `.env`.

## 3. Phân loại nguồn

### Nhóm A - Yêu cầu chính thức

- rubric/thông báo của thầy;
- đề bài môn học;
- template bắt buộc;
- giới hạn thời lượng.

### Nhóm B - Baseline và báo cáo

- requirements specification;
- use case/business rules;
- thiết kế kiến trúc, class, sequence, database;
- báo cáo chính thức;
- tài liệu phase.

### Nhóm C - Implementation evidence

- frontend route/page/component;
- backend controller/service/DTO/guard;
- Prisma schema/migration/seed;
- Swagger/OpenAPI;
- unit/integration/e2e tests;
- build/lint output.

### Nhóm D - Management evidence

- Git log/branch/tag;
- issue/task board;
- checklist phân công;
- biên bản họp;
- changelog/release note.

### Nhóm E - Demo evidence

- tài khoản demo;
- demo seed;
- video/screenshot;
- smoke test;
- timing log;
- known issues.

## 4. Evidence matrix

Mỗi dòng là một claim tiềm năng trên slide.

| ID | Claim | Loại | Nguồn chính | Vị trí | Cách xác minh | Trạng thái | Được dùng ở slide |
|---|---|---|---|---|---|---|---|
| C-001 | Hệ thống phân quyền theo vai trò | Feature | Guard/API/UI | file:line | login nhiều role + test | VERIFIED | 2/6 |
| C-002 | Nhóm phát triển theo Scrum | Process | backlog/sprint logs | ... | kiểm tra artifacts | UNKNOWN | Không |

## 5. Conflict register

Mỗi mâu thuẫn phải có:

- nguồn A;
- nguồn B;
- nội dung mâu thuẫn;
- ảnh hưởng đến slide/demo;
- quyết định tạm thời;
- người cần xác nhận;
- deadline xử lý.

Ví dụ:

```text
CR-03
- Báo cáo: UC quản lý tài khoản đã hoàn tất.
- Code: route frontend đang bị khóa hoặc backend thiếu guard.
- Ảnh hưởng: không được demo như tính năng hoàn chỉnh.
- Quyết định: loại khỏi demo; ghi vào limitation nếu cần.
```

## 6. Traceability tối thiểu

Thiết lập chuỗi:

```text
Yêu cầu/Use case
→ business rule
→ UI route/screen
→ API endpoint
→ service/domain logic
→ database entity
→ test case
→ demo step
→ slide claim
```

Một chức năng không cần có đủ mọi mắt xích mới tồn tại, nhưng chức năng dùng trong demo phải có ít nhất: requirement/use case, code path, dữ liệu, test hoặc smoke evidence, và bước khôi phục.

## 7. Báo cáo sau audit

Claude Code phải trả lời rõ:

1. Phiên bản nào sẽ được demo?
2. Có bao nhiêu chức năng lõi thực sự chạy được?
3. Những tính năng nào chỉ nằm trong tài liệu?
4. Quy trình phát triển nào có đủ bằng chứng?
5. Các claim nào cần nhóm xác nhận?
6. Những rủi ro lớn nhất trước ngày trình bày?
