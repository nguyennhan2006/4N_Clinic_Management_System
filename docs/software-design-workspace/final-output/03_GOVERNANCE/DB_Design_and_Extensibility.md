# Database Design & Extensibility Assessment
## 4N Clinic Management System — Working Tree (Phase 1 + Phase 2A schema)

**Ngày:** 2026-05-27  
**Schema source:** `backend/prisma/schema.prisma` (working tree, pre-commit)  
**Models:** 37 (20 Phase 1 + 17 Phase 2A)

---

## 1. Domain Grouping

```
IDENTITY & ACCESS (7 models)
├── User               — tài khoản nhân viên
├── Role               — vai trò (ADMIN, DOCTOR, ...)
├── Permission         — quyền hạn cụ thể
├── UserRole           — junction: user có nhiều role
├── RolePermission     — junction: role có nhiều permission
├── RefreshToken       — JWT refresh token, hash SHA-256
└── AuditLog           — append-only log mọi hành động quan trọng

PATIENT & CLINICAL (8 models)
├── Patient            — hồ sơ bệnh nhân (static, reusable)
├── Visit              — một lượt khám (state machine)
├── Examination        — phiếu khám của bác sĩ (state machine)
├── Disease            — danh mục bệnh
├── Diagnosis          — chẩn đoán trong một examination
├── Drug               — danh mục thuốc
├── Prescription       — đơn thuốc (1:1 với examination)
└── PrescriptionItem   — dòng thuốc trong đơn

FINANCIAL (3 models)
├── Invoice            — hóa đơn (1:1 với visit)
├── InvoiceItem        — dòng hóa đơn (snapshot giá/mô tả)
└── Payment            — giao dịch thanh toán

OPERATIONS (2 models)
├── RegulationVersion  — phiên bản quy định (version-controlled)
└── RegulationItem     — key-value config trong regulation

ORGANIZATION — Phase 2A (4 models)
├── Department         — khoa/phòng ban
├── Room               — phòng khám
├── DoctorProfile      — hồ sơ bác sĩ (1:1 với User)
└── StaffSchedule      — lịch làm việc

SCHEDULING — Phase 2A (2 models)
├── Appointment        — lịch hẹn khám
└── QueueTicket        — số thứ tự hàng đợi

CLINICAL EXTENSION — Phase 2A (4 models)
├── VitalSign          — sinh hiệu (1:1 với visit)
├── ServiceCatalog     — danh mục dịch vụ/xét nghiệm
├── LabTestCatalog     — chi tiết xét nghiệm (1:1 với ServiceCatalog)
└── ServiceOrder       — chỉ định dịch vụ của bác sĩ

LABORATORY — Phase 2A (3 models)
├── LabOrder           — lệnh xét nghiệm (1:1 với ServiceOrder)
├── LabSample          — mẫu xét nghiệm
└── LabResult          — kết quả xét nghiệm

PHARMACY & INVENTORY — Phase 2A (4 models)
├── StockLot           — lô thuốc (FEFO)
├── StockMovement      — lịch sử nhập/xuất kho
├── Dispense           — lần cấp phát thuốc (1:1 với prescription)
└── DispenseItem       — dòng cấp phát (1:1 với PrescriptionItem)
```

---

## 2. Relationship Analysis

### 2.1 One-to-One (1:1) — Quan hệ đặc biệt

| Model A | Bên kia | FK direction | Ý nghĩa |
|---|---|---|---|
| Visit | Examination | Examination.visitId → Visit | Mỗi lượt khám có đúng 1 phiếu khám |
| Visit | Invoice | Invoice.visitId → Visit | Mỗi lượt khám có đúng 1 hóa đơn |
| Visit | QueueTicket | QueueTicket.visitId → Visit | Mỗi lượt khám có đúng 1 số hàng đợi |
| Visit | VitalSign | VitalSign.visitId → Visit | Mỗi lượt khám có đúng 1 bộ sinh hiệu |
| Examination | Prescription | Prescription.examinationId → Examination | Mỗi phiếu khám có đúng 1 đơn thuốc |
| Prescription | Dispense | Dispense.prescriptionId → Prescription | Mỗi đơn thuốc được cấp phát 1 lần |
| ServiceOrder | LabOrder | LabOrder.serviceOrderId → ServiceOrder | Mỗi chỉ định xét nghiệm có 1 lab order |
| ServiceCatalog | LabTestCatalog | LabTestCatalog.serviceId → ServiceCatalog | Chi tiết xét nghiệm cho service |
| User | DoctorProfile | DoctorProfile.userId → User | Mỗi user bác sĩ có 1 hồ sơ |
| PrescriptionItem | DispenseItem | DispenseItem.prescriptionItemId → PrescriptionItem | Mỗi dòng đơn thuốc được cấp phát 1 lần |
| Appointment | Visit | Visit.appointmentId → Appointment | Check-in appointment tạo 1 visit |

> **Quy tắc FK direction:** FK luôn đặt trên bảng "phụ" (child). Visit là parent cho Examination/Invoice/Queue/Vital — vì Visit tồn tại độc lập, các bảng kia không tồn tại nếu không có Visit.

### 2.2 One-to-Many (1:N) — Quan hệ phổ biến nhất

| Parent | Child | FK | Quan trọng gì |
|---|---|---|---|
| Patient | Visit | Visit.patientId | Bệnh nhân khám nhiều lần |
| Patient | Appointment | Appointment.patientId | Bệnh nhân đặt nhiều lịch |
| User | Visit (creator) | Visit.createdByUserId | Lễ tân tạo nhiều lượt khám |
| User | Examination (doctor) | Examination.doctorUserId | Bác sĩ khám nhiều bệnh nhân |
| Examination | Diagnosis | Diagnosis.examinationId | Một phiếu có nhiều chẩn đoán |
| Prescription | PrescriptionItem | PrescriptionItem.prescriptionId | Đơn có nhiều thuốc |
| Drug | PrescriptionItem | PrescriptionItem.drugId | Thuốc xuất hiện trong nhiều đơn |
| Invoice | InvoiceItem | InvoiceItem.invoiceId | Hóa đơn có nhiều dòng |
| Invoice | Payment | Payment.invoiceId | Hóa đơn có nhiều giao dịch |
| Department | Room | Room.departmentId | Khoa có nhiều phòng |
| Department | DoctorProfile | DoctorProfile.departmentId | Khoa có nhiều bác sĩ |
| DoctorProfile | Appointment | Appointment.doctorProfileId | Bác sĩ nhận nhiều lịch hẹn |
| Visit | ServiceOrder | ServiceOrder.visitId | Một lượt khám nhiều chỉ định |
| ServiceCatalog | ServiceOrder | ServiceOrder.serviceId | Dịch vụ được chỉ định nhiều lần |
| Drug | StockLot | StockLot.drugId | Thuốc có nhiều lô |
| StockLot | StockMovement | StockMovement.lotId | Lô có nhiều lịch sử nhập/xuất |
| Dispense | DispenseItem | DispenseItem.dispenseId | Một lần cấp phát nhiều thuốc |
| LabOrder | LabSample | LabSample.labOrderId | Một lệnh xét nghiệm nhiều mẫu |
| LabOrder | LabResult | LabResult.labOrderId | Một lệnh xét nghiệm nhiều kết quả |

### 2.3 Many-to-Many (N:M) — Qua junction table

| Model A | Junction | Model B | Ghi chú |
|---|---|---|---|
| User | UserRole | Role | Dynamic RBAC |
| Role | RolePermission | Permission | Fine-grained permissions |

### 2.4 Self-referencing / Nullable FK

| Model | Nullable FK | Lý do nullable |
|---|---|---|
| Visit | departmentId | Walk-in không biết khoa trước khi khám |
| Visit | appointmentId | Walk-in không có appointment |
| Examination | (none self-ref) | — |
| Appointment | roomId | Phòng chưa xác định khi đặt lịch |
| Appointment | scheduleId | Đặt lịch ngoài slot cũng được |
| AuditLog | actorId | System action không có actor |
| Diagnosis | diseaseId | Chẩn đoán tự nhập (không cần từ catalog) |

---

## 3. Constraint Inventory

### 3.1 Primary Keys

Tất cả 37 models đều dùng `@id @default(uuid())` — UUID v4.

**Trade-off:** UUID không sequential → index B-tree kém hơn BIGINT serial cho bảng dữ liệu lớn. Tuy nhiên với quy mô phòng mạch (vài nghìn records/tháng) là không đáng kể.

### 3.2 Unique Constraints

| Model | Unique constraint | Tác dụng bảo vệ |
|---|---|---|
| User | username | Không duplicate account |
| Patient | patientCode | Mã bệnh nhân duy nhất |
| Patient | citizenId | CMND/CCCD duy nhất |
| Visit | (visitDate, queueNumber) | Queue number duy nhất trong ngày |
| Visit | (patientId, visitDate) | Bệnh nhân không khám 2 lần/ngày |
| Visit | appointmentId | 1 appointment → 1 visit |
| Examination | visitId | 1 visit → 1 examination |
| Prescription | examinationId | 1 examination → 1 prescription |
| PrescriptionItem | (prescriptionId, drugId) | Không duplicate thuốc trong đơn |
| Invoice | visitId | 1 visit → 1 invoice |
| Room | (departmentId, code) | Mã phòng duy nhất trong khoa |
| DoctorProfile | userId | 1 user → 1 doctor profile |
| QueueTicket | visitId | 1 visit → 1 queue ticket |
| QueueTicket | (departmentId, queueDate, queueNumber) | Queue number duy nhất trong khoa+ngày |
| VitalSign | visitId | 1 visit → 1 vital sign record |
| ServiceCatalog | code | Mã dịch vụ duy nhất |
| LabTestCatalog | serviceId, code | 1 service → 1 lab test config |
| LabOrder | serviceOrderId | 1 service order → 1 lab order |
| StockLot | (drugId, lotNumber) | Số lô duy nhất trong từng thuốc |
| Dispense | prescriptionId | 1 prescription → 1 dispense |
| DispenseItem | prescriptionItemId | 1 prescription item → 1 dispense item |

### 3.3 Indexes

| Model | Index fields | Tại sao |
|---|---|---|
| RefreshToken | userId, tokenHash | Lookup token nhanh |
| AuditLog | (entityType, entityId), actorId | Filter log theo entity/actor |
| Patient | fullName, phone | Tìm kiếm bệnh nhân |
| Visit | visitDate, status | Filter danh sách lượt khám |
| Disease | isActive | Filter catalog đang active |
| Drug | isActive | Filter catalog đang active |
| Invoice | status | Filter hóa đơn theo trạng thái |
| RegulationVersion | isActive | Tìm version đang active |
| StaffSchedule | workDate, (userId, workDate) | Xem lịch theo ngày/bác sĩ |
| Appointment | patientId, (doctorProfileId, scheduledAt), (departmentId, scheduledAt) | Xem lịch hẹn |
| QueueTicket | (departmentId, queueDate, status) | Real-time queue view |
| ServiceCatalog | (type, isActive) | Filter theo loại dịch vụ |
| ServiceOrder | visitId, examinationId | Xem chỉ định theo visit/exam |
| StockLot | (drugId, expiryDate) | FEFO selection |
| StockMovement | drugId, lotId, createdAt | Stock history |
| Dispense | visitId, status | Pharmacy pending list |

### 3.4 Cascade Delete

| Parent | Child | OnDelete |
|---|---|---|
| UserRole ← User/Role | — | Cascade |
| RolePermission ← Role/Permission | — | Cascade |
| RefreshToken ← User | — | Cascade |
| Diagnosis ← Examination | — | Cascade |
| PrescriptionItem ← Prescription | — | Cascade |
| InvoiceItem ← Invoice | — | Cascade |
| Payment ← Invoice | — | Cascade |
| RegulationItem ← RegulationVersion | — | Cascade |
| DispenseItem ← Dispense | — | Cascade |

> **Không có cascade xóa** cho Patient, Visit, Examination, Invoice — dữ liệu lâm sàng và tài chính phải được giữ lại. Xóa phải là soft-delete (isActive = false hoặc status = CANCELLED).

---

## 4. Snapshot Pattern Analysis

Các field sau là **snapshot** — được lưu tại thời điểm tạo và không thay đổi dù catalog thay đổi sau:

| Model | Snapshot field | Tại sao không dùng FK |
|---|---|---|
| PrescriptionItem | unitPrice, lineTotal | Giá thuốc có thể thay đổi; đơn cũ phải giữ giá cũ |
| InvoiceItem | description, unitPrice, lineTotal | Hóa đơn phải bất biến |
| ServiceOrder | priceSnapshot | Giá dịch vụ lúc order |
| DispenseItem | unitPriceSnapshot | Giá lúc cấp phát |

**Quy tắc:** Bất kỳ bảng nào liên quan đến tài chính đều phải snapshot, không reference live catalog.

---

## 5. Extensibility Assessment

### 5.1 Dễ mở rộng ✅

| Điểm mở rộng | Cách thêm | Ví dụ |
|---|---|---|
| **Thêm role mới** | Seed Role + Permission, thêm ROLES constant, seed demo user | Thêm PHARMACIST xong trong 30 phút |
| **Thêm quy định mới** | Thêm RegulationItem key mới, đọc trong service | Thêm MAX_LAB_ORDERS_PER_VISIT |
| **Thêm loại dịch vụ** | Thêm ServiceType enum value, thêm ServiceCatalog record | Thêm type IMAGING |
| **Thêm module mới** | Tạo module NestJS mới, không đụng module cũ (nếu không cần schema chung) | Thêm TelemedicineModule |
| **Thêm audit event** | Gọi `auditService.log({action: 'NEW_ACTION', ...})` ở bất kỳ đâu | 1 dòng code |
| **Thêm loại payment** | Thêm PaymentMethod enum value | Thêm INSURANCE |
| **Thêm regulation key** | Insert vào RegulationVersion + RegulationItem | Không cần migration |
| **Thêm field optional** | Prisma schema + migration | Không break existing data |

### 5.2 Khó mở rộng ⚠️ — cần biết trước

| Điểm khó | Vấn đề | Giải pháp khi cần |
|---|---|---|
| **Visit là God Table** | Visit có 8 nullable FK (departmentId, appointmentId, queueTicket, vitalSign, serviceOrders, dispenses, examination, invoice). Thêm module mới thường phải thêm FK vào Visit | Chấp nhận với modular monolith. Nếu quá nhiều, tách VisitContext table |
| **BillingService gom items hardcode** | `createInvoiceFromVisit()` phải biết về ServiceOrder + Dispense → coupling chặt | Dùng strategy pattern: `InvoiceItemProvider[]` interface, mỗi module register provider |
| **ExaminationsService.complete() biết ServiceOrder** | isRequiredForCompletion check tạo coupling | Dùng domain event: ExaminationCompleting → check ServiceOrder |
| **Reports đọc trực tiếp từ DB** | Khi data source nhiều hơn, query reports sẽ phức tạp | Tạo ReportQueryService riêng, hoặc materialized view |
| **Không có event bus** | Dispense → StockMovement → InvoiceUpdate đều qua direct service call | Thêm EventEmitter2 (NestJS built-in) khi cần decouple |
| **InvoiceItem.itemType là String** | Không có compile-time check khi thêm loại item mới | Tạo enum InvoiceItemType |
| **StaffSchedule.startTime là String** | Không thể query overlap ở DB level | CF-005 cần sửa sang DateTime |

### 5.3 Không nên thay đổi ❌

| Điểm | Lý do |
|---|---|
| **FK direction trên 1:1** | Visit là parent → Examination/Invoice/Queue/Vital là child. Đảo ngược sẽ làm Visit biết về các module extension |
| **Snapshot pattern** | Đã có data tài chính cũ với giá snapshot. Thay sang FK sẽ mất historical accuracy |
| **UUID cho PK** | Đã được dùng khắp nơi, không thể đổi sang BigInt mà không có full migration |
| **Modular Monolith** | Với team 4 người và 1 tháng, microservices sẽ làm chậm hơn 3x. Giữ đến khi có lý do cụ thể |
| **RegulationVersion immutable** | Quy định cũ không được sửa — đây là thiết kế cố ý để audit trail |

---

## 6. Missing DB-level Protections

Những bảo vệ này hiện tại chỉ ở service layer, không có ở DB:

| Bảo vệ | Service có | DB không có | Rủi ro nếu bypass service |
|---|---|---|---|
| quantity > 0 trên PrescriptionItem | ✅ DTO validation | ❌ Không có CHECK | Có thể insert quantity = 0 qua raw query |
| amount > 0 trên Payment | ✅ Service check | ❌ Không có CHECK | Thanh toán âm |
| stockLot.quantityOnHand >= 0 | ✅ Service check | ❌ Không có CHECK | Kho âm |
| Visit COMPLETED trước khi tạo Invoice | ✅ Service check | ❌ Không có constraint | Invoice cho visit chưa khám xong |
| Không void invoice đã có payment | ✅ Service check | ❌ Không có constraint | Void invoice dù đã thu tiền |

**Khuyến nghị:** Thêm `CHECK` constraint qua custom migration sau khi Phase 2A SDD approved. Không cần urgent cho Phase 1.

---

## 7. Index Analysis & Query Patterns

### Các query chính và index coverage

| Query | Index used | Covered? |
|---|---|---|
| Tìm bệnh nhân theo tên/phone | fullName, phone | ✅ |
| Danh sách lượt khám hôm nay | visitDate, status | ✅ |
| Hóa đơn chờ thanh toán | status | ✅ |
| Queue hôm nay theo khoa | (departmentId, queueDate, status) | ✅ |
| Lịch bác sĩ hôm nay | (userId, workDate) | ✅ |
| Lịch sử kho theo thuốc | (drugId, expiryDate) | ✅ |
| Audit log theo entity | (entityType, entityId) | ✅ |
| Appointment conflict check | (doctorProfileId, scheduledAt) | ✅ |

### Queries chưa có index tốt

| Query | Hiện tại | Cần thêm |
|---|---|---|
| Báo cáo doanh thu tháng | Full scan Payment join Invoice join Visit | Index trên Payment.paidAt |
| Tìm đơn thuốc theo bệnh nhân | Join Visit → Examination → Prescription | Index Examination.doctorUserId |
| Pending dispense theo pharmacist | Scan Dispense.status | ✅ Đã có index |
