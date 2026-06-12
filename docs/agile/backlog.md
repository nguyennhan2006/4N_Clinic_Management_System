# Backlog

## 1. Cách đọc backlog

- `Epic`: nhóm chức năng lớn
- `Task`: đơn vị công việc nhỏ để giao trong sprint
- `Priority`: P1 / P2 / P3
- `Dependency`: task phải xong trước
- `Status`: ✅ DONE / 🔄 PARTIAL / ❌ TODO

> **Cập nhật lần cuối: 2026-05-18** — sau khi hoàn thành UC-12 → UC-20 (Bước 6).
> Các task DONE đã qua build + lint + e2e test (104/104 pass).

---

## 2. Epic E1 — Project Foundation

### Mục tiêu
Dựng nền tảng repo, kiến trúc, rules, setup local.

| ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| E1-T01 | tạo repo structure | P1 | - | ✅ DONE |
| E1-T02 | hoàn thiện docs business rules | P1 | - | ✅ DONE |
| E1-T03 | hoàn thiện role matrix | P1 | - | ✅ DONE |
| E1-T04 | hoàn thiện API scope | P1 | E1-T02, E1-T03 | ✅ DONE |
| E1-T05 | scaffold backend NestJS | P1 | - | ✅ DONE |
| E1-T06 | scaffold frontend React Vite | P1 | - | ❌ TODO |
| E1-T07 | init Prisma + migrate | P1 | E1-T05 | ✅ DONE |
| E1-T08 | seed users/roles/drugs/diseases/regulation | P1 | E1-T07 | ✅ DONE |

---

## 3. Epic E2 — Auth & RBAC

### Mục tiêu
Đăng nhập được và chặn quyền đúng.

| ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| E2-T01 | user/role schema + JwtAuthGuard + RolesGuard | P1 | E1-T07 | ✅ DONE |
| E2-T02 | login API (`POST /auth/login`) | P1 | E2-T01 | ✅ DONE |
| E2-T03 | refresh token API | P1 | E2-T02 | ❌ TODO |
| E2-T04 | me API (`GET /auth/me`) | P1 | E2-T02 | ✅ DONE |
| E2-T05 | JWT guard + Roles guard toàn hệ thống | P1 | E2-T02 | ✅ DONE |
| E2-T06 | roles endpoint (list roles) | P2 | E2-T01 | ❌ TODO |
| E2-T07 | assign role API cho user | P1 | E2-T01 | ❌ TODO |

**Ghi chú:** `JWT_REFRESH_SECRET` đã khai báo trong `.env.example` nhưng refresh flow chưa implement.

---

## 4. Epic E3 — Patient

### Mục tiêu
Quản lý hồ sơ bệnh nhân.

| ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| E3-T01 | patient schema (patientCode, indexes) | P1 | E1-T07 | ✅ DONE |
| E3-T02 | create patient API + sinh patientCode `BN-000001` | P1 | E3-T01 | ✅ DONE |
| E3-T03 | search patient API (fullName, phone, citizenId, patientCode) | P1 | E3-T01 | ✅ DONE |
| E3-T04 | get patient detail API | P1 | E3-T01 | ✅ DONE |
| E3-T05 | update patient API | P2 | E3-T01 | ❌ TODO |
| E3-T06 | duplicate-check cứng theo `citizenId` | P1 | E3-T01 | ✅ DONE |
| E3-T07 | duplicate-check mềm (fullName + dob + phone) — BR-03 | P1 | E3-T01 | ❌ TODO |

**Ghi chú:** BR-03 yêu cầu cảnh báo trùng ngay cả khi không có `citizenId`. Hiện chỉ chặn theo `citizenId`. Cần thêm soft-check trả warning (không block) cho tổ hợp `fullName + dob + phone`.

---

## 5. Epic E4 — Visit Intake

### Mục tiêu
Lễ tân tạo lượt khám và quản lý danh sách khám ngày.

| ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| E4-T01 | visit schema (@@unique, indexes, VisitStatus enum) | P1 | E1-T07 | ✅ DONE |
| E4-T02 | quota check tích hợp vào create visit | P1 | E1-T07 | ✅ DONE |
| E4-T03 | create visit API — UC-07 (queue number Serializable) | P1 | E4-T01, E3-T02 | ✅ DONE |
| E4-T04 | daily visit list API — UC-08 (filter date, status) | P1 | E4-T01 | ✅ DONE |
| E4-T05 | assign doctor API | P2 | E2-T07, E4-T01 | ❌ TODO |
| E4-T06 | cancel visit API (`PATCH /visits/:id/cancel`) | P2 | E4-T01 | ❌ TODO |
| E4-T07 | enforce max patients per day từ regulation | P1 | E8-T02, E4-T03 | ✅ DONE |
| E4-T08 | confirm visit API (`REGISTERED → WAITING`) | P1 | E4-T01 | ❌ TODO |
| E4-T09 | phân trang `GET /visits` | P2 | E4-T04 | ❌ TODO |

**Ghi chú:**
- E4-T08 là task **mới phát hiện**: business rules định nghĩa `REGISTERED → WAITING` là 2 bước tách biệt, nhưng hiện tại visit tạo ra trực tiếp ở `WAITING`. Cần quyết định team: giữ 1 bước hay triển khai đúng 2 bước.
- E4-T09: danh sách không có `limit/offset` — khi 40 BN/ngày sẽ trả toàn bộ.

---

## 6. Epic E5 — Examination

### Mục tiêu
Bác sĩ mở khám, cập nhật bệnh án, hoàn tất khám.

| ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| E5-T01 | examination schema (ExaminationStatus enum) | P1 | E4-T01 | ✅ DONE |
| E5-T02 | open examination API — UC-09 | P1 | E5-T01, E4-T03 | ✅ DONE |
| E5-T03 | update examination API — UC-10 (symptoms, notes, conclusion) | P1 | E5-T01 | ✅ DONE |
| E5-T04 | disease schema (Disease model, ICD catalog) | P1 | E1-T07 | ✅ DONE |
| E5-T05 | diagnosis schema (snapshot Disease.name) | P1 | E5-T01, E5-T04 | ✅ DONE |
| E5-T06 | update diagnoses API (merge vào PATCH /examinations/:id) | P1 | E5-T05 | ✅ DONE |
| E5-T07 | complete examination API — UC-10 | P1 | E5-T03, E5-T06 | ✅ DONE |
| E5-T08 | validate doctor active khi mở khám — BR-09 | P1 | E5-T02 | ✅ DONE |
| E5-T09 | disease catalog API (GET/POST/PATCH /diseases) | P2 | E5-T04 | ✅ DONE |

**Ghi chú:**
- E5-T08 là task **mới phát hiện**: UC-09 lấy `doctorUserId` từ JWT nhưng không verify `user.status === ACTIVE`. Nếu account bị khoá sau khi đăng nhập vẫn mở được khám.
- E5-T09: frontend cần endpoint để hiển thị dropdown chọn bệnh khi PATCH /examinations/:id.

---

## 7. Epic E6 — Prescription

### Mục tiêu
Kê đơn thuốc sau khi khám.

| ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| E6-T01 | drug schema (isActive, price) | P1 | E1-T07 | ✅ DONE |
| E6-T02 | prescription schema | P1 | E5-T01 | ✅ DONE |
| E6-T03 | prescription item schema (@@unique[prescriptionId, drugId]) | P1 | E6-T02, E6-T01 | ✅ DONE |
| E6-T04 | create prescription API (tạo nguyên toa, không add từng item) | P1 | E6-T02 | ✅ DONE |
| E6-T05 | validate quantity > 0 trong DTO — BR-13 | P1 | E6-T04 | ✅ DONE |
| E6-T06 | update prescription API — UC-12 replace-all (PUT /examinations/:id/prescription) | P2 | E6-T03 | ✅ DONE |
| E6-T07 | drug catalog API (GET/POST/PATCH /drugs) | P2 | E6-T01 | ✅ DONE |

**Ghi chú:**
- E6-T05 là task **mới phát hiện**: `CreatePrescriptionDto` thiếu `@Min(1)` trên field `quantity`. BR-13 yêu cầu rõ ràng.
- E6-T06: hiện tại prescription chỉ tạo được 1 lần (toàn bộ items cùng lúc), không update sau. Cần nếu bác sĩ muốn sửa toa sau khi tạo.

---

## 8. Epic E7 — Billing & Payment

### Mục tiêu
Lập hóa đơn và ghi nhận thanh toán.

| ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| E7-T01 | invoice schema (InvoiceStatus enum đầy đủ) | P1 | E4-T01 | ✅ DONE |
| E7-T02 | invoice item schema (snapshot giá) | P1 | E7-T01 | ✅ DONE |
| E7-T03 | payment schema | P1 | E7-T01 | ✅ DONE |
| E7-T04 | create invoice API (từ visit COMPLETED) | P1 | E7-T01, E6-T04, E5-T07 | ✅ DONE |
| E7-T05 | get invoice detail API | P1 | E7-T01 | ✅ DONE |
| E7-T06 | record payment API (BR-16 check overpayment) | P1 | E7-T03 | ✅ DONE |
| E7-T07 | invoice list API (GET /invoices?keyword&status&date) | P1 | E7-T01 | ✅ DONE |
| E7-T08 | đọc CONSULTATION_FEE từ regulation thay vì hardcode | P1 | E8-T03 | ✅ DONE |

**Ghi chú:**
- E7-T08 là task **mới phát hiện**: `billing.service.ts` đang hardcode `EXAMINATION_FEE = 100_000` thay vì đọc `CONSULTATION_FEE` từ `RegulationVersion` active. Cần sửa tương tự cách `visits.service` đọc `MAX_PATIENTS_PER_DAY`.

---

## 9. Epic E8 — Regulation

### Mục tiêu
Version hóa quy định cho ver1.

| ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| E8-T01 | RegulationVersion schema | P1 | E1-T07 | ✅ DONE |
| E8-T02 | RegulationItem schema | P1 | E8-T01 | ✅ DONE |
| E8-T03 | get current regulation API | P1 | E8-T02 | ✅ DONE |
| E8-T04 | create draft regulation version API | P2 | E8-T02 | ✅ DONE |
| E8-T05 | activate regulation version API (BR-18) | P1 | E8-T02 | ✅ DONE |

---

## 10. Epic E9 — Reporting

### Mục tiêu
Báo cáo tháng cơ bản cho quản lý.

| ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| E9-T01 | monthly visit count query (BR-20) | P2 | E7-T06 | ✅ DONE |
| E9-T02 | monthly revenue query (BR-20) | P2 | E7-T06 | ✅ DONE |
| E9-T03 | disease breakdown query (BR-20) | P2 | E5-T06 | ❌ TODO |
| E9-T04 | drug usage query | P3 | E6-T04 | ❌ TODO |
| E9-T05 | reports API (`GET /reports/monthly`) | P2 | E9-T01, E9-T02 | ✅ DONE |

---

## 11. Epic E10 — Demo & QA

### Mục tiêu
Giữ dữ liệu demo, test cases và regression checklist sẵn sàng.

| ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| E10-T01 | seed demo data (roles, users, drugs, diseases, regulation) | P1 | E3-T01, E4-T01, E6-T01 | ✅ DONE |
| E10-T02 | e2e test auth + RBAC | P1 | E2–E3 | ✅ DONE |
| E10-T03 | e2e test clinic flow UC-07 → UC-11 | P1 | E4–E6 | ✅ DONE |
| E10-T06 | e2e test billing & catalog flow UC-12 → UC-20 | P1 | E6–E9 | ✅ DONE |
| E10-T04 | demo script đầy đủ | P1 | E2–E9 | ❌ TODO |
| E10-T05 | regression checklist | P1 | E2–E9 | ❌ TODO |

---

## 12. Danh sách nợ kỹ thuật phát hiện sau UC-07 → UC-11

Các task mới sinh ra từ quá trình review implementation. Cần ưu tiên trong sprint tiếp theo.

| ID | Mô tả | Priority | Liên quan | Gốc |
|---|---|---|---|---|
| DEBT-01 | `REGISTERED → WAITING` chưa có API riêng — visit tạo ra trực tiếp `WAITING` | P1 | E4-T08 | UC-07 lệch business rules |
| DEBT-02 | Validate doctor `status === ACTIVE` khi mở khám | P1 | E5-T08 | ✅ Fixed Bước 6 |
| DEBT-03 | `quantity > 0` trong `CreatePrescriptionDto` | P1 | E6-T05 | ✅ Fixed Bước 4 |
| DEBT-04 | `CONSULTATION_FEE` hardcode trong billing.service — cần đọc từ regulation | P1 | E7-T08 | ✅ Fixed Bước 6 |
| DEBT-05 | Soft duplicate check bệnh nhân (fullName + dob + phone) | P1 | E3-T07 | BR-03 chưa đủ |
| DEBT-06 | Phân trang `GET /visits` và `GET /patients/:id/medical-history` | P2 | E4-T09 | Scale |
| DEBT-07 | Update prescription sau khi tạo | P2 | E6-T06 | ✅ Fixed Bước 6 (PUT replace-all) |
| DEBT-08 | Drug catalog API + Disease catalog API cho frontend dropdown | P2 | E5-T09, E6-T07 | ✅ Fixed Bước 6 |
| DEBT-09 | Refresh token flow | P1 | E2-T03 | Security |
| DEBT-10 | DB hardening constraints (partial index: 1 primary diagnosis, 1 active regulation) | P2 | schema | Từ PLAN.md |

---

## 13. Tổng kết tiến độ

| Epic | Tổng tasks | Done | Partial | Todo |
|------|-----------|------|---------|------|
| E1 Foundation | 8 | 7 | 0 | 1 |
| E2 Auth & RBAC | 7 | 4 | 0 | 3 |
| E3 Patient | 7 | 5 | 0 | 2 |
| E4 Visit Intake | 9 | 5 | 0 | 4 |
| E5 Examination | 9 | 9 | 0 | 0 |
| E6 Prescription | 7 | 7 | 0 | 0 |
| E7 Billing | 8 | 8 | 0 | 0 |
| E8 Regulation | 5 | 5 | 0 | 0 |
| E9 Reporting | 5 | 3 | 0 | 2 |
| E10 Demo & QA | 6 | 4 | 0 | 2 |
| **TOTAL** | **71** | **57** | **0** | **14** |

**Tiến độ backend:** ~80% task hoàn thành. E2e test: **104/104 pass**.

**Ưu tiên sprint tiếp theo (P1 còn lại):**
1. DEBT-01 — Chốt team: `REGISTERED → WAITING` 1 hay 2 bước
2. DEBT-05 — Soft duplicate check bệnh nhân (fullName + dob + phone)
3. DEBT-09 — Refresh token (`POST /auth/refresh`)
4. E1-T06 — Scaffold frontend React + Vite
5. DEBT-10 — DB partial index constraints
6. E3-T05 — Update patient API (`PATCH /patients/:id`)
