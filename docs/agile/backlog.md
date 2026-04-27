# Backlog

## 1. Cách đọc backlog

- `Epic`: nhóm chức năng lớn
- `Task`: đơn vị công việc nhỏ để giao trong sprint
- `Priority`: P1 / P2 / P3
- `Dependency`: task phải xong trước

---

## 2. Epic E1 — Project Foundation

### Mục tiêu
Dựng nền tảng repo, kiến trúc, rules, setup local.

| ID | Task | Priority | Dependency |
|---|---|---|---|
| E1-T01 | tạo repo structure | P1 | - |
| E1-T02 | hoàn thiện docs business rules | P1 | - |
| E1-T03 | hoàn thiện role matrix | P1 | - |
| E1-T04 | hoàn thiện API scope | P1 | E1-T02, E1-T03 |
| E1-T05 | scaffold backend NestJS | P1 | - |
| E1-T06 | scaffold frontend React Vite | P1 | - |
| E1-T07 | init Prisma | P1 | E1-T05 |
| E1-T08 | tạo seed users/roles nền | P1 | E1-T07 |

---

## 3. Epic E2 — Auth & RBAC

### Mục tiêu
Đăng nhập được và chặn quyền đúng.

| ID | Task | Priority | Dependency |
|---|---|---|---|
| E2-T01 | tạo user/role/permission schema | P1 | E1-T07 |
| E2-T02 | login API | P1 | E2-T01 |
| E2-T03 | refresh API | P1 | E2-T02 |
| E2-T04 | me API | P1 | E2-T02 |
| E2-T05 | JWT guard | P1 | E2-T02 |
| E2-T06 | roles endpoint | P2 | E2-T01 |
| E2-T07 | assign roles API | P1 | E2-T01 |

---

## 4. Epic E3 — Patient

### Mục tiêu
Quản lý hồ sơ bệnh nhân.

| ID | Task | Priority | Dependency |
|---|---|---|---|
| E3-T01 | tạo patient schema | P1 | E1-T07 |
| E3-T02 | create patient API | P1 | E3-T01 |
| E3-T03 | search patient API | P1 | E3-T01 |
| E3-T04 | get patient detail API | P1 | E3-T01 |
| E3-T05 | update patient API | P2 | E3-T01 |
| E3-T06 | duplicate-check rule | P1 | E3-T01 |

---

## 5. Epic E4 — Visit Intake

### Mục tiêu
Lễ tân tạo lượt khám và quản lý danh sách khám ngày.

| ID | Task | Priority | Dependency |
|---|---|---|---|
| E4-T01 | tạo visit schema | P1 | E1-T07 |
| E4-T02 | tạo daily visit counter schema | P1 | E1-T07 |
| E4-T03 | create visit API | P1 | E4-T01, E4-T02, E3-T02 |
| E4-T04 | daily visit list API | P1 | E4-T01 |
| E4-T05 | assign doctor API | P2 | E2-T07, E4-T01 |
| E4-T06 | cancel visit API | P2 | E4-T01 |
| E4-T07 | enforce max patients per day | P1 | E8-T02, E4-T03 |

---

## 6. Epic E5 — Examination

### Mục tiêu
Bác sĩ mở khám, cập nhật bệnh án, hoàn tất khám.

| ID | Task | Priority | Dependency |
|---|---|---|---|
| E5-T01 | tạo examination schema | P1 | E4-T01 |
| E5-T02 | open examination API | P1 | E5-T01, E4-T03 |
| E5-T03 | update examination API | P1 | E5-T01 |
| E5-T04 | disease schema | P1 | E1-T07 |
| E5-T05 | examination diagnosis schema | P1 | E5-T01, E5-T04 |
| E5-T06 | update diagnoses API | P1 | E5-T05 |
| E5-T07 | complete examination API | P1 | E5-T03, E5-T06 |

---

## 7. Epic E6 — Prescription

### Mục tiêu
Kê đơn thuốc sau khi khám.

| ID | Task | Priority | Dependency |
|---|---|---|---|
| E6-T01 | drug schema | P1 | E1-T07 |
| E6-T02 | prescription schema | P1 | E5-T01 |
| E6-T03 | prescription item schema | P1 | E6-T02, E6-T01 |
| E6-T04 | create or upsert prescription API | P1 | E6-T02 |
| E6-T05 | add prescription item API | P1 | E6-T03 |
| E6-T06 | update prescription item API | P1 | E6-T03 |
| E6-T07 | finalize prescription API | P2 | E6-T05 |

---

## 8. Epic E7 — Billing & Payment

### Mục tiêu
Lập hóa đơn và ghi nhận thanh toán.

| ID | Task | Priority | Dependency |
|---|---|---|---|
| E7-T01 | invoice schema | P1 | E4-T01 |
| E7-T02 | invoice item schema | P1 | E7-T01 |
| E7-T03 | payment schema | P1 | E7-T01 |
| E7-T04 | create invoice API | P1 | E7-T01, E6-T05, E5-T07 |
| E7-T05 | get invoice detail API | P1 | E7-T01 |
| E7-T06 | record payment API | P1 | E7-T03 |
| E7-T07 | invoice list API | P1 | E7-T01 |

---

## 9. Epic E8 — Regulation

### Mục tiêu
Version hóa quy định cho ver1.

| ID | Task | Priority | Dependency |
|---|---|---|---|
| E8-T01 | regulation version schema | P1 | E1-T07 |
| E8-T02 | regulation value schema | P1 | E8-T01 |
| E8-T03 | current regulation API | P1 | E8-T02 |
| E8-T04 | create draft regulation version API | P2 | E8-T02 |
| E8-T05 | activate regulation version API | P1 | E8-T02 |

---

## 10. Epic E9 — Reporting

### Mục tiêu
Báo cáo tháng cơ bản cho quản lý.

| ID | Task | Priority | Dependency |
|---|---|---|---|
| E9-T01 | monthly summary query | P2 | E7-T06 |
| E9-T02 | monthly revenue query | P2 | E7-T06 |
| E9-T03 | disease breakdown query | P2 | E5-T06 |
| E9-T04 | drug usage query | P3 | E6-T05 |
| E9-T05 | reports API | P2 | E9-T01, E9-T02 |

---

## 11. Epic E10 — Demo & QA

### Mục tiêu
Giữ dữ liệu demo, test cases và regression checklist sẵn sàng.

| ID | Task | Priority | Dependency |
|---|---|---|---|
| E10-T01 | seed demo data | P1 | E3-T01, E4-T01, E6-T01 |
| E10-T02 | smoke test script | P1 | E2–E7 |
| E10-T03 | demo script | P1 | E2–E9 |
| E10-T04 | regression checklist | P1 | E2–E9 |
