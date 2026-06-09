# 08 — Khảo sát Khách hàng và Chốt Yêu cầu

> Lưu ý: Dự án SE104 là dự án môn học. Phần "khách hàng" là khách hàng giả định.  
> Nhóm cần tự viết narrative khảo sát vào phần này.

---

## 1. Khảo sát Khách hàng (giả định)

| Đối tượng | Nhu cầu chính | Vấn đề hiện tại | Yêu cầu mong muốn | Ghi chú cho báo cáo |
|---|---|---|---|---|
| **Chủ phòng mạch / Quản lý** | Xem báo cáo doanh thu, quản lý tổng thể | Theo dõi thủ công bằng sổ sách, khó tổng hợp | Báo cáo tháng tự động, thống kê doanh thu theo loại dịch vụ | Nhóm cần viết narrative khảo sát |
| **Lễ tân** | Tiếp nhận bệnh nhân, quản lý lịch khám | Ghi chép tay, dễ nhầm lẫn, không biết quota | Tạo hồ sơ bệnh nhân, tạo lượt khám tự động có STT, biết quota | — |
| **Bác sĩ** | Xem thông tin bệnh nhân, ghi phiếu khám | Tra cứu hồ sơ chậm, viết tay | Xem lịch sử, ghi chẩn đoán, kê đơn nhanh | — |
| **Thu ngân** | Lập hóa đơn, ghi nhận thanh toán | Tính toán thủ công, dễ sai sót | Hóa đơn tự động từ phiếu khám, in biên lai | — |
| **Quản trị viên** | Quản lý người dùng, phân quyền, cấu hình | Không có hệ thống phân quyền, rủi ro bảo mật | RBAC, quản lý tài khoản, thay đổi quy định | — |
| **Dược sĩ (Phase 2)** | Theo dõi tồn kho, cấp phát thuốc | Quản lý kho thủ công, dễ hết hàng | Nhập lô thuốc, xem tồn kho, cấp phát theo đơn | — |
| **Kỹ thuật viên XN (Phase 2)** | Nhận mẫu, nhập kết quả xét nghiệm | Thông báo thủ công, dễ sai | Worklist, nhập kết quả online | — |

---

## 2. Bảng Chốt Yêu cầu Khách hàng

| Req ID | Nội dung yêu cầu | Actor | Mức ưu tiên | Phase | Bằng chứng codebase | Trạng thái | Ghi chú |
|---|---|---|---|---|---|---|---|
| REQ-01 | Đăng nhập bảo mật với tài khoản riêng | Tất cả | Cao | P1 | `auth.controller.ts`, JWT guards | CONFIRMED | — |
| REQ-02 | Quản lý tài khoản người dùng | ADMIN | Cao | P1 | `users.controller.ts`, `users.service.ts` | CONFIRMED | — |
| REQ-03 | Phân quyền theo vai trò | ADMIN | Cao | P1 | `rbac.controller.ts`, `RolesGuard` | CONFIRMED | — |
| REQ-04 | Tìm kiếm bệnh nhân theo tên, số điện thoại | RECEPTIONIST, DOCTOR | Cao | P1 | `patients.service.ts` search query | CONFIRMED | — |
| REQ-05 | Tạo hồ sơ bệnh nhân mới | RECEPTIONIST | Cao | P1 | `patients.controller.ts` POST | CONFIRMED | — |
| REQ-06 | Xem và cập nhật thông tin bệnh nhân | RECEPTIONIST, ADMIN | Trung bình | P1 | `patients.controller.ts` PATCH | CONFIRMED | — |
| REQ-07 | Tạo lượt khám với số thứ tự tự động | RECEPTIONIST | Cao | P1 | `visits.service.ts`, queueNumber | CONFIRMED | — |
| REQ-08 | Kiểm tra quota lượt khám theo quy định | Hệ thống | Cao | P1 | BR-06, `regulations` + visits service | CONFIRMED | — |
| REQ-09 | Ngăn trùng lượt khám cùng ngày/bệnh nhân | Hệ thống | Cao | P1 | BR-05, `@@unique([patientId, date])` | CONFIRMED | — |
| REQ-10 | Bác sĩ mở và ghi phiếu khám | DOCTOR | Cao | P1 | `examinations.controller.ts` | CONFIRMED | — |
| REQ-11 | Chẩn đoán và chọn bệnh từ danh mục | DOCTOR | Cao | P1 | Disease, Diagnosis model | CONFIRMED | — |
| REQ-12 | Kê đơn thuốc từ danh mục | DOCTOR | Cao | P1 | Prescription, PrescriptionItem | CONFIRMED | — |
| REQ-13 | Xem lịch sử khám của bệnh nhân | DOCTOR, ADMIN | Trung bình | P1 | `GET /patients/:id/medical-history` | CONFIRMED | — |
| REQ-14 | Lập hóa đơn tự động sau khi hoàn tất khám | CASHIER | Cao | P1 | `billing.service.ts` | CONFIRMED | — |
| REQ-15 | Ghi nhận thanh toán nhiều lần | CASHIER | Cao | P1 | Payment model, PARTIALLY_PAID status | CONFIRMED | — |
| REQ-16 | Tra cứu hóa đơn theo ngày, trạng thái | CASHIER | Trung bình | P1 | `GET /invoices` với query params | CONFIRMED | — |
| REQ-17 | Quản lý quy định phòng mạch (quota, giá) | ADMIN | Trung bình | P1 | RegulationVersion, RegulationItem | CONFIRMED | — |
| REQ-18 | Quản lý danh mục bệnh | ADMIN | Thấp | P1 | `diseases.controller.ts` | CONFIRMED | — |
| REQ-19 | Quản lý danh mục thuốc | ADMIN | Thấp | P1 | `drugs.controller.ts` | CONFIRMED | — |
| REQ-20 | Xem báo cáo doanh thu tháng | MANAGER, ADMIN | Cao | P1 | `reports.controller.ts` monthly | CONFIRMED | — |
| REQ-21 | Đặt lịch hẹn trước | RECEPTIONIST | Trung bình | P2 | `appointments.controller.ts` | CONFIRMED | — |
| REQ-22 | Quản lý hàng đợi khám | Hệ thống | Trung bình | P2 | `queue.controller.ts` | CONFIRMED | — |
| REQ-23 | Ghi nhận sinh hiệu trước khám | NURSE | Trung bình | P2 | `vitals.controller.ts` | CONFIRMED | — |
| REQ-24 | Chỉ định dịch vụ cận lâm sàng | DOCTOR | Trung bình | P2 | `services.controller.ts` service-orders | CONFIRMED | — |
| REQ-25 | Quản lý xét nghiệm (lấy mẫu, kết quả) | LAB_TECHNICIAN | Trung bình | P2 | `lab.controller.ts` | CONFIRMED | — |
| REQ-26 | Quản lý kho thuốc | PHARMACIST | Trung bình | P2 | `inventory.controller.ts` | CONFIRMED | — |
| REQ-27 | Cấp phát thuốc theo đơn | PHARMACIST | Trung bình | P2 | `pharmacy.controller.ts` | CONFIRMED | — |
| REQ-28 | Xem báo cáo doanh thu theo loại | MANAGER | Thấp | P2 | `GET /reports/revenue-breakdown` | CONFIRMED | — |
| REQ-29 | Nhật ký hệ thống (audit log) | ADMIN | Thấp | P2 | `audit.controller.ts` | CONFIRMED | — |
| REQ-30 | Quản lý cơ cấu tổ chức phòng khám | ADMIN | Thấp | P2 | `organization.controller.ts` | CONFIRMED | — |

---

## 3. Acceptance Criteria (Điều kiện chấp nhận)

| Use case / Luồng | Actor | Điều kiện chấp nhận | Bằng chứng cần có | Trạng thái |
|---|---|---|---|---|
| Đăng nhập | Tất cả | Login đúng credentials → nhận token và vào dashboard. Sai → hiện lỗi rõ ràng | Screenshot SS-01, SS-02 | Cần chụp |
| Tạo bệnh nhân mới | RECEPTIONIST | Form nhập đủ thông tin, validate, lưu thành công, hiện mã bệnh nhân | Screenshot SS-07, TC-03 | Cần chụp |
| Tạo lượt khám | RECEPTIONIST | Chọn bệnh nhân, ngày, hệ thống cấp STT tự động, báo lỗi nếu trùng | Screenshot SS-10, TC-05, TC-06 | Cần chụp |
| Mở phiếu khám | DOCTOR | Bác sĩ chọn visit, mở khám, ghi triệu chứng, chẩn đoán | Screenshot SS-11, TC-07 | Cần chụp |
| Kê đơn thuốc | DOCTOR | Chọn thuốc active, nhập số lượng, liều dùng | Screenshot SS-12, TC-08 | Cần chụp |
| Thanh toán hóa đơn | CASHIER | Nhập số tiền ≤ remaining, chọn phương thức, lưu | Screenshot SS-15, TC-09 | Cần chụp |
| Xem báo cáo | MANAGER | Chọn tháng/năm, xem tổng doanh thu, số lượt khám | Screenshot SS-16 | Cần chụp |
| RBAC enforcement | Tất cả | Sidebar ẩn menu không có quyền, API trả 403 nếu sai role | Screenshot SS-04, SS-05 | Cần chụp |

---

## 4. In-scope / Out-of-scope

### In-scope (đã implement)
- Đăng nhập, RBAC, quản lý tài khoản
- Quản lý bệnh nhân, lịch sử khám
- Lượt khám, phiên khám, đơn thuốc
- Hóa đơn, thanh toán, tra cứu
- Danh mục bệnh, thuốc, dịch vụ
- Quy định phòng mạch
- Báo cáo tháng, doanh thu theo loại
- Lịch hẹn, hàng đợi, sinh hiệu
- Xét nghiệm, kho thuốc, cấp phát
- Tổ chức phòng khám, nhật ký hệ thống

### Out-of-scope (Version 2 — MISSING — không có trong codebase)
- Đặt lịch online (patient portal)
- Nhắc lịch qua SMS/Email
- Quản lý kho phức tạp (nhập hàng từ nhà cung cấp)
- Hệ thống bảo hiểm
- Multi-branch / multi-tenant
- Telehealth / tư vấn online
- Analytics nâng cao (BI dashboard)
- Tích hợp máy xét nghiệm
