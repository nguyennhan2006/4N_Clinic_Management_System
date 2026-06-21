# BLUEPRINT SLIDE 5 PHÚT

## Slide 1 - Đề tài và nhóm

**Headline:** Hệ thống quản lý phòng mạch tư nhân

Nội dung:

- Tên học phần/đồ án.
- Tên nhóm.
- 4 thành viên + MSSV lấy từ nguồn chính thức.
- Một câu tagline: số hóa quy trình từ tiếp nhận đến thanh toán.

Không giải thích công nghệ ở slide này.

## Slide 2 - Bài toán và giá trị

**Câu hỏi slide trả lời:** Phần mềm giải quyết vấn đề gì?

Nội dung gợi ý:

- Dữ liệu bệnh nhân và lượt khám dễ phân tán/thất lạc.
- Nhiều vai trò cần phối hợp trong một quy trình.
- Cần kiểm soát quy tắc khám, kê đơn, hóa đơn và truy vết.
- Giải pháp: một hệ thống web thống nhất, phân quyền theo vai trò.

Hình: một workflow đơn giản hoặc 3 ảnh UI nhỏ.

## Slide 3 - Quy trình phát triển thực tế

**Câu hỏi:** Nhóm đã phát triển theo quy trình nào?

Dùng sơ đồ 4-6 bước:

```text
Yêu cầu → Mô hình/Thiết kế → Increment/Phase → Kiểm thử → Review → Điều chỉnh
```

Ghi tên process model chỉ sau audit. Nếu phù hợp, dùng:

> Hybrid incremental: tài liệu hóa mốc chính + triển khai theo phase + phản hồi/kiểm thử liên tục.

Không ghi “Scrum” nếu không đủ bằng chứng.

## Slide 4 - Tổ chức và thực hiện nhóm

**Câu hỏi:** Bốn thành viên phối hợp như thế nào?

Không chỉ chia “mỗi người một module” vì dễ tạo silo. Trình bày theo workstream:

- Requirements & documentation.
- Backend & database.
- Frontend & UX.
- Testing, integration & release.

Sau đó cho thấy review chéo, tích hợp chung và đóng góp cân bằng. Tên người/role phải lấy từ tài liệu hoặc Git.

## Slide 5 - Phương pháp, kỹ thuật và kết quả

Dùng bảng/flow 4 cột cực ngắn:

| Bước | Kỹ thuật | Artifact | Kết quả |
|---|---|---|---|
| Yêu cầu | Use case, business rules | SRS/UC | phạm vi rõ |
| Thiết kế | UML, architecture, DB | diagrams/schema | cấu trúc thống nhất |
| Hiện thực | REST, RBAC, validation | web app/API | luồng nghiệp vụ |
| Kiểm thử | unit/system/manual | test report | phát hiện và sửa lỗi |

Chỉ đưa mục đã VERIFIED/SUPPORTED.

## Slide 6 - Hệ thống và chức năng chính

**Mục tiêu:** chuẩn bị bối cảnh cho demo.

- Kiến trúc web client-server.
- Các vai trò chính.
- 3-5 module chính.
- Một ảnh kiến trúc tối giản hoặc screenshot dashboard.

Không dùng class diagram/ERD đầy đủ.

## Slide 7 - Demo

Đặt tên theo giá trị:

> Từ tiếp nhận bệnh nhân đến hoàn tất thanh toán

Trên slide chỉ hiển thị 3 bước lớn và tài khoản đang dùng. Không đặt nhiều chữ. Phần chính diễn ra trong hệ thống thật.

## Slide 8 - Kết luận

Ba dòng:

1. Kết quả chính đã đạt.
2. Bài học về quy trình/phối hợp/kiểm thử.
3. Hạn chế và hướng phát triển gần nhất.

Không tuyên bố hệ thống sẵn sàng triển khai y tế thực tế nếu chưa có đánh giá bảo mật, pháp lý, vận hành và dữ liệu thực.

## Appendix khuyến nghị

- Process evidence.
- Architecture chi tiết.
- Database/ERD.
- Test summary.
- Contribution evidence.
- Known limitations.
- Q&A backup.
