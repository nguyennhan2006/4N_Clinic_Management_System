# MASTER INSTRUCTOR FOR CLAUDE CODE

## Vai trò

Hãy làm việc như một **Software Engineering Lead + Technical Writer + Presentation Designer + QA Lead**. Mục tiêu là tạo một gói trình bày 5 phút chính xác, ngắn gọn, chuyên nghiệp và có thể bảo vệ trước giảng viên.

## Nhiệm vụ tổng thể

1. Đọc toàn bộ nguồn có liên quan trong repository.
2. Xây dựng inventory, evidence matrix và conflict register.
3. Xác định đúng quy trình phát triển thực tế, không gán nhãn theo cảm tính.
4. Phân tích phương pháp/kỹ thuật tại từng bước và kết quả tương ứng.
5. Đề xuất cấu trúc 7-8 slide theo yêu cầu của giảng viên.
6. Tạo nội dung slide tối giản nhưng đủ ý.
7. Tạo script nói có timestamp cho 5 phút.
8. Chọn luồng demo an toàn, có giá trị nghiệp vụ và phù hợp thời gian.
9. Chạy smoke test/rehearsal, ghi kết quả và lỗi.
10. Tạo ngân hàng câu hỏi phản biện kèm trả lời dựa trên bằng chứng.
11. Chạy final QA và không tuyên bố hoàn tất nếu còn lỗi chặn.

## Yêu cầu nội dung bắt buộc của bài trình bày

- Tên đề tài, thành viên.
- Giới thiệu đề tài/phần mềm.
- Quy trình phát triển.
- Cách tổ chức và thực hiện của nhóm.
- Phương pháp, kỹ thuật ở mỗi bước trong quy trình và kết quả.
- Demo một số chức năng chính.
- Kết luận.

## Cách làm bắt buộc

### Bước 1 - Audit trước, viết sau

Không viết slide ngay. Trước hết tạo:

- `presentation/00_source_inventory.md`;
- `presentation/01_evidence_matrix.csv`;
- `presentation/02_conflict_register.md`.

Sau đó tóm tắt các phát hiện và dừng để người dùng kiểm tra nếu có mâu thuẫn nghiêm trọng.

### Bước 2 - Xác định process model

Đánh giá các khả năng:

- plan-driven/waterfall;
- incremental/iterative;
- prototyping;
- Agile-inspired;
- Scrum/Scrum-like;
- reuse/integration-oriented;
- hybrid.

Tạo bảng:

| Dấu hiệu | Bằng chứng | Có/Không | Mức tin cậy |
|---|---|---|---|
| Phát triển theo increment/phase | ... | ... | ... |
| Backlog ưu tiên | ... | ... | ... |
| Sprint timebox | ... | ... | ... |
| Review/retrospective | ... | ... | ... |
| Tài liệu sign-off | ... | ... | ... |
| Prototyping UI | ... | ... | ... |

Sau cùng viết kết luận theo công thức:

> Nhóm áp dụng [process model chính], kết hợp [thực hành bổ trợ], vì [bằng chứng]. Cách làm này phù hợp với [đặc điểm dự án], nhưng còn hạn chế [điểm chưa đạt].

### Bước 3 - Lập ma trận phương pháp theo bước

Tạo bảng đầy đủ:

| Bước | Mục tiêu | Phương pháp/kỹ thuật | Công cụ | Artifact | Kết quả xác minh | Hạn chế |
|---|---|---|---|---|---|---|
| Yêu cầu | ... | elicitation, use case, validation | ... | SRS/UC | ... | ... |
| Phân tích & mô hình | ... | UML/context/sequence/class | ... | diagrams | ... | ... |
| Thiết kế | ... | client-server, layered/module, DB design | ... | architecture/schema | ... | ... |
| Hiện thực | ... | REST, modularization, DTO validation, RBAC | ... | code/API | ... | ... |
| Kiểm thử | ... | unit/integration/e2e/manual/UAT | ... | test report | ... | ... |
| Quản lý cấu hình | ... | Git, branching, commit, build | ... | history/release | ... | ... |
| Tiến hóa | ... | phase/increment/refactor/change control | ... | phase docs | ... | ... |

Không liệt kê kỹ thuật nếu không tìm thấy bằng chứng.

### Bước 4 - Storyboard 5 phút

Dùng cấu trúc khuyến nghị:

| Slide | Nội dung | Thời gian |
|---|---|---:|
| 1 | Tên đề tài + 4 thành viên | 20 giây |
| 2 | Bài toán, người dùng, giá trị phần mềm | 35 giây |
| 3 | Quy trình phát triển thực tế | 40 giây |
| 4 | Tổ chức nhóm và cách phối hợp | 35 giây |
| 5 | Phương pháp/kỹ thuật theo bước + kết quả | 50 giây |
| 6 | Kiến trúc/chức năng chính để dẫn vào demo | 30 giây |
| 7 | Demo end-to-end | 100 giây |
| 8 | Kết luận, hạn chế, hướng phát triển | 30 giây |
| Buffer | chuyển cảnh/sự cố nhỏ | 10 giây |

Tổng tối đa 300 giây.

### Bước 5 - Quy tắc tạo slide

- Dùng thông điệp dạng headline, không dùng tên mục chung chung.
- Mỗi slide chỉ trả lời một câu hỏi.
- Mỗi bullet ưu tiên một dòng.
- Dùng hình ảnh chạy thật hoặc sơ đồ đơn giản hơn văn bản.
- Không hiển thị chi tiết mà người nói không kịp giải thích.
- Không vượt quá 8 slide chính.
- Có appendix riêng cho kiến trúc chi tiết, test evidence và Q&A nếu cần.

### Bước 6 - Script

Tạo hai script:

#### Script A - một người trình bày

- 550-650 từ tiếng Việt, tùy tốc độ nói.
- Có timestamp từng slide.
- Có câu chuyển slide và câu dẫn demo.
- Demo narration phải nói giá trị nghiệp vụ, không đọc tên nút.

#### Script B - bốn người trình bày

- Hạn chế còn 3 lần chuyển người hoặc ít hơn.
- Mỗi người có phần nội dung rõ ràng.
- Không tuyên bố đóng góp không có bằng chứng.
- Thời lượng nói không nhất thiết tuyệt đối bằng nhau, nhưng phải hợp lý và thể hiện 4 thành viên đều nắm hệ thống.

Tạo thêm `emergency_cut_lines`: các câu/ý có thể bỏ khi còn dưới 30 giây.

### Bước 7 - Demo

Chọn một luồng nghiệp vụ chính. Khuyến nghị:

```text
Receptionist: đăng nhập → tìm/tạo bệnh nhân → tạo lượt khám
Doctor: mở lượt khám → nhập chẩn đoán → kê đơn → hoàn tất
Cashier: mở hóa đơn → ghi nhận thanh toán
```

Có thể thay đổi theo trạng thái thực tế của hệ thống.

Phải chuẩn bị:

- tài khoản theo role;
- dữ liệu seed;
- script reset dữ liệu demo;
- browser tabs mở sẵn;
- health check backend/database;
- fallback video/screenshot;
- câu nói khi demo lỗi.

### Bước 8 - Kiểm tra demo

Chạy ít nhất 3 rehearsal liên tiếp trên máy dùng để thuyết trình. Ghi:

- thời gian tổng;
- thời gian từng bước;
- lỗi UI/API;
- console/network error;
- dữ liệu bị thay đổi;
- khả năng reset;
- mức độ phụ thuộc Internet;
- kết quả PASS/CONDITIONAL/FAIL.

### Bước 9 - Q&A

Tạo tối thiểu 30 câu hỏi, chia nhóm:

- process và lựa chọn phương pháp;
- requirements và validation;
- architecture/design;
- database và integrity;
- security/RBAC;
- testing và quality;
- teamwork và configuration management;
- demo/limitations/future work.

Mỗi câu trả lời cần:

1. câu trả lời trực tiếp 1-2 câu;
2. bằng chứng cụ thể;
3. trade-off hoặc giới hạn;
4. câu trả lời mở rộng khi giảng viên hỏi sâu.

### Bước 10 - Final gate

Tạo `presentation/11_final_qa_report.md` với kết luận:

- `READY`: không còn blocker;
- `READY WITH CONDITIONS`: có vấn đề nhỏ và fallback;
- `NOT READY`: còn lỗi chặn.

Không dùng `READY` nếu demo chưa chạy 3 lần hoặc slide chưa rehearsal đủ 5 phút.

## Deliverable cuối

Trả về:

1. danh sách file đã tạo;
2. tóm tắt process model;
3. slide outline;
4. demo flow;
5. lỗi/rủi ro còn lại;
6. những thông tin cần nhóm xác nhận.
