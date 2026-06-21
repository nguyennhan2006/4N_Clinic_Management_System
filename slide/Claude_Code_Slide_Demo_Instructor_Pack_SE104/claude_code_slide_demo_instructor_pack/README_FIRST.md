# BỘ HƯỚNG DẪN CLAUDE CODE - SLIDE, SCRIPT, DEMO VÀ PHẢN BIỆN

## 1. Mục tiêu

Bộ tài liệu này hướng dẫn Claude Code làm việc theo nguyên tắc **evidence-first** để:

1. Đọc đúng tài nguyên của đồ án SE104 - Hệ thống quản lý phòng mạch tư nhân.
2. Xác định chính xác quy trình/phương pháp phát triển đã thực sự được áp dụng.
3. Tạo bộ slide ngắn gọn cho phần trình bày khoảng 5 phút.
4. Tạo script nói có phân bổ thời gian.
5. Kiểm tra luồng demo có ổn định, mượt và có phương án dự phòng.
6. Chuẩn bị ngân hàng câu hỏi phản biện và câu trả lời có căn cứ.
7. Kiểm tra chéo slide - báo cáo - code - database - API - test - lịch sử Git.

## 2. Thứ tự sử dụng

1. Đặt `CLAUDE.md` ở thư mục gốc repository.
2. Đọc `01_SOURCE_AND_EVIDENCE_PLAN.md` và chạy giai đoạn kiểm kê tài nguyên.
3. Dùng `02_MASTER_INSTRUCTOR.md` làm lệnh chính cho Claude Code.
4. Hoàn thành các biểu mẫu trong `templates/`.
5. Chỉ tạo slide sau khi `evidence_matrix.csv` và `conflict_register.md` đã được kiểm tra.
6. Chạy audit demo theo `05_DEMO_AUDIT_AND_REHEARSAL.md`.
7. Chạy kiểm tra cuối theo `07_FINAL_QA_GATE.md`.

## 3. Sản phẩm bắt buộc

Claude Code phải tạo tối thiểu các tệp sau trong `presentation/`:

```text
presentation/
├── 00_source_inventory.md
├── 01_evidence_matrix.csv
├── 02_conflict_register.md
├── 03_process_method_analysis.md
├── 04_slide_storyboard.md
├── 05_slide_content.md
├── 06_speaker_script_single_presenter.md
├── 07_speaker_script_four_presenters.md
├── 08_demo_plan.md
├── 09_demo_test_report.md
├── 10_qna_bank.md
├── 11_final_qa_report.md
├── assets/
└── slides/
```

## 4. Nguyên tắc quan trọng nhất

- Không suy đoán thành sự thật.
- Không gọi quy trình là Scrum nếu repository không có bằng chứng về sprint, backlog, review/retrospective hoặc cách làm tương đương.
- Không đưa chức năng vào slide/demo khi chưa xác minh chạy được.
- Không lấy số liệu test, số use case, số API, số bảng, số commit bằng cách ước lượng.
- Mọi phát biểu quan trọng phải có nguồn trong ma trận bằng chứng.
- Khi tài liệu và code mâu thuẫn, phải ghi vào conflict register; không tự ý che giấu.
- Trình bày ngắn gọn, nhưng phần kiểm tra phía sau phải đầy đủ.

## 5. Cơ sở phương pháp

Bộ hướng dẫn tổ chức công việc theo các nhóm hoạt động kỹ nghệ phần mềm: đặc tả, phát triển, xác minh/validation và tiến hóa; đồng thời kết hợp quản lý dự án, quản lý chất lượng, review, testing và quản lý cấu hình. Với đồ án sinh viên có thay đổi yêu cầu và phát triển theo phase, cách mô tả thường phù hợp nhất là **incremental/iterative có thực hành Agile và có tài liệu plan-driven**, nhưng chỉ được kết luận như vậy sau khi kiểm tra bằng chứng.
