# Team Working Rules

## 1. Mục đích

File này quy định cách team làm việc để tránh 3 lỗi phổ biến nhất của đồ án nhóm:

- làm chồng việc;
- hiểu sai nghiệp vụ;
- đến cuối kỳ mới ghép và phát hiện mọi thứ không khớp nhau.

---

## 2. Nguyên tắc cốt lõi

1. **Business rule chốt trước khi code sâu**
2. **Backend và DB đi trước frontend**
3. **Task phải nhỏ, rõ đầu ra, review được nhanh**
4. **Mọi thay đổi quan trọng phải phản ánh vào docs**
5. **Không ai giữ độc quyền hiểu biết một module**

---

## 3. Quy tắc giao tiếp trong nhóm

- Mọi quyết định quan trọng phải được ghi lại bằng text trong `docs/`
- Tranh luận bằng rule, flow, dữ liệu và ảnh hưởng hệ thống; không tranh luận bằng cảm giác
- Khi không chắc về nghiệp vụ, hỏi ngay trước khi code
- Không để “ngầm hiểu” trong đầu mỗi người một kiểu

---

## 4. Quy tắc chia việc

### 4.1 Không chia theo màn hình

Sai:
- bạn A làm vài màn hình
- bạn B làm vài form

Đúng:
- bạn A phụ trách Auth / RBAC
- bạn B phụ trách Patient / Visit
- bạn C phụ trách Examination / Prescription
- bạn D phụ trách Billing / Report / FE integration

### 4.2 Task phải đủ nhỏ

Một task tốt nên code được trong khoảng 2–6 giờ hoặc tối đa 1 buổi làm việc tập trung.

Ví dụ task tốt:

- tạo `POST /patients`
- tạo bảng `visits`
- thêm rule chống overpayment
- thêm migration `invoice_items`

---

## 5. Quy tắc đồng bộ đầu tuần và cuối tuần

### Buổi họp 1 mỗi tuần

Mục tiêu:
- chốt scope tuần;
- xác nhận phụ thuộc;
- phát hiện blocker sớm.

### Buổi họp 2 mỗi tuần

Mục tiêu:
- demo cái đã chạy;
- review chất lượng;
- chốt carry-over;
- sửa sprint plan nếu cần.

---

## 6. Quy tắc khi phát hiện blocker

Nếu bị blocker quá 30–60 phút ở task quan trọng:

- ghi rõ blocker;
- ping người phụ trách module liên quan;
- nếu vẫn chưa giải quyết được thì đưa vào note để chốt ở buổi họp gần nhất.

Không im lặng ôm lỗi đến cuối tuần.

---

## 7. Quy tắc review chéo và test chéo

- Người code chính không phải người review cuối cùng
- Người review không phải người test chéo trong cùng task nếu tránh được
- Ít nhất mỗi thành viên phải đọc code của 1 người khác mỗi tuần
- Ít nhất mỗi thành viên phải test 1 flow không phải do mình code

---

## 8. Quy tắc với business rules

Khi phát hiện rule mới hoặc rule chưa rõ:

1. ghi lại vào `docs/business/business-rules.md` dạng đề xuất;
2. mô tả ảnh hưởng:
   - entity nào;
   - API nào;
   - UI nào;
   - report nào;
3. chốt lại rồi mới code.

---

## 9. Quy tắc với tài liệu sống

Các file sau là tài liệu sống, phải cập nhật khi có thay đổi:

- `docs/business/business-rules.md`
- `docs/business/role-matrix.md`
- `docs/api/api-scope.md`
- `database/docs/erd-implementation.md`
- `docs/agile/backlog.md`
- `docs/agile/sprint-plan.md`

---

## 10. Quy tắc với demo

- Không đợi đến gần deadline mới nghĩ dữ liệu demo
- Mỗi sprint nên giữ được ít nhất 1 flow demo được
- Cuối mỗi tuần cần trả lời được câu hỏi: **hệ thống chạy thêm được gì rồi?**

---

## 11. Quy tắc giữ sạch phạm vi ver1

Không mở rộng sang ver2 nếu chưa hoàn thành ver1.

Tạm thời **không đưa vào ver1**:

- quản lý tồn kho thuốc đầy đủ;
- đặt lịch online;
- nhiều chi nhánh;
- patient portal;
- microservices;
- mobile app native.

---

## 12. Quy tắc xử lý thay đổi phạm vi

Nếu muốn thêm chức năng mới:

1. chứng minh nó thuộc ver1;
2. chỉ ra module nào bị ảnh hưởng;
3. chỉ ra sprint nào bị ảnh hưởng;
4. được team đồng ý.

Nếu không đạt 4 điểm trên thì không đưa vào sprint hiện tại.
