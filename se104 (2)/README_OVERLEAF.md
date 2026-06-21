# SE104 4N Clinic LaTeX Report — pdfLaTeX

## 1. Cách dùng trên Overleaf

1. Upload toàn bộ thư mục này lên Overleaf.
2. Vào Menu → Compiler → chọn **pdfLaTeX**.
3. File chính: `main.tex`.
4. Compile lần đầu sẽ hiện placeholder cho các ảnh chưa có. Đây là hành vi chủ động để báo cáo vẫn compile được.
5. Sau khi có sơ đồ/screenshot, đặt đúng tên file trong thư mục `figures/` để placeholder tự biến thành hình thật.

## 2. Vì sao dùng pdfLaTeX

File đã được cấu hình cho pdfLaTeX bằng:

```latex
\usepackage[utf8]{inputenc}
\usepackage[T5]{fontenc}
\usepackage[vietnamese]{babel}
\usepackage{mathptmx}
```

Không dùng `fontspec`, `polyglossia`, `\setmainfont` vì các gói đó dành cho XeLaTeX/LuaLaTeX.

## 3. Cách chèn ảnh rõ trên A4

- Diagram: export **PDF vector** từ draw.io/Figma/PlantUML/Mermaid.
- Screenshot: dùng **PNG** chất lượng cao, chụp màn hình rộng từ 1440px trở lên.
- Diagram lớn: dùng `\LandscapeFigure{...}{...}{...}`.
- Screenshot thường: dùng `\ReportFigure{...}{...}{...}`.
- Hai screenshot cùng luồng: dùng `\TwoDemoFigures{...}{...}{...}{...}{...}{...}`.

## 4. File cần thay thế

Các ảnh placeholder hiện đang trỏ đến các file như:

- `figures/ch01-requirements/usecase-phase1.pdf`
- `figures/ch02-system-design/system-context.pdf`
- `figures/ch03-software-design/erd-phase1.pdf`
- `figures/ch03-software-design/visit-sequence.pdf`
- `figures/ch04-implementation/swagger-ui.png`
- `figures/ch05-testing/test-e2e-result.png`
- `figures/ch06-deployment/terminal-backend.png`
- `figures/screenshots/examination-page.png`

Bạn chỉ cần đặt ảnh đúng tên đường dẫn là báo cáo tự cập nhật.

## 5. Nội dung đã được viết từ evidence fixed

Báo cáo đã dùng các số liệu thống nhất:

- 37 database models
- 12 enums
- 3 migrations
- 21 backend feature folders
- 20 controllers có API route
- 21 service files
- 92 endpoints
- 41 endpoints Phase 1
- 51 endpoints Phase 2
- 36 frontend named routes
- 33 frontend page files
- 3 e2e test files có ý nghĩa cho Phase 1
- Deployment: local/development only
- Customer survey: giả định theo nghiệp vụ đồ án

## 6. Việc nhóm cần làm trước khi nộp

- Điền tên thành viên, MSSV, giảng viên, lớp.
- Chụp screenshots UI và lưu đúng tên trong `figures/screenshots/`.
- Render ERD, use case, sequence, component, deployment diagrams thành PDF.
- Chạy build/lint/test và chụp log.
- Điền bảng kết quả kiểm thử ở Chương 5.
- Kiểm tra lại phân công nhóm 4 thành viên.
