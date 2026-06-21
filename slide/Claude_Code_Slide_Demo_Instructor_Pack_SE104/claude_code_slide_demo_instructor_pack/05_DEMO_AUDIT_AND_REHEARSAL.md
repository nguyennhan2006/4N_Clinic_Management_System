# DEMO AUDIT VÀ REHEARSAL

## 1. Mục tiêu

Chứng minh demo có thể chạy ổn định trên đúng máy, đúng branch, đúng database và đúng bộ dữ liệu sẽ dùng khi trình bày.

## 2. Chọn luồng demo

Ưu tiên luồng end-to-end có giá trị rõ:

```text
Đăng nhập → bệnh nhân → lượt khám → khám/chẩn đoán/kê đơn → hóa đơn/thanh toán
```

Tiêu chí chọn:

- chạy được trong 90-100 giây;
- tối đa 2-3 lần đổi role;
- dữ liệu đầu vào đã chuẩn bị;
- có kết quả nhìn thấy được;
- có thể reset;
- không phụ thuộc dịch vụ Internet bên ngoài;
- không chứa dữ liệu nhạy cảm.

## 3. Preflight checklist

### Máy và môi trường

- [ ] Đúng branch/tag/commit.
- [ ] Working tree sạch hoặc thay đổi đã biết.
- [ ] Node/package manager/database version đúng.
- [ ] Backend và frontend build được.
- [ ] Port không xung đột.
- [ ] Đồng hồ hệ thống và timezone đúng nếu nghiệp vụ phụ thuộc ngày.
- [ ] Tắt thông báo, update, VPN hoặc phần mềm gây popup.

### Database

- [ ] Có database demo riêng.
- [ ] Có seed idempotent hoặc reset script an toàn.
- [ ] Không dùng dữ liệu bệnh nhân thật.
- [ ] Có đủ catalog bệnh/thuốc/dịch vụ.
- [ ] Có thể khôi phục trạng thái trong dưới 60 giây.

### Tài khoản

- [ ] Tài khoản từng role hoạt động.
- [ ] Password không hiển thị trên slide.
- [ ] Session/token không hết hạn giữa demo.
- [ ] Có tài khoản dự phòng.

### UI/API

- [ ] Không có lỗi console chặn.
- [ ] API health check pass.
- [ ] Không có request 4xx/5xx ngoài tình huống được chủ động minh họa.
- [ ] Loading/error state rõ ràng.
- [ ] Dữ liệu sau thao tác xuất hiện đúng.
- [ ] Chức năng refresh/reload không làm hỏng state.

## 4. Smoke test bắt buộc

Tạo bảng:

| ID | Bước | Input | Expected | Actual | Thời gian | Kết quả |
|---|---|---|---|---|---:|---|
| D-01 | Login receptionist | account demo | dashboard đúng role | ... | ... | ... |
| D-02 | Tìm/tạo bệnh nhân | dữ liệu seed | record hiển thị | ... | ... | ... |
| D-03 | Tạo lượt khám | patient id | visit + queue/status | ... | ... | ... |
| D-04 | Mở khám | doctor account | examination mở | ... | ... | ... |
| D-05 | Chẩn đoán/kê đơn | valid inputs | dữ liệu lưu | ... | ... | ... |
| D-06 | Hoàn tất | required fields | status đúng | ... | ... | ... |
| D-07 | Hóa đơn/thanh toán | visit id | invoice/payment | ... | ... | ... |

Thêm negative checks cho ít nhất:

- sai role;
- thiếu trường bắt buộc;
- dữ liệu trùng;
- trạng thái không hợp lệ;
- refresh/back navigation.

## 5. Rehearsal protocol

Chạy 3 vòng liên tiếp:

### Vòng 1 - Functional

Dừng để ghi mọi lỗi và sửa blocker.

### Vòng 2 - Timed

Chạy đúng script, đo thời lượng từng bước.

### Vòng 3 - Recovery

Cố ý mô phỏng một lỗi nhẹ: tab reload, dữ liệu trùng hoặc token hết hạn; kiểm tra nhóm có thể chuyển fallback.

## 6. Tiêu chí đánh giá

### READY

- 3/3 vòng luồng chính pass;
- tổng demo không vượt 100 giây;
- reset dữ liệu hoạt động;
- không có lỗi 5xx hoặc crash;
- fallback sẵn sàng.

### READY WITH CONDITIONS

- lỗi nhỏ không ảnh hưởng luồng chính;
- có workaround rõ;
- không vượt thời gian;
- đã ghi known issue.

### NOT READY

- lỗi chặn luồng chính;
- không reset được dữ liệu;
- phụ thuộc Internet không kiểm soát;
- build/test không ổn định;
- không có fallback.

## 7. Fallback package

Chuẩn bị offline:

- video quay luồng chính dưới 100 giây;
- 4-6 screenshot theo từng checkpoint;
- một PDF hoặc slide appendix mô tả expected result;
- câu chuyển sang fallback;
- dữ liệu demo tĩnh.

Video/screenshot phải cùng phiên bản với slide và không hiển thị dữ liệu nhạy cảm.
