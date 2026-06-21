# HƯỚNG DẪN CHỈNH SỬA BÁO CÁO LATEX SE104  
## Đồ án: Hệ thống quản lý phòng mạch tư nhân – 4N Clinic Management System

> File này dùng làm **instruction chính cho Claude Code** khi chỉnh sửa nội dung báo cáo LaTeX.  
> Mục tiêu: cập nhật báo cáo theo mạch rõ ràng hơn: **khảo sát/tham khảo → chốt yêu cầu → chia Phase 1/Phase 2 → thiết kế → hiện thực → kiểm thử → kết luận**.

---

# 0. MỤC TIÊU CHUNG KHI SỬA BÁO CÁO

## 0.1. Mạch nội dung bắt buộc phải thể hiện xuyên suốt

Báo cáo sau chỉnh sửa phải làm rõ rằng nhóm không làm chức năng một cách tùy hứng. Mạch kể của toàn bộ báo cáo cần thống nhất như sau:

```text
Khảo sát/tham khảo hệ thống tương tự
→ xác định vấn đề của phòng mạch tư nhân
→ chốt yêu cầu và phạm vi
→ chia dự án thành Phase 1 và Phase 2
→ Phase 1 hoàn thành baseline nghiệp vụ lõi để bảo đảm tiến độ ban đầu
→ Phase 2 mở rộng phạm vi toàn dự án, sát thực tế phòng khám hơn
→ thiết kế, hiện thực và kiểm thử đều bám theo yêu cầu/phase
→ kết luận trung thực kết quả, hạn chế và hướng phát triển
```

## 0.2. Ý chính phải lặp lại nhất quán

Trong toàn bộ báo cáo, cần giữ thống nhất các ý sau:

- Hệ thống là **web application nội bộ** cho phòng mạch tư nhân quy mô nhỏ đến trung bình.
- Hệ thống phục vụ nhân sự nội bộ: `ADMIN`, `RECEPTIONIST`, `DOCTOR`, `CASHIER`, `MANAGER`; Phase 2 mở rộng thêm `NURSE`, `LAB_TECHNICIAN`, `PHARMACIST`.
- Không phải patient portal ở Phase 1.
- Không triển khai production thật; hệ thống hiện phục vụ **local/development/demo**.
- Kiến trúc tổng thể là **Client–Server**.
- Backend là **NestJS Modular Monolith**, không phải microservices.
- Bên trong backend áp dụng **Layered/Clean Architecture**: Controller → DTO/Validation → Service/Use Case → Business Rules → Prisma/Repository → PostgreSQL.
- Database dùng **PostgreSQL + Prisma**.
- Business logic bắt buộc đặt ở backend service layer, không đặt ở frontend.
- Phase 1 là baseline nghiệp vụ lõi.
- Phase 2 là phần mở rộng toàn dự án sau khi Phase 1 ổn định.
- Phase 1 có kiểm thử tự động/E2E/API rõ hơn.
- Phase 2 có manual/demo test, cần bổ sung automated test trong tương lai.
- Không phóng đại rằng hệ thống đã kiểm thử tuyệt đối hoặc đã production.

## 0.3. Công nghệ cần thống nhất

Kiểm tra toàn bộ LaTeX để thống nhất cách ghi:

| Thành phần | Cách ghi thống nhất |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT, Passport, Guards |
| API | REST/JSON, prefix `/api/v1`, Swagger UI |
| Testing | Jest, Supertest, Swagger/Postman, manual UI test |
| Architecture | Client–Server, Modular Monolith, Layered/Clean Architecture |

Nếu trong file cũ có chỗ ghi `PostgreSQL 15+` và chỗ khác ghi `PostgreSQL 18`, hãy chọn một cách ghi thống nhất. Nếu không chắc phiên bản thật trong repo, dùng cách an toàn: **PostgreSQL** hoặc **PostgreSQL 15+** thay vì khẳng định `PostgreSQL 18`.

---

# 1. YÊU CẦU KỸ THUẬT KHI SỬA LATEX

## 1.1. Quy tắc thao tác với source LaTeX

Claude Code cần:

1. Đọc cấu trúc project LaTeX trước khi sửa:
   - `main.tex`
   - `chapters/*.tex`
   - `sections/*.tex` nếu có
   - `figures/`
   - `tables/`
   - `refs.bib` hoặc `references.bib`
   - các file macro như `preamble.tex`, `commands.tex`, `style.tex`.

2. Không tự ý xóa hình, bảng, macro hoặc lệnh custom đang dùng trong báo cáo.

3. Nếu báo cáo đang dùng macro riêng như:
   - `\ReportFigure`
   - `\TwoDemoFigures`
   - `\begin{longtable}`
   - `\begin{tabularx}`
   - `\chapter`
   - `\section`
   - `\subsection`

   thì ưu tiên dùng lại đúng style hiện có.

4. Các bảng dài nên dùng `longtable` hoặc `tabularx`, tránh bảng tràn trang.

5. Văn bản tiếng Việt cần được giữ dấu đầy đủ.

6. Nếu báo cáo dùng `pdflatex`, hạn chế đưa ký tự Unicode đặc biệt dễ lỗi. Nếu dùng `xelatex`, có thể giữ Unicode thoải mái hơn. Kiểm tra compiler trong project.

7. Sau khi sửa, phải build thử LaTeX ít nhất 1 lần:
   - Nếu dùng latexmk: `latexmk -pdf main.tex`
   - Nếu dùng pdflatex: chạy ít nhất 2 lần để cập nhật mục lục.
   - Nếu dùng xelatex: `xelatex main.tex`.

8. Sau build, sửa các lỗi:
   - undefined control sequence
   - missing package
   - overfull hbox nghiêm trọng
   - bảng tràn trang
   - hình không tìm thấy
   - nhãn/citation undefined.

## 1.2. Quy tắc chuyển Markdown sang LaTeX

Khi chuyển nội dung dưới đây vào LaTeX:

| Markdown | LaTeX |
|---|---|
| `# CHƯƠNG 1...` | `\chapter{...}` |
| `## 1.1...` | `\section{...}` |
| `### 1.1.1...` | `\subsection{...}` |
| bảng Markdown | `longtable`, `tabularx` hoặc macro bảng hiện có |
| code block text | `verbatim`, `lstlisting` hoặc `tcolorbox` nếu project có |
| danh sách bullet | `itemize` |
| danh sách số | `enumerate` |
| chữ đậm | `\textbf{...}` |
| thuật ngữ tiếng Anh | giữ nguyên hoặc dùng `\textit{...}` nếu cần |

## 1.3. Quy tắc đặt hình và caption

Các hình nên có caption mô tả nghiệp vụ, không chỉ ghi tên màn hình.

Ví dụ caption tốt:

```latex
\caption{Minh chứng test case TC-VIS-01: lễ tân tạo lượt khám cho bệnh nhân, hệ thống cấp số thứ tự và hiển thị lượt khám trong danh sách chờ.}
```

Không nên ghi quá chung chung:

```latex
\caption{Màn hình tạo lượt khám}
```

## 1.4. Quy tắc kiểm tra sau khi sửa

Sau khi cập nhật xong, Claude Code phải tự kiểm tra:

- Có đủ Mở đầu + Chương 1 đến Chương 6.
- Mạch Phase 1/Phase 2 xuất hiện nhất quán.
- Không còn đoạn nói mâu thuẫn như:
  - vừa nói không có inventory, vừa nói inventory đã hoàn thành mà không giải thích Phase.
  - vừa nói Client–Server, vừa gọi hệ thống là microservices.
  - vừa nói local demo, vừa nói đã deploy production.
- Các hình/bảng có số thứ tự và được tham chiếu hợp lý.
- Các chương không lặp lại quá nhiều đoạn y hệt nhau.
- Không xóa phần đóng góp nhóm 4 thành viên tương đương.
- Không xóa các minh chứng test/API/UI đã có.

---

# 2. CẤU TRÚC BÁO CÁO SAU CHỈNH SỬA

Nên tổ chức theo cấu trúc:

```text
Mở đầu
Chương 1. Đặc tả yêu cầu phần mềm
Chương 2. Thiết kế hệ thống
Chương 3. Thiết kế phần mềm
Chương 4. Hiện thực
Chương 5. Kiểm thử phần mềm
Chương 6. Kết luận và hướng phát triển
Tài liệu tham khảo
Phụ lục nếu có
```

Nếu file cũ đang có chương "Triển khai và vận hành" riêng, có thể:
- hoặc nhập nội dung quan trọng vào Chương 4;
- hoặc chuyển phần hướng dẫn chạy local sang phụ lục;
- còn Chương 6 nên là **Kết luận và hướng phát triển**.

---

# 3. PHẦN MỞ ĐẦU – NỘI DUNG CẦN THAY/SỬA

## 3.1. Mục tiêu sửa phần Mở đầu

Mở đầu cần giải thích rõ:

- Vì sao chọn đề tài phòng mạch tư nhân.
- Vấn đề của quản lý thủ công.
- Hệ thống hướng đến web app nội bộ.
- Sau khảo sát/tham khảo, nhóm quyết định chia dự án thành 2 phase.
- Phase 1 bảo đảm tiến độ ban đầu.
- Phase 2 là phạm vi mở rộng toàn dự án.
- Báo cáo trình bày quy trình kỹ nghệ phần mềm đầy đủ.

## 3.2. Nội dung đề xuất

### Giới thiệu đề tài

Trong bối cảnh các phòng mạch tư nhân ngày càng cần chuẩn hóa quy trình vận hành, việc quản lý thủ công bằng sổ sách, bảng tính rời rạc hoặc các công cụ không đồng bộ dễ dẫn đến nhiều vấn đề như thất lạc thông tin bệnh nhân, khó tra cứu lịch sử khám, sai sót khi kê đơn, lập hóa đơn chưa nhất quán và thiếu dữ liệu tổng hợp phục vụ quản lý. Đối với một phòng mạch quy mô nhỏ đến trung bình, yêu cầu quan trọng không phải là xây dựng một hệ thống quá lớn ngay từ đầu, mà là hình thành một phần mềm nội bộ đủ rõ ràng, dễ dùng, kiểm soát được dữ liệu và hỗ trợ tốt các nghiệp vụ cốt lõi.

Từ thực tế đó, nhóm lựa chọn đề tài **Hệ thống quản lý phòng mạch tư nhân – 4N Clinic Management System**. Hệ thống được định hướng là một ứng dụng web nội bộ phục vụ các vai trò trong phòng mạch như lễ tân, bác sĩ, thu ngân, quản trị viên và quản lý phòng mạch. Mục tiêu của hệ thống là hỗ trợ quy trình từ tiếp nhận bệnh nhân, tạo lượt khám, ghi nhận thông tin khám bệnh, kê đơn, lập hóa đơn, ghi nhận thanh toán đến xem báo cáo vận hành cơ bản.

Đây là một hệ thống thông tin nghiệp vụ, trong đó dữ liệu bệnh nhân, lượt khám, phiếu khám, đơn thuốc, hóa đơn và thanh toán có quan hệ chặt chẽ với nhau. Vì vậy, quá trình phát triển hệ thống không chỉ tập trung vào giao diện hoặc mã nguồn, mà còn phải chú trọng đặc tả yêu cầu, thiết kế dữ liệu, thiết kế xử lý, phân quyền, kiểm thử và khả năng mở rộng trong các giai đoạn tiếp theo.

### Mục tiêu đề tài

Đề tài hướng đến việc xây dựng một hệ thống phần mềm có thể mô phỏng tương đối đầy đủ quy trình vận hành cơ bản của một phòng mạch tư nhân. Các mục tiêu chính gồm:

- Chuẩn hóa quy trình tiếp nhận, khám bệnh, kê đơn, lập hóa đơn và thanh toán.
- Quản lý tập trung hồ sơ bệnh nhân, lịch sử khám, chẩn đoán, đơn thuốc và chứng từ thanh toán.
- Phân quyền người dùng theo vai trò để hạn chế thao tác sai phạm vi trách nhiệm.
- Hỗ trợ quản lý phòng mạch theo dõi tình hình hoạt động thông qua báo cáo cơ bản.
- Xây dựng kiến trúc phần mềm đủ rõ ràng để nhóm có thể hiện thực, kiểm thử, bảo trì và mở rộng.
- Áp dụng các kiến thức của học phần Nhập môn Công nghệ phần mềm vào một sản phẩm cụ thể, bao gồm khảo sát, đặc tả yêu cầu, thiết kế, hiện thực, kiểm thử và triển khai.

### Cơ sở khảo sát và định hướng phạm vi

Trong quá trình chuẩn bị đề tài, nhóm tiến hành khảo sát nghiệp vụ theo hướng khách hàng giả định, tham khảo quy trình vận hành phổ biến của phòng mạch tư nhân và đối chiếu với năng lực thực hiện của nhóm trong phạm vi học phần SE104. Qua phân tích, nhóm nhận thấy nếu triển khai toàn bộ chức năng mở rộng ngay từ đầu thì dự án dễ bị quá tải phạm vi, khó kiểm thử đầy đủ và có nguy cơ không hoàn thành đúng tiến độ.

Vì vậy, nhóm không phát triển hệ thống theo cách “làm tất cả trong một lần”, mà chốt phạm vi theo hướng chia thành hai giai đoạn. Cách chia này giúp nhóm ưu tiên nghiệp vụ lõi trước, tạo được một baseline vận hành ổn định, sau đó mới mở rộng sang các nghiệp vụ nâng cao hơn. Đây cũng là cách tiếp cận phù hợp với bản chất của phát triển phần mềm: yêu cầu, thiết kế, hiện thực và kiểm thử cần được kiểm soát theo từng phần để giảm rủi ro và dễ đánh giá kết quả.

### Nội dung thực hiện

Nội dung thực hiện của nhóm được tổ chức theo quy trình kỹ nghệ phần mềm, bao gồm:

1. Khảo sát và xác định vấn đề.
2. Xác định và đặc tả yêu cầu.
3. Thiết kế hệ thống.
4. Thiết kế phần mềm.
5. Hiện thực hệ thống.
6. Kiểm thử phần mềm.
7. Triển khai và vận hành cục bộ để demo.

### Quyết định phát triển theo hai giai đoạn

Sau khi khảo sát và chốt phạm vi, nhóm thống nhất phát triển hệ thống qua hai giai đoạn: **Phase 1** và **Phase 2**.

**Phase 1** tập trung xây dựng hệ thống lõi để phòng mạch có thể vận hành ở mức cơ bản. Giai đoạn này ưu tiên các nghiệp vụ bắt buộc như đăng nhập, phân quyền, quản lý tài khoản, quản lý bệnh nhân, tiếp nhận lượt khám, lập phiếu khám, chẩn đoán, kê đơn, lập hóa đơn, ghi nhận thanh toán, quản lý danh mục, thay đổi quy định và báo cáo tháng. Mục tiêu của Phase 1 là bảo đảm tiến độ ban đầu, tạo được sản phẩm có thể chạy, demo và kiểm thử được trên các luồng nghiệp vụ quan trọng.

**Phase 2** được thực hiện sau khi Phase 1 đã ổn định, nhằm mở rộng hệ thống theo hướng gần hơn với quy trình vận hành thực tế của phòng khám. Giai đoạn này bổ sung các chức năng như lịch hẹn, hàng đợi khám, ghi nhận sinh hiệu, quản lý dịch vụ, xét nghiệm, kho thuốc, cấp phát thuốc, tổ chức phòng ban và audit log. Mục tiêu của Phase 2 là hoàn thiện phạm vi toàn dự án, tăng tính thực tế của hệ thống và chứng minh rằng kiến trúc ban đầu có khả năng mở rộng.

Bảng tóm tắt:

| Giai đoạn | Mục tiêu | Nhóm chức năng chính | Ý nghĩa |
|---|---|---|---|
| Phase 1 | Xây dựng baseline vận hành phòng mạch cơ bản | Auth/RBAC, tài khoản, bệnh nhân, lượt khám, phiếu khám, chẩn đoán, kê đơn, hóa đơn, thanh toán, danh mục, quy định, báo cáo tháng | Bảo đảm tiến độ ban đầu, có sản phẩm lõi chạy được và kiểm thử được |
| Phase 2 | Mở rộng quy trình vận hành phòng khám | Lịch hẹn, hàng đợi, sinh hiệu, dịch vụ, xét nghiệm, kho thuốc, cấp phát thuốc, tổ chức phòng ban, audit log | Hoàn thiện phạm vi toàn dự án, tăng tính thực tế và khả năng mở rộng |

### Phạm vi và giới hạn của đề tài

Trong phạm vi đồ án, hệ thống được giả định phục vụ một phòng mạch tư nhân quy mô nhỏ đến trung bình, vận hành nội bộ tại một cơ sở. Người dùng trực tiếp của hệ thống là nhân sự phòng mạch, không phải bệnh nhân bên ngoài. Hệ thống tập trung vào web application nội bộ, chưa triển khai production thực tế, chưa tích hợp với hệ thống y tế bên ngoài và chưa hỗ trợ đa chi nhánh.

Các giới hạn chính:

- Khách hàng trong đồ án là khách hàng giả định, chưa có khảo sát trực tiếp tại một phòng mạch cụ thể.
- Hệ thống ưu tiên mô phỏng đúng quy trình nghiệp vụ và khả năng hiện thực trong phạm vi học phần.
- Dữ liệu demo được tạo để phục vụ kiểm thử và trình bày, không phải dữ liệu bệnh nhân thật.
- Hệ thống chạy ở môi trường local development, chưa triển khai production.
- Một số chức năng Phase 2 cần tiếp tục bổ sung kiểm thử tự động và bằng chứng kiểm thử thủ công chi tiết hơn trong các phiên bản sau.

---

# 4. CHƯƠNG 1 – ĐẶC TẢ YÊU CẦU PHẦN MỀM

## 4.1. Mục tiêu sửa Chương 1

Chương 1 cần đủ các phần sau:

1. Mục tiêu chương.
2. Cơ sở khảo sát và phương pháp đặc tả.
3. Bối cảnh nghiệp vụ.
4. Stakeholder và actor.
5. Phạm vi hệ thống.
6. Quyết định chia phase sau khảo sát.
7. Yêu cầu chức năng Phase 1 và Phase 2.
8. Yêu cầu phi chức năng.
9. Business rules.
10. Use case tổng quan.
11. Đặc tả use case trọng tâm.
12. Acceptance criteria.
13. Ma trận truy vết.
14. Dữ liệu đầu vào/đầu ra/ràng buộc.
15. Demo chức năng trọng tâm.
16. Kết luận chương.

## 4.2. Nội dung chính cần đưa vào

### 1.1. Mục tiêu của chương

Chương này trình bày quá trình xác định và đặc tả yêu cầu cho hệ thống **4N Clinic Management System – Hệ thống quản lý phòng mạch tư nhân**. Nội dung chương tập trung làm rõ bối cảnh nghiệp vụ, các stakeholder, phạm vi hệ thống, danh sách yêu cầu chức năng, yêu cầu phi chức năng, mô hình use case, đặc tả một số use case trọng tâm, acceptance criteria và ma trận truy vết yêu cầu.

Các yêu cầu được tổ chức theo hai giai đoạn:

- **Phase 1**: baseline hệ thống lõi.
- **Phase 2**: mở rộng nghiệp vụ nâng cao.

### 1.2. Cơ sở khảo sát và phương pháp đặc tả

Trong phạm vi đồ án, nhóm sử dụng hình thức khảo sát nghiệp vụ giả định dựa trên mô hình vận hành phổ biến của phòng mạch tư nhân quy mô nhỏ đến trung bình. Đối tượng khảo sát giả định gồm chủ phòng mạch, lễ tân, bác sĩ, thu ngân, quản trị viên hệ thống và quản lý phòng mạch.

Các vấn đề khi quản lý thủ công:

- Hồ sơ bệnh nhân lưu rời rạc.
- Quy trình tiếp nhận và cấp số thứ tự dễ nhầm lẫn.
- Bác sĩ khó theo dõi lịch sử khám.
- Hóa đơn và thanh toán dễ sai lệch.
- Chủ phòng mạch thiếu dữ liệu tổng hợp.
- Phân quyền chưa rõ ràng.

Phương pháp đặc tả: dùng **Structured Natural Language Specification**, gồm:

| Thành phần | Ý nghĩa |
|---|---|
| Use case ID | Mã định danh use case |
| Tên use case | Tên chức năng nghiệp vụ |
| Actor | Tác nhân chính/phụ |
| Mô tả | Mục đích nghiệp vụ |
| Tiền điều kiện | Điều kiện trước khi thực hiện |
| Hậu điều kiện | Trạng thái sau khi thành công |
| Luồng chính | Các bước xử lý chính |
| Luồng ngoại lệ | Trường hợp lỗi/nhánh đặc biệt |
| Yêu cầu liên quan | Requirement, NFR, business rules liên quan |

### 1.3. Bối cảnh nghiệp vụ

Quy trình vận hành cơ bản:

```text
Bệnh nhân đến phòng mạch
→ lễ tân tra cứu/tạo hồ sơ
→ lễ tân tạo lượt khám
→ bác sĩ mở phiên khám
→ bác sĩ ghi chẩn đoán/kê đơn
→ thu ngân lập hóa đơn
→ thu ngân ghi nhận thanh toán
→ quản lý xem báo cáo
```

Phase 2 mở rộng thêm:

```text
lịch hẹn → check-in → hàng đợi → sinh hiệu → dịch vụ/xét nghiệm → kho thuốc/cấp phát thuốc
```

### 1.4. Stakeholder và actor

Bảng stakeholder:

| Stakeholder | Mối quan tâm | Kỳ vọng |
|---|---|---|
| Chủ phòng mạch/Quản lý | Doanh thu, lượt khám, vận hành | Có báo cáo, điều chỉnh quy định |
| Lễ tân | Tiếp nhận nhanh, tránh sai | Tra cứu bệnh nhân, tạo lượt khám |
| Bác sĩ | Xem thông tin, khám, kê đơn | Phiếu khám rõ ràng, lịch sử khám |
| Thu ngân | Hóa đơn, thanh toán | Hóa đơn gắn visit, trạng thái rõ |
| Admin | Tài khoản, quyền | Quản lý user, role, permission |
| Nhóm phát triển | Thiết kế, hiện thực, test | Yêu cầu rõ, truy vết được |
| Giảng viên | Đánh giá quy trình và sản phẩm | Báo cáo đủ khảo sát, yêu cầu, thiết kế, hiện thực, kiểm thử |

Bảng actor:

| Actor | Phase | Chức năng chính |
|---|---|---|
| ADMIN | P1 | Quản lý tài khoản, vai trò, danh mục, cấu hình |
| RECEPTIONIST | P1 | Bệnh nhân, tiếp nhận, lượt khám |
| DOCTOR | P1 | Phiếu khám, chẩn đoán, kê đơn |
| CASHIER | P1 | Hóa đơn, thanh toán |
| MANAGER | P1 | Báo cáo, quy định |
| NURSE | P2 | Sinh hiệu, hàng đợi |
| LAB_TECHNICIAN | P2 | Nhận mẫu, nhập/xác minh xét nghiệm |
| PHARMACIST | P2 | Kho thuốc, cấp phát thuốc |

### 1.5. Phạm vi hệ thống

Phase 1:

| Nhóm chức năng | Trong Phase 1 | Ghi chú |
|---|---|---|
| Xác thực và phân quyền | Có | Đăng nhập, kiểm tra quyền |
| Quản lý tài khoản | Có | Tạo, cập nhật, khóa/mở tài khoản |
| Quản lý bệnh nhân | Có | Tạo, cập nhật, tìm kiếm |
| Tiếp nhận và lượt khám | Có | Tạo visit, cấp số thứ tự |
| Phiếu khám | Có | Mở khám, ghi triệu chứng, chẩn đoán |
| Kê đơn | Có | Prescription và prescription items |
| Hóa đơn và thanh toán | Có | Invoice, payment |
| Quy định | Có | Phí khám, quota ngày |
| Báo cáo tháng | Có | Lượt khám, doanh thu cơ bản |

Phase 2:

| Nhóm chức năng | Trong Phase 2 | Ghi chú |
|---|---|---|
| Lịch hẹn | Có | Appointment |
| Hàng đợi | Có | Queue |
| Sinh hiệu | Có | Vitals |
| Dịch vụ y tế | Có | Services, service orders |
| Xét nghiệm | Có | Lab orders/results |
| Kho thuốc | Có | Stock lot, stock movement |
| Cấp phát thuốc | Có | Dispense theo FEFO |
| Tổ chức phòng ban | Có | Department, staff profile |
| Audit log | Có | Ghi nhận thao tác quan trọng |

Ngoài phạm vi hiện tại:

- Patient portal.
- Đặt lịch online công khai.
- Thanh toán online.
- Bảo hiểm y tế.
- Tích hợp HIS/EMR bên ngoài.
- Đa chi nhánh.
- Production deployment thật.

### 1.6. Yêu cầu chức năng

Phase 1:

| Mã | Tên yêu cầu | Actor |
|---|---|---|
| REQ-01 | Đăng nhập | Tất cả |
| REQ-02 | Đăng xuất | Tất cả |
| REQ-03 | Quản lý tài khoản | ADMIN |
| REQ-04 | Tạo hồ sơ bệnh nhân | RECEPTIONIST |
| REQ-05 | Tra cứu/cập nhật bệnh nhân | RECEPTIONIST, DOCTOR |
| REQ-06 | Tạo lượt khám | RECEPTIONIST |
| REQ-07 | Cấp số thứ tự khám | RECEPTIONIST |
| REQ-08 | Xem danh sách lượt khám | RECEPTIONIST, DOCTOR |
| REQ-09 | Mở phiên khám | DOCTOR |
| REQ-10 | Ghi thông tin khám | DOCTOR |
| REQ-11 | Ghi chẩn đoán | DOCTOR |
| REQ-12 | Kê đơn thuốc | DOCTOR |
| REQ-13 | Hoàn tất phiếu khám | DOCTOR |
| REQ-14 | Lập hóa đơn | CASHIER |
| REQ-15 | Ghi nhận thanh toán | CASHIER |
| REQ-16 | Tra cứu hóa đơn | CASHIER, MANAGER |
| REQ-17 | Quản lý danh mục bệnh | ADMIN, MANAGER |
| REQ-18 | Quản lý danh mục thuốc | ADMIN, MANAGER |
| REQ-19 | Thay đổi quy định | MANAGER, ADMIN |
| REQ-20 | Báo cáo tháng | MANAGER |

Phase 2:

| Mã | Tên yêu cầu | Actor |
|---|---|---|
| REQ-21 | Quản lý lịch hẹn | RECEPTIONIST |
| REQ-22 | Check-in lịch hẹn | RECEPTIONIST |
| REQ-23 | Quản lý hàng đợi | RECEPTIONIST, NURSE, DOCTOR |
| REQ-24 | Ghi nhận sinh hiệu | NURSE, DOCTOR |
| REQ-25 | Quản lý dịch vụ | ADMIN, MANAGER |
| REQ-26 | Chỉ định dịch vụ | DOCTOR |
| REQ-27 | Quản lý xét nghiệm | LAB_TECHNICIAN, DOCTOR |
| REQ-28 | Quản lý kho thuốc | PHARMACIST, MANAGER |
| REQ-29 | Cấp phát thuốc | PHARMACIST |
| REQ-30 | Audit log và tổ chức vận hành | ADMIN, MANAGER |

### 1.7. Yêu cầu phi chức năng

| Mã | Nhóm | Nội dung |
|---|---|---|
| NFR-01 | Hiệu năng | Các thao tác thường dùng phản hồi trong thời gian chấp nhận được ở local |
| NFR-02 | Bảo mật | API nghiệp vụ yêu cầu JWT |
| NFR-03 | Phân quyền | Frontend và backend đều kiểm tra role/permission |
| NFR-04 | Toàn vẹn dữ liệu | Transaction cho nghiệp vụ nhiều bảng |
| NFR-05 | Dễ sử dụng | Giao diện rõ theo vai trò |
| NFR-06 | Bảo trì | Module/service/DTO rõ ràng |
| NFR-07 | Mở rộng | Phase 2 bổ sung quanh lõi Phase 1 |
| NFR-08 | Kiểm thử | Use case quan trọng có test case/minh chứng |
| NFR-09 | Truy vết | Yêu cầu liên kết use case, API, UI, test |
| NFR-10 | Vận hành local | Có hướng dẫn chạy local, migration, seed |

### 1.8. Business rules trọng tâm

| Mã | Rule | Phase |
|---|---|---|
| BR-01 | Chỉ người dùng có tài khoản hợp lệ mới đăng nhập | P1 |
| BR-02 | Tài khoản bị khóa không được truy cập | P1 |
| BR-03 | Người dùng chỉ thao tác theo role/permission | P1 |
| BR-04 | Bệnh nhân cần thông tin định danh tối thiểu | P1 |
| BR-05 | Không tạo nhiều visit trùng trong ngày cho cùng bệnh nhân nếu chưa cho phép | P1 |
| BR-06 | Số thứ tự khám duy nhất theo ngày | P1 |
| BR-07 | Không tạo visit nếu vượt quota ngày | P1 |
| BR-08 | Chỉ bác sĩ/role được ủy quyền mở và cập nhật phiếu khám | P1 |
| BR-09 | Phiếu khám phải gắn với visit hợp lệ | P1 |
| BR-10 | Mỗi phiếu khám có tối đa một chẩn đoán chính | P1 |
| BR-11 | Đơn thuốc phải gắn với phiếu khám | P1 |
| BR-12 | Không hoàn tất phiếu khám nếu thiếu chẩn đoán tối thiểu | P1 |
| BR-13 | Chỉ lập hóa đơn cho visit đã hoàn tất | P1 |
| BR-14 | Mỗi visit có tối đa một hóa đơn chính trong Phase 1 | P1 |
| BR-15 | Số tiền thanh toán phải lớn hơn 0 | P1 |
| BR-16 | Tổng tiền thanh toán không vượt tổng tiền hóa đơn | P1 |
| BR-17 | Hóa đơn PAID/VOID không được thanh toán mới | P1 |
| BR-18 | Quy định có hiệu lực cần lưu version/thời điểm áp dụng | P1 |
| BR-19 | Kết quả xét nghiệm verified không được sửa tùy tiện | P2 |
| BR-20 | Cấp phát thuốc theo FEFO | P2 |

### 1.9. Use case trọng tâm cần đặc tả

Đặc tả chi tiết ít nhất các UC sau:

- UC01 Đăng nhập.
- UC04 Tạo hồ sơ bệnh nhân.
- UC05 Tra cứu bệnh nhân.
- UC07 Tạo lượt khám và cấp số thứ tự.
- UC09 Mở phiên khám.
- UC11 Ghi chẩn đoán.
- UC12 Kê đơn thuốc.
- UC13 Hoàn tất phiếu khám.
- UC14 Lập hóa đơn.
- UC15 Ghi nhận thanh toán.
- UC21 Quản lý lịch hẹn.
- UC27 Quản lý xét nghiệm.
- UC29 Cấp phát thuốc.

Mỗi UC dùng bảng gồm:

| Thành phần | Nội dung |
|---|---|
| Use case ID | ... |
| Tên use case | ... |
| Phase | ... |
| Actor | ... |
| Mô tả | ... |
| Tiền điều kiện | ... |
| Hậu điều kiện | ... |
| Luồng chính | ... |
| Luồng ngoại lệ | ... |
| Yêu cầu liên quan | ... |

### 1.10. Acceptance criteria chọn lọc

| Mã AC | Use case | Điều kiện chấp nhận |
|---|---|---|
| AC-01 | UC01 | Đăng nhập đúng trả token và giao diện đúng role |
| AC-02 | UC01 | Sai mật khẩu không cấp token |
| AC-03 | UC04 | Tạo bệnh nhân hợp lệ thành công |
| AC-04 | UC05 | Tìm bệnh nhân theo tên/số điện thoại trả kết quả phù hợp |
| AC-05 | UC07 | Tạo visit hợp lệ có queueNumber |
| AC-06 | UC07 | Visit trùng ngày bị chặn |
| AC-07 | UC13 | Phiếu khám có diagnosis thì hoàn tất được |
| AC-08 | UC13 | Thiếu diagnosis thì không hoàn tất |
| AC-09 | UC14 | Visit completed lập được invoice |
| AC-10 | UC15 | Payment hợp lệ cập nhật invoice |
| AC-11 | UC15 | Payment vượt remaining bị chặn |
| AC-12 | UC21 | Appointment hợp lệ được lưu và check-in thành visit |
| AC-13 | UC27 | Lab result verified bị hạn chế sửa |
| AC-14 | UC29 | Dispense thành công trừ kho theo lô phù hợp |

### 1.11. Ma trận truy vết rút gọn

| REQ | Use case | Phase | Backend/API | Frontend |
|---|---|---|---|---|
| REQ-01 | UC01 | P1 | POST /api/v1/auth/login | LoginPage |
| REQ-04/05 | UC04-05 | P1 | /api/v1/patients | Patient pages |
| REQ-06/07/08 | UC07-08 | P1 | /api/v1/visits | Visit pages |
| REQ-09-13 | UC09-13 | P1 | /api/v1/examinations | ExaminationPage |
| REQ-14-16 | UC14-16 | P1 | /api/v1/invoices, /payments | Invoice pages |
| REQ-19 | Regulation | P1 | /api/v1/regulations | RegulationPage |
| REQ-20 | Report | P1 | /api/v1/reports | ReportPage |
| REQ-21/22 | UC21 | P2 | /api/v1/appointments | AppointmentPage |
| REQ-27 | UC27 | P2 | /api/v1/lab | LabPage |
| REQ-28/29 | UC29 | P2 | /api/v1/inventory, /pharmacy | Inventory/Pharmacy pages |

### 1.12. Kết luận chương

Chương 1 cần kết luận rằng yêu cầu đã được xác định theo hai phase; Phase 1 là nghiệp vụ lõi, Phase 2 là mở rộng; yêu cầu là cơ sở cho thiết kế hệ thống, thiết kế phần mềm, hiện thực và kiểm thử.

---

# 5. CHƯƠNG 2 – THIẾT KẾ HỆ THỐNG

## 5.1. Mục tiêu sửa Chương 2

Chương 2 cần giải thích rõ vì sao chọn kiến trúc hiện tại:

- Client–Server tổng thể.
- Backend Modular Monolith.
- Layered/Clean Architecture.
- PostgreSQL.
- REST API.
- JWT/RBAC.
- Không chọn microservices trong Phase 1.
- Hệ thống chạy local/development.

## 5.2. Nội dung chính cần đưa vào

### 2.1. Mục tiêu thiết kế hệ thống

Chương này trình bày thiết kế hệ thống ở mức kiến trúc tổng thể. Thiết kế hướng đến:

- Tách frontend, backend, database.
- Hỗ trợ nhiều vai trò nội bộ.
- Business logic, validation, phân quyền, transaction ở backend.
- Dữ liệu quan hệ trong PostgreSQL.
- Backend module hóa để dễ kiểm thử và mở rộng.
- Frontend theo vai trò/feature.
- Phù hợp team nhỏ, thời gian học phần và local demo.
- Mở rộng từ Phase 1 sang Phase 2.

### 2.2. Nguyên tắc thiết kế

| Nguyên tắc | Nội dung |
|---|---|
| Không đưa business logic lõi vào frontend | Frontend hỗ trợ trải nghiệm; rule bắt buộc ở backend |
| Backend kiểm soát nghiệp vụ | Auth, RBAC, validation, transaction |
| Database bảo đảm toàn vẹn | FK, unique, index, transaction |
| Thiết kế theo module | Auth, Patient, Visit, Examination, Billing, Lab, Inventory |
| Không tối ưu hóa sớm | Chưa cần microservices/message broker |
| Ưu tiên kiểm thử | Rule ở service layer dễ test |
| Mở rộng Phase 2 | Module mới quanh lõi Phase 1 |
| Thiết kế giải thích được | Mỗi quyết định có lý do/lợi ích/giới hạn |

### 2.3. Giả định và môi trường

Giả định:

| Mã | Nội dung | Ảnh hưởng |
|---|---|---|
| A1 | Một phòng mạch/chi nhánh | Chưa cần tenant/branch |
| A2 | Web app nội bộ | Người dùng là nhân sự |
| A3 | Phase 1 tiếp nhận tại quầy | Chưa cần booking public |
| A4 | Khám ngoại trú cơ bản | Tập trung Patient/Visit/Examination/Billing |
| A5 | Một visit có tối đa một invoice chính | Billing đơn giản, tránh trùng |
| A6 | Phase 1 thuốc ở mức danh mục | Inventory sang Phase 2 |
| A7 | Nhiều vai trò nội bộ | Cần RBAC |
| A8 | Lưu lượng thấp/vừa | Modular monolith phù hợp |

### 2.4. Kiến trúc tổng thể

Mô hình logic:

```text
[Admin] [Lễ tân] [Bác sĩ] [Thu ngân] [Quản lý]
        │
        │ Trình duyệt web
        ▼
React + Vite + Tailwind Frontend
        │
        │ REST/JSON + Bearer Token
        ▼
NestJS Modular Monolith Backend
        │
        ├── Auth/RBAC
        ├── Patient
        ├── Visit / Queue
        ├── Examination / Prescription
        ├── Billing / Payment
        ├── Regulation / Report
        ├── Appointment / Vitals / Services
        ├── Lab
        └── Inventory / Pharmacy
        │
        │ Prisma ORM / SQL
        ▼
PostgreSQL Database
```

Chèn hình:

- Hình 2.1: Sơ đồ ngữ cảnh hệ thống.
- Hình 2.2: Sơ đồ container.
- Hình 2.3: Component backend theo module.
- Hình 2.4: Layered architecture.
- Hình 2.5: Triển khai local/development.

### 2.5. Tech stack

| Lớp | Công nghệ | Vai trò |
|---|---|---|
| Runtime | Node.js | Chạy backend/frontend tooling |
| Backend | NestJS + TypeScript | REST API, DI, module |
| ORM | Prisma | Schema, migration, query |
| Database | PostgreSQL | Dữ liệu quan hệ |
| Auth | JWT, Passport | Xác thực |
| Frontend | React + Vite + TypeScript | UI |
| Styling | Tailwind CSS | Giao diện |
| Server state | TanStack Query | Fetch/cache |
| Client state | Zustand | Auth/global state |
| Form | React Hook Form + Zod | Form/validation |
| Test | Jest, Supertest | API/E2E |
| API docs | Swagger | Tài liệu API |
| Version control | Git/GitHub | Quản lý mã nguồn |

### 2.6. Quyết định kiến trúc

| ADR | Quyết định | Lý do | Tác động |
|---|---|---|---|
| ADR-01 | Web app thay desktop | Nhiều vai trò, dữ liệu tập trung | Cần backend/API |
| ADR-02 | Client–Server | Tách UI, nghiệp vụ, dữ liệu | Frontend không truy cập DB |
| ADR-03 | Modular Monolith | Team nhỏ, dễ debug/test/deploy | Không scale từng module độc lập |
| ADR-04 | Layered Architecture | Rule rõ, kiểm thử được | Controller/service/repository tách trách nhiệm |
| ADR-05 | PostgreSQL | Dữ liệu quan hệ, transaction | FK, unique, index |
| ADR-06 | Business logic ở backend | Tránh lệch rule giữa UI | Backend là nguồn sự thật |
| ADR-07 | REST API | Phù hợp React, Swagger | Cần chuẩn hóa response/error |
| ADR-08 | Phase 2 bằng module mới | Không phá lõi Phase 1 | Dễ mở rộng |

### 2.7. Backend Modular Monolith

Các module:

| Nhóm | Module | Phase |
|---|---|---|
| Identity | Auth, Users, Roles, Permissions | P1 |
| Patient | Patients | P1 |
| Clinical Core | Visits, Examinations | P1 |
| Clinical Detail | Diagnoses, Diseases, Prescriptions, Drugs | P1 |
| Billing | Invoices, Payments | P1 |
| Configuration | Regulations | P1 |
| Reporting | Reports | P1 |
| Workflow Extension | Appointments, Queue, Vitals | P2 |
| Service/Lab | Services, ServiceOrders, Lab | P2 |
| Inventory/Pharmacy | Inventory, Pharmacy | P2 |
| Operation | Organization, Audit Logs | P2 |

Lý do không chọn microservices:

- Phức tạp vận hành.
- Khó transaction.
- Debug khó.
- Vượt thời gian học phần.
- Over-engineering cho phòng mạch nhỏ.

### 2.8. Layered/Clean Architecture

Mô hình:

```text
Controller
→ DTO/Validation
→ Service/Use Case
→ Domain Policy/Business Rules
→ Repository/Prisma
→ PostgreSQL
```

Ví dụ Payment:

| Lớp | Trách nhiệm |
|---|---|
| PaymentController | Nhận request |
| CreatePaymentDto | Kiểm tra input |
| PaymentService | Kiểm tra invoice, amount, status |
| Billing Policy | Không overpayment, không pay VOID |
| Prisma Transaction | Tạo payment + cập nhật invoice |
| PostgreSQL | Lưu dữ liệu |

### 2.9. Frontend architecture

Frontend:

- React SPA.
- Route theo role.
- ProtectedRoute.
- Sidebar theo role/permission.
- API client chung.
- TanStack Query cho server state.
- Zustand cho auth/global state.
- React Hook Form/Zod cho form.

Frontend không quyết định business rules lõi.

### 2.10. Auth/RBAC

RBAC:

```text
User → Role → Permission
```

Ma trận quyền rút gọn:

| Chức năng | ADMIN | RECEPTIONIST | DOCTOR | CASHIER | MANAGER |
|---|---|---|---|---|---|
| Quản lý tài khoản | Có | Không | Không | Không | Xem giới hạn |
| Quản lý bệnh nhân | Có | Có | Xem | Không | Xem |
| Tạo lượt khám | Có | Có | Không | Không | Xem |
| Mở phiếu khám | Không | Không | Có | Không | Xem |
| Kê đơn | Không | Không | Có | Không | Xem |
| Lập hóa đơn | Không | Không | Không | Có | Xem |
| Thanh toán | Không | Không | Không | Có | Xem |
| Quy định | Có | Không | Không | Không | Có |
| Báo cáo | Có | Không | Không | Không | Có |

### 2.11. Kết luận chương

Kết luận rằng kiến trúc Client–Server + Modular Monolith + Layered/Clean phù hợp với quy mô, team và phạm vi phase; là cơ sở cho Chương 3 thiết kế dữ liệu/xử lý/UI chi tiết.

---

# 6. CHƯƠNG 3 – THIẾT KẾ PHẦN MỀM

## 6.1. Mục tiêu sửa Chương 3

Chương 3 cần đi sâu vào:

- Thiết kế dữ liệu.
- Thiết kế xử lý.
- Thiết kế lớp/module nghiệp vụ.
- Thiết kế giao diện/user flow.
- Liên kết yêu cầu – thiết kế – API – UI.
- State machine, transaction, constraints.

## 6.2. Nội dung chính cần đưa vào

### 3.1. Tổng quan

Chương này chuyển hóa yêu cầu và kiến trúc thành thiết kế chi tiết: ERD, module, class diagram, sequence diagram, state machine, API inventory và UI/user flow.

### 3.2. Nguyên tắc thiết kế phần mềm

| Nguyên tắc | Nội dung |
|---|---|
| Tách dữ liệu lõi và mở rộng | Patient/Visit/Examination/Billing là lõi; Lab/Inventory/Pharmacy là mở rộng |
| Lưu lịch sử nghiệp vụ | Giá, thuốc, hóa đơn, quy định theo thời điểm |
| Business logic ở service | Không dồn vào frontend/controller |
| Dữ liệu quan hệ ràng buộc rõ | FK, unique, enum, transaction |
| Module theo nghiệp vụ | Dễ kiểm thử/mở rộng |
| Phase 2 quanh lõi Phase 1 | Không tạo luồng độc lập |

### 3.3. Thiết kế dữ liệu

Các nhóm ERD nên có:

| Sơ đồ ERD | Phạm vi |
|---|---|
| ERD Phase 1 lõi | User, Patient, Visit, Examination, Diagnosis, Disease, Prescription, Drug, Invoice, Payment, Regulation |
| ERD Identity & Access | User, Role, Permission |
| ERD Clinical Core | Patient, Visit, Examination, Diagnosis, Prescription |
| ERD Billing | Visit, Invoice, InvoiceItem, Payment |
| ERD Phase 2 Workflow | Appointment, QueueTicket, VitalSign, ServiceOrder, LabOrder |
| ERD Inventory/Pharmacy | Drug, StockLot, StockMovement, Prescription, Dispense |

Nhóm model:

**Identity & Access**

| Model | Vai trò |
|---|---|
| User | Tài khoản |
| Role | Vai trò |
| Permission | Quyền |
| UserRole/RolePermission | Bảng nối nếu RBAC động |

**Clinical Core**

| Model | Vai trò |
|---|---|
| Patient | Hồ sơ bệnh nhân |
| Visit | Lượt khám |
| Examination | Phiếu khám |
| Diagnosis | Dòng chẩn đoán |
| Disease | Danh mục bệnh |
| Prescription | Đơn thuốc |
| PrescriptionItem | Dòng thuốc |
| Drug | Danh mục thuốc |

**Billing**

| Model | Vai trò |
|---|---|
| Invoice | Hóa đơn |
| InvoiceItem | Dòng hóa đơn |
| Payment | Lần thanh toán |
| PaymentMethod | Enum |
| InvoiceStatus | Enum |

**Phase 2**

| Module | Model |
|---|---|
| Appointment/Queue | Appointment, QueueTicket |
| Vitals | VitalSign |
| Services/Lab | ServiceCatalog, ServiceOrder, LabOrder, LabResult |
| Inventory/Pharmacy | StockLot, StockMovement, Dispense, DispenseItem |
| Organization/Audit | Department, StaffProfile, AuditLog |

### 3.4. Enum/state machine

Visit:

```text
WAITING → IN_PROGRESS → COMPLETED
   │            │
   └────────────┴──→ CANCELLED
```

Invoice:

```text
DRAFT → ISSUED → PARTIALLY_PAID → PAID
  │        │             │
  └────────┴─────────────┴──→ VOID
```

Appointment:

```text
SCHEDULED → CHECKED_IN
    │
    ├──→ CANCELLED
    └──→ NO_SHOW
```

Lab:

```text
ORDERED → SAMPLE_COLLECTED → RESULT_ENTERED → VERIFIED
   │              │                 │
   └──────────────┴─────────────────┴──→ CANCELLED
```

### 3.5. Ràng buộc dữ liệu

| Ràng buộc | Mục đích |
|---|---|
| User email/username unique | Tránh trùng đăng nhập |
| Patient code unique | Định danh bệnh nhân |
| Visit patientId + date unique có điều kiện | Tránh visit trùng |
| Visit date + queueNumber unique | Tránh trùng số thứ tự |
| Examination visitId unique | Một visit có một examination chính |
| Invoice visitId unique | Một visit có một invoice chính |
| Payment amount > 0 | Không thanh toán âm/0 |
| paidAmount <= totalAmount | Không overpayment |
| StockLot quantityOnHand >= 0 | Không âm kho |
| Diagnosis primary tối đa một | Không nhiều chẩn đoán chính |
| Lab verified hạn chế sửa | Bảo toàn kết quả |

### 3.6. Snapshot dữ liệu

Cần nhấn mạnh:

- Giá thuốc/dịch vụ/phí khám cần lưu snapshot trong invoice item.
- Đơn thuốc/hóa đơn quá khứ không bị đổi khi danh mục hiện tại thay đổi.
- Regulation cần lưu version/thời điểm áp dụng.
- Lab result verified cần bảo toàn giá trị.

### 3.7. Thiết kế xử lý

API inventory:

| Nhóm | API |
|---|---|
| Auth | POST /auth/login |
| Patients | GET/POST/PATCH /patients |
| Visits | GET/POST/PATCH /visits |
| Examinations | GET/POST/PATCH /examinations |
| Billing | GET/POST /invoices |
| Payments | POST /payments |
| Reports | GET /reports/monthly |
| Appointments | GET/POST/PATCH /appointments |
| Lab | POST/PATCH /lab/orders |
| Inventory | POST/PATCH /inventory/stock-lots |
| Pharmacy | POST /pharmacy/dispense |

Transaction quan trọng:

| Transaction | Lý do |
|---|---|
| Tạo lượt khám | quota + queueNumber + visit |
| Hoàn tất khám | examination + visit |
| Lập hóa đơn | invoice + invoice items |
| Thanh toán | payment + invoice status |
| Check-in lịch hẹn | appointment + visit + queue |
| Cấp phát thuốc | dispense + stock movement + trừ tồn kho |

Sequence diagram nên có:

- Đăng nhập/RBAC.
- Tạo lượt khám.
- Hoàn tất phiếu khám.
- Lập hóa đơn/thanh toán.
- Check-in lịch hẹn.
- Lab workflow.
- Cấp phát thuốc FEFO.

### 3.8. Class design/module

Các sơ đồ lớp cần có phần giải thích chứ không chỉ chèn hình:

| Sơ đồ | Nội dung |
|---|---|
| Identity & Access | User, Role, Permission, AuthService, RbacGuard |
| Core Clinical Flow | Patient, Visit, Examination, VisitService, ExaminationService |
| Diagnosis & Prescription | Diagnosis, Disease, Prescription, PrescriptionItem, Drug |
| Financial Module | Invoice, InvoiceItem, Payment, BillingService, PaymentService |
| Regulation Module | RegulationVersion, RegulationService |
| Service Layer | AuthService, PatientService, VisitService, ExaminationService, BillingService, PaymentService |
| Organization | Department, Room, StaffProfile |
| Appointment & Queue | Appointment, QueueTicket, Visit |
| Laboratory | ServiceOrder, LabOrder, LabResult |
| Pharmacy & Inventory | Drug, StockLot, StockMovement, Dispense |

### 3.9. Thiết kế giao diện

Danh sách màn hình:

| Màn hình | Role | Phase |
|---|---|---|
| LoginPage | Tất cả | P1 |
| DashboardPage | Theo role | P1 |
| UserManagementPage | ADMIN | P1 |
| PatientList/Create/Detail | RECEPTIONIST, DOCTOR | P1 |
| VisitList/Create | RECEPTIONIST, DOCTOR | P1 |
| ExaminationPage | DOCTOR | P1 |
| InvoiceList/Detail | CASHIER, MANAGER | P1 |
| RegulationPage | ADMIN, MANAGER | P1 |
| ReportPage | MANAGER | P1 |
| AppointmentPage | RECEPTIONIST | P2 |
| QueuePage | RECEPTIONIST, NURSE, DOCTOR | P2 |
| VitalsPage | NURSE, DOCTOR | P2 |
| LabPage | LAB_TECHNICIAN, DOCTOR | P2 |
| InventoryPage | PHARMACIST, MANAGER | P2 |
| PharmacyPage | PHARMACIST | P2 |

User flow:

```text
Receptionist: Login → Search/Create Patient → Create Visit → Queue
Doctor: Login → Visit List → Examination → Diagnosis → Prescription → Complete
Cashier: Login → Invoice List → Invoice Detail → Add Payment
Phase 2: Appointment → Check-in → Visit/Queue
Phase 2: Lab Order → Sample → Result → Verify
Phase 2: Prescription → Pharmacy → FEFO Dispense → StockMovement
```

### 3.10. Kết luận chương

Kết luận rằng thiết kế phần mềm xoay quanh lõi Patient–Visit–Examination–Billing; Phase 2 mở rộng quanh lõi; thiết kế xử lý đặt rule ở backend service, dùng state machine và transaction.

---

# 7. CHƯƠNG 4 – HIỆN THỰC

## 7.1. Mục tiêu sửa Chương 4

Chương 4 cần trình bày cách hệ thống được hiện thực từ thiết kế:

- Phase 1 baseline.
- Phase 2 full extension.
- Backend implementation.
- Frontend implementation.
- Database/Prisma.
- API/Swagger.
- Business rules.
- Git/timeline/quy trình nhóm.
- Demo/minh chứng.

## 7.2. Nội dung chính cần đưa vào

### 4.1. Mục tiêu chương

Chương này trình bày cách nhóm chuyển hóa yêu cầu, kiến trúc và thiết kế thành mã nguồn backend, frontend, database, API và giao diện chạy được.

### 4.2. Phương pháp hiện thực

- Chia Phase 1/Phase 2.
- Backend-first và business-logic-first.
- Một chức năng làm theo quy trình:
  1. Đối chiếu yêu cầu.
  2. Kiểm tra thiết kế dữ liệu.
  3. Cập nhật Prisma schema.
  4. Migration/seed.
  5. DTO.
  6. Service/business rule.
  7. Controller/API.
  8. Guard/role.
  9. Swagger.
  10. Frontend API hook.
  11. UI.
  12. Test.
  13. Screenshot minh chứng.

### 4.3. Công nghệ hiện thực

Backend:

| Thành phần | Công nghệ |
|---|---|
| Runtime | Node.js |
| Framework | NestJS |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT, Passport |
| Authorization | Guards, decorators |
| API docs | Swagger |
| Testing | Jest, Supertest |

Frontend:

| Thành phần | Công nghệ |
|---|---|
| Framework | React |
| Build tool | Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Server state | TanStack Query |
| Client state | Zustand |
| Form | React Hook Form |
| Validation | Zod |
| Routing | React Router |

### 4.4. Cấu trúc mã nguồn

Mẫu cấu trúc:

```text
4N_Clinic_Management_System/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── common/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── patients/
│   │   ├── visits/
│   │   ├── examinations/
│   │   ├── billing/
│   │   ├── regulations/
│   │   ├── reports/
│   │   ├── appointments/
│   │   ├── queue/
│   │   ├── vitals/
│   │   ├── services/
│   │   ├── lab/
│   │   ├── inventory/
│   │   ├── pharmacy/
│   │   ├── organization/
│   │   └── audit/
│   └── test/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── config/
│   │   ├── features/
│   │   ├── layouts/
│   │   ├── lib/
│   │   └── shared/
└── docs/
```

### 4.5. Backend implementation

Một module gồm:

```text
module/
├── dto/
├── module.controller.ts
├── module.service.ts
└── module.module.ts
```

Bảng module:

| Module | Phase | Chức năng |
|---|---|---|
| auth | P1 | Login, token |
| users | P1 | Account |
| patients | P1 | Patient CRUD/search |
| visits | P1 | Visit/queue number |
| examinations | P1 | Examination/diagnosis/prescription |
| diseases/drugs | P1 | Catalog |
| billing/invoices | P1 | Invoice |
| payments | P1 | Payment |
| regulations | P1 | Rules |
| reports | P1 | Monthly report |
| appointments | P2 | Appointment/check-in |
| queue | P2 | Queue |
| vitals | P2 | Vital signs |
| services | P2 | Services/orders |
| lab | P2 | Lab workflow |
| inventory | P2 | Stock |
| pharmacy | P2 | Dispense |
| organization/audit | P2 | Operation |

### 4.6. Business rules tiêu biểu

Nên đưa pseudo-code hoặc mô tả ngắn cho:

- createVisit: kiểm tra patient, trùng ngày, quota, queueNumber, transaction.
- completeExamination: kiểm tra diagnosis, update examination + visit.
- createPayment: kiểm tra invoice, remaining, create payment + update invoice.
- dispensePrescription: FEFO, stock lot, dispense, stock movement, transaction.

Không cần code thật quá dài nếu báo cáo bị dài. Có thể để pseudo-code rút gọn.

### 4.7. Frontend implementation

Frontend cần mô tả:

- LoginPage.
- ProtectedRoute/RequireRole.
- Sidebar theo role.
- API client.
- TanStack Query hooks.
- Form validation.
- Các page Phase 1/Phase 2.

Bảng màn hình:

| Màn hình | Phase | Role |
|---|---|---|
| Login | P1 | All |
| Patients | P1 | RECEPTIONIST/DOCTOR |
| Visits | P1 | RECEPTIONIST/DOCTOR |
| Examination | P1 | DOCTOR |
| Invoice | P1 | CASHIER/MANAGER |
| Report | P1 | MANAGER |
| Appointment | P2 | RECEPTIONIST |
| Queue | P2 | RECEPTIONIST/NURSE/DOCTOR |
| Lab | P2 | LAB_TECHNICIAN/DOCTOR |
| Inventory | P2 | PHARMACIST/MANAGER |
| Pharmacy | P2 | PHARMACIST |

### 4.8. Database/Prisma

Cần trình bày:

- Prisma schema.
- Migration.
- Seed data.
- Ràng buộc service/database.
- Dữ liệu seed gồm user demo, catalog, patient, visit, invoice, appointment, lab, stock.

### 4.9. API/Swagger

Cần có bảng:

| Hạng mục | Kết quả |
|---|---|
| API prefix | /api/v1 |
| Swagger UI | http://localhost:3000/api/docs |
| Auth | JWT access/refresh nếu có |
| API protection | JwtAuthGuard, RolesGuard, @Roles |
| Định dạng | JSON |

Nếu chắc số endpoint hiện tại là 92, có thể ghi:
- Tổng endpoints: 92.
- Phase 1 endpoints: 41.
- Phase 2 endpoints: 51.

Nếu không chắc repo hiện tại, Claude Code cần kiểm tra Swagger/controller count trước khi khẳng định.

### 4.10. Git/timeline/quy trình nhóm

Timeline gợi ý:

| Giai đoạn | Nội dung |
|---|---|
| Khởi tạo | Initial commit, cấu trúc ban đầu |
| Setup project | Backend/frontend/docs nền |
| Phase 1 backend core | Prisma schema, core modules |
| Phase 1 UC07–UC11 | Visit/examination flow |
| Phase 1 Auth/RBAC/frontend | Login, user, role, pages |
| Phase 1 baseline | Baseline đầu tiên |
| Phase 2 full implementation | Appointments, queue, lab, inventory, pharmacy |
| Bug fixes/seed | Fix, seed, demo data |

Đóng góp nhóm:

- Nhấn mạnh 4 thành viên đóng góp tương đương.
- Git history không phản ánh toàn bộ công sức.
- Có công việc code, thiết kế, test, tài liệu, demo, review, sửa lỗi.

### 4.11. Kết luận chương

Kết luận rằng hệ thống đã chuyển từ thiết kế sang sản phẩm chạy được; Phase 1 hoàn thành baseline; Phase 2 mở rộng; API/DB/UI/business rules đã được hiện thực.

---

# 8. CHƯƠNG 5 – KIỂM THỬ PHẦN MỀM

## 8.1. Mục tiêu sửa Chương 5

Chương 5 cần trung thực và chuyên nghiệp:

- Phase 1 có API/E2E test rõ.
- Phase 2 manual/demo test, cần bổ sung automated test.
- Có black-box, gray-box, API/E2E, integration, manual UI, regression.
- Có bảng test case.
- Có traceability requirement-test.
- Có hạn chế và kế hoạch bổ sung test.

## 8.2. Nội dung chính cần đưa vào

### 5.1. Mục tiêu kiểm thử

Kiểm thử xác nhận hệ thống đáp ứng yêu cầu, business rules đúng, luồng nghiệp vụ hoạt động ổn định khi frontend/backend/database tích hợp.

### 5.2. Phạm vi kiểm thử

Phase 1:

| Nhóm | Module | Hình thức |
|---|---|---|
| Auth/RBAC | Auth/User/RBAC | E2E/API + manual UI |
| Patient | Patients | API + manual UI |
| Visit | Visits/Regulations | E2E/API + business rule |
| Examination | Examinations/Prescriptions | E2E/API + UI |
| Billing/Payment | Invoices/Payments | E2E/API + transaction |
| Catalog/Regulation/Report | Catalogs/Regulations/Reports | API + UI |
| UI RBAC | Frontend | Manual UI |

Phase 2:

| Nhóm | Module | Hình thức |
|---|---|---|
| Appointment | Appointments | Manual API/UI |
| Queue | Queue | Manual workflow |
| Vitals | Vitals | Manual |
| Services/Lab | Services/Lab | Manual workflow |
| Inventory/Pharmacy | Inventory/Pharmacy | Manual workflow, cần automated |
| Audit | Audit | Manual verification |

Ngoài phạm vi:

- Load testing lớn.
- Security pentest.
- Usability với người dùng thật.
- Cross-browser đầy đủ.
- CI/CD pipeline.
- Mobile responsive đầy đủ.

### 5.3. Chiến lược kiểm thử

| Phương pháp | Mục đích |
|---|---|
| Hộp đen | Kiểm tra chức năng theo input/output |
| Hộp xám | Kiểm tra API/database/business rule với hiểu biết kiến trúc |
| API/E2E | Kiểm tra luồng backend |
| Integration | Frontend-backend-database |
| Manual UI | Giao diện/role/form |
| Regression | Đảm bảo Phase 2 không phá Phase 1 |
| Boundary/negative | Dữ liệu sai/biên |

### 5.4. Môi trường kiểm thử

| Thành phần | Môi trường |
|---|---|
| Backend | NestJS local |
| Frontend | React/Vite local |
| Database | PostgreSQL local |
| ORM | Prisma |
| API docs | Swagger |
| Test runner | Jest/Supertest |
| Manual API | Swagger/Postman |
| Data | Seed data giả lập |

### 5.5. Bằng chứng kiểm thử

Nếu đúng theo repo/log:

| Hạng mục | Kết quả |
|---|---|
| Loại test | Backend E2E/API |
| Phạm vi chính | Phase 1 core flow |
| Công cụ | Jest/Supertest |
| Tổng số test | 220 |
| Pass | 220 |
| Fail | 0 |
| Tỷ lệ | 100% trên bộ test hiện có |

Cần ghi rõ: kết quả 220/220 chỉ phản ánh **bộ test hiện có**, không có nghĩa hệ thống đã test tuyệt đối.

### 5.6. Test case Phase 1

Các bảng test case cần có:

**Auth/RBAC**
- TC-AUTH-01: login thành công.
- TC-AUTH-02: sai mật khẩu.
- TC-AUTH-03: tài khoản không tồn tại.
- TC-AUTH-04: tài khoản bị khóa.
- TC-AUTH-05: API thiếu token trả 401.
- TC-AUTH-06: API sai role trả 403.
- TC-AUTH-07: sidebar theo role.

**Patient**
- Tạo bệnh nhân hợp lệ.
- Thiếu trường bắt buộc.
- Tìm theo tên.
- Không tìm thấy.
- Cập nhật hồ sơ.
- Xem chi tiết.

**Visit**
- Tạo visit hợp lệ.
- Chặn visit trùng ngày.
- Kiểm tra quota.
- Queue number tăng dần.
- Danh sách visit trong ngày.
- Sai role không tạo được visit.

**Examination**
- Mở phiếu khám.
- Ghi triệu chứng.
- Thêm diagnosis.
- Chặn nhiều primary diagnosis.
- Kê đơn.
- Hoàn tất hợp lệ.
- Thiếu diagnosis không hoàn tất.
- Cập nhật completed examination bị chặn/hạn chế.

**Billing/Payment**
- Lập invoice cho visit completed.
- Không lập invoice cho visit chưa completed.
- Chặn invoice trùng.
- Payment hợp lệ.
- Payment một phần.
- Payment đủ.
- Amount <= 0 bị chặn.
- Overpayment bị chặn.
- Pay invoice PAID/VOID bị chặn.

**Catalog/Regulation/Report**
- Tạo disease/drug.
- Chặn thiếu tên.
- Cập nhật phí khám/quota.
- Chặn giá trị âm.
- Báo cáo tháng có/không có dữ liệu.

### 5.7. Test case Phase 2

Cần ghi `MANUAL` nếu chưa có automated test.

**Appointment/Queue**
- Tạo appointment.
- Hủy appointment.
- Check-in tạo visit/queue.
- Check-in appointment cancelled bị chặn.
- Queue WAITING → CALLED → IN_SERVICE → DONE.

**Vitals**
- Ghi sinh hiệu.
- Tính BMI nếu có.
- Chặn dữ liệu âm.
- Cập nhật sinh hiệu.

**Lab**
- Tạo lab order.
- Nhận mẫu.
- Nhập kết quả.
- Verify kết quả.
- Sửa verified result bị chặn.
- Không hoàn tất khám nếu lab required pending nếu rule áp dụng.

**Inventory/Pharmacy**
- Nhập stock lot.
- Chặn quantity âm.
- Xem tồn kho.
- Xem đơn chờ cấp phát.
- Cấp phát đủ thuốc.
- FEFO chọn lô hết hạn sớm trước.
- Không đủ tồn kho bị chặn.
- Không dùng lô hết hạn.
- Reverse dispense nếu có.

### 5.8. Test giao diện

Cần kiểm tra:

- Protected route redirect login.
- Sidebar admin/doctor/cashier/receptionist khác nhau.
- Form validation.
- Error message từ backend.
- Loading/empty/success state.
- Luồng demo chính chạy mượt.

### 5.9. Traceability requirement-test

Bảng:

| Requirement | Use case | Module | Test case |
|---|---|---|---|
| REQ-01 | UC01 | Auth | TC-AUTH-* |
| REQ-04/05 | UC04/05 | Patients | TC-PAT-* |
| REQ-06/07 | UC07 | Visits | TC-VIS-* |
| REQ-09-13 | UC09-13 | Examinations | TC-EXAM-* |
| REQ-14-16 | UC14-16 | Billing/Payment | TC-BIL-*, TC-PAY-* |
| REQ-21/22 | UC21 | Appointments | TC-APT-* |
| REQ-27 | UC27 | Lab | TC-LAB-* |
| REQ-28/29 | UC29 | Inventory/Pharmacy | TC-INV-*, TC-PHA-* |

### 5.10. Hạn chế kiểm thử

| Hạn chế | Hướng khắc phục |
|---|---|
| Phase 2 chưa đủ automated tests | Bổ sung E2E cho appointment/lab/pharmacy |
| Chưa có UI automation | Playwright/Cypress |
| Chưa load testing | k6/JMeter |
| Chưa security testing sâu | OWASP checklist |
| Chưa UAT với người dùng thật | Khảo sát phòng mạch thật |
| Chưa CI/CD test pipeline | GitHub Actions |
| Test data còn giới hạn | Test data factory |

### 5.11. Hình minh chứng cần chèn

| Hình | Nội dung |
|---|---|
| Hình 5.1 | Terminal test 220/220 |
| Hình 5.2 | Swagger login |
| Hình 5.3 | Lỗi 401/403 |
| Hình 5.4 | Tạo bệnh nhân |
| Hình 5.5 | Tạo visit + queueNumber |
| Hình 5.6 | Lỗi visit trùng ngày |
| Hình 5.7 | Phiếu khám |
| Hình 5.8 | Hoàn tất khám |
| Hình 5.9 | Lập hóa đơn |
| Hình 5.10 | Payment |
| Hình 5.11 | Lỗi overpayment |
| Hình 5.12 | Report |
| Hình 5.13 | Appointment/check-in |
| Hình 5.14 | Lab workflow |
| Hình 5.15 | Inventory/Pharmacy FEFO |

### 5.12. Kết luận chương

Kết luận rằng Phase 1 đã có test tốt trên bộ test hiện có; Phase 2 đã manual/demo test nhưng cần bổ sung automated; test bám yêu cầu và business rule.

---

# 9. CHƯƠNG 6 – KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## 9.1. Mục tiêu sửa Chương 6

Chương 6 cần:

- Tổng kết mục tiêu ban đầu.
- Đánh giá mức độ hoàn thành.
- Tách kết quả Phase 1 và Phase 2.
- Tổng kết kỹ thuật.
- Tổng kết kiểm thử.
- Nêu hạn chế trung thực.
- Bài học kinh nghiệm.
- Hướng phát triển ngắn/trung/dài hạn.
- Đề xuất nếu triển khai thực tế.
- Tổng kết đóng góp nhóm.

## 9.2. Nội dung chính cần đưa vào

### 6.1. Tổng quan chương

Chương này tổng kết toàn bộ quá trình thực hiện đồ án. Nội dung tập trung đánh giá kết quả đạt được so với mục tiêu ban đầu, mức độ hoàn thành của Phase 1 và Phase 2, giá trị kỹ thuật/nghiệp vụ, hạn chế và hướng phát triển.

### 6.2. Mức độ hoàn thành

| Nhóm mục tiêu | Mức độ | Nhận xét |
|---|---|---|
| Khảo sát/đặc tả yêu cầu | Hoàn thành | Stakeholder, requirement, use case, business rules |
| Thiết kế hệ thống | Hoàn thành | Client–Server, Modular Monolith, PostgreSQL |
| Thiết kế phần mềm | Hoàn thành | Data, class, sequence, state, UI |
| Hiện thực Phase 1 | Hoàn thành baseline | Nghiệp vụ lõi |
| Hiện thực Phase 2 | Hoàn thành mở rộng đồ án | Appointment, queue, lab, inventory, pharmacy |
| Kiểm thử Phase 1 | Tương đối đầy đủ | API/E2E + manual |
| Kiểm thử Phase 2 | Cần bổ sung | Manual/demo, cần automated |
| Production | Chưa thực hiện | Local/development/demo |

### 6.3. Kết quả Phase 1

Luồng:

```text
Đăng nhập
→ Phân quyền
→ Quản lý bệnh nhân
→ Tạo lượt khám
→ Mở phiếu khám
→ Ghi chẩn đoán
→ Kê đơn
→ Hoàn tất khám
→ Lập hóa đơn
→ Ghi nhận thanh toán
→ Báo cáo tháng
```

Bảng kết quả:

| Nhóm | Ý nghĩa |
|---|---|
| Auth/RBAC | Nhân sự thao tác đúng phạm vi |
| Patient | Quản lý hồ sơ/lịch sử |
| Visit | Chuẩn hóa tiếp nhận |
| Examination | Hỗ trợ bác sĩ khám |
| Prescription | Kê đơn |
| Billing/Payment | Liên kết khám với tài chính |
| Regulation | Thay đổi quy định |
| Report | Theo dõi vận hành |

### 6.4. Kết quả Phase 2

| Nhóm | Ý nghĩa |
|---|---|
| Appointment | Lịch hẹn |
| Queue | Gọi số/điều phối |
| Vitals | Sinh hiệu |
| Services | Dịch vụ phát sinh |
| Lab | Xét nghiệm |
| Inventory | Lô thuốc/tồn kho |
| Pharmacy | Cấp phát theo FEFO |
| Organization/Audit | Vận hành/truy vết |

Ý nghĩa:

- Chứng minh kiến trúc mở rộng được.
- Hệ thống gần thực tế phòng khám hơn.
- Nhóm mở rộng có lộ trình, không làm dàn trải từ đầu.

### 6.5. Kết quả kỹ thuật

Cần tổng kết:

- Client–Server.
- React frontend.
- NestJS backend.
- PostgreSQL/Prisma.
- REST API + Swagger.
- JWT/RBAC.
- Modular Monolith.
- Layered/Clean Architecture.
- Transaction cho nghiệp vụ quan trọng.
- Seed data/demo.

### 6.6. Kết quả kiểm thử

Nội dung:

- Phase 1 đã test các luồng lõi.
- Nếu đúng log: 220/220 test pass trên bộ test hiện có.
- Phase 2 manual workflow test.
- Cần automated test thêm cho appointment/lab/inventory/pharmacy.

### 6.7. Mức độ đáp ứng yêu cầu

| Nhóm yêu cầu | Mức độ |
|---|---|
| Auth/RBAC | Đáp ứng tốt |
| Patient | Đáp ứng tốt |
| Visit | Đáp ứng tốt |
| Examination | Đáp ứng tốt |
| Billing/Payment | Đáp ứng tốt |
| Regulation/Report | Đáp ứng cơ bản |
| Appointment/Queue | Mở rộng, cần test thêm |
| Lab | Mở rộng, cần test thêm |
| Inventory/Pharmacy | Mở rộng, cần test sâu |
| Production | Chưa đáp ứng |

### 6.8. Hạn chế

Nhóm hạn chế:

**Khảo sát**
- Khách hàng giả định.
- Chưa khảo sát phòng mạch thật.
- Một số nghiệp vụ thực tế có thể khác.

**Triển khai**
- Chạy local/development.
- Chưa Docker/CI/CD/production.
- Chưa monitoring/backup/HTTPS.

**Kiểm thử**
- Phase 2 chưa đủ automated.
- Chưa UI automation.
- Chưa load/security testing.
- Chưa UAT người dùng thật.

**Bảo mật**
- Cần HTTPS, secret management, password policy, rate limit, audit log, backup.

**Giao diện**
- Cần tối ưu nhập liệu, in đơn thuốc/hóa đơn, export báo cáo, responsive.

**Báo cáo dữ liệu**
- Cần báo cáo nâng cao theo bác sĩ/dịch vụ/thuốc/kho.

### 6.9. Bài học kinh nghiệm

- Cần chốt scope theo phase.
- Đặc tả yêu cầu rõ giúp giảm mơ hồ.
- Modular Monolith phù hợp hơn microservices cho team nhỏ.
- Business logic phải ở backend.
- Database schema ảnh hưởng toàn hệ thống.
- Kiểm thử cần bảng test case và evidence.
- Git history không phản ánh toàn bộ đóng góp.

### 6.10. Hướng phát triển

Ngắn hạn:

| Hướng | Nội dung |
|---|---|
| Test Phase 2 | E2E appointment/lab/pharmacy |
| UI | Form, error, loading |
| In ấn | Đơn thuốc, hóa đơn |
| Export | Excel/PDF |
| Audit | Sửa phiếu khám, hủy hóa đơn, reverse dispense |
| Seed | Demo data ổn định |
| User manual | Theo role |
| Docker | docker-compose |

Trung hạn:

| Hướng | Nội dung |
|---|---|
| Staging/production | Deploy VPS/máy chủ |
| CI/CD | Chạy test khi push |
| Backup | PostgreSQL backup |
| Monitoring/logging | Theo dõi lỗi |
| RBAC chi tiết | Quyền theo nhân sự |
| Báo cáo nâng cao | Doanh thu theo bác sĩ/dịch vụ/thuốc |
| UAT | Người dùng thật |

Dài hạn:

| Hướng | Nội dung |
|---|---|
| Patient portal | Bệnh nhân tự xem lịch |
| Online booking | Đặt lịch online |
| Online payment | Cổng thanh toán |
| Multi-branch | Đa chi nhánh |
| External lab integration | Tích hợp lab ngoài |
| Insurance | Bảo hiểm |
| Mobile/tablet | Tablet support |
| Analytics | Phân tích vận hành |
| HL7/FHIR | Chuẩn liên thông y tế nếu cần |

### 6.11. Đóng góp nhóm

Phải có đoạn:

Nhóm xác định bốn thành viên đóng góp tương đương về công sức, mặc dù hình thức đóng góp có thể khác nhau giữa code, tài liệu, kiểm thử, thiết kế, sửa lỗi và chuẩn bị demo. Git history chỉ phản ánh một phần công việc, không phản ánh toàn bộ đóng góp của các thành viên.

### 6.12. Kết luận chung

Kết luận cần nhấn mạnh:

- Đồ án hoàn thành mục tiêu xây dựng web app nội bộ quản lý phòng mạch.
- Phase 1 đạt baseline ổn định.
- Phase 2 chứng minh khả năng mở rộng.
- Kiến trúc hợp lý, không over-engineering.
- Hệ thống còn hạn chế nhưng có hướng phát triển rõ.

---

# 10. DANH SÁCH HÌNH/BẢNG NÊN CÓ SAU CHỈNH SỬA

## 10.1. Hình nên có

| Chương | Hình |
|---|---|
| Mở đầu | Demo flow tổng quan nếu có |
| Chương 1 | Use Case Diagram tổng quan |
| Chương 2 | Context diagram, Container diagram, Backend component, Layered architecture, Local deployment |
| Chương 3 | ERD Phase 1, ERD Phase 2, sequence diagrams, class diagrams, UI screenshots |
| Chương 4 | Source structure, Swagger UI, Patient UI, Examination UI, Invoice UI, Pharmacy UI |
| Chương 5 | Test terminal, Swagger 401/403, test case screenshots, Phase 2 manual test |
| Chương 6 | Không bắt buộc, có thể có summary diagram nếu muốn |

## 10.2. Bảng nên có

| Chương | Bảng |
|---|---|
| Mở đầu | Phase 1/Phase 2 summary |
| Chương 1 | Stakeholder, actor, scope, requirements, NFR, business rules, acceptance criteria, traceability |
| Chương 2 | Principles, assumptions, tech stack, ADR, RBAC matrix |
| Chương 3 | Model groups, constraints, state machine, transactions, UI screens, design traceability |
| Chương 4 | Tech, modules, timeline, implementation traceability, demo evidence |
| Chương 5 | Test scope, test cases, test result, bug log, traceability, limitations |
| Chương 6 | Completion, results Phase 1/2, limitations, future work |

---

# 11. NHỮNG CHỖ CẦN CẨN THẬN KHI CLAUDE CODE SỬA

## 11.1. Không được phóng đại

Không viết:

- “Hệ thống đã sẵn sàng production”.
- “Đã kiểm thử đầy đủ toàn bộ hệ thống”.
- “Phase 2 đã có test tự động hoàn chỉnh” nếu không có bằng chứng.
- “Microservices” nếu thực tế là Modular Monolith.
- “Patient portal/online booking công khai” nếu chưa làm.

Nên viết:

- “Hệ thống hiện phục vụ local/development/demo”.
- “Phase 1 có bằng chứng test tự động rõ hơn”.
- “Phase 2 đã được kiểm tra manual/demo workflow và cần bổ sung automated test”.
- “Kiến trúc Client–Server tổng thể, backend Modular Monolith”.

## 11.2. Không được xóa ý quan trọng

Không xóa:

- Lý do chia Phase 1/Phase 2.
- 4 thành viên đóng góp tương đương.
- Hạn chế trung thực.
- Hướng phát triển.
- Kiểm thử Phase 2 cần bổ sung.
- Business logic đặt ở backend.

## 11.3. Cần thống nhất thuật ngữ

| Không thống nhất | Dùng thống nhất |
|---|---|
| phòng khám/phòng mạch lẫn lộn | Có thể dùng cả hai, nhưng ưu tiên “phòng mạch tư nhân” cho tên đề tài |
| monolithic | Modular Monolith |
| client-server | Client–Server |
| phase 1/phase 2 | Phase 1/Phase 2 |
| hóa đơn/thanh toán | Invoice/Payment khi nói kỹ thuật; hóa đơn/thanh toán khi nói nghiệp vụ |
| hàng đợi/queue | Hàng đợi (Queue) |
| xét nghiệm/lab | Xét nghiệm (Lab) |
| cấp phát/pharmacy | Cấp phát thuốc (Pharmacy) |

---

# 12. CHECKLIST CUỐI CÙNG CHO CLAUDE CODE

Sau khi chỉnh xong báo cáo LaTeX, hãy kiểm tra 2 lần.

## 12.1. Kiểm tra lần 1 – Cấu trúc

- [ ] Có Mở đầu.
- [ ] Có Chương 1: Đặc tả yêu cầu.
- [ ] Có Chương 2: Thiết kế hệ thống.
- [ ] Có Chương 3: Thiết kế phần mềm.
- [ ] Có Chương 4: Hiện thực.
- [ ] Có Chương 5: Kiểm thử phần mềm.
- [ ] Có Chương 6: Kết luận và hướng phát triển.
- [ ] Mục lục build đúng.
- [ ] Hình/bảng không bị tràn nghiêm trọng.
- [ ] Caption hình/bảng có ý nghĩa.
- [ ] Không có lỗi LaTeX.

## 12.2. Kiểm tra lần 2 – Nội dung

- [ ] Phase 1 được mô tả là baseline nghiệp vụ lõi.
- [ ] Phase 2 được mô tả là mở rộng sau Phase 1.
- [ ] Không mâu thuẫn về phạm vi Phase 1/Phase 2.
- [ ] Kiến trúc là Client–Server + Modular Monolith.
- [ ] Business logic đặt ở backend service.
- [ ] Có traceability yêu cầu → thiết kế → hiện thực → test.
- [ ] Kiểm thử Phase 1 và Phase 2 được trình bày trung thực.
- [ ] Hạn chế có nêu rõ.
- [ ] Hướng phát triển có ngắn/trung/dài hạn.
- [ ] Đóng góp nhóm 4 thành viên tương đương được ghi nhận.
- [ ] Không nói hệ thống đã production.
- [ ] Không nói Phase 2 đã test tự động đầy đủ nếu không có bằng chứng.

---

# 13. PROMPT NGẮN ĐỂ DÙNG VỚI CLAUDE CODE

Có thể dùng prompt sau khi đưa file này vào repo:

```text
Bạn là Claude Code đang chỉnh sửa báo cáo LaTeX đồ án SE104 “4N Clinic Management System – Hệ thống quản lý phòng mạch tư nhân”.

Hãy đọc toàn bộ project LaTeX trước khi sửa. Sau đó dùng file hướng dẫn Markdown này làm source-of-truth để cập nhật nội dung báo cáo.

Mục tiêu:
1. Chỉnh lại mạch báo cáo theo hướng: khảo sát/tham khảo → chốt yêu cầu → chia Phase 1/Phase 2 → thiết kế → hiện thực → kiểm thử → kết luận.
2. Thay/viết lại các phần Mở đầu và Chương 1–6 theo nội dung hướng dẫn.
3. Giữ nguyên các hình, macro, style LaTeX hiện có nếu còn phù hợp.
4. Chèn thêm placeholder/caption cho hình và bảng nếu thiếu.
5. Không phóng đại: hệ thống hiện local/development/demo, Phase 2 cần bổ sung automated test.
6. Nhấn mạnh Phase 1 là baseline nghiệp vụ lõi, Phase 2 là mở rộng toàn dự án.
7. Nhấn mạnh kiến trúc là Client–Server + NestJS Modular Monolith + Layered/Clean Architecture + PostgreSQL/Prisma.
8. Sau khi sửa, build LaTeX, sửa lỗi compile, rồi kiểm tra lại 2 lần theo checklist cuối file.

Khi sửa, hãy báo cáo:
- Những file đã sửa.
- Những chương đã cập nhật.
- Những chỗ còn cần người dùng cung cấp hình/screenshot.
- Kết quả build LaTeX.
```

---

# 14. GHI CHÚ RIÊNG CHO NGƯỜI DÙNG

Khi đưa file này cho Claude Code, nên yêu cầu Claude Code **không tự xóa toàn bộ nội dung cũ nếu chưa đọc kỹ**, mà nên:

1. Backup file cũ.
2. Sửa từng chương.
3. Build thử sau mỗi nhóm sửa lớn.
4. Ghi lại danh sách hình còn thiếu.
5. Không tự bịa screenshot/test log nếu chưa có.

Nếu cần rút gọn báo cáo, ưu tiên giữ:

- Mở đầu có lý do chia phase.
- Chương 1 có requirements/use case/business rules/traceability.
- Chương 2 có architecture decision.
- Chương 3 có ERD/class/sequence/state/transaction.
- Chương 4 có implementation/backend/frontend/API/business rules/timeline.
- Chương 5 có test evidence, test cases, limitation.
- Chương 6 có kết luận Phase 1/Phase 2, hạn chế, hướng phát triển.
