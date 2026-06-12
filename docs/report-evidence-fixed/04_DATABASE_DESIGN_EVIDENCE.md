# 04 — Bằng chứng Thiết kế Database

> Audit date: 2026-06-07 | Nguồn: `backend/prisma/schema.prisma` đọc trực tiếp

---

## Canonical counts (thống nhất với file 00)

- **Database models: 37** (đếm chính xác từ `grep "^model "`)
- **Enums: 12** (đếm chính xác từ `grep "^enum "`)
- **Migrations: 3** (baseline, identity-access, phase2a-foundation)

---

## 1. Model Inventory theo nhóm nghiệp vụ

### 1.1 Identity & Access (Phase 1)

| Model | Mô tả | Key fields |
|---|---|---|
| User | Tài khoản hệ thống | id (UUID), email @unique, username @unique, passwordHash, status (UserStatus) |
| Role | Vai trò hệ thống | id, code @unique, name |
| Permission | Quyền cụ thể | id, code @unique |
| UserRole | Gán role cho user | @@id([userId, roleId]) |
| RolePermission | Gán permission cho role | @@id([roleId, permissionId]) |
| RefreshToken | JWT refresh token | id, tokenHash, userId, @@index([tokenHash]) |
| AuditLog | Nhật ký thao tác | id, actorId, entityType, entityId, @@index([entityType, entityId]) |

**Số model: 7**

### 1.2 Clinical Core — Patients & Visits (Phase 1)

| Model | Mô tả | Key fields |
|---|---|---|
| Patient | Hồ sơ bệnh nhân | id (UUID), patientCode @unique, citizenId @unique, fullName, dateOfBirth, gender, phone |
| Visit | Lượt khám | id (UUID), patientId, visitDate, queueNumber, status (VisitStatus), @@unique([visitDate, queueNumber]), @@unique([patientId, visitDate]) |

**Số model: 2**

### 1.3 Clinical Core — Examination & Prescription (Phase 1)

| Model | Mô tả | Key fields |
|---|---|---|
| Examination | Phiếu khám | id, visitId @unique, status (ExaminationStatus), symptoms, notes |
| Disease | Danh mục bệnh | id, code @unique, name @unique, isActive |
| Diagnosis | Chẩn đoán (link Examination ↔ Disease) | id, examinationId, diseaseId, isPrimary |
| Drug | Danh mục thuốc | id, name @unique, unit, pricePerUnit, isActive |
| Prescription | Đơn thuốc | id, examinationId @unique |
| PrescriptionItem | Chi tiết đơn thuốc | id, prescriptionId, drugId, quantity, unitPrice (snapshot), @@unique([prescriptionId, drugId]) |

**Số model: 6**

### 1.4 Billing & Regulation & Reports (Phase 1)

| Model | Mô tả | Key fields |
|---|---|---|
| Invoice | Hóa đơn | id, visitId @unique, totalAmount, paidAmount, status (InvoiceStatus) |
| InvoiceItem | Chi tiết hóa đơn | id, invoiceId, description, amount, itemType |
| Payment | Thanh toán | id, invoiceId, amount, method (PaymentMethod), paidAt |
| RegulationVersion | Phiên bản quy định | id, isActive, activatedAt |
| RegulationItem | Chi tiết quy định | id, versionId, key, value, @@unique([versionId, key]) |

**Số model: 5**

### 1.5 Organization (Phase 2)

| Model | Mô tả | Key fields |
|---|---|---|
| Department | Khoa/Phòng | id, code @unique, name |
| Room | Phòng khám | id, departmentId, code, @@unique([departmentId, code]) |
| DoctorProfile | Hồ sơ bác sĩ | id, userId @unique, specialization, licenseNumber |
| StaffSchedule | Lịch làm việc | id, userId, workDate, @@index([userId, workDate]) |

**Số model: 4**

### 1.6 Appointment & Queue (Phase 2)

| Model | Mô tả | Key fields |
|---|---|---|
| Appointment | Lịch hẹn | id, patientId, doctorProfileId, scheduledAt, status (AppointmentStatus) |
| QueueTicket | Phiếu hàng đợi | id, visitId @unique, departmentId, queueDate, queueNumber, status (QueueStatus), @@unique([departmentId, queueDate, queueNumber]) |

**Số model: 2**

### 1.7 Clinical Extended — Vitals & Services & Lab (Phase 2)

| Model | Mô tả | Key fields |
|---|---|---|
| VitalSign | Sinh hiệu | id, visitId @unique, weight, height, bmi (computed), temperature, bloodPressure |
| ServiceCatalog | Danh mục dịch vụ | id, code @unique, name, type (ServiceType), basePrice, isActive |
| LabTestCatalog | Danh mục xét nghiệm | id, serviceId @unique, code @unique, normalRange |
| ServiceOrder | Chỉ định dịch vụ | id, visitId, examinationId, serviceId, status (ServiceOrderStatus) |
| LabOrder | Chỉ định xét nghiệm | id, serviceOrderId @unique, status (LabOrderStatus) |
| LabSample | Mẫu xét nghiệm | id, labOrderId @unique, collectedAt, collectedBy |
| LabResult | Kết quả xét nghiệm | id, labOrderId @unique, resultData (JSON), enteredBy, verifiedBy |

**Số model: 7**

### 1.8 Inventory & Pharmacy (Phase 2)

| Model | Mô tả | Key fields |
|---|---|---|
| StockLot | Lô thuốc | id, drugId, lotNumber, expiryDate, quantity, @@unique([drugId, lotNumber]) |
| StockMovement | Biến động kho | id, stockLotId, type (StockMovementType), quantity, reason |
| Dispense | Cấp phát thuốc | id, prescriptionId, status (DispenseStatus) |
| DispenseItem | Chi tiết cấp phát | id, dispenseId, stockLotId, drugId, quantity |

**Số model: 4**

---

## 2. Enum Inventory (12 enums — đếm chính xác)

| Enum | Values | Dùng trong model |
|---|---|---|
| UserStatus | ACTIVE, INACTIVE, LOCKED | User |
| VisitStatus | REGISTERED, WAITING, IN_EXAMINATION, COMPLETED, CANCELLED | Visit |
| ExaminationStatus | OPEN, COMPLETED, CANCELLED | Examination |
| InvoiceStatus | DRAFT, ISSUED, PARTIALLY_PAID, PAID, VOID | Invoice |
| PaymentMethod | CASH, TRANSFER, CARD | Payment |
| AppointmentStatus | SCHEDULED, CHECKED_IN, CANCELLED, NO_SHOW | Appointment |
| QueueStatus | WAITING, CALLED, IN_SERVICE, DONE, SKIPPED, CANCELLED | QueueTicket |
| ServiceType | CONSULTATION, LAB_TEST, PROCEDURE | ServiceCatalog |
| DispenseStatus | PENDING, DISPENSED, CANCELLED | Dispense |
| StockMovementType | IN, OUT, ADJUSTMENT | StockMovement |
| LabOrderStatus | ORDERED, SAMPLE_COLLECTED, RESULT_ENTERED, VERIFIED, CANCELLED | LabOrder |
| ServiceOrderStatus | ORDERED, IN_PROGRESS, COMPLETED, CANCELLED | ServiceOrder |

**Tổng: 12 enums** — Không được ghi 9 enum (con số sai trong bản draft cũ).

---

## 3. Quan hệ quan trọng

| Từ | Đến | Loại | Ghi chú |
|---|---|---|---|
| Visit | Patient | N:1 | Một bệnh nhân nhiều lượt khám |
| Visit | Appointment | 1:0..1 | Lượt khám có thể từ lịch hẹn |
| Examination | Visit | 1:1 | Mỗi lượt khám 1 phiếu khám |
| Diagnosis | Examination | N:1 | Nhiều chẩn đoán trong 1 phiếu |
| Diagnosis | Disease | N:1 | Liên kết với danh mục bệnh |
| Prescription | Examination | 1:1 | Mỗi phiếu khám 1 đơn thuốc |
| PrescriptionItem | Drug | N:1 | Snapshot giá tại thời điểm kê đơn |
| Invoice | Visit | 1:1 | Mỗi lượt khám 1 hóa đơn |
| Payment | Invoice | N:1 | Nhiều lần thanh toán trên 1 hóa đơn |
| LabOrder | ServiceOrder | 1:1 | Lab order từ service order |
| Dispense | Prescription | 1:1 | Cấp phát từ đơn thuốc |
| DispenseItem | StockLot | N:1 | FEFO — chọn lô theo ngày hết hạn |
| QueueTicket | Visit | 1:1 | Phiếu xếp hàng cho lượt khám |
| DoctorProfile | User | 1:1 | Hồ sơ bác sĩ liên kết tài khoản |

---

## 4. Constraints / Integrity

| Constraint | Model | Bằng chứng |
|---|---|---|
| UUID PK | Tất cả model | `id String @id @default(uuid())` |
| Unique patientCode | Patient | `patientCode @unique` |
| Unique citizenId | Patient | `citizenId @unique` |
| No duplicate visit same patient/date | Visit | `@@unique([patientId, visitDate])` |
| Unique queueNumber per date | Visit | `@@unique([visitDate, queueNumber])` |
| Examination ↔ Visit 1:1 | Examination | `visitId @unique` |
| Prescription ↔ Examination 1:1 | Prescription | `examinationId @unique` |
| Invoice ↔ Visit 1:1 | Invoice | `visitId @unique` |
| No duplicate drug in prescription | PrescriptionItem | `@@unique([prescriptionId, drugId])` |
| No duplicate stock lot | StockLot | `@@unique([drugId, lotNumber])` |
| Department room code unique | Room | `@@unique([departmentId, code])` |
| Queue unique per dept/date/number | QueueTicket | `@@unique([departmentId, queueDate, queueNumber])` |

---

## 5. State Machines

### VisitStatus
```
REGISTERED → WAITING → IN_EXAMINATION → COMPLETED
                                       → CANCELLED
REGISTERED → CANCELLED
```

### ExaminationStatus
```
OPEN → COMPLETED
OPEN → CANCELLED
```

### InvoiceStatus
```
DRAFT → ISSUED → PARTIALLY_PAID → PAID
ISSUED → VOID
```

### AppointmentStatus
```
SCHEDULED → CHECKED_IN
SCHEDULED → CANCELLED
SCHEDULED → NO_SHOW
```

### LabOrderStatus
```
ORDERED → SAMPLE_COLLECTED → RESULT_ENTERED → VERIFIED
                                             → CANCELLED
```

---

## 6. Design Notes

| Quyết định thiết kế | Evidence | Lý do |
|---|---|---|
| UUID PK thay vì serial INT | Tất cả model | Phù hợp distributed system, không đoán được ID |
| Soft-delete qua isActive | Disease, Drug, ServiceCatalog | Giữ lịch sử, không mất dữ liệu |
| Snapshot giá trong PrescriptionItem | `unitPrice` field | Invoice lịch sử không thay đổi khi giá thuốc thay đổi |
| Prisma transaction | visits.service, billing.service, regulations.service | Đảm bảo atomic cho queue number, payment, regulation activation |
| RegulationVersion với isActive | `isActive` + `@@index([isActive])` | Chỉ 1 version active tại 1 thời điểm |
