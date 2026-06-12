# ADR-005: Visit.appointmentId FK direction (ngoại lệ của ADR-002)

**Ngày:** 2026-05-20  
**Trạng thái:** ACCEPTED  
**Liên quan:** ADR-002 (FK direction)

## Bối cảnh

ADR-002 quy định FK đặt ở extension table (child). Tuy nhiên Appointment → Visit là trường hợp đặc biệt: khi check-in, Visit được tạo từ Appointment. Nên đặt `Appointment.visitId` hay `Visit.appointmentId`?

## Quyết định

Giữ **`Visit.appointmentId`** (FK ở child = Visit), đây là ngoại lệ có ý thức của ADR-002.

**Lý do:**
1. **Nullable ở đúng bảng:** Walk-in visits không có appointment → `Visit.appointmentId = null` là tự nhiên. Đặt FK ở Appointment sẽ cần `Appointment.visitId = null` (SCHEDULED appointment chưa có visit), cũng nullable nhưng ít rõ nghĩa hơn.
2. **Unique constraint:** `Visit.appointmentId @unique` đảm bảo 1 appointment chỉ check-in 1 lần. Đặt FK ở Appointment cần thêm constraint phức tạp hơn.
3. **visitSource:** `Visit.visitSource` (WALK_IN/APPOINTMENT) cần đặt ở Visit, và nó có semantic relationship với `Visit.appointmentId`.
4. **FK ownership:** Visit "biết" nó đến từ đâu (appointment hay walk-in). Appointment không cần biết nó tạo ra visit nào.

## Hậu quả

- OQ-004 (open question) đã được resolved: giữ `Visit.appointmentId`
- Appointment model không có FK đến Visit → clean
- `Visit.appointmentId @unique` là DB-level idempotency check cho check-in

## Liên quan

- ADR-002: FK direction rule (parent document)
- `backend/prisma/schema.prisma`: `Visit.appointmentId String? @unique`
- CF-007, CF-008: visitSource + doctorProfileId cũng cần thêm vào Visit
