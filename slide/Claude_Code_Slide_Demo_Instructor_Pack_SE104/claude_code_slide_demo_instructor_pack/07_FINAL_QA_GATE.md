# FINAL QA GATE

## 1. Factual consistency

- [ ] Tên đề tài thống nhất trên slide, script, report và demo.
- [ ] Tên/MSSV thành viên chính xác.
- [ ] Số liệu có bằng chứng.
- [ ] Module/role/use case khớp code dùng demo.
- [ ] Không mô tả planned feature như completed feature.
- [ ] Process model có giải thích và evidence.
- [ ] Thuật ngữ nhất quán: visit/examination/appointment/invoice/payment.

## 2. Slide quality

- [ ] 7-8 slide chính.
- [ ] Đúng tỷ lệ 16:9.
- [ ] Không có chữ quá nhỏ.
- [ ] Không quá nhiều bullet.
- [ ] Ảnh rõ, crop đúng và không lộ dữ liệu nhạy cảm.
- [ ] Một thông điệp chính mỗi slide.
- [ ] Slide demo chỉ chứa flow và checkpoint.
- [ ] Có appendix cho chi tiết.

## 3. Script quality

- [ ] Có timestamp.
- [ ] 4:50-5:00 khi rehearsal.
- [ ] Không đọc nguyên văn slide.
- [ ] Có câu chuyển slide.
- [ ] Có câu dẫn và câu khôi phục demo.
- [ ] Có emergency cuts.
- [ ] Script khớp hoàn toàn với thứ tự thao tác.

## 4. Demo quality

- [ ] Đúng commit/branch.
- [ ] 3 rehearsal liên tiếp.
- [ ] Dữ liệu reset được.
- [ ] Tài khoản dự phòng hoạt động.
- [ ] Backend/database health pass.
- [ ] Không có crash/5xx trong luồng chính.
- [ ] Tổng demo dưới 100 giây.
- [ ] Có video/screenshot fallback offline.

## 5. Engineering quality

- [ ] Build pass.
- [ ] Lint/type-check pass hoặc có giải trình.
- [ ] Test liên quan luồng demo pass.
- [ ] Không lộ secrets.
- [ ] Không dùng dữ liệu y tế thật.
- [ ] Git working tree và thay đổi được ghi rõ.
- [ ] Known issues được liệt kê.

## 6. Defense readiness

- [ ] Tối thiểu 30 câu hỏi có đáp án.
- [ ] Các thành viên hiểu process model.
- [ ] Các thành viên giải thích được một quyết định thiết kế.
- [ ] Các thành viên biết giới hạn và trade-off.
- [ ] Có bằng chứng đóng góp/phối hợp.
- [ ] Có câu trả lời trung thực khi chưa hoàn tất.

## 7. Kết luận bắt buộc

Claude Code phải kết luận một trong ba trạng thái:

### READY

Không còn blocker, demo và timing đã được xác minh.

### READY WITH CONDITIONS

Có lỗi nhỏ, workaround/fallback rõ ràng và không ảnh hưởng thông điệp chính.

### NOT READY

Còn lỗi chặn, thiếu evidence hoặc không kiểm soát được demo.

Báo cáo phải liệt kê:

- blocker;
- owner;
- deadline;
- cách xác minh sau sửa;
- phương án fallback.
