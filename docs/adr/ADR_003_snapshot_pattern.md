# ADR-003: Snapshot pattern cho dữ liệu tài chính

**Ngày:** 2026-05-15  
**Trạng thái:** ACCEPTED  
**Người quyết định:** Chơn Nhân

## Bối cảnh

Hệ thống có danh mục thuốc (Drug.price), danh mục dịch vụ (ServiceCatalog.price), quy định phí khám. Giá có thể thay đổi theo thời gian. Câu hỏi: InvoiceItem nên lưu giá tại thời điểm tạo hay reference đến catalog?

## Các lựa chọn đã xem xét

**Option A: Reference đến catalog (live price)**  
```prisma
model InvoiceItem {
  drugId String  // FK → Drug
  // tính giá = Drug.price tại thời điểm xem
}
```
- (+) Luôn có giá mới nhất  
- (-) Khi Drug.price thay đổi, hóa đơn cũ hiển thị sai giá  
- (-) Báo cáo tài chính tháng cũ sẽ sai nếu recompute  
- ❌ Không thể dùng cho tài chính  

**Option B: Snapshot tại thời điểm tạo** ← Chọn  
```prisma
model PrescriptionItem {
  unitPrice Decimal  // snapshot từ Drug.price lúc kê đơn
  lineTotal Decimal  // tính toán sẵn
}
model InvoiceItem {
  description String  // snapshot tên
  unitPrice   Decimal // snapshot giá
  lineTotal   Decimal
}
```
- (+) Hóa đơn bất biến — đúng chuẩn kế toán  
- (+) Báo cáo lịch sử luôn chính xác  
- (+) Không bị ảnh hưởng bởi thay đổi catalog sau này  
- (-) Cần logic copy giá tại thời điểm tạo (1 dòng code)  

## Quyết định

Chọn **Option B: Snapshot** cho tất cả bảng tài chính.

**Quy tắc:**
- `PrescriptionItem.unitPrice` = copy từ `Drug.price` lúc kê đơn
- `InvoiceItem.description` + `unitPrice` = copy tại lúc issue invoice
- `ServiceOrder.priceSnapshot` = copy từ `ServiceCatalog.price` lúc order
- `DispenseItem.unitPriceSnapshot` = copy từ `Drug.price` (hoặc `StockLot.unitCost`) lúc dispense

**Không áp dụng snapshot cho:**
- Prescription.note (không tài chính)
- Examination (không tài chính)

## Hậu quả

**Tốt hơn:**
- Audit trail tài chính chính xác tuyệt đối
- Compliance: hóa đơn không thay đổi sau khi phát hành
- Reports historical luôn đúng

**Khó hơn:**
- BillingService phải copy giá từ catalog tại thời điểm tạo invoice (acceptable, 2-3 dòng code)
- Không thể "cập nhật giá hóa đơn" — phải VOID và tạo mới

## Liên quan

- `backend/src/modules/billing/billing.service.ts`: logic copy giá
- `backend/src/modules/examinations/examinations.service.ts`: copy giá thuốc vào PrescriptionItem
- ADR-007: Regulation version immutable (cùng philosophy)
