# 04 — Bằng chứng Thiết kế Cơ sở dữ liệu

> Nguồn: `backend/prisma/schema.prisma`  
> Provider: PostgreSQL, ORM: Prisma 6.16

---

## 1. Kiểm kê Models (37 models)

### Nhóm Identity & Access (Phase 1)

| Model | Phase | Nhóm nghiệp vụ | Field quan trọng | Quan hệ chính | Unique/Index | Enum liên quan | Ghi chú |
|---|---|---|---|---|---|---|---|
| **User** | P1 | Tài khoản | id, username, passwordHash, fullName, email, phone, status | UserRole[], RefreshToken[], AuditLog[], Examination[], Visit[], DoctorProfile | username (unique) | UserStatus | Không lưu role trực tiếp — qua UserRole |
| **Role** | P1 | Vai trò | id, code, name, description | UserRole[], RolePermission[] | code (unique) | — | code = ADMIN, DOCTOR, ... |
| **Permission** | P1 | Quyền | id, code, name | RolePermission[] | code (unique) | — | Granular permission |
| **UserRole** | P1 | Gán vai trò | userId, roleId | User, Role | @@id([userId, roleId]) | — | Composite PK |
| **RolePermission** | P1 | Gán quyền | roleId, permissionId | Role, Permission | @@id([roleId, permissionId]) | — | Composite PK |
| **RefreshToken** | P1 | JWT refresh | id, userId, tokenHash, revokedAt, expiresAt | User | @@index([userId]), @@index([tokenHash]) | — | tokenHash để tra cứu nhanh |
| **AuditLog** | P2 | Nhật ký | id, actorId, action, entityType, entityId, oldValues, newValues, ipAddress | User | @@index([actorId]), @@index([entityType, entityId]) | — | JSON fields cho old/new values |

### Nhóm Clinical Core (Phase 1)

| Model | Phase | Nhóm nghiệp vụ | Field quan trọng | Quan hệ chính | Unique/Index | Enum liên quan | Ghi chú |
|---|---|---|---|---|---|---|---|
| **Patient** | P1 | Bệnh nhân | id, patientCode, fullName, dateOfBirth, gender, phone, address, citizenId | Visit[], Appointment[] | patientCode (unique), citizenId (unique nếu có) | — | patientCode tự sinh |
| **Visit** | P1 | Lượt khám | id, patientId, date, queueNumber, status, examinedById | Patient, User, Examination, Invoice | @@unique([patientId, date]) | VisitStatus | Ngăn trùng lượt cùng ngày |
| **Examination** | P1 | Phiên khám | id, visitId, doctorId, status, symptoms, diagnosis, consultationFee | Visit, User, Prescription, Diagnosis[], ServiceOrder[] | visitId (unique — 1 khám/visit) | ExaminationStatus | — |
| **Disease** | P1 | Danh mục bệnh | id, code, name, isActive | Diagnosis[] | code (unique) | — | ICD-style code |
| **Diagnosis** | P1 | Chẩn đoán | id, examinationId, diseaseId, isPrimary | Examination, Disease | — | — | Có thể nhiều diagnosis/exam |
| **Drug** | P1 | Danh mục thuốc | id, name, unit, pricePerUnit, isActive | PrescriptionItem[], StockLot[] | — | — | — |
| **Prescription** | P1 | Đơn thuốc | id, examinationId, notes | Examination, PrescriptionItem[] | examinationId (unique) | — | 1 đơn/khám |
| **PrescriptionItem** | P1 | Chi tiết đơn | id, prescriptionId, drugId, quantity, unitPrice, dosageInstruction, snapshot | Prescription, Drug, DispenseItem[] | — | — | snapshot lưu tên/giá tại thời điểm kê |
| **Invoice** | P1 | Hóa đơn | id, visitId, totalAmount, paidAmount, status, issuedAt | Visit, Payment[], InvoiceItem[] | visitId (unique) | InvoiceStatus | — |
| **InvoiceItem** | P1+2 | Dòng hóa đơn | id, invoiceId, description, itemType, amount, refId | Invoice | — | — | Multi-item billing (P2 extension) |
| **Payment** | P1 | Thanh toán | id, invoiceId, amount, method, paidAt | Invoice | — | PaymentMethod | — |
| **RegulationVersion** | P1 | Phiên bản quy định | id, versionName, isActive, activatedAt | RegulationItem[] | — | — | Chỉ 1 active tại 1 thời điểm |
| **RegulationItem** | P1 | Mục quy định | id, versionId, key, value | RegulationVersion | @@unique([versionId, key]) | — | key-value store |

### Nhóm Organization (Phase 2)

| Model | Phase | Nhóm nghiệp vụ | Field quan trọng | Quan hệ chính | Unique/Index | Ghi chú |
|---|---|---|---|---|---|---|
| **Department** | P2 | Khoa | id, code, name, description, isActive | Room[], DoctorProfile[], Appointment[] | code (unique) | — |
| **Room** | P2 | Phòng | id, code, name, roomType, departmentId | Department, Appointment[], StaffSchedule[] | code (unique) | — |
| **DoctorProfile** | P2 | Hồ sơ bác sĩ | id, userId, departmentId, title, specialty, isActive | User, Department, Appointment[], StaffSchedule[] | userId (unique) | — |
| **StaffSchedule** | P2 | Lịch trực | id, userId, roomId, dayOfWeek, startTime, endTime | User, Room | — | — |

### Nhóm Appointment & Queue (Phase 2)

| Model | Phase | Nhóm nghiệp vụ | Field quan trọng | Quan hệ chính | Unique/Index | Enum |
|---|---|---|---|---|---|---|
| **Appointment** | P2 | Lịch hẹn | id, patientId, doctorProfileId, scheduledAt, durationMinutes, status, reason, visitId | Patient, DoctorProfile, Department, Room, Visit, User | — | AppointmentStatus |
| **QueueTicket** | P2 | Hàng đợi | id, visitId, departmentId, roomId, queueNumber, status, calledAt | Visit, Department, Room | — | QueueStatus |

### Nhóm Clinical Extended (Phase 2)

| Model | Phase | Nhóm nghiệp vụ | Field quan trọng | Quan hệ chính | Enum |
|---|---|---|---|---|---|
| **VitalSign** | P2 | Sinh hiệu | id, visitId, measuredById, weight, height, bmi, temperature, bloodPressure, heartRate, spO2 | Visit, User | — |
| **ServiceCatalog** | P2 | Danh mục dịch vụ | id, code, name, type, price, isActive | ServiceOrder[], LabTestCatalog | ServiceType |
| **LabTestCatalog** | P2 | Danh mục xét nghiệm | id, serviceId, unit, referenceRange | ServiceCatalog | — |
| **ServiceOrder** | P2 | Chỉ định dịch vụ | id, visitId, examinationId, serviceId, status, quantity, price | Visit, Examination, ServiceCatalog, LabOrder, InvoiceItem | ServiceOrderStatus |
| **LabOrder** | P2 | Đặt xét nghiệm | id, serviceOrderId, visitId, status | ServiceOrder, Visit, LabSample, LabResult | LabOrderStatus |
| **LabSample** | P2 | Mẫu xét nghiệm | id, labOrderId, collectedAt, collectedById, sampleType, notes | LabOrder, User | — |
| **LabResult** | P2 | Kết quả XN | id, labOrderId, resultData (Json), resultNotes, enteredById, verifiedById, enteredAt | LabOrder, User | — |

### Nhóm Inventory & Pharmacy (Phase 2)

| Model | Phase | Nhóm nghiệp vụ | Field quan trọng | Quan hệ chính | Enum |
|---|---|---|---|---|---|
| **StockLot** | P2 | Lô thuốc | id, drugId, lotNumber, quantityOnHand, expiryDate, unitCost | Drug, StockMovement[], DispenseItem[] | — |
| **StockMovement** | P2 | Xuất nhập kho | id, lotId, type, quantity, createdById | StockLot, User | StockMovementType |
| **Dispense** | P2 | Phiếu cấp phát | id, visitId, prescriptionId, dispensedById, status, totalAmount | Visit, Prescription, User, DispenseItem[] | DispenseStatus |
| **DispenseItem** | P2 | Chi tiết cấp phát | id, dispenseId, prescriptionItemId, lotId, quantity, unitCost | Dispense, PrescriptionItem, StockLot | — |

---

## 2. Kiểm kê Enums (9 enums)

| Enum | Giá trị | Dùng ở model | Ý nghĩa nghiệp vụ | Rủi ro |
|---|---|---|---|---|
| **UserStatus** | ACTIVE, INACTIVE, LOCKED | User | Trạng thái tài khoản | — |
| **VisitStatus** | REGISTERED, WAITING, IN_EXAMINATION, COMPLETED, CANCELLED | Visit | State machine lượt khám | CONFIRMED: có transition logic trong service |
| **ExaminationStatus** | OPEN, COMPLETED, CANCELLED | Examination | State phiên khám | CONFIRMED |
| **InvoiceStatus** | DRAFT, ISSUED, PARTIALLY_PAID, PAID, VOID | Invoice | State hóa đơn | CONFIRMED: prevent double-pay |
| **PaymentMethod** | CASH, TRANSFER, CARD | Payment | Hình thức thanh toán | — |
| **AppointmentStatus** | SCHEDULED, CHECKED_IN, CANCELLED, NO_SHOW | Appointment | State lịch hẹn | CONFIRMED |
| **QueueStatus** | WAITING, CALLED, IN_SERVICE, DONE, SKIPPED, CANCELLED | QueueTicket | State hàng đợi | CONFIRMED |
| **ServiceType** | CONSULTATION, LAB_TEST, PROCEDURE, IMAGING, MATERIAL | ServiceCatalog | Loại dịch vụ | — |
| **DispenseStatus** | PENDING, DISPENSED, CANCELLED | Dispense | State phiếu cấp phát | CONFIRMED |
| **StockMovementType** | IN, OUT, ADJUSTMENT | StockMovement | Loại xuất nhập | — |
| **LabOrderStatus** | ORDERED, SAMPLE_COLLECTED, RESULT_ENTERED, VERIFIED, CANCELLED | LabOrder | State xét nghiệm | CONFIRMED |
| **ServiceOrderStatus** | ORDERED, IN_PROGRESS, COMPLETED, CANCELLED | ServiceOrder | State chỉ định dịch vụ | CONFIRMED |

> **Ghi chú**: Schema có 12 enums thực tế (bao gồm StockMovementType, ServiceOrderStatus), nhưng file schema khai báo 9 enum blocks

---

## 3. Tóm tắt Quan hệ quan trọng

| Quan hệ | Loại | Ý nghĩa | Bằng chứng | Ghi chú báo cáo |
|---|---|---|---|---|
| User → UserRole → Role | M:N qua join table | 1 user nhiều vai trò | schema.prisma:UserRole | Trình bày RBAC: tách role khỏi user |
| Patient → Visit | 1:N | 1 bệnh nhân nhiều lượt khám | schema.prisma:Visit.patientId | — |
| Visit → Examination | 1:1 | 1 lượt khám, 1 phiên khám | schema.prisma:Examination.visitId (unique) | Ràng buộc unique enforce |
| Examination → Prescription | 1:1 | 1 phiên khám, 1 đơn thuốc | schema.prisma:Prescription.examinationId (unique) | — |
| Prescription → PrescriptionItem | 1:N | 1 đơn nhiều dòng thuốc | schema.prisma:PrescriptionItem.prescriptionId | — |
| Visit → Invoice | 1:1 | 1 lượt khám, 1 hóa đơn | schema.prisma:Invoice.visitId (unique) | Ràng buộc unique enforce |
| Invoice → Payment | 1:N | 1 hóa đơn nhiều lần thanh toán | schema.prisma:Payment.invoiceId | Hỗ trợ thanh toán nhiều lần |
| Drug → StockLot | 1:N | 1 thuốc nhiều lô | schema.prisma:StockLot.drugId | FEFO dựa trên expiryDate |
| Prescription → Dispense | 1:1 | 1 đơn 1 phiếu cấp phát | schema.prisma:Dispense.prescriptionId | — |

---

## 4. Constraints và Integrity

| Constraint/Index | Model | Mục đích | Bằng chứng | Trạng thái |
|---|---|---|---|---|
| `@@unique([patientId, date])` | Visit | Ngăn tạo 2 lượt khám cùng bệnh nhân cùng ngày | schema.prisma:Visit | CONFIRMED |
| `visitId @unique` | Examination | Đảm bảo 1 examination/visit | schema.prisma:Examination | CONFIRMED |
| `visitId @unique` | Invoice | Đảm bảo 1 invoice/visit | schema.prisma:Invoice | CONFIRMED |
| `prescriptionId @unique` | Dispense | Đảm bảo 1 dispense/prescription | schema.prisma:Dispense | CONFIRMED |
| `examinationId @unique` | Prescription | Đảm bảo 1 prescription/examination | schema.prisma:Prescription | CONFIRMED |
| `username @unique` | User | Email/username duy nhất | schema.prisma:User | CONFIRMED |
| `code @unique` | Disease, Drug, Department, Room, Role, Permission, ServiceCatalog | Mã duy nhất | schema.prisma:các model | CONFIRMED |
| `@@index([tokenHash])` | RefreshToken | Tra cứu nhanh khi revoke | schema.prisma:RefreshToken | CONFIRMED |
| `@@index([actorId])` | AuditLog | Query log nhanh theo actor | schema.prisma:AuditLog | CONFIRMED |
| `@@id([userId, roleId])` | UserRole | Composite PK, ngăn gán trùng | schema.prisma:UserRole | CONFIRMED |
| `@@id([roleId, permissionId])` | RolePermission | Composite PK | schema.prisma:RolePermission | CONFIRMED |

---

## 5. Gợi ý viết Chương 3 — Thiết kế dữ liệu

- Vẽ ERD từ file `docs/software-design-workspace/final-output/04_DIAGRAM_SOURCES/ERD_03_Full_Schema.mmd` (dùng draw.io)
- Phân nhóm ERD theo nghiệp vụ: Identity/Access, Clinical Core, Organization, Appointment/Queue, Lab/Service, Inventory/Pharmacy
- Trình bày state machine diagram cho: VisitStatus, ExaminationStatus, InvoiceStatus, AppointmentStatus, LabOrderStatus
- Ghi rõ: schema sử dụng UUID làm primary key (không phải auto-increment integer)
- Ghi rõ: soft-delete pattern dùng `isActive` field, không có `deletedAt` timestamp
- Đề cập: `snapshot` field trong PrescriptionItem để bảo toàn lịch sử giá thuốc
