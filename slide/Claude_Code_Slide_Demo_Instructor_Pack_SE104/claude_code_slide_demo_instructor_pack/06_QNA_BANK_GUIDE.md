# NGÂN HÀNG CÂU HỎI PHẢN BIỆN

Claude Code phải tạo câu trả lời theo dữ liệu thật. Danh sách dưới đây là khung tối thiểu.

## A. Quy trình phát triển

1. Nhóm áp dụng quy trình nào? Bằng chứng là gì?
2. Tại sao không dùng Waterfall thuần túy?
3. Tại sao gọi là incremental/iterative?
4. Nhóm có thực sự dùng Scrum không? Có đủ artifact nào?
5. Phase 1 và Phase 2 khác increment như thế nào?
6. Khi yêu cầu thay đổi, nhóm xử lý ra sao?
7. Definition of Done của một chức năng là gì?
8. Nhóm cân bằng giữa tài liệu hóa và tốc độ phát triển như thế nào?
9. Có prototype trước khi triển khai không?
10. Bài học lớn nhất về quy trình là gì?

## B. Requirements

11. Yêu cầu được thu thập từ đâu?
12. Functional và non-functional requirements chính là gì?
13. Cách nhóm kiểm tra yêu cầu có đầy đủ/nhất quán?
14. Business rule quan trọng nhất trong hệ thống?
15. Cách trace use case đến API/database/test?
16. Khi báo cáo và code lệch nhau, nguồn nào được ưu tiên?

## C. Thiết kế và kiến trúc

17. Tại sao chọn web client-server?
18. Tại sao tách frontend/backend/database?
19. Kiến trúc module/layer hỗ trợ bảo trì thế nào?
20. Tại sao chọn REST API?
21. Tại sao chọn PostgreSQL/Prisma hoặc công nghệ thật trong repo?
22. Quyết định thiết kế nào khó nhất?
23. Làm sao tránh coupling giữa module?
24. Transaction nào cần atomicity?
25. Hệ thống bảo toàn lịch sử khám và hóa đơn như thế nào?

## D. Bảo mật và dữ liệu

26. RBAC được thực hiện ở frontend hay backend?
27. Vì sao không thể chỉ ẩn menu ở frontend?
28. JWT/session được xác minh thế nào?
29. Dữ liệu bệnh nhân được bảo vệ ra sao?
30. Audit log có phạm vi nào?
31. Hệ thống xử lý validation và SQL injection ra sao?
32. Dữ liệu demo có bảo đảm không phải dữ liệu thật không?

## E. Testing và chất lượng

33. Nhóm có những mức test nào?
34. Test nào chứng minh luồng chính hoạt động?
35. Phân biệt unit, integration, system và acceptance test trong dự án.
36. Cách nhóm kiểm tra business rules?
37. Khi sửa lỗi, làm sao tránh regression?
38. Vì sao automated tests chưa đủ cho UI/demo?
39. Tiêu chí kết luận demo sẵn sàng?
40. Known issue lớn nhất hiện tại?

## F. Tổ chức nhóm và Git

41. Nhóm phân công 4 người như thế nào?
42. Làm sao chứng minh đóng góp cân bằng?
43. Cách review chéo code/tài liệu?
44. Nhóm tránh xung đột khi cùng sửa một repository thế nào?
45. Quy ước commit/branch/release là gì?
46. Khi một thành viên chậm tiến độ, nhóm xử lý thế nào?
47. Rủi ro mất thành viên hoặc phụ thuộc một người được giảm thế nào?

## G. Demo, giới hạn và phát triển

48. Vì sao chọn các chức năng này để demo?
49. Nếu demo lỗi, phương án dự phòng?
50. Hệ thống đã sẵn sàng triển khai thực tế chưa?
51. Giới hạn về pháp lý, bảo mật, hiệu năng hoặc vận hành?
52. Nếu có thêm thời gian, ưu tiên nào đứng đầu?
53. Hệ thống có mở rộng cho nhiều phòng khám được không?
54. Cách kiểm tra hiệu năng khi dữ liệu tăng?
55. Kết quả quan trọng nhất của đồ án là gì?

## Mẫu trả lời

```text
Trả lời trực tiếp:
[1-2 câu]

Bằng chứng:
[file/module/test/screenshot/commit]

Trade-off hoặc giới hạn:
[1 câu]

Khi hỏi sâu:
[giải thích kỹ thuật 3-5 câu]
```

## Cảnh báo

- Không trả lời “nhóm dùng Scrum” nếu không chỉ ra được artifacts.
- Không nói “bảo mật cao” chỉ vì có JWT.
- Không nói “test đầy đủ” nếu chưa có coverage/traceability.
- Không nói “đóng góp bằng nhau” chỉ bằng lời; cần phân công, history, artifact hoặc review log.
- Không khẳng định sẵn sàng dùng trong y tế thật khi chưa đánh giá pháp lý, privacy, backup, disaster recovery và vận hành.
