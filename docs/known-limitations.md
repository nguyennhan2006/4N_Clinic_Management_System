# Known Limitations — Phase 1

Danh sách các giới hạn kỹ thuật đã biết, chưa xử lý trong Phase 1.

---

## KL-01 — Không thể tạo lại lượt khám trong ngày sau khi huỷ

**Ảnh hưởng:** UC-06 `POST /visits`

**Mô tả:**
Schema hiện tại có constraint:
```
@@unique([patientId, visitDate])
```
Constraint này không lọc theo `status`, nên một bệnh nhân đã có visit CANCELLED trong ngày vẫn không thể đăng ký lại — DB sẽ trả P2002 Conflict.

Logic code trong `VisitsService.create()` chỉ chặn khi có visit **active** (WAITING / IN_EXAMINATION / COMPLETED), nhưng constraint DB cứng hơn.

**Workaround hiện tại:** Không có. Receptionist phải dùng ngày khác hoặc chờ.

**Fix cho Phase 2:**
Xoá constraint `@@unique([patientId, visitDate])` và thay bằng **partial unique index** trên PostgreSQL:
```sql
CREATE UNIQUE INDEX visit_patient_date_active_uidx
  ON "Visit" ("patientId", "visitDate")
  WHERE status NOT IN ('CANCELLED');
```
Prisma hiện chưa hỗ trợ partial index trong schema — cần migration SQL thủ công.

---

## KL-02 — RegulationsService chưa được wiring vào VisitsService

**Ảnh hưởng:** UC-06 daily limit check

**Mô tả:**
`VisitsService.getMaxPatientsPerDay()` đọc trực tiếp Prisma thay vì qua `RegulationsService`.
`RegulationsService` hiện chỉ là stub `getCurrent() → null`.

**Workaround hiện tại:** Fallback về 40 nếu không có regulation version active.

**Fix cho Phase 2:** Implement đầy đủ `RegulationsService.getCurrent()` và inject vào `VisitsModule`.

---

## KL-03 — REGISTERED enum value không dùng trong Phase 1

**Ảnh hưởng:** `VisitStatus` enum

**Mô tả:**
`REGISTERED` được giữ trong enum để tránh breaking migration. `POST /visits` tạo thẳng status `WAITING`.
Nếu Phase 2 cần flow 2 bước (tiếp nhận → chờ khám), `REGISTERED` sẽ được activate.
