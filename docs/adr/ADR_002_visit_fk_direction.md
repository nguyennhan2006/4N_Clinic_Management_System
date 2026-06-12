# ADR-002: FK direction cho 1:1 relationships với Visit

**Ngày:** 2026-05-15  
**Trạng thái:** ACCEPTED  
**Người quyết định:** Chơn Nhân + Đức Nguyên

## Bối cảnh

Visit là core entity, có nhiều 1:1 relationships: Examination, Invoice, QueueTicket, VitalSign, Prescription (qua Examination). Câu hỏi: FK nên đặt ở Visit hay ở bảng liên quan?

Ví dụ: `Visit.examinationId` hay `Examination.visitId`?

## Các lựa chọn đã xem xét

**Option A: FK ở Visit (parent có FK đến child)**  
```prisma
model Visit {
  examinationId String? @unique
  invoiceId     String? @unique
  queueTicketId String? @unique
}
```
- (+) Visit là hub, truy vấn từ Visit không cần JOIN phức tạp  
- (-) Visit phải biết về mọi extension module → coupling cao  
- (-) Khi thêm module mới (VitalSign, ServiceOrder) lại phải sửa Visit schema  
- (-) Circular dependency potential: Visit ↔ Examination  

**Option B: FK ở extension table (child có FK đến parent)** ← Chọn  
```prisma
model Examination {
  visitId String @unique  // FK → Visit
}
model Invoice {
  visitId String @unique  // FK → Visit
}
```
- (+) Visit không cần biết về extensions → Visit schema ổn định  
- (+) Thêm extension mới không sửa Visit (chỉ thêm bảng mới)  
- (+) Standard one-to-one pattern trong relational DB  
- (-) Truy vấn Visit + Examination cần JOIN (acceptable, Prisma handle)  

## Quyết định

Chọn **Option B: FK luôn ở extension table**.

Quy tắc: Entity "phụ thuộc vào" entity kia thì FK đặt ở đó. Examination không tồn tại nếu không có Visit → `Examination.visitId`. Visit tồn tại độc lập → không có FK đến Examination.

**Ngoại lệ có ý thức (Phase 2A):**
- `Visit.appointmentId` — đặt FK ở Visit vì:
  1. Visit cần biết nó được tạo từ appointment hay walk-in (visitSource)
  2. Appointment là optional FK (nullable) → phù hợp đặt ở bảng có NULL
  3. Cho phép unique constraint `@unique` dễ hơn ở Visit

## Hậu quả

**Tốt hơn:**
- Visit schema không thay đổi khi thêm Phase 2A modules
- Module mới (VitalSign, ServiceOrder) chỉ cần thêm FK vào model mới
- Không có circular dependency

**Khó hơn:**
- Truy vấn "Get Visit với Examination" cần `include: { examination: true }` (acceptable)
- Eager loading cẩn thận để tránh N+1

## Liên quan

- ADR-005: Visit.appointmentId FK direction (ngoại lệ)
- `backend/prisma/schema.prisma`: Examination.visitId, Invoice.visitId, QueueTicket.visitId, VitalSign.visitId
