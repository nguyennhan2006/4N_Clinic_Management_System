# ADR-008: FEFO (First Expired First Out) cho luồng phát thuốc

**Ngày:** 2026-06-18  
**Trạng thái:** ACCEPTED

## Bối cảnh

Khi dược sĩ phát thuốc theo đơn, hệ thống cần quyết định **chọn lô thuốc nào** khi cùng một loại thuốc có nhiều lô tồn kho với ngày hết hạn khác nhau. Hai chiến lược phổ biến:

- **FIFO (First In First Out):** Lấy lô nhập kho sớm nhất trước
- **FEFO (First Expired First Out):** Lấy lô gần hết hạn nhất trước

## Quyết định

Áp dụng **FEFO** làm chiến lược mặc định khi chọn lô thuốc để phát.

```
Ví dụ: Thuốc Paracetamol 500mg có 3 lô
  Lô A: nhập 2026-01-10, hết hạn 2026-08-01, còn 50 viên
  Lô B: nhập 2026-03-05, hết hạn 2026-12-31, còn 200 viên
  Lô C: nhập 2026-04-20, hết hạn 2027-06-30, còn 100 viên

→ FEFO chọn Lô A trước (hết hạn sớm nhất)
→ Nếu Lô A không đủ số lượng, tiếp tục lấy Lô B
```

## Lý do

1. **An toàn bệnh nhân:** Ưu tiên dùng thuốc gần hết hạn giúp tránh phát thuốc đã quá hạn
2. **Giảm lãng phí:** Lô cũ được dùng trước, giảm nguy cơ hủy thuốc hết hạn còn tồn kho
3. **Tiêu chuẩn ngành:** FEFO là thực hành chuẩn trong quản lý dược phẩm (GDP — Good Distribution Practice)
4. **Truy xuất nguồn gốc:** Ghi nhận lô cụ thể trong `DispenseItem` giúp recall thuốc khi có sự cố

## Hậu quả

- Service phát thuốc phải ORDER lô theo `expiry_date ASC` trước khi trừ tồn kho
- Một đơn thuốc có thể trừ từ **nhiều lô** nếu lô đầu không đủ số lượng — cần xử lý atomic trong `prisma.$transaction()`
- Khi nhập kho, bắt buộc ghi `expiry_date` — trường này NOT NULL trong `stock_lots`
- UI phát thuốc hiển thị lô được chọn tự động, dược sĩ có thể xem nhưng không override thứ tự FEFO

## Liên quan

- ADR-003: Snapshot pattern — `unit_price_snapshot` trong `DispenseItem` cùng philosophy
- `backend/src/modules/pharmacy/pharmacy.service.ts`
- `backend/src/modules/inventory/inventory.service.ts`
- `POST /pharmacy/dispenses`: endpoint phát thuốc
