# Dev Guidelines — 4N Clinic Management System

> Tài liệu này là nguồn chốt quy tắc code cho toàn team. Mọi PR phải tuân theo.
> Cập nhật khi team thống nhất thay đổi quy tắc — không tự ý sửa.

---

## Mục lục

1. [Cấu trúc thư mục](#1-cấu-trúc-thư-mục)
2. [Đặt tên file](#2-đặt-tên-file)
3. [Controller pattern](#3-controller-pattern)
4. [Service pattern](#4-service-pattern)
5. [DTO pattern](#5-dto-pattern)
6. [RBAC — Guard & Decorator](#6-rbac--guard--decorator)
7. [Xử lý lỗi & Exception](#7-xử-lý-lỗi--exception)
8. [Prisma & Database](#8-prisma--database)
9. [TypeScript](#9-typescript)
10. [Format & Lint](#10-format--lint)
11. [Comment](#11-comment)
12. [Git workflow](#12-git-workflow)
13. [PR Checklist (DoD)](#13-pr-checklist-dod)
14. [Anti-patterns cấm dùng](#14-anti-patterns-cấm-dùng)

---

## 1. Cấu trúc thư mục

```
backend/src/
  common/
    constants/        # Hằng số toàn cục (roles.constant.ts)
    decorators/       # Custom decorators (@CurrentUser, @Roles)
    filters/          # Global exception filters
    guards/           # JwtAuthGuard, RolesGuard
    types/            # Shared TypeScript types
    utils/            # Pure utility functions (date-only.util.ts)
  modules/
    [module]/
      dto/            # Tất cả DTO của module này
      [module].controller.ts
      [module].service.ts
      [module].module.ts
  prisma/
    prisma.service.ts
    prisma.module.ts
  app.module.ts
  main.ts

backend/prisma/
  schema.prisma       # Nguồn chốt schema
  seed.ts             # Seed data
  migrations/         # Auto-generated bởi prisma migrate dev

docs/
  business/           # business-rules.md, role-matrix.md
  agile/              # backlog.md, sprint-plan.md
  api/                # api-scope.md, error-codes.md
  architecture/       # architecture-overview.md
```

---

## 2. Đặt tên file

| Loại | Convention | Ví dụ đúng | Ví dụ sai |
|------|-----------|-----------|-----------|
| Service | `[module].service.ts` | `visits.service.ts` | `visitService.ts` |
| Controller | `[module].controller.ts` | `visits.controller.ts` | `VisitsController.ts` |
| Module | `[module].module.ts` | `visits.module.ts` | `visit.module.ts` |
| DTO — tạo | `create-[noun].dto.ts` | `create-visit.dto.ts` | `visitDto.ts` |
| DTO — update | `update-[noun].dto.ts` | `update-examination.dto.ts` | `editExam.dto.ts` |
| DTO — query | `query-[noun]s.dto.ts` | `query-visits.dto.ts` | `filter.dto.ts` |
| Guard | `[name].guard.ts` | `jwt-auth.guard.ts` | `authGuard.ts` |
| Decorator | `[name].decorator.ts` | `current-user.decorator.ts` | `userDeco.ts` |
| Util | `[name].util.ts` | `date-only.util.ts` | `helpers.ts` |
| Constant | `[name].constant.ts` | `roles.constant.ts` | `consts.ts` |
| Filter | `[name].filter.ts` | `prisma-exception.filter.ts` | `errorFilter.ts` |

**Tuyệt đối không**: `test2.ts`, `fix_temp.ts`, `helper.ts`, `utils.ts` — tên mơ hồ.

---

## 3. Controller pattern

### Template chuẩn

```typescript
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ROLES } from '../../common/constants/roles.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateVisitDto } from './dto/create-visit.dto';
import { QueryVisitsDto } from './dto/query-visits.dto';
import { VisitsService } from './visits.service';

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)      // ← ở class level, KHÔNG ở method
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @Roles(ROLES.RECEPTIONIST, ROLES.ADMIN) // ← LUÔN có @Roles trên mọi method
  create(@Body() dto: CreateVisitDto, @CurrentUser() user: { sub: string }) {
    return this.visitsService.create(dto, user.sub);
  }

  @Get()
  @Roles(ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.MANAGER, ROLES.ADMIN)
  findAll(@Query() query: QueryVisitsDto) {
    return this.visitsService.findAll(query);
  }

  @Post(':id/open-examination')
  @Roles(ROLES.DOCTOR, ROLES.ADMIN)
  openExamination(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.visitsService.openExamination(id, user.sub);
  }
}
```

### Quy tắc bắt buộc

- `@UseGuards(JwtAuthGuard, RolesGuard)` đặt ở **class level** — áp dụng cho toàn bộ controller
- `@Roles(...)` phải có trên **mọi method** — không để method nào không có role
- Dùng hằng số `ROLES.ADMIN` từ `roles.constant.ts`, **không hardcode** string `'ADMIN'`
- Controller **không chứa business logic** — chỉ nhận request, gọi service, trả kết quả
- Trả về thẳng `return this.service.method()` — không wrap thêm `{ data: ... }` hay `{ success: true }`
- Route tĩnh phải khai báo **trước** route động trong cùng prefix:
  ```typescript
  // ✅ Đúng — /patients/medical-history match trước /:id
  @Get('medical-history/:id')
  getMedicalHistory() { ... }

  @Get(':id')
  findOne() { ... }
  ```

---

## 4. Service pattern

### Template chuẩn — write operation

```typescript
@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVisitDto, userId: string) {
    // 1. Validate entity tồn tại (ngoài transaction để tránh lock không cần thiết)
    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    // 2. Transaction với Serializable cho operation có race condition
    return this.prisma.$transaction(async (tx) => {
      // 3. Business rule check bên trong transaction
      const duplicate = await tx.visit.findFirst({ where: { patientId: dto.patientId, visitDate } });
      if (duplicate) throw new ConflictException('Patient already has a visit on this date');

      // 4. Tính toán state mới
      const latest = await tx.visit.findFirst({ where: { visitDate }, orderBy: { queueNumber: 'desc' } });
      const queueNumber = (latest?.queueNumber ?? 0) + 1;

      // 5. Write
      return tx.visit.create({ data: { ... } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
```

### Khi nào dùng transaction Serializable

| Operation | Lý do |
|-----------|-------|
| Tạo visit (queue number) | 2 request cùng lúc có thể lấy cùng max |
| Tạo patient (patientCode) | Race condition count+1 |
| Kích hoạt regulation version | Chỉ 1 version active tại một thời điểm |
| Thanh toán invoice | Kiểm tra overpayment + update cùng lúc |

### Quy tắc service

- Business rule (BR-xx theo `docs/business/business-rules.md`) implement ở **service layer**, không phải controller hay guard
- Validate external input trước transaction để tránh lock dài không cần thiết
- Không thêm error handling cho case không thể xảy ra trong luồng bình thường
- Snapshot data khi cần audit trail (ví dụ: `Diagnosis.name` lưu tên bệnh tại thời điểm khám, không lấy từ catalog sau này)

---

## 5. DTO pattern

### Template chuẩn

```typescript
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { VisitStatus } from '@prisma/client';

export class QueryVisitsDto {
  @IsOptional()
  @IsString()
  date?: string;              // YYYY-MM-DD, validate thực chất trong service

  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;
}
```

### Nested DTO

```typescript
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class DiagnosisInputDto {
  @IsString()
  diseaseId: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateExaminationDto {
  @IsOptional()
  @IsString()
  symptoms?: string;

  // Nếu có (kể cả mảng rỗng) => thay thế toàn bộ. Không truyền => giữ nguyên.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosisInputDto)
  diagnoses?: DiagnosisInputDto[];
}
```

### Quy tắc DTO

- Mọi field phải có decorator `class-validator` — không để field trần không được validate
- Nested object: bắt buộc `@ValidateNested({ each: true })` + `@Type(() => ChildDto)`
- Validate **shape** trong DTO (type, format, required/optional), validate **business logic** trong service
- Date string giữ kiểu `string` trong DTO, parse bằng `toDateOnly()` trong service — không dùng `Date` type trong DTO
- Enum field: dùng `@IsEnum(EnumType)` từ Prisma enum trực tiếp

---

## 6. RBAC — Guard & Decorator

### Cách hoạt động

```
Request → JwtAuthGuard (xác thực token, set request.user) → RolesGuard (kiểm tra role)
```

**JwtAuthGuard** (`src/common/guards/jwt-auth.guard.ts`): verify JWT, gán `request.user = { sub, email, role }`.

**RolesGuard** (`src/common/guards/roles.guard.ts`): đọc `@Roles()` metadata, kiểm tra `request.user.role`.

**`@CurrentUser()`** (`src/common/decorators/current-user.decorator.ts`): extract `request.user` vào param.

### Role matrix

| Endpoint | ADMIN | DOCTOR | RECEPTIONIST | CASHIER | MANAGER |
|----------|:-----:|:------:|:------------:|:-------:|:-------:|
| POST /patients | ✅ | | ✅ | | |
| GET /patients | ✅ | ✅ | ✅ | | ✅ |
| GET /patients/:id/medical-history | ✅ | ✅ | | | ✅ |
| POST /visits | ✅ | | ✅ | | |
| GET /visits | ✅ | ✅ | ✅ | | ✅ |
| POST /visits/:id/open-examination | ✅ | ✅ | | | |
| GET /examinations/:id | ✅ | ✅ | | | ✅ |
| PATCH /examinations/:id | ✅ | ✅ | | | |
| POST /examinations/:id/prescription | ✅ | ✅ | | | |
| POST /examinations/:id/complete | ✅ | ✅ | | | |
| POST /billing/invoices | ✅ | | | ✅ | |
| POST /billing/invoices/:id/pay | ✅ | | | ✅ | |

### Quy tắc RBAC

- RBAC check **phải ở backend** — không dựa vào UI ẩn nút
- Không dùng guard/middleware để thay thế business validation
- Chỉ `/auth/login` được miễn `@UseGuards`

---

## 7. Xử lý lỗi & Exception

### HTTP status mapping

| Tình huống | Exception class | HTTP |
|------------|----------------|------|
| Record không tồn tại | `NotFoundException` | 404 |
| Vi phạm unique constraint | `ConflictException` | 409 |
| Input sai nghiệp vụ | `BadRequestException` | 400 |
| Không có quyền | `ForbiddenException` | 403 |
| Token sai/hết hạn | `UnauthorizedException` | 401 |

### Prisma error mapping (tự động qua PrismaExceptionFilter)

| Prisma code | HTTP | Mô tả |
|-------------|------|-------|
| P2002 | 409 Conflict | Unique constraint violation |
| P2025 | 404 Not Found | Record not found (findUniqueOrThrow, update) |
| Khác | 500 | Database error |

**`PrismaExceptionFilter`** đã được đăng ký globally trong `main.ts` — không cần đăng ký lại ở module.

### Ví dụ đúng

```typescript
// ✅ NotFoundException khi record không tồn tại
const examination = await this.prisma.examination.findUnique({ where: { id } });
if (!examination) throw new NotFoundException('Examination not found');

// ✅ ConflictException khi vi phạm business rule dạng duplicate
if (visit.examination) throw new ConflictException('Examination already exists for this visit');

// ✅ BadRequestException khi sai trạng thái
if (examination.status === ExaminationStatus.COMPLETED) {
  throw new BadRequestException(`Cannot edit examination with status ${examination.status}`);
}
```

### Quy tắc exception

- Message phải đủ rõ để frontend hiển thị hoặc dev debug — không để `'error'`, `'invalid'`
- Không catch exception rồi re-throw với thông tin ít hơn
- Không dùng `HttpException` trực tiếp — dùng subclass cụ thể

---

## 8. Prisma & Database

### Schema là nguồn chốt

- Không code service trước khi schema đã được migrate
- Sau mỗi thay đổi `schema.prisma`:
  ```bash
  cd backend
  npx prisma migrate dev --name <mô-tả-ngắn>
  # VD: npx prisma migrate dev --name add-phone-index-patient
  ```
- Commit **cả hai**: `prisma/schema.prisma` + toàn bộ thư mục `prisma/migrations/`
- Không edit migration file đã tạo — tạo migration mới nếu cần sửa

### select vs include

```typescript
// ✅ Dùng select khi chỉ cần một số field (API response nhỏ hơn, bảo mật hơn)
await this.prisma.patient.findMany({
  select: { id: true, patientCode: true, fullName: true, phone: true },
});

// ✅ Dùng include khi cần toàn bộ object + relation
await this.prisma.examination.findUnique({
  where: { id },
  include: { diagnoses: { include: { disease: true } } },
});

// ❌ Không include relation rồi bỏ field nhạy cảm thủ công
// ❌ Không return passwordHash dù vô tình — luôn dùng select để loại trừ
```

### Date handling

Dùng `toDateOnly()` từ `src/common/utils/date-only.util.ts` cho mọi field date dạng `YYYY-MM-DD`:

```typescript
import { toDateOnly } from '../../common/utils/date-only.util';

const visitDate = toDateOnly(dto.visitDate);   // parse string → Date UTC 00:00:00
const today = toDateOnly();                     // không truyền → ngày hôm nay
```

Không tự parse date bằng `new Date(string)` hay `Date.parse()`.

### Snapshot pattern

Khi dữ liệu catalog có thể thay đổi theo thời gian, lưu snapshot tại thời điểm ghi:

```typescript
// ✅ Đúng — lưu tên bệnh vào Diagnosis.name tại thời điểm khám
diagnosisRows = dto.diagnoses.map((d) => ({
  name: diseaseMap.get(d.diseaseId)!.name,  // snapshot
  diseaseId: d.diseaseId,
  isPrimary: d.isPrimary ?? false,
}));
```

Áp dụng cho: `Diagnosis.name` (từ Disease), `InvoiceItem.description` (từ Drug/fee).

---

## 9. TypeScript

### Quy tắc type

```typescript
// ✅ Dùng type cụ thể cho param decorator
@CurrentUser() user: { sub: string }          // chỉ lấy sub

// ✅ Dùng union type cho optional computed value
let diagnosisRows:
  | { name: string; diseaseId: string; isPrimary: boolean }[]
  | undefined;

// ✅ Non-null assertion chỉ khi đã verify trước đó
const drug = drugMap.get(item.drugId);
if (!drug) throw new BadRequestException('Drug not found');
const price = Number(drug.price);   // drug đã được verify

// ❌ Không dùng non-null assertion không có guard
const drug = drugMap.get(item.drugId)!.price;  // có thể crash
```

### Import order

Nhóm imports theo thứ tự, cách nhau 1 dòng trống:

```typescript
// 1. NestJS packages
import { Injectable, NotFoundException } from '@nestjs/common';

// 2. Prisma / third-party
import { Prisma, VisitStatus } from '@prisma/client';

// 3. Internal — absolute (relative path)
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
```

Prettier + ESLint tự enforce, không cần nhớ thứ tự chính xác — chạy `npm run format` là đủ.

### tsconfig quan trọng

| Option | Giá trị | Ý nghĩa |
|--------|---------|---------|
| `strictNullChecks` | `true` | Phải handle `null \| undefined` rõ ràng |
| `noImplicitAny` | `false` | Cho phép implicit any (team chọn tắt để dễ hơn) |
| `emitDecoratorMetadata` | `true` | Bắt buộc cho NestJS DI |
| `moduleResolution` | `nodenext` | Cần import path đầy đủ, prisma generate tương thích |

---

## 10. Format & Lint

### Cấu hình

**.prettierrc**:
```json
{ "singleQuote": true, "trailingComma": "all" }
```

**ESLint rules quan trọng**:
- `@typescript-eslint/no-explicit-any`: **off** (cho phép dùng khi cần)
- `@typescript-eslint/no-floating-promises`: **warn** (cần `await` hoặc `void`)
- `prettier/prettier`: **error** (format sai = lint fail)
- `endOfLine: "auto"` (tránh conflict Windows/Mac)

### Commands

```bash
cd backend

npm run format    # prettier --write src/**/*.ts — fix format tự động
npm run lint      # eslint --fix — fix lint tự động
npm run build     # nest build — phải 0 errors trước khi push
npm run test      # jest — chạy unit tests
```

### Quy tắc

- Chạy `npm run format && npm run lint && npm run build` trước mọi commit
- CI sẽ fail nếu build có lỗi — không push code chưa build clean
- Không dùng `// eslint-disable` để bỏ qua lỗi — fix gốc rễ

---

## 11. Comment

### Không comment giải thích WHAT

```typescript
// ❌ Xấu — tên hàm đã nói rõ
// Tìm visit theo id
async findOne(id: string) { ... }

// ❌ Xấu — code tự giải thích
// Tính queue number = max hiện tại + 1
const queueNumber = (latestVisit?.queueNumber ?? 0) + 1;

// ❌ Xấu — comment theo UC không có giá trị lâu dài
// UC-07: tạo lượt khám
async create(dto: CreateVisitDto) { ... }
```

### Chỉ comment WHY khi không hiển nhiên

```typescript
// ✅ Tốt — giải thích lý do kỹ thuật không rõ từ code
// Serializable để tránh race condition: 2 request đồng thời lấy cùng max queueNumber
return this.prisma.$transaction(async (tx) => { ... },
  { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
);

// ✅ Tốt — invariant quan trọng không hiển nhiên
// Phải chạy SAU JwtAuthGuard (JwtAuthGuard set request.user trước)
@Injectable()
export class RolesGuard implements CanActivate { ... }

// ✅ Tốt — quy ước đặc biệt
// Nếu có (kể cả mảng rỗng) => thay thế toàn bộ diagnosis cũ.
// Không truyền => giữ nguyên diagnosis hiện tại.
@IsOptional()
diagnoses?: DiagnosisInputDto[];
```

---

## 12. Git workflow

### Branch naming

```
main                          # production-ready, merge chỉ qua PR có review
develop                       # integration branch
feature/E4-visit-intake       # [feature/E{epic}-{tên-ngắn}]
feature/E5-examination
hotfix/fix-queue-duplicate    # emergency fix
```

### Commit message

Format: `type(scope): mô tả ngắn`

```bash
feat(visits): implement UC-07 create visit with queue number
fix(billing): correct InvoiceStatus enum after M2 rename
chore(schema): add @@unique constraint for PrescriptionItem
test(visits): add concurrency test for simultaneous visit creation
docs(guidelines): add dev-guidelines.md
```

| Type | Khi nào dùng |
|------|-------------|
| `feat` | Thêm tính năng mới |
| `fix` | Sửa bug |
| `chore` | Thay đổi config, deps, schema không ảnh hưởng logic |
| `test` | Thêm/sửa test |
| `docs` | Tài liệu |
| `refactor` | Refactor không thêm feature, không fix bug |

### Schema change — quy trình bắt buộc

```bash
# 1. Sửa prisma/schema.prisma
# 2. Tạo migration
npx prisma migrate dev --name add-phone-index-patient

# 3. Commit CẢ HAI cùng một commit
git add prisma/schema.prisma prisma/migrations/
git commit -m "chore(schema): add phone index to patient"

# 4. Người pull về chạy
npx prisma migrate deploy   # hoặc npx prisma migrate dev
```

---

## 13. PR Checklist (DoD)

Trước khi tạo PR, tự check:

**Code**
- [ ] `npm run build` → 0 errors
- [ ] `npm run lint` → 0 errors (sau `npm run format`)
- [ ] Không có `console.log` debug còn sót
- [ ] Không có file tạm (`test2.ts`, `debug_*.ts`)

**Business logic**
- [ ] Business rule implement ở service layer, không phải controller
- [ ] Mọi route mới có `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`
- [ ] Không return `passwordHash` hoặc trường nhạy cảm trong response

**Database**
- [ ] Nếu đổi schema: migration file có trong commit cùng code change
- [ ] Dùng `$transaction` với Serializable cho operation có race condition

**Tài liệu**
- [ ] Cập nhật status task trong `PLAN.md`
- [ ] Cập nhật `docs/api/api-scope.md` nếu thêm endpoint mới

---

## 14. Anti-patterns cấm dùng

### Controller

```typescript
// ❌ Business logic trong controller
@Post()
async create(@Body() dto: CreateVisitDto) {
  const patient = await this.prisma.patient.findUnique(...);  // KHÔNG
  if (!patient) throw new NotFoundException(...);             // KHÔNG
  return this.visitsService.create(dto);
}

// ❌ Guard ở method level thay vì class level
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)   // KHÔNG — đặt ở class
create() { ... }

// ❌ Hardcode role string
@Roles('ADMIN', 'DOCTOR')   // KHÔNG — dùng ROLES.ADMIN, ROLES.DOCTOR
```

### Service

```typescript
// ❌ Transaction không cần thiết cho read-only
return this.prisma.$transaction(async (tx) => {
  return tx.visit.findMany(...);   // KHÔNG — chỉ dùng transaction khi write
});

// ❌ Catch rồi bỏ qua lỗi
try {
  await this.prisma.visit.update(...);
} catch {
  // bỏ qua   // KHÔNG — ít nhất phải log hoặc re-throw
}

// ❌ Validate business logic trong DTO
export class CreateVisitDto {
  @IsDate()   // KHÔNG — date là string YYYY-MM-DD, parse trong service
  visitDate: Date;
}
```

### Database

```typescript
// ❌ Include relation rồi để lộ passwordHash
const patient = await this.prisma.patient.findUnique({
  where: { id },
  include: { user: true },   // KHÔNG — user có passwordHash
});
return patient;

// ❌ Tự parse date không qua util
const date = new Date(dto.visitDate);   // KHÔNG — dùng toDateOnly()

// ❌ Sửa migration file đã commit
// Tạo migration mới thay vì sửa file cũ
```

---

*Cập nhật lần cuối: 2026-05-17 — nếu có thắc mắc hoặc muốn thay đổi rule, tạo issue hoặc thảo luận trong team trước khi sửa file này.*
