# RUNBOOK PROMPTS CHO CLAUDE CODE

Dùng từng prompt theo thứ tự. Không chạy prompt tạo slide trước audit.

## Prompt 1 - Inventory only

```text
Hãy đọc CLAUDE.md. Chỉ thực hiện audit read-only. Kiểm kê toàn bộ nguồn liên quan đến báo cáo, yêu cầu giảng viên, source code, schema, migration, seed, test, API docs, diagrams, Git history và dữ liệu demo. Tạo presentation/00_source_inventory.md. Không sửa code và không tạo slide. Kết thúc bằng danh sách nguồn thiếu hoặc cần tôi xác nhận.
```

## Prompt 2 - Evidence and conflict

```text
Dựa trên source inventory, tạo presentation/01_evidence_matrix.csv và presentation/02_conflict_register.md. Tập trung vào các claim có thể xuất hiện trong slide: tên đề tài, thành viên, process model, vai trò, công nghệ, module, use case, kết quả test, đóng góp nhóm và chức năng demo. Không suy đoán. Đánh dấu VERIFIED/SUPPORTED/PLANNED/UNKNOWN.
```

## Prompt 3 - Process analysis

```text
Phân tích quy trình phát triển thực tế. So sánh bằng chứng với plan-driven, incremental/iterative, prototyping, Agile-inspired, Scrum và hybrid. Không gọi Scrum nếu thiếu artifact. Tạo presentation/03_process_method_analysis.md, gồm ma trận bước - phương pháp - công cụ - artifact - kết quả - hạn chế.
```

## Prompt 4 - Slide storyboard

```text
Dựa duy nhất trên các claim VERIFIED/SUPPORTED, tạo storyboard 7-8 slide cho 5 phút theo đúng yêu cầu giảng viên. Tạo presentation/04_slide_storyboard.md và presentation/05_slide_content.md. Mỗi slide có headline, mục tiêu, nội dung hiển thị, hình/ảnh đề xuất, nguồn bằng chứng và thời gian.
```

## Prompt 5 - Script

```text
Tạo hai script 5 phút: một người và bốn người trình bày. Có timestamp, câu chuyển, demo narration, emergency cuts và câu xử lý sự cố. Nội dung phải khớp storyboard và không thêm claim mới. Lưu vào presentation/06_speaker_script_single_presenter.md và 07_speaker_script_four_presenters.md.
```

## Prompt 6 - Demo audit

```text
Kiểm tra code và môi trường để chọn luồng demo ngắn nhất nhưng thể hiện giá trị nghiệp vụ. Tạo kế hoạch, account/data prerequisites, reset strategy, smoke test và fallback. Chỉ sửa lỗi chặn sau khi lập kế hoạch và nêu rõ file sẽ thay đổi. Chạy ít nhất 3 rehearsal nếu môi trường cho phép. Tạo presentation/08_demo_plan.md và 09_demo_test_report.md.
```

## Prompt 7 - Q&A

```text
Tạo tối thiểu 30 câu hỏi phản biện và câu trả lời dựa trên evidence matrix. Bao gồm process, requirements, architecture, database, security, testing, teamwork, Git, demo, limitations và future work. Mỗi câu có direct answer, evidence, trade-off và deep answer. Lưu presentation/10_qna_bank.md.
```

## Prompt 8 - Final gate

```text
Chạy final QA theo 07_FINAL_QA_GATE.md. Kiểm tra consistency giữa source, slide, script và demo; chạy build/lint/type-check/test phù hợp; kiểm tra timing và fallback. Tạo presentation/11_final_qa_report.md và kết luận READY, READY WITH CONDITIONS hoặc NOT READY. Không che giấu lỗi.
```
