# 08 — Yêu cầu và Khảo sát Khách hàng

> Audit date: 2026-06-07

---

> **Ghi chú bắt buộc:** Do đây là đồ án môn học, phần khảo sát khách hàng được mô phỏng dựa trên nghiệp vụ phòng mạch tư nhân quy mô nhỏ đến trung bình. Không có phỏng vấn khách hàng thật. Mọi thông tin về "khách hàng" trong file này là giả định phân tích nghiệp vụ.

---

## 1. Bối cảnh khảo sát (giả định)

Nhóm phân tích nghiệp vụ dựa trên quy trình vận hành điển hình của phòng mạch tư nhân quy mô nhỏ đến trung bình tại Việt Nam, thường gặp các vấn đề:

- Quản lý hồ sơ bệnh nhân thủ công (sổ tay) → dễ mất, khó tra cứu
- Không có số thứ tự xếp hàng hệ thống → bệnh nhân chờ lộn xộn
- Kê đơn thuốc viết tay → khó đọc, dễ nhầm
- Hóa đơn tính thủ công → sai sót thanh toán
- Không có báo cáo doanh thu → khó theo dõi hoạt động

---

## 2. Stakeholder Table (giả định)

| Actor | Vai trò | Mối quan tâm chính |
|---|---|---|
| Chủ phòng khám / Quản lý | MANAGER | Báo cáo doanh thu, tổng quan hoạt động |
| Bác sĩ | DOCTOR | Tra cứu lịch sử bệnh nhân nhanh, kê đơn chính xác |
| Lễ tân | RECEPTIONIST | Tiếp nhận nhanh, xếp hàng trật tự |
| Thu ngân | CASHIER | Tính hóa đơn đúng, ghi nhận thanh toán |
| Quản trị viên IT | ADMIN | Quản lý tài khoản, phân quyền, cấu hình hệ thống |
| Y tá / Điều dưỡng | NURSE | Đo sinh hiệu, hỗ trợ bác sĩ |
| Kỹ thuật viên xét nghiệm | LAB_TECHNICIAN | Nhận mẫu, nhập kết quả |
| Dược sĩ | PHARMACIST | Cấp phát thuốc đúng theo đơn, quản lý tồn kho |

---

## 3. Pain Points và Yêu cầu phân tích

| Pain point | Yêu cầu tương ứng | Priority | Phase |
|---|---|---|---|
| Hồ sơ BN thủ công, khó tra cứu | Hệ thống quản lý hồ sơ BN số hóa | Cao | P1 |
| Không có xếp hàng | Tạo số thứ tự tự động, tránh trùng | Cao | P1 |
| Kê đơn viết tay | Kê đơn điện tử, lưu lịch sử | Cao | P1 |
| Hóa đơn thủ công | Hóa đơn điện tử, ghi nhận thanh toán | Cao | P1 |
| Không có báo cáo | Báo cáo tháng cơ bản | Trung bình | P1 |
| Không có lịch hẹn | Đặt và quản lý lịch hẹn | Trung bình | P2 |
| Xét nghiệm ghi tay | Quy trình xét nghiệm số hóa | Thấp | P2 |
| Tồn kho thuốc thủ công | Quản lý kho thuốc, FEFO | Thấp | P2 |

---

## 4. Bảng chốt yêu cầu (REQ-01 → REQ-30)

| ID | Yêu cầu | Actor | UC | Phase | Priority | Evidence codebase | Status |
|---|---|---|---|---|---|---|---|
| REQ-01 | Đăng nhập bằng email/password | Tất cả roles | UC01 | P1 | Cao | `auth.controller.ts` — POST /auth/login | CONFIRMED |
| REQ-02 | Phân quyền theo vai trò | ADMIN | UC03 | P1 | Cao | `rbac.controller.ts`, guards/ | CONFIRMED |
| REQ-03 | Quản lý tài khoản (CRUD, lock) | ADMIN | UC02 | P1 | Cao | `users.controller.ts` | CONFIRMED |
| REQ-04 | Tìm kiếm bệnh nhân | RECEPTIONIST, DOCTOR | UC04 | P1 | Cao | `patients.controller.ts` GET / | CONFIRMED |
| REQ-05 | Tạo hồ sơ bệnh nhân | RECEPTIONIST | UC05 | P1 | Cao | `patients.controller.ts` POST / | CONFIRMED |
| REQ-06 | Tiếp nhận bệnh nhân (visit) | RECEPTIONIST | UC06 | P1 | Cao | `visits.controller.ts` POST / | CONFIRMED |
| REQ-07 | Cấp số thứ tự tự động, không trùng | RECEPTIONIST | UC07 | P1 | Cao | `visits.service.ts:55` — transaction | CONFIRMED |
| REQ-08 | Xem danh sách lượt khám theo ngày/trạng thái | DOCTOR, RECEPTIONIST | UC08 | P1 | Cao | `visits.controller.ts` GET / | CONFIRMED |
| REQ-09 | Bác sĩ mở lượt khám | DOCTOR | UC09 | P1 | Cao | `visits.controller.ts` POST /:id/open-examination | CONFIRMED |
| REQ-10 | Lập phiếu khám (triệu chứng, chẩn đoán) | DOCTOR | UC10 | P1 | Cao | `examinations.controller.ts` PATCH /:id | CONFIRMED |
| REQ-11 | Xem lịch sử khám bệnh nhân | DOCTOR | UC11 | P1 | Cao | `patients.controller.ts` GET /:id/medical-history | CONFIRMED |
| REQ-12 | Kê đơn thuốc điện tử | DOCTOR | UC12 | P1 | Cao | `examinations.controller.ts` POST /:id/prescription | CONFIRMED |
| REQ-13 | Hoàn tất phiếu khám | DOCTOR | UC13 | P1 | Cao | `examinations.controller.ts` POST /:id/complete | CONFIRMED |
| REQ-14 | Lập hóa đơn | CASHIER | UC14 | P1 | Cao | `billing.controller.ts` POST /visits/:visitId/invoice | CONFIRMED |
| REQ-15 | Ghi nhận thanh toán | CASHIER | UC15 | P1 | Cao | `billing.controller.ts` POST /invoices/:id/payments | CONFIRMED |
| REQ-16 | Tra cứu hóa đơn | CASHIER, MANAGER | UC16 | P1 | Cao | `billing.controller.ts` GET /invoices | CONFIRMED |
| REQ-17 | Thay đổi quy định phòng khám | ADMIN, MANAGER | UC17 | P1 | Trung bình | `regulations.controller.ts` | CONFIRMED |
| REQ-18 | Quản lý danh mục bệnh | ADMIN, MANAGER | UC18 | P1 | Trung bình | `diseases.controller.ts` | CONFIRMED |
| REQ-19 | Quản lý danh mục thuốc | ADMIN, MANAGER | UC19 | P1 | Trung bình | `drugs.controller.ts` | CONFIRMED |
| REQ-20 | Báo cáo tháng cơ bản | MANAGER | UC20 | P1 | Trung bình | `reports.controller.ts` GET /monthly | CONFIRMED |
| REQ-21 | Đặt và quản lý lịch hẹn | RECEPTIONIST | UC21 | P2 | Trung bình | `appointments.controller.ts` | CONFIRMED |
| REQ-22 | Hàng đợi điện tử | RECEPTIONIST, NURSE | UC22 | P2 | Trung bình | `queue.controller.ts` | CONFIRMED |
| REQ-23 | Check-in lịch hẹn tạo lượt khám | RECEPTIONIST | UC23 | P2 | Trung bình | `appointments.controller.ts` POST /:id/checkin | CONFIRMED |
| REQ-24 | Đo và lưu sinh hiệu (BMI tự tính) | NURSE | UC24 | P2 | Thấp | `vitals.controller.ts` | CONFIRMED |
| REQ-25 | Quản lý danh mục dịch vụ và chỉ định | DOCTOR, ADMIN | UC25 | P2 | Thấp | `services.controller.ts` | CONFIRMED |
| REQ-26 | Quy trình xét nghiệm (order→sample→result→verify) | LAB_TECHNICIAN, DOCTOR | UC26 | P2 | Thấp | `lab.controller.ts` | CONFIRMED |
| REQ-27 | Quản lý lô thuốc và tồn kho | PHARMACIST | UC27 | P2 | Thấp | `inventory.controller.ts` | CONFIRMED |
| REQ-28 | Cấp phát thuốc theo FEFO | PHARMACIST | UC28 | P2 | Thấp | `pharmacy.controller.ts`, pharmacy.service FEFO | CONFIRMED |
| REQ-29 | Quản lý khoa phòng và bác sĩ | ADMIN, MANAGER | UC29 | P2 | Thấp | `organization.controller.ts` | CONFIRMED |
| REQ-30 | Nhật ký hệ thống (audit log) | ADMIN | UC30 | P2 | Thấp | `audit.controller.ts` | CONFIRMED |

---

## 5. Acceptance Criteria chọn lọc

| REQ | Acceptance Criteria |
|---|---|
| REQ-07 | Hai lượt khám cùng ngày không được có cùng số thứ tự (constraint DB + transaction) |
| REQ-06 | Bệnh nhân cùng ngày không được có 2 lượt khám khác nhau |
| REQ-13 | Không hoàn tất phiếu khám nếu chưa có chẩn đoán |
| REQ-15 | Số tiền thanh toán không được vượt số tiền còn lại |
| REQ-28 | Cấp phát ưu tiên lô gần hết hạn nhất (FEFO — First Expire First Out) |

---

## 6. In-scope / Out-of-scope

### Trong phạm vi

- Phase 1: UC01 → UC20 (nghiệp vụ lõi phòng mạch tư nhân)
- Phase 2: UC21 → UC30 (mở rộng quy trình vận hành)
- Web application nội bộ (không phải public-facing)
- 8 vai trò người dùng
- Đăng nhập bằng email/password + JWT

### Ngoài phạm vi

- Patient portal (bệnh nhân tự tra cứu online)
- Đặt lịch trực tuyến từ phía bệnh nhân
- SMS/email reminder tự động
- Bảo hiểm y tế workflow
- Multi-branch / multi-tenant
- Telemedicine (video/chat)
- Advanced analytics / BI
- Docker, CI/CD, production deployment
- Mobile app
