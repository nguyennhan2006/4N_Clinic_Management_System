# ADR-007: Regulation version là immutable append-only

**Ngày:** 2026-05-15  
**Trạng thái:** ACCEPTED

## Bối cảnh

Phòng mạch có các quy định vận hành thay đổi theo thời gian: phí khám, số lượng bệnh nhân tối đa/ngày. Câu hỏi: khi thay đổi quy định, có UPDATE record cũ không?

## Quyết định

**Không UPDATE quy định cũ.** Mỗi thay đổi tạo `RegulationVersion` mới. Activate version mới deactivate version cũ (qua `$transaction`).

```
RegulationVersion 1 (isActive=false)  ← visits tháng 1 dùng version này
RegulationVersion 2 (isActive=true)   ← visits hiện tại dùng version này
```

Visit lúc tạo đọc `regulations/current` → lấy active version → áp dụng rules.

**Lý do:**
1. **Audit trail:** Biết quy định phòng mạch thay đổi khi nào, thay đổi gì
2. **Historical correctness:** Báo cáo tháng cũ dùng đúng quy định của tháng đó
3. **Rollback:** Có thể re-activate version cũ nếu cần
4. **Dispute resolution:** Khi có tranh chấp về phí khám, biết chính xác quy định tại thời điểm đó

## Hậu quả

- Không thể "sửa typo" trong quy định cũ — phải tạo version mới
- Cần UI hiển thị lịch sử các versions (TD-008)
- RegulationItem dùng key-value → thêm rule mới không cần migration

## Liên quan

- ADR-003: Snapshot pattern (cùng philosophy về immutability)
- `backend/src/modules/regulations/regulations.service.ts`
- `GET /regulations/current`: trả về active version
