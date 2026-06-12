# Phase 2A Task Index

> Project: 4N Clinic Management System  
> Phase: 2A — Full clinic flow (appointment → dispense)  
> Tổng số task: 8 (00–07)

---

## Dependency Graph

```
Task 00 (Hardening)
    │
    ▼
Task 01 (Schema Migration)
    │
    ├──────────────────────────────────────┐
    │                                      │
    ▼                                      ▼
Task 02 (Organization)         Task 05 (Inventory + Pharmacy) ─┐
    │                                                            │
    ▼                                                            │
Task 03 (Appointment + Queue)                                   │
    │ (parallel với Task 04)                                     │
Task 04 (Vitals + Service + Lab) ─────────────────────────────┤
    │                                                            │
    └────────────────────┬───────────────────────────────────────┘
                         ▼
                   Task 06 (Billing Extended)
                         │
                         ▼
                   Task 07 (Integration QA)
```

---

## Tổng quan tasks

| Task | File | Branch | Phụ thuộc | Người làm | Estimated |
|------|------|--------|-----------|-----------|-----------|
| 00 | [00-hardening.md](00-hardening.md) | `fix/phase1-hardening` | Không có | 1 người | 2–3 ngày |
| 01 | [01-schema-migration.md](01-schema-migration.md) | `feat/phase2-schema` | Task 00 merged | 1 người (Backend Arch) | 1 ngày |
| 02 | [02-organization.md](02-organization.md) | `feat/phase2-organization` | Task 01 merged | 1 người | 2–3 ngày |
| 03 | [03-appointment-queue.md](03-appointment-queue.md) | `feat/phase2-appointment` | Task 01+02 merged | 1 người | 3–4 ngày |
| 04 | [04-vitals-service-order.md](04-vitals-service-order.md) | `feat/phase2-clinical` | Task 01+02 merged | 1 người | 3–4 ngày |
| 05 | [05-inventory-pharmacy.md](05-inventory-pharmacy.md) | `feat/phase2-pharmacy` | Task 01 merged | 1 người | 3–4 ngày |
| 06 | [06-billing-extended.md](06-billing-extended.md) | `feat/phase2-billing-extended` | Task 01+04+05 merged | 1 người | 2–3 ngày |
| 07 | [07-integration-qa.md](07-integration-qa.md) | `feat/phase2-integration` | Tất cả 00–06 merged | Toàn team | 1–2 ngày |

**Tổng estimated:** 17–24 ngày dev (4 người làm song song: ~5–7 ngày thực tế)

---

## Phân công gợi ý cho team 4 người

### Người 1 — Backend Architect
- Task 00 (subtasks A, D)
- Task 01 (schema migration)
- Review PR của người khác

### Người 2 — Full-stack A
- Task 00 (subtasks B, C) sau khi 01 merge
- Task 02 (Organization)
- Task 03 (Appointment + Queue)

### Người 3 — Full-stack B
- Task 04 (Vitals + Service + Lab) — song song với Task 03
- Task 06 (Billing Extended) — sau khi Task 04 + 05 merge

### Người 4 — Full-stack C
- Task 05 (Inventory + Pharmacy) — song song với Task 03+04
- Task 07 (Integration QA) — cuối cùng

---

## Thứ tự merge vào develop

```
1. fix/phase1-hardening     (Task 00)
2. feat/phase2-schema       (Task 01) ← block mọi thứ phía dưới
3. feat/phase2-organization (Task 02)
4. feat/phase2-appointment  (Task 03) ]
   feat/phase2-clinical     (Task 04) ] song song
   feat/phase2-pharmacy     (Task 05) ]
5. feat/phase2-billing-extended (Task 06)
6. feat/phase2-integration  (Task 07)
```

---

## Quy tắc chung

1. **Không sửa schema.prisma** sau khi Task 01 merged — nếu cần sửa schema, mở PR riêng và merge vào Task 01 trước khi ai bắt đầu task khác.

2. **Không thay đổi file của task khác** — mỗi task có danh sách "Files được sửa" và "Files không được sửa" rõ ràng.

3. **Mỗi task phải pass build và lint** trước khi merge — không merge broken code.

4. **Audit log** cho mọi action quan trọng — pattern chuẩn xem trong Task 00-D.

5. **prisma.$transaction()** cho mọi operation có nhiều writes — không atomic nghĩa là bug.

6. **Không invent API endpoint** ở frontend — chỉ dùng endpoints đã implement ở backend task tương ứng.

---

## Files không được sửa bởi bất kỳ task Phase 2 nào

- `backend/prisma/schema.prisma` (chỉ Task 01 được sửa)
- `backend/src/modules/auth/` (chỉ Task 00-D thêm audit log)
- `backend/src/common/` (chỉ Task 00 thêm ROLES constant)
- `frontend/src/lib/api-client.ts` (đã ổn định)
- `frontend/src/lib/auth.ts` (đã ổn định)
