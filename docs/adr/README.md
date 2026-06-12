# Architecture Decision Records (ADR)
## 4N Clinic Management System

ADR (Architecture Decision Record) ghi lại các quyết định kiến trúc quan trọng: **quyết định gì, tại sao, trade-off là gì**.

Mục đích: bất kỳ thành viên team hay AI assistant nào đọc cũng hiểu được *tại sao* code lại như vậy, thay vì chỉ biết *nó là gì*.

---

## Template

```markdown
# ADR-NNN: Tiêu đề ngắn

**Ngày:** YYYY-MM-DD  
**Trạng thái:** PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED by ADR-NNN  
**Người quyết định:** [tên/role]

## Bối cảnh
[Vấn đề gì cần quyết định và tại sao nó quan trọng]

## Các lựa chọn đã xem xét
[Option A, B, C với ưu/nhược của từng lựa chọn]

## Quyết định
[Chọn lựa nào và lý do cụ thể]

## Hậu quả
[Điều gì trở nên tốt hơn/dễ hơn và điều gì trở nên khó hơn]

## Liên quan
[ADR khác, code files, docs]
```

---

## Index

| ADR | Tiêu đề | Trạng thái |
|---|---|---|
| [ADR-001](ADR_001_modular_monolith.md) | Chọn Modular Monolith thay vì Microservices | ACCEPTED |
| [ADR-002](ADR_002_visit_fk_direction.md) | FK direction cho 1:1 relationships | ACCEPTED |
| [ADR-003](ADR_003_snapshot_pattern.md) | Snapshot pattern cho dữ liệu tài chính | ACCEPTED |
| [ADR-004](ADR_004_prescription_replace_all.md) | Prescription dùng replace-all strategy | ACCEPTED |
| [ADR-005](ADR_005_visit_appointmentId_fk.md) | Visit.appointmentId thay vì Appointment.visitId | ACCEPTED |
| [ADR-006](ADR_006_uuid_primary_keys.md) | UUID cho primary keys | ACCEPTED |
| [ADR-007](ADR_007_regulation_version_immutable.md) | Regulation version là immutable append-only | ACCEPTED |
