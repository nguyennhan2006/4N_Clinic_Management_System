# 4N Clinic Management System — Project Plan

> **Cách dùng file này:** Đây là nguồn chốt trạng thái project. Cập nhật khi hoàn thành task, thay đổi quyết định, hoặc phát hiện lệch giữa code và spec.
>
> Tài liệu gốc đầy đủ: [`docs/Tài liệu, đặc tả về hệ thống Phòng mạch tư nhân (7).docx`](docs/)
> Business rules: [`docs/business/business-rules.md`](docs/business/business-rules.md)
> Backlog chi tiết: [`docs/agile/backlog.md`](docs/agile/backlog.md)
> Sprint plan: [`docs/agile/sprint-plan.md`](docs/agile/sprint-plan.md)

---

## 1. Trạng thái hiện tại (2026-05-15)

### Backend scaffold — đã có
- [x] NestJS 11 + TypeScript + Prisma 6 + PostgreSQL
- [x] Cấu trúc module: `auth`, `users`, `patients`, `visits`, `examinations`, `prescriptions`, `billing`, `rbac`, `regulations`, `reports`, `audit`
- [x] JWT auth skeleton (`login.dto.ts`, `refresh-token.dto.ts`)
- [x] Prisma schema: User, Role, Patient (+patientCode), Visit (+REGISTERED status), Examination (+CANCELLED status), Diagnosis (+Disease ref), Disease (catalog), Drug, Prescription, PrescriptionItem, Invoice (DRAFT/ISSUED/VOID), InvoiceItem, Payment, RegulationVersion, RegulationItem
- [x] Seed script: admin + doctor role/user, sample drugs (cần cập nhật thêm RegulationVersion seed)
- [x] Swagger setup ở `main.ts`
- [x] Health check endpoint
- [x] `@CurrentUser()` decorator, `JwtAuthGuard`

### Frontend — chưa bắt đầu
- [ ] React + Vite + TypeScript
- [ ] TanStack Query, Zustand, Tailwind, shadcn/ui

### Database — schema draft, chưa migrate
- [ ] Chạy `prisma migrate dev` lần đầu
- [ ] Chạy seed

---

## 2. Schema Mismatches — ĐÃ SỬA (2026-05-16)

> Tất cả 6 mismatch đã được fix trong `backend/prisma/schema.prisma`.
> Prisma Client đã generate lại. Migration SQL đã validated.
> **Cần chạy `npx prisma migrate dev` khi có PostgreSQL.**

### M1 — `VisitStatus` thiếu `REGISTERED` ✅ FIXED

| | Business Rules | Prisma hiện tại |
|---|---|---|
| Status | `REGISTERED, WAITING, IN_EXAMINATION, COMPLETED, CANCELLED` | `WAITING, IN_EXAMINATION, COMPLETED, CANCELLED` |

**Quyết định cần chốt:** Có giữ `REGISTERED` hay merge vào `WAITING`?

> **Gợi ý:** Giữ `REGISTERED` — nó biểu diễn trạng thái "đã tạo lượt khám, chưa vào hàng đợi chính thức", khác với `WAITING`.

**Action:** Thêm `REGISTERED` vào `VisitStatus` enum trong schema + cập nhật business-rules.md nếu bỏ.

---

### M2 — `InvoiceStatus` khác tên ✅ FIXED

| | Business Rules | Prisma hiện tại |
|---|---|---|
| Statuses | `DRAFT, ISSUED, PARTIALLY_PAID, PAID, VOID` | `UNPAID, PARTIALLY_PAID, PAID, CANCELLED` |

**Quyết định cần chốt:** Dùng naming của business-rules.md hay của Prisma?

> **Gợi ý:** Dùng `business-rules.md` — `DRAFT/ISSUED/VOID` rõ nghĩa hơn và phân biệt được "hóa đơn nháp" vs "hóa đơn đã phát hành".

**Action:** Cập nhật `InvoiceStatus` enum trong schema thành `DRAFT, ISSUED, PARTIALLY_PAID, PAID, VOID`.

---

### M3 — `ExaminationStatus` thiếu `CANCELLED` ✅ FIXED

| | Business Rules | Prisma hiện tại |
|---|---|---|
| Statuses | `OPEN, COMPLETED, CANCELLED` | `OPEN, COMPLETED` |

**Action:** Thêm `CANCELLED` vào `ExaminationStatus`.

---

### M4 — `Regulation` model chưa có trong schema ✅ FIXED

Module `regulations/` đã scaffold nhưng **không có model nào trong `schema.prisma`**.

BR-18/BR-19 yêu cầu version hóa quy định.

**Cần thêm:**
```prisma
model RegulationVersion {
  id          String   @id @default(uuid())
  isActive    Boolean  @default(false)
  activatedAt DateTime?
  note        String?
  createdAt   DateTime @default(now())
  items       RegulationItem[]
}

model RegulationItem {
  id        String            @id @default(uuid())
  versionId String
  version   RegulationVersion @relation(fields: [versionId], references: [id], onDelete: Cascade)
  key       String            // e.g. "MAX_PATIENTS_PER_DAY", "CONSULTATION_FEE"
  value     String
  @@unique([versionId, key])
}
```

---

### M5 — `Disease` catalog chưa có model ✅ FIXED

UC-19 yêu cầu quản lý danh mục bệnh độc lập (admin CRUD).

Hiện tại `Diagnosis` chỉ lưu `name: String` tự do — không liên kết catalog.

**Cần thêm:**
```prisma
model Disease {
  id        String  @id @default(uuid())
  code      String  @unique
  name      String
  isActive  Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  diagnoses Diagnosis[]
}
```

Và sửa `Diagnosis`:
```prisma
model Diagnosis {
  // ...
  diseaseId String?
  disease   Disease? @relation(...)
  name      String   // giữ lại để backward-compat hoặc free-text fallback
}
```

---

### M6 — `Patient` thiếu `patientCode` ✅ FIXED

UC-04 yêu cầu sinh mã bệnh nhân duy nhất (dạng `BN-000001`).

**Action:** Thêm `patientCode String @unique` vào model `Patient`. Sinh trong service khi tạo mới.

---

## 3. Quyết định kiến trúc đã chốt

| ID | Quyết định | Lý do |
|---|---|---|
| DEC-01 | Modular Monolith, không microservices | Team 4 người, timeline 6 tuần, nghiệp vụ cần transaction nhất quán |
| DEC-02 | 1 Visit = 1 Invoice (tối đa) | Đơn giản hóa billing, đủ cho ver1 |
| DEC-03 | Snapshot giá thuốc vào `InvoiceItem.unitPrice` | Thay đổi giá thuốc sau không được làm lệch hóa đơn cũ (BR-15) |
| DEC-04 | `billing/` module gộp invoice + payment | Scope ver1 không cần tách, ghi vào decision log để ver2 |
| DEC-05 | Soft delete cho Drug và Disease (dùng `isActive`) | Không hard delete item đã có lịch sử sử dụng (UC-19/UC-20) |
| DEC-06 | Queue number duy nhất theo ngày, sinh trong transaction | Tránh race condition (BR-07) |
| DEC-07 | Phase 1: tạo Visit thẳng `WAITING` (không qua `REGISTERED`) | Chưa có endpoint `REGISTERED→WAITING`; giữ `REGISTERED` trong enum cho ver2 |
| DEC-08 | 1 bệnh nhân chỉ 1 visit/ngày bất kể status (DB `@@unique([patientId,visitDate])` + service check) | Chặt hơn BR-05 ("active only"); cancel+rebook cùng ngày = ver2. Đảm bảo concurrency 409 |
| DEC-09 | InvoiceStatus mapping M2: hóa đơn mới = `ISSUED`, hủy = `VOID` | `billing.service` đã cập nhật theo enum mới |
| DEC-10 | Diagnosis dùng `diseaseId` + snapshot `name`; chỉ 1 đường set diagnosis qua `PATCH /examinations/:id` | Bỏ `PUT /:id/diagnoses` (free-text) để tránh 2 contract lệch nhau (guide 4.1) |
| DEC-11 | `patientCode` sinh dạng `BN-000001` trong transaction Serializable (count+1) | Hệ quả M6; đủ cho volume Phase 1, ver2 cân nhắc DB sequence |

---

## 4. Traceability — UC → Module → API → DB

| UC | Tên | Module backend | API endpoint | DB model |
|---|---|---|---|---|
| UC-01 | Đăng nhập | `auth` | `POST /auth/login` | User, Role |
| UC-02 | Tra cứu bệnh nhân | `patients` | `GET /patients?search=` | Patient |
| UC-03 | Tiếp nhận bệnh nhân | `visits` | *(check daily quota)* | Visit, RegulationItem |
| UC-04 | Tạo hồ sơ bệnh nhân | `patients` | `POST /patients` | Patient |
| UC-05 | Tạo lượt khám | `visits` | `POST /visits` | Visit |
| UC-06 | Xem danh sách khám | `visits` | `GET /visits?date=` | Visit |
| UC-07 | Mở lượt khám | `visits` | `PATCH /visits/:id/status` | Visit |
| UC-08 | Lập phiếu khám | `examinations` | `POST /examinations` | Examination |
| UC-09 | Xem lịch sử khám | `examinations` | `GET /patients/:id/visits` | Visit, Examination |
| UC-10 | Kê đơn thuốc | `examinations` | `PUT /examinations/:id/prescription` | Prescription, PrescriptionItem, Drug |
| UC-11 | Hoàn tất phiếu khám | `examinations` | `PATCH /examinations/:id/complete` | Examination |
| UC-12 | Lập hóa đơn | `billing` | `POST /invoices` | Invoice, InvoiceItem |
| UC-13 | Ghi nhận thanh toán | `billing` | `POST /invoices/:id/payments` | Payment, Invoice |
| UC-14 | Tra cứu hóa đơn | `billing` | `GET /invoices?search=` | Invoice |
| UC-15 | Thay đổi quy định | `regulations` | `POST /regulations/versions` + `PATCH /regulations/versions/:id/activate` | RegulationVersion, RegulationItem |
| UC-16 | Xem báo cáo tháng | `reports` | `GET /reports/monthly?month=&year=` | Visit, Invoice, Payment, Diagnosis |
| UC-17 | Quản lý tài khoản | `users` | `POST /users`, `PATCH /users/:id` | User |
| UC-18 | Phân quyền | `rbac` | `PATCH /users/:id/role` | User, Role |
| UC-19 | Quản lý danh mục bệnh | *(chưa có module)* | `GET/POST/PATCH /diseases` | Disease |
| UC-20 | Quản lý danh mục thuốc | `prescriptions` | `GET/POST/PATCH /drugs` | Drug |

---

## 5. Backlog theo Epic — Trạng thái thực tế

Legend: ✅ Done · 🔧 Scaffold only · ⬜ Chưa làm

### E1 — Project Foundation
| Task | Trạng thái |
|---|---|
| Repo structure | ✅ |
| Business rules docs | ✅ |
| Role matrix | ✅ |
| API scope | ✅ |
| Scaffold backend NestJS | ✅ |
| Scaffold frontend | ⬜ |
| Init Prisma schema | ✅ (draft, chưa migrate) |
| Seed users/roles | 🔧 (script có, chưa chạy) |

### E2 — Auth & RBAC
| Task | Trạng thái |
|---|---|
| User/role schema | ✅ |
| Login API | 🔧 |
| Refresh token API | 🔧 (dto có, chưa implement) |
| Me API | ⬜ |
| JWT guard | ✅ |
| Assign role API | ⬜ |

### E3 — Patient
| Task | Trạng thái |
|---|---|
| Patient schema | ✅ (`patientCode` added — M6) |
| Create patient API | ✅ (sinh patientCode, citizenId 409) |
| Search patient API | ✅ (keyword: name/phone/citizenId/patientCode) |
| Get patient detail | ✅ (404 nếu không tồn tại) |
| Update patient | ⬜ |
| Duplicate-check rule | ✅ (citizenId unique check) |
| Medical history API (UC-11) | ✅ `GET /patients/:id/medical-history` |

### E4 — Visit Intake
| Task | Trạng thái |
|---|---|
| Visit schema | ✅ (`REGISTERED` added — M1) |
| Create visit API (UC-07) | ✅ (WAITING, 404/409, queue tx Serializable) |
| Daily visit list API (UC-08) | ✅ (date default today, status filter, sort) |
| Cancel visit API | ⬜ |
| Enforce max patients/day | ✅ (đọc `MAX_PATIENTS_PER_DAY` từ RegulationVersion active, fallback 40) |

### E5 — Examination
| Task | Trạng thái |
|---|---|
| Examination schema | ✅ (`CANCELLED` added — M3) |
| Open examination API (UC-09) | ✅ (404 visit / 409 exam tồn tại / 400 sai status) |
| Update examination API (UC-10) | ✅ (PATCH, diagnoses diseaseId + snapshot, ≤1 primary, disease active) |
| Disease catalog schema | ✅ (M5) |
| Diagnosis API | ✅ (gộp vào PATCH /examinations/:id — DEC-10) |
| Complete examination API | ✅ (giữ nguyên, +chặn CANCELLED) |

### E6 — Prescription
| Task | Trạng thái |
|---|---|
| Drug schema | ✅ |
| Prescription schema | ✅ |
| Create/upsert prescription API | ⬜ |
| Add/update prescription items | ⬜ |
| Drug catalog API (admin) | ⬜ |

### E7 — Billing & Payment
| Task | Trạng thái |
|---|---|
| Invoice schema | ✅ (sai InvoiceStatus — xem M2) |
| Invoice item schema | ✅ |
| Payment schema | ✅ |
| Create invoice API | 🔧 |
| Record payment API | 🔧 |
| Invoice list/detail API | ⬜ |

### E8 — Regulation
| Task | Trạng thái |
|---|---|
| Regulation schema | ⬜ (model chưa có — xem M4) |
| Current regulation API | ⬜ |
| Create draft version API | ⬜ |
| Activate version API | ⬜ |

### E9 — Reporting
| Task | Trạng thái |
|---|---|
| Monthly summary query | ⬜ |
| Monthly revenue query | ⬜ |
| Disease breakdown query | ⬜ |
| Reports API | ⬜ |

### E10 — Demo & QA
| Task | Trạng thái |
|---|---|
| Seed demo data đầy đủ | ⬜ |
| Smoke test script | ⬜ |

---

## 6. Thứ tự ưu tiên làm việc tiếp theo

**Bước 1 — Sửa schema** ✅ DONE (2026-05-16)
- M1-M6 đã fix trong `schema.prisma`, Prisma Client đã generate.
- Migration SQL đã validated. Chờ DB để chạy `prisma migrate dev`.
- [ ] Chạy `cd backend && npx prisma migrate dev --name init-schema-with-regulation-disease-fixes` khi có PostgreSQL
- [ ] Cập nhật `seed.ts`: thêm `patientCode`, thêm RegulationVersion với MAX_PATIENTS_PER_DAY + CONSULTATION_FEE

**Bước 2 — Implement E2 Auth đầy đủ** (nền cho tất cả)
- Login, refresh, me, JWT guard wired vào routes

**Bước 3 — E3 Patient + E4 Visit** (luồng lễ tân)
- Create/search patient với duplicate-check
- Create visit với quota check từ Regulation

**Bước 4 — E5 Examination + E6 Prescription** (luồng bác sĩ)

**Bước 5 — E7 Billing + E8 Regulation** (luồng thu ngân + admin)

**Bước 6 — E9 Reports + E10 Demo hardening**

---

## 7. Business Rules quan trọng nhất cần implement đúng

> Xem đầy đủ tại [`docs/business/business-rules.md`](docs/business/business-rules.md)

| BR | Nội dung | Implement ở đâu |
|---|---|---|
| BR-05 | 1 bệnh nhân chỉ có 1 visit đang active / ngày | `visits.service` — check trước khi tạo |
| BR-06 | Không vượt `MAX_PATIENTS_PER_DAY` | `visits.service` — đọc từ `RegulationItem` active |
| BR-07 | Queue number unique theo ngày, sinh trong transaction | `visits.service` — dùng `$transaction` |
| BR-10 | Không hoàn tất examination nếu thiếu dữ liệu tối thiểu | `examinations.service` — completeness check |
| BR-11 | 1 examination chỉ có 1 `PRIMARY` diagnosis | `examinations.service` — validate trước khi save |
| BR-15 | Snapshot giá thuốc + phí khám vào `InvoiceItem` | `billing.service` — không query lại Drug price |
| BR-16 | Tổng payment không vượt số dư | `billing.service` — check trong transaction |
| BR-18 | Regulation phải version hóa | `regulations.service` — không ghi đè version active |
| BR-19 | Quy định mới không hồi tố invoice cũ | `billing.service` — dùng snapshot, không dùng regulation hiện tại |

---

## 8. Đã implement: UC-07 → UC-11 (2026-05-16)

Theo bản hướng dẫn của team. Build ✅ + lint ✅ pass.

### Files mới
- `common/constants/roles.constant.ts` — ROLES (ADMIN/DOCTOR/RECEPTIONIST/CASHIER/MANAGER)
- `common/decorators/roles.decorator.ts` — `@Roles()`
- `common/guards/roles.guard.ts` — `RolesGuard` (chạy sau JwtAuthGuard)
- `common/utils/date-only.util.ts` — `toDateOnly()` parse YYYY-MM-DD, 400 nếu sai format
- `common/types/authenticated-request.type.ts`
- `common/filters/prisma-exception.filter.ts` — P2002→409, P2025→404 (global, wired ở main.ts)
- `modules/visits/dto/query-visits.dto.ts`

### Endpoints + RBAC (guide mục 4.4)
| Endpoint | Roles | UC |
|---|---|---|
| `POST /visits` | RECEPTIONIST, ADMIN | UC-07 |
| `GET /visits?date&status` | RECEPTIONIST, DOCTOR, MANAGER, ADMIN | UC-08 |
| `POST /visits/:id/open-examination` | DOCTOR, ADMIN | UC-09 |
| `PATCH /examinations/:id` | DOCTOR, ADMIN | UC-10 |
| `GET /patients/:id/medical-history` | DOCTOR, MANAGER, ADMIN | UC-11 |

### Cleanup từ schema change
- `billing.service.ts`: `UNPAID→ISSUED`, `CANCELLED→VOID` (M2)
- `patients.service.ts`: sinh `patientCode` (M6); not-found → 404; citizenId trùng → 409
- Xóa `examinations/dto/set-diagnoses.dto.ts` + route `PUT /:id/diagnoses` (DEC-10)
- `seed.ts`: 5 roles/users, Disease catalog, RegulationVersion active

### Chưa làm / cần lưu ý
- [ ] **Chạy `npx prisma migrate dev`** khi có PostgreSQL (DB credentials hiện sai → migrate fail). Code đã đúng schema, client đã generate.
- [ ] Unit/integration test cho UC-07→UC-11 (guide mục 3, 6) — chưa viết
- [ ] Concurrency test (guide mục 6): 2 request tạo visit cùng lúc, 2 request mở cùng visit, quota gần đầy

### Hardening — DB constraints (guide mục 7, cần migration SQL riêng khi có DB)
Schema-level chưa enforce, thêm sau khi code chạy ổn:
```sql
-- 1 primary diagnosis / examination
CREATE UNIQUE INDEX "Diagnosis_one_primary_per_examination"
  ON "Diagnosis" ("examinationId") WHERE "isPrimary" = true;

-- chỉ 1 RegulationVersion active
CREATE UNIQUE INDEX "RegulationVersion_only_one_active"
  ON "RegulationVersion" ("isActive") WHERE "isActive" = true;

ALTER TABLE "Payment"          ADD CONSTRAINT "Payment_amount_positive"           CHECK ("amount" > 0);
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "InvoiceItem"      ADD CONSTRAINT "InvoiceItem_quantity_positive"      CHECK ("quantity" > 0);
```
> Hiện business rule (≤1 primary, payment>0...) đã enforce ở **service layer**. Các constraint trên là lớp bảo vệ thứ 2 ở DB, chống ghi sai qua đường khác.
