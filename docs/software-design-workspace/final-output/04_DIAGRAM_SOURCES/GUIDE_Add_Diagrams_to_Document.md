# Hướng dẫn: Tạo và chèn Class Diagram vào tài liệu
## 4N Clinic Management System — SE104

---

## Bước 1 — Tạo ảnh từ PlantUML

### Cách A: Online (nhanh nhất)

1. Truy cập **https://www.plantuml.com/plantuml/uml/**
2. Paste code PlantUML (từ Gemini response) vào ô text
3. Nhấn **Submit** → preview hiện ngay bên phải
4. Download:
   - Nhấn **PNG** để tải ảnh (dùng trong Word, Google Docs)
   - Nhấn **SVG** để tải vector (dùng khi cần zoom/scale không bị mờ)

### Cách B: VS Code Extension

1. Cài **PlantUML** extension (`jebbs.plantuml`) trong VS Code
2. Tạo file `.puml` → paste code vào
3. Nhấn `Alt+D` để preview
4. Chuột phải → **Export Current Diagram** → chọn PNG/SVG

### Cách C: Render cục bộ (cần Java)

```bash
# Download plantuml.jar từ plantuml.com
java -jar plantuml.jar *.puml -tpng   # xuất PNG
java -jar plantuml.jar *.puml -tsvg   # xuất SVG
```

### Quy ước đặt tên file

```
docs/software-design-workspace/final-output/04_DIAGRAM_SOURCES/rendered/
├── CD_P01_Identity_Access.png
├── CD_P02_Clinical_Chain.png
├── CD_P03_Exam_Detail.png
├── CD_P04_Financial.png
├── CD_P05_Configuration.png
├── CD_P06_Service_Layer.png
├── CD_P07_Organization.png
├── CD_P08_Appointment_Queue.png
├── CD_P09_Laboratory.png
└── CD_P10_Pharmacy.png
```

---

## Bước 2 — Cài đặt kích thước ảnh chuẩn

Trước khi render, thêm dòng này vào đầu mỗi file PlantUML (sau `@startuml`):

```plantuml
@startuml
scale 1.5
skinparam dpi 150
```

- **`scale 1.5`** — phóng to 1.5x để ảnh rõ nét hơn
- **`skinparam dpi 150`** — độ phân giải 150 DPI (đủ cho in A4)
- Nếu cần in khổ A3 hoặc poster: dùng `skinparam dpi 300`

---

## Bước 3 — Chèn vào tài liệu Word

### 3.1 Cấu trúc tài liệu thiết kế (gợi ý)

```
4N_Clinic_SDD_Phase1_AsBuilt_Verified.docx
│
├── Chương 1 — Tổng quan kiến trúc
│   └── [Hình 1.1] Kiến trúc C4 Level 1 (System Context)
│
├── Chương 2 — Thiết kế lớp (Class Design)
│   ├── 2.1 Identity & Access
│   │   └── [Hình 2.1] CD_P01_Identity_Access.png
│   ├── 2.2 Luồng khám bệnh cốt lõi
│   │   └── [Hình 2.2] CD_P02_Clinical_Chain.png
│   ├── 2.3 Chi tiết phiếu khám
│   │   └── [Hình 2.3] CD_P03_Exam_Detail.png
│   ├── 2.4 Module tài chính
│   │   └── [Hình 2.4] CD_P04_Financial.png
│   ├── 2.5 Cấu hình quy định
│   │   └── [Hình 2.5] CD_P05_Configuration.png
│   └── 2.6 Tầng service (nghiệp vụ)
│       └── [Hình 2.6] CD_P06_Service_Layer.png
│
└── Chương 3 — Thiết kế Phase 2A (Target)
    ├── 3.1 Module tổ chức
    │   └── [Hình 3.1] CD_P07_Organization.png
    ├── 3.2 Đặt lịch & hàng đợi
    │   └── [Hình 3.2] CD_P08_Appointment_Queue.png
    ├── 3.3 Quy trình xét nghiệm
    │   └── [Hình 3.3] CD_P09_Laboratory.png
    └── 3.4 Quy trình dược & kho
        └── [Hình 3.4] CD_P10_Pharmacy.png
```

### 3.2 Thao tác chèn ảnh trong Word

1. Đặt con trỏ vào vị trí muốn chèn
2. **Insert → Pictures → This Device** → chọn file PNG
3. Chọn ảnh → **Format → Wrap Text → Top and Bottom** (ảnh nằm riêng một dòng)
4. Thêm caption: chuột phải ảnh → **Insert Caption** → `Hình X.X: Tên diagram`
5. Căn giữa ảnh: chọn ảnh → căn giữa (Ctrl+E)

### 3.3 Kích thước chèn chuẩn A4

- **Diagram nhỏ** (3-5 class): Width = 10 cm
- **Diagram trung bình** (6-10 class): Width = 14 cm
- **Diagram lớn** (11+ class): Width = 16 cm, nếu quá lớn → chèn ngang (Landscape page)

---

## Bước 4 — Chèn vào Google Docs

1. **Insert → Image → Upload from computer** → chọn PNG
2. Click ảnh → **Image options** (bên phải) → Size: đặt width
3. Thêm caption: click dưới ảnh → nhập caption → format italic, gray

---

## Bước 5 — Chèn vào Markdown / GitHub README

```markdown
## 2.2 Luồng khám bệnh cốt lõi

![Clinical Chain Diagram](./04_DIAGRAM_SOURCES/rendered/CD_P02_Clinical_Chain.png)

*Hình 2.2: Quan hệ Patient → Visit → Examination*
```

Hoặc dùng SVG inline:

```markdown
![Clinical Chain Diagram](./04_DIAGRAM_SOURCES/rendered/CD_P02_Clinical_Chain.svg)
```

SVG tốt hơn PNG trong Markdown vì không bị mờ khi zoom.

---

## Bước 6 — Export tài liệu có ảnh sang PDF

### Từ Word:
**File → Export → Create PDF/XPS** → chọn **Standard (publishing online and printing)**

### Từ Google Docs:
**File → Download → PDF Document**

### Lưu ý về chất lượng ảnh trong PDF:
- Dùng **SVG** thay PNG → ảnh sắc nét trong PDF không giới hạn zoom
- Nếu phải dùng PNG → render ở DPI 300 trước khi chèn

---

## Bảng tổng hợp

| Prompt | File output | Số class | Dùng ở section |
|---|---|---|---|
| P01 | CD_P01_Identity_Access.png | 3 | §2.1 Identity & Access |
| P02 | CD_P02_Clinical_Chain.png | 4 | §2.2 Core Clinical Flow |
| P03 | CD_P03_Exam_Detail.png | 6 | §2.3 Examination Detail |
| P04 | CD_P04_Financial.png | 4 | §2.4 Financial Module |
| P05 | CD_P05_Configuration.png | 2 | §2.5 Configuration |
| P06 | CD_P06_Service_Layer.png | 3 svc + 7 entity | §2.6 Service Layer |
| P07 | CD_P07_Organization.png | 5 | §3.1 Organization |
| P08 | CD_P08_Appointment_Queue.png | 6 | §3.2 Scheduling |
| P09 | CD_P09_Laboratory.png | 9 | §3.3 Laboratory |
| P10 | CD_P10_Pharmacy.png | 8 | §3.4 Pharmacy |

---

## Troubleshooting PlantUML

| Vấn đề | Nguyên nhân | Giải pháp |
|---|---|---|
| Lines overlap | Class quá gần nhau | Thêm `skinparam nodesep 120` và `skinparam ranksep 140` |
| Arrow labels bị che | Label quá dài | Rút gọn label: `has` thay vì `contains_prescription` |
| Class bị cắt đầu/cuối | Canvas quá nhỏ | Thêm `scale 0.8` để thu nhỏ toàn bộ |
| Arrows chéo nhau | Layout direction không phù hợp | Thêm `skinparam linetype ortho` (vuông góc) |
| Tiếng Việt bị lỗi font | Encoding issue | Dùng label tiếng Anh hoặc thêm `charset UTF-8` |
| Diagram trắng/rỗng | Syntax error | Kiểm tra @startuml/@enduml, dấu nháy kép trong attribute |
