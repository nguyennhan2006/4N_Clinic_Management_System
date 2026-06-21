# Vision & Scope — 4N Clinic Management System

## 1. Tầm nhìn (Vision Statement)

> **Xây dựng một nền tảng quản lý phòng mạch tư nhân nội bộ, giúp đội ngũ nhân viên vận hành toàn bộ quy trình khám chữa bệnh — từ tiếp nhận bệnh nhân đến thanh toán — trong một hệ thống thống nhất, an toàn và dễ kiểm soát.**

Hệ thống không phải là phần mềm bệnh viện quy mô lớn. Đây là công cụ thực tế cho phòng mạch tư nhân quy mô vừa, nơi mỗi bác sĩ, lễ tân và thu ngân cần một giao diện rõ ràng theo đúng vai trò của mình.

---

## 2. Thông tin dự án

| Thuộc tính | Nội dung |
|---|---|
| **Tên sản phẩm** | 4N Clinic Management System |
| **Môn học** | SE104 — Nhập môn Công nghệ phần mềm |
| **Team** | 4 người — Chơn Nhân, Đức Nguyên, Trọng Nhân, Phan Nhật |
| **Loại hệ thống** | Internal Web Application (không public) |
| **Backend** | NestJS + TypeScript + Prisma + PostgreSQL |
| **Frontend** | React + Vite + TypeScript + Tailwind CSS + shadcn/ui |
| **Architecture** | Client-Server · Modular Monolith · Layered Architecture |
| **Auth** | JWT (access token + refresh token, hash SHA-256) |

---

## 3. Bối cảnh vấn đề

Phòng mạch tư nhân hiện tại thường quản lý bằng sổ tay, Excel, hoặc phần mềm rời rạc không kết nối nhau. Điều này dẫn đến:

- Lễ tân và bác sĩ không thấy được trạng thái hàng chờ theo thời gian thực.
- Thu ngân phải tính tay tổng hóa đơn từ nhiều nguồn (phí khám + thuốc + dịch vụ).
- Không có lịch sử khám tập trung — bác sĩ không tra cứu được phác đồ cũ.
- Quy định (giá khám, giới hạn bệnh nhân/ngày) thay đổi không có version control.
- Không có audit trail khi xảy ra sự cố hoặc tranh chấp.

**4N Clinic Management System** giải quyết các vấn đề này bằng một hệ thống web nội bộ, vai trò rõ ràng, luồng nghiệp vụ được tự động hóa.

---

## 4. Các bên liên quan (Stakeholders)

| Stakeholder | Vai trò trong hệ thống | Quan tâm chính |
|---|---|---|
| **Chủ phòng mạch** | Người dùng cuối cấp cao | Báo cáo doanh thu, kiểm soát quy định |
| **Quản lý (MANAGER)** | Xem báo cáo, giám sát | Thống kê tháng, tổng quan hoạt động |
| **Quản trị viên (ADMIN)** | Vận hành hệ thống | Tài khoản, phân quyền, danh mục, quy định |
| **Lễ tân (RECEPTIONIST)** | Tiếp nhận hàng ngày | Tiếp nhận nhanh, tra cứu bệnh nhân, tạo lượt khám |
| **Bác sĩ (DOCTOR)** | Khám và điều trị | Phiếu khám, chẩn đoán, đơn thuốc, lịch sử bệnh nhân |
| **Thu ngân (CASHIER)** | Tài chính | Lập hóa đơn, ghi nhận thanh toán, tra cứu |
| **Dev Team (4N)** | Xây dựng & bảo trì | Kiến trúc rõ ràng, dễ mở rộng, không nợ kỹ thuật |

---

## 5. Phạm vi Phase 1 — In Scope

Phase 1 bao gồm **20 use cases**, chia theo 5 nhóm nghiệp vụ:

### 5.1 Xác thực & Phân quyền

| UC | Tên | Actor |
|---|---|---|
| UC01 | Đăng nhập | Tất cả |
| UC02 | Quản lý tài khoản | ADMIN |
| UC03 | Phân quyền | ADMIN |

### 5.2 Hồ sơ & Tiếp nhận

| UC | Tên | Actor |
|---|---|---|
| UC04 | Tra cứu bệnh nhân | RECEPTIONIST, DOCTOR, MANAGER, ADMIN |
| UC05 | Tạo hồ sơ bệnh nhân | RECEPTIONIST, ADMIN |
| UC06 | Tiếp nhận bệnh nhân | RECEPTIONIST, ADMIN |
| UC07 | Tạo lượt khám | RECEPTIONIST, ADMIN |
| UC08 | Xem danh sách khám | RECEPTIONIST, DOCTOR, MANAGER, ADMIN |

### 5.3 Khám bệnh

| UC | Tên | Actor |
|---|---|---|
| UC09 | Mở lượt khám | DOCTOR, ADMIN |
| UC10 | Lập phiếu khám | DOCTOR, ADMIN |
| UC11 | Xem lịch sử khám | DOCTOR, MANAGER, ADMIN |
| UC12 | Kê đơn thuốc | DOCTOR, ADMIN |
| UC13 | Hoàn tất phiếu khám | DOCTOR, ADMIN |

### 5.4 Thanh toán

| UC | Tên | Actor |
|---|---|---|
| UC14 | Lập hóa đơn | CASHIER, ADMIN |
| UC15 | Ghi nhận thanh toán | CASHIER, ADMIN |
| UC16 | Tra cứu hóa đơn | CASHIER, MANAGER, ADMIN |

### 5.5 Quản trị & Báo cáo

| UC | Tên | Actor |
|---|---|---|
| UC17 | Thay đổi quy định | ADMIN |
| UC18 | Quản lý danh mục bệnh | ADMIN |
| UC19 | Quản lý danh mục thuốc | ADMIN |
| UC20 | Xem báo cáo tháng cơ bản | ADMIN, MANAGER |

---

## 6. Phạm vi Phase 2A — Schema Present, Implementation Pending

Phase 2A đã có **17 models trong schema** nhưng chưa implement service/controller. Chờ SDD được duyệt.

| Nhóm | Models | Mô tả |
|---|---|---|
| Organization | Department, Room, DoctorProfile, StaffSchedule | Cơ cấu tổ chức phòng mạch |
| Scheduling | Appointment, QueueTicket | Đặt lịch hẹn, hàng chờ theo khoa |
| Clinical Extension | VitalSign, ServiceCatalog, LabTestCatalog, ServiceOrder | Sinh hiệu, chỉ định dịch vụ, xét nghiệm |
| Laboratory | LabOrder, LabSample, LabResult | Quy trình xét nghiệm |
| Pharmacy & Inventory | StockLot, StockMovement, Dispense, DispenseItem | Kho thuốc, cấp phát theo FEFO |

**Quy tắc bất biến:** Design → Approve → Migration → Implement. Không implement Phase 2A khi chưa có SDD approved.

---

## 7. Ngoài phạm vi (Out of Scope)

Những tính năng dưới đây **không được xây dựng** trong bất kỳ phase nào hiện tại. Nếu có yêu cầu bổ sung, đánh dấu rõ là **Ver 2**.

| Tính năng | Lý do loại trừ |
|---|---|
| Patient Portal (cổng bệnh nhân) | Hệ thống nội bộ, không phục vụ bệnh nhân trực tiếp |
| Đặt lịch online (public booking) | Ver 2 — cần xác thực bệnh nhân riêng |
| SMS / Email nhắc lịch hẹn | Ver 2 — cần tích hợp provider bên ngoài |
| Quản lý kho thuốc đầy đủ (import/export) | Phase 2A chỉ dispense, chưa có nhập kho UI |
| Multi-branch / Multi-tenant | Ver 2 — kiến trúc hiện tại single-tenant |
| Bảo hiểm y tế (Insurance workflow) | Ver 2 — nghiệp vụ phức tạp riêng |
| Telemedicine | Ver 2 |
| Phân tích nâng cao (BI, dashboard) | Ver 2 — Phase 1 chỉ báo cáo tháng cơ bản |
| Lab / Imaging workflow UI | Phase 2A backend schema có, UI chưa implement |
| Refund / Credit note phức tạp | Ver 2 |
| Quản lý vật tư y tế (consumables) | Ver 2 |

---

## 8. Kiến trúc hệ thống

### 8.1 Sơ đồ tổng quan

```
┌─────────────────────────────────────────────────┐
│                   Browser (Staff)                │
│          React + Vite + TypeScript SPA           │
│    Tailwind CSS · shadcn/ui · TanStack Query     │
│         Zustand · React Hook Form · Zod          │
└───────────────────┬─────────────────────────────┘
                    │ HTTPS / REST JSON
                    │ Authorization: Bearer <JWT>
┌───────────────────▼─────────────────────────────┐
│              API Server (Port 3000)              │
│         NestJS + TypeScript                      │
│  ┌─────────────────────────────────────────────┐│
│  │  JwtAuthGuard  ·  RolesGuard                ││
│  ├─────────────────────────────────────────────┤│
│  │  Auth · Users · Patients · Visits           ││
│  │  Examinations · Billing · Regulations       ││
│  │  Diseases · Drugs · Reports · Audit · RBAC  ││
│  └─────────────────────────────────────────────┘│
│         Prisma ORM (single source of truth)      │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│           PostgreSQL Database                    │
│   37 models · UUID PKs · Soft-delete pattern    │
└─────────────────────────────────────────────────┘
```

### 8.2 Các quyết định kiến trúc chính (ADRs)

| ADR | Quyết định | Lý do |
|---|---|---|
| ADR-001 | Modular Monolith thay vì Microservices | Team 4 người, 1 tháng — microservices làm chậm 3x |
| ADR-002 | FK direction: child giữ FK trong 1:1 | Visit là parent độc lập, không biết về Examination/Invoice |
| ADR-003 | Snapshot pattern cho dữ liệu tài chính | Giá thuốc/dịch vụ thay đổi không ảnh hưởng hóa đơn cũ |
| ADR-004 | Prescription dùng replace-all upsert | Đơn giản hơn partial update, tránh orphan items |
| ADR-005 | `Visit.appointmentId` thay vì `Appointment.visitId` | Visit tồn tại độc lập (walk-in), Appointment là optional |
| ADR-006 | UUID cho primary keys | Không lộ sequence, distributed-safe |
| ADR-007 | RegulationVersion là immutable append-only | Audit trail — không sửa quy định cũ, chỉ tạo phiên bản mới |

---

## 9. Roles & Phân quyền

### 9.1 Các role đang hoạt động (Phase 1)

| Role | Màn hình chính | Quyền cốt lõi |
|---|---|---|
| **ADMIN** | Tất cả | Toàn quyền — users, roles, catalogs, regulations, reports |
| **RECEPTIONIST** | Patients, Visits | Tạo bệnh nhân, tạo lượt khám, hàng chờ |
| **DOCTOR** | Visits, Examinations, History | Mở khám, phiếu khám, chẩn đoán, đơn thuốc, hoàn tất |
| **CASHIER** | Invoices | Lập hóa đơn, ghi nhận thanh toán, tra cứu |
| **MANAGER** | Reports, Catalogs (xem) | Báo cáo tháng, xem danh mục, xem hóa đơn |

### 9.2 Roles đã seed cho Phase 2A (chưa có UI/RBAC)

| Role | Phase 2A scope |
|---|---|
| NURSE | Đo sinh hiệu (VitalSign) |
| LAB_TECHNICIAN | Thu mẫu xét nghiệm, nhập kết quả |
| PHARMACIST | Cấp phát thuốc (Dispense) |

### 9.3 Nguyên tắc RBAC

- Backend là nguồn chốt bảo mật — mọi endpoint đều có `JwtAuthGuard` + `RolesGuard`.
- Frontend ẩn menu/nút theo role để cải thiện UX, không phải để bảo mật.
- Unauthorized → 403. Unauthenticated → 401.
- `passwordHash` không bao giờ xuất hiện trong response.

---

## 10. Luồng nghiệp vụ cốt lõi

```
[RECEPTIONIST]
    │
    ├─ Tra cứu bệnh nhân (UC04)
    │       └─ Chưa có hồ sơ → Tạo mới (UC05)
    │
    └─ Tạo lượt khám (UC07)
           • Kiểm tra trùng ngày (BR-01)
           • Kiểm tra giới hạn ngày từ Regulation (BR-02)
           • Gán queueNumber tự động (atomic transaction)
           • Visit → WAITING
           │
[DOCTOR]   │
           ├─ Mở lượt khám (UC09)
           │       • Visit phải WAITING (BR-04)
           │       • Doctor phải ACTIVE (BR-05)
           │       • Visit → IN_EXAMINATION
           │
           ├─ Lập phiếu khám (UC10)
           │       • Nhập symptoms, clinicalNotes, conclusion
           │       • Chọn diagnosis từ danh mục (isActive)
           │       • Tối đa 1 isPrimary (BR-06)
           │
           ├─ Kê đơn thuốc (UC12)
           │       • Chọn drug (isActive)
           │       • Snapshot unitPrice tại thời điểm kê (BR-09)
           │
           └─ Hoàn tất khám (UC13)
                   • Bắt buộc: symptoms + conclusion + isPrimary diagnosis (BR-10)
                   • Visit → COMPLETED
                   │
[CASHIER]          │
                   ├─ Lập hóa đơn (UC14)
                   │       • Chỉ COMPLETED visit (BR-12)
                   │       • Tổng hợp: CONSULTATION_FEE + thuốc + dịch vụ
                   │       • Snapshot toàn bộ giá vào InvoiceItems
                   │
                   └─ Ghi nhận thanh toán (UC15)
                           • amount ≤ remaining (BR-14)
                           • Hỗ trợ CASH / TRANSFER / CARD
                           • Thanh toán từng phần → PARTIALLY_PAID → PAID
```

---

## 11. Yêu cầu phi chức năng (Non-Functional Requirements)

### 11.1 Bảo mật

| Yêu cầu | Hiện trạng |
|---|---|
| Mật khẩu lưu bcrypt | ✅ Implemented |
| JWT access token + refresh token | ✅ Implemented |
| Refresh token hash SHA-256 trước khi lưu DB | ✅ Implemented |
| Token rotation sau mỗi refresh | ✅ Implemented |
| RBAC tại mọi endpoint | ✅ 11/12 controllers có class-level guard |
| passwordHash không xuất hiện trong response | ✅ Code-reviewed |
| Audit log các hành động quan trọng | ⚠️ 8/~20 actions (Phase 2 cần bổ sung) |

### 11.2 Tính nhất quán dữ liệu

| Yêu cầu | Cơ chế |
|---|---|
| Queue number không trùng trong ngày | Prisma `$transaction` Serializable |
| Đơn thuốc giá không thay đổi theo thời gian | Snapshot pattern (ADR-003) |
| Hóa đơn bất biến sau khi tạo | Snapshot InvoiceItems |
| Regulation chỉ có 1 phiên bản active | `$transaction` deactivate + activate |
| Bệnh nhân không khám 2 lần/ngày | DB `@@unique([patientId, visitDate])` |

### 11.3 Hiệu năng

| Điểm | Tiếp cận |
|---|---|
| Tìm kiếm bệnh nhân | Index trên `fullName`, `phone` |
| Danh sách khám theo ngày | Index trên `visitDate`, `status` |
| Queue hàng chờ | Index trên `(departmentId, queueDate, status)` |
| Báo cáo tháng | Query trực tiếp — chấp nhận được với quy mô phòng mạch |

**Quy mô dự kiến:** vài nghìn records/tháng. Không cần cache hay caching layer ở Phase 1.

### 11.4 Khả năng bảo trì

- Mỗi module NestJS độc lập: `auth`, `patients`, `visits`, `examinations`, `billing`, v.v.
- Business rule nằm ở service layer, không ở controller hay middleware.
- `prisma.schema` là single source of truth cho toàn bộ DB.
- ADR ghi lại lý do các quyết định — không đoán mò.

---

## 12. Lộ trình phát triển (Roadmap)

### Phase 1 — Completed ✅

- 20 Use Cases (UC01–UC20)
- 12 controllers, 40 endpoints
- 20 DB models
- 5 roles hoạt động đầy đủ
- Frontend React tích hợp hoàn chỉnh

### Phase 2A — Schema Present, Implementation Pending ⏳

| Module | Models | Nội dung |
|---|---|---|
| Organization | Department, Room, DoctorProfile, StaffSchedule | Cơ cấu tổ chức |
| Scheduling | Appointment, QueueTicket | Đặt lịch hẹn, số thứ tự |
| Clinical Extension | VitalSign, ServiceCatalog, LabTestCatalog, ServiceOrder | Sinh hiệu, dịch vụ |
| Laboratory | LabOrder, LabSample, LabResult | Xét nghiệm |
| Pharmacy & Inventory | StockLot, StockMovement, Dispense, DispenseItem | Kho thuốc, cấp phát FEFO |

**Điều kiện tiến hành:** SDD Phase 2A được team approve + schema correction migration cho 9 conflict items.

### Ver 2 — Future (ngoài phạm vi hiện tại)

- Patient Portal
- Online Booking
- SMS/Email reminders
- Multi-branch
- Insurance workflow
- BI Dashboard
- Telemedicine

---

## 13. Ràng buộc & Giả định

### Ràng buộc

| Loại | Nội dung |
|---|---|
| **Thời gian** | Dự án theo tiến độ môn học SE104 |
| **Team** | 4 người — không có chuyên gia DevOps hay DBA |
| **Hạ tầng** | Single PostgreSQL instance, không có replica |
| **Quy mô** | Phòng mạch đơn (single-branch), một cơ sở |
| **Phạm vi** | Chỉ staff nội bộ — không có public-facing interface |

### Giả định

| Giả định | Hệ quả |
|---|---|
| Phòng mạch có ≤ 40 bệnh nhân/ngày (default) | `MAX_PATIENTS_PER_DAY = 40` là mặc định hợp lý |
| Tất cả staff dùng cùng mạng nội bộ | Không cần VPN hay zero-trust phức tạp |
| Bác sĩ chỉ cần 1 chẩn đoán chính | Schema `isPrimary` enforce tối đa 1 |
| Hóa đơn không cần refund phức tạp | VOID status là đủ cho Phase 1 |
| Dữ liệu lâm sàng không được xóa | Soft-delete qua `status = CANCELLED` hoặc `isActive = false` |

---

## 14. Định nghĩa hoàn thành (Definition of Done)

### Phase 1 là done khi

- [ ] Login hoạt động, redirect đúng theo role
- [ ] Sidebar thay đổi theo role đăng nhập
- [ ] Unauthorized route → `/403`
- [ ] Tạo bệnh nhân và tra cứu hoạt động
- [ ] Tạo lượt khám, queue number tự sinh
- [ ] Bác sĩ mở, lập, hoàn tất phiếu khám
- [ ] Kê đơn thuốc với price snapshot
- [ ] Thu ngân lập hóa đơn tổng hợp
- [ ] Thanh toán từng phần và một lần đều hoạt động
- [ ] Regulation thay đổi ảnh hưởng đúng đến lượt khám mới
- [ ] Danh mục bệnh, thuốc quản lý được
- [ ] Báo cáo tháng hiển thị đúng số liệu
- [ ] Không có API call đến endpoint không tồn tại
- [ ] `passwordHash` không xuất hiện ở bất kỳ response nào
- [ ] Build pass · Lint pass

### Phase 2A là done khi

- [ ] SDD được team approve
- [ ] Schema correction migration cho 9 conflict items
- [ ] Appointment booking và check-in hoạt động
- [ ] Queue theo khoa hoạt động
- [ ] VitalSign ghi nhận được
- [ ] ServiceOrder và LabOrder đầy đủ flow
- [ ] Dispense theo FEFO hoạt động
- [ ] Invoice tự động gộp ServiceOrder và Dispense
- [ ] 3 role mới (NURSE, LAB_TECHNICIAN, PHARMACIST) hoạt động đầy đủ
