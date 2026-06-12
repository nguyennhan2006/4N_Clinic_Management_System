# ADR-006: UUID cho Primary Keys

**Ngày:** 2026-05-15  
**Trạng thái:** ACCEPTED

## Bối cảnh

Cần chọn kiểu primary key: UUID, BIGINT serial, hay ULID.

## Quyết định

Dùng **UUID v4** (`@default(uuid())`) cho tất cả entities.

**Lý do:**
1. **No sequential leak:** BIGINT serial để lộ business data (số lượng records, growth rate). UUID không leak thông tin.
2. **Distributed friendly:** Nếu sau này cần shard hay merge data từ multiple sources, UUID không conflict.
3. **Prisma default:** `@default(uuid())` built-in, zero configuration.
4. **Frontend safe:** ID trong URL không predictable (security through obscurity).

**Trade-off chấp nhận:**
- UUID (128-bit) tốn gấp 2x không gian so với BIGINT (64-bit) — chấp nhận được với quy mô phòng mạch
- UUID non-sequential → B-tree index fragmentation cao hơn BIGINT — không đáng kể với < 1M records
- Nếu cần sequential UUID: dùng `cuid()` hoặc `ulid()` — có thể migrate sau nếu cần

## Liên quan

- Tất cả models trong `backend/prisma/schema.prisma`
