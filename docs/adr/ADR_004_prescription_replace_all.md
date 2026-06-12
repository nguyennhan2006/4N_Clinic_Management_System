# ADR-004: Prescription dùng replace-all (upsert) strategy

**Ngày:** 2026-05-15  
**Trạng thái:** ACCEPTED

## Bối cảnh

Bác sĩ kê đơn thuốc trong quá trình khám, có thể chỉnh sửa nhiều lần trước khi hoàn tất. Câu hỏi: API kê đơn nên là append (thêm từng thuốc) hay replace-all (gửi toàn bộ đơn)?

## Quyết định

**Replace-all (upsert):** `PUT /examinations/:id/prescription` nhận toàn bộ danh sách thuốc, xóa items cũ và tạo lại.

**Lý do:** Giao diện bác sĩ hiển thị toàn bộ đơn thuốc, chỉnh sửa trực tiếp (thêm/bỏ/sửa số lượng). Việc gửi toàn bộ state đơn giản hơn nhiều so với tracking từng operation (add/remove/update item) ở frontend. Số lượng item trong 1 đơn thuốc nhỏ (thường < 10).

**Atomic transaction:** Xóa items cũ + tạo items mới trong `$transaction` để không có trạng thái inconsistent.

## Hậu quả

- Frontend không cần manage diff, chỉ gửi current state
- Không có partial update — không thể "thêm 1 thuốc" mà không gửi lại toàn bộ
- Không dùng được cho đơn thuốc đã COMPLETED (service check status)

## Liên quan

- `backend/src/modules/examinations/examinations.service.ts`: `upsertPrescription()`
- `PUT /examinations/:id/prescription`
