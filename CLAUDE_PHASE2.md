# CLAUDE_PHASE2.md — Hướng dẫn Claude Code cho Phase 2

> Tài liệu này dành cho Claude Code khi bắt đầu làm Phase 2.  
> Đọc toàn bộ trước khi implement bất cứ thứ gì.  
> **ERD và workflow đã được team chốt ở tài liệu này — không được tự suy luận thêm.**

---

## 1. Trạng thái codebase đầu vào Phase 2

Phase 1 đã hoàn thành (85/100) với chuỗi nghiệp vụ:

```
Patient → Visit → Examination → Prescription → Invoice → Payment
```

Tech stack giữ nguyên:
- Backend: NestJS 11 + Prisma 6 + PostgreSQL
- Frontend: React 19 + Vite + TypeScript + TanStack Query + Zustand
- Auth: JWT (access 1d + refresh 7d rotation)
- API prefix: `/api/v1`
- Global guards: `JwtAuthGuard` + `RolesGuard` bắt buộc trên tất cả route

**Không thay đổi tech stack. Không chuyển sang microservices.**

---

## 2. Mục tiêu Phase 2A (1 tháng)

Sau Phase 2A, hệ thống demo được flow đầy đủ:

```
Admin cấu hình phòng ban / phòng khám / lịch bác sĩ
→ Receptionist đặt lịch hẹn hoặc tiếp nhận walk-in
→ Queue theo department/doctor
→ Nurse đo sinh hiệu
→ Doctor khám, chỉ định xét nghiệm
→ Lab technician lấy mẫu, nhập kết quả
→ Doctor xem kết quả, kết luận, kê đơn
→ Pharmacist cấp phát thuốc, trừ kho thực tế
→ Cashier lập hóa đơn nhiều khoản mục
→ Cashier ghi nhận thanh toán
→ Manager xem báo cáo nâng cao + audit log
```

**Không làm trong Phase 2A:**
- Patient portal
- SMS/Email thật (chỉ log vào DB nếu cần)
- Bảo hiểm y tế (BHYT)
- Telemedicine
- Multi-branch
- LIS/PACS / tích hợp máy xét nghiệm
- Purchase order đầy đủ / supplier management
- Recurring schedule phức tạp

---

## 3. Việc bắt buộc làm TRƯỚC khi bắt đầu Phase 2

### 3.1 Fix Critical Security — PrescriptionsController

`backend/src/modules/prescriptions/prescriptions.controller.ts` không có `@UseGuards`. Phải xử lý trước.

**Cách xử lý đúng:** xóa `PrescriptionsController`, gộp logic vào `ExaminationsController` (đã có guard).

```typescript
// KHÔNG được làm: chỉ thêm @UseGuards vào controller trống prefix
// PHẢI làm: xóa file này, đảm bảo ExaminationsController cover đủ:
//   PUT /examinations/:id/prescription  ← đã có
//   GET /examinations/:id/prescription  ← thêm nếu thiếu
// Các route /prescriptions/:id/items không có user story → bỏ hoàn toàn
```

### 3.2 Fix UC03 — RoleManagementPage gọi API thật

`frontend/src/features/users/RoleManagementPage.tsx` hiện là matrix tĩnh. Phải gọi:
- `GET /rbac/roles` → danh sách role + permissions hiện tại
- `GET /rbac/permissions` → danh sách permissions
- `PATCH /rbac/roles/:id/permissions` → update

UI: checkbox matrix — rows là roles, columns là permissions.

### 3.3 Fix UC14 — Cashier invoice flow

Cashier không có cách tìm visit để tạo invoice. Cần thêm:

```
InvoiceListPage → tab "Chờ lập hóa đơn"
→ GET /visits?status=COMPLETED&hasInvoice=false
→ Cashier chọn visit → POST /visits/:id/invoice
```

Backend thêm query param `hasInvoice` vào `GET /visits`.

### 3.4 Mở rộng AuditService coverage

Thêm `AuditService.log()` vào các nơi chưa có:
- `patients.service.ts` — create, update
- `visits.service.ts` — create, openExamination
- `examinations.service.ts` — complete
- `billing.service.ts` — createInvoice, createPayment
- `auth.service.ts` — login success, login fail, logout

---

## 4. Thứ tự triển khai Phase 2A

### Nguyên tắc thứ tự

```
KHÔNG làm: Chart/Report trước khi có data model
KHÔNG làm: Inventory trước khi có Dispense workflow
KHÔNG làm: Lab result trước khi có ServiceOrder
KHÔNG làm: Appointment trước khi có DoctorSchedule

PHẢI làm theo thứ tự:
1. Department / Room / DoctorProfile
2. StaffSchedule / Appointment
3. Queue / VitalSign
4. ServiceCatalog / ServiceOrder / LabOrder / LabResult
5. Inventory / Dispense
6. Billing multi-item refactor
7. Reports + Charts + Audit UI (polish cuối)
```

### Tuần 1 — Foundation

Module cần tạo: `departments`, `staff`, `appointments`

Deliverable: Admin tạo phòng ban → tạo lịch bác sĩ → Receptionist đặt lịch → check-in tạo Visit

### Tuần 2 — Queue + Vitals

Module cần tạo: `queues`, `vitals`

Deliverable: Bệnh nhân check-in → vào queue → điều dưỡng đo sinh hiệu → bác sĩ thấy sinh hiệu

### Tuần 3 — Lab

Module cần tạo: `services`, `lab`

Deliverable: Bác sĩ chỉ định xét nghiệm → technician lấy mẫu/nhập kết quả → bác sĩ xem → hoàn tất

### Tuần 4 — Pharmacy + Billing + Polish

Module cần tạo: `inventory`, `pharmacy`  
Refactor: `billing` để support multi-item

Deliverable: Full end-to-end demo từ check-in đến payment

---

## 5. Data Model Phase 2A — ĐÃ CHỐT

Team đã chốt model. Claude **không được thêm/bỏ field** nếu không có yêu cầu từ người review.

### 5.1 Department & Room

```prisma
model Department {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  rooms          Room[]
  staffSchedules StaffSchedule[]
  appointments   Appointment[]
  queueTickets   QueueTicket[]
  doctorProfiles DoctorProfile[]
}

model Room {
  id           String     @id @default(uuid())
  departmentId String
  code         String
  name         String
  roomType     String     // CONSULTATION | PROCEDURE | LAB | PHARMACY
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  department     Department      @relation(fields: [departmentId], references: [id])
  staffSchedules StaffSchedule[]
  appointments   Appointment[]

  @@unique([departmentId, code])
}
```

### 5.2 DoctorProfile & StaffSchedule

```prisma
model DoctorProfile {
  id           String   @id @default(uuid())
  userId       String   @unique
  departmentId String
  title        String?  // BS., ThS., TS.
  specialty    String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user           User            @relation(fields: [userId], references: [id])
  department     Department      @relation(fields: [departmentId], references: [id])
  staffSchedules StaffSchedule[]
  appointments   Appointment[]
}

model StaffSchedule {
  id                  String   @id @default(uuid())
  userId              String
  departmentId        String
  roomId              String?
  workDate            DateTime @db.Date
  startTime           String   // "08:00"
  endTime             String   // "12:00"
  slotDurationMinutes Int      @default(15)
  maxAppointments     Int      @default(20)
  status              String   @default("ACTIVE") // ACTIVE | CANCELLED
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user         User         @relation(fields: [userId], references: [id])
  department   Department   @relation(fields: [departmentId], references: [id])
  room         Room?        @relation(fields: [roomId], references: [id])
  doctorProfile DoctorProfile? @relation(fields: [userId], references: [userId])
  appointments Appointment[]
}
```

### 5.3 Appointment

```prisma
enum AppointmentStatus {
  SCHEDULED
  CHECKED_IN
  CANCELLED
  NO_SHOW
}

model Appointment {
  id               String            @id @default(uuid())
  patientId        String
  doctorId         String
  departmentId     String
  roomId           String?
  scheduleId       String?
  scheduledAt      DateTime
  durationMinutes  Int               @default(15)
  status           AppointmentStatus @default(SCHEDULED)
  reason           String?
  createdById      String
  checkedInVisitId String?           @unique
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  patient        Patient        @relation(fields: [patientId], references: [id])
  doctor         DoctorProfile  @relation(fields: [doctorId], references: [id])
  department     Department     @relation(fields: [departmentId], references: [id])
  room           Room?          @relation(fields: [roomId], references: [id])
  schedule       StaffSchedule? @relation(fields: [scheduleId], references: [id])
  createdBy      User           @relation(fields: [createdById], references: [id])
  checkedInVisit Visit?         @relation(fields: [checkedInVisitId], references: [id])
}
```

### 5.4 QueueTicket

```prisma
enum QueueStatus {
  WAITING
  CALLED
  IN_SERVICE
  DONE
  SKIPPED
  CANCELLED
}

model QueueTicket {
  id           String      @id @default(uuid())
  visitId      String      @unique
  departmentId String
  doctorId     String?
  queueNumber  Int
  status       QueueStatus @default(WAITING)
  priority     Int         @default(0) // 0 = normal, 1 = appointment priority
  calledAt     DateTime?
  completedAt  DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  visit      Visit      @relation(fields: [visitId], references: [id])
  department Department @relation(fields: [departmentId], references: [id])

  @@unique([departmentId, queueNumber, createdAt]) // queue number per department per day
}
```

### 5.5 VitalSign

```prisma
model VitalSign {
  id           String   @id @default(uuid())
  visitId      String   @unique
  measuredById String
  pulse        Int?     // bpm
  systolicBp   Int?     // mmHg
  diastolicBp  Int?     // mmHg
  temperature  Decimal? // Celsius
  spo2         Int?     // %
  heightCm     Decimal?
  weightKg     Decimal?
  bmi          Decimal? // auto-calculated
  note         String?
  measuredAt   DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  visit      Visit @relation(fields: [visitId], references: [id])
  measuredBy User  @relation(fields: [measuredById], references: [id])
}
```

**Business rule BMI:** `bmi = weightKg / (heightCm/100)^2` — tính trong service, không để frontend tính.

### 5.6 ServiceCatalog & ServiceOrder

```prisma
enum ServiceType {
  CONSULTATION
  LAB_TEST
  PROCEDURE
  IMAGING
  MATERIAL
}

model ServiceCatalog {
  id       String      @id @default(uuid())
  code     String      @unique
  name     String
  type     ServiceType
  price    Decimal
  isActive Boolean     @default(true)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  serviceOrders ServiceOrder[]
  labTests      LabTestCatalog[]
}

model ServiceOrder {
  id             String   @id @default(uuid())
  visitId        String
  examinationId  String?
  serviceId      String
  orderedById    String
  status         String   @default("ORDERED") // ORDERED | IN_PROGRESS | COMPLETED | CANCELLED
  priceSnapshot  Decimal
  billingStatus  String   @default("PENDING")  // PENDING | INVOICED
  orderedAt      DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  visit       Visit          @relation(fields: [visitId], references: [id])
  examination Examination?   @relation(fields: [examinationId], references: [id])
  service     ServiceCatalog @relation(fields: [serviceId], references: [id])
  orderedBy   User           @relation(fields: [orderedById], references: [id])
  labOrder    LabOrder?
}
```

### 5.7 Lab

```prisma
model LabTestCatalog {
  id              String         @id @default(uuid())
  serviceId       String
  code            String         @unique
  sampleType      String         // BLOOD | URINE | STOOL | SWAB
  turnaroundHours Int            @default(24)
  referenceRange  String?

  service   ServiceCatalog @relation(fields: [serviceId], references: [id])
  labOrders LabOrder[]
}

model LabOrder {
  id             String   @id @default(uuid())
  serviceOrderId String   @unique
  labTestId      String
  status         String   @default("ORDERED")
  // ORDERED | SAMPLE_COLLECTED | RESULT_ENTERED | VERIFIED | CANCELLED
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  serviceOrder ServiceOrder   @relation(fields: [serviceOrderId], references: [id])
  labTest      LabTestCatalog @relation(fields: [labTestId], references: [id])
  samples      LabSample[]
  results      LabResult[]
}

model LabSample {
  id            String   @id @default(uuid())
  labOrderId    String
  collectedById String
  sampleType    String
  status        String   @default("COLLECTED") // COLLECTED | REJECTED
  collectedAt   DateTime @default(now())
  note          String?
  createdAt     DateTime @default(now())

  labOrder    LabOrder @relation(fields: [labOrderId], references: [id])
  collectedBy User     @relation(fields: [collectedById], references: [id])
}

model LabResult {
  id             String    @id @default(uuid())
  labOrderId     String
  enteredById    String
  verifiedById   String?
  resultText     String?
  resultValue    Decimal?
  unit           String?
  referenceRange String?
  status         String    @default("RESULT_ENTERED") // RESULT_ENTERED | VERIFIED
  enteredAt      DateTime  @default(now())
  verifiedAt     DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  labOrder   LabOrder @relation(fields: [labOrderId], references: [id])
  enteredBy  User     @relation(fields: [enteredById], references: [id])
  verifiedBy User?    @relation("LabResultVerifier", fields: [verifiedById], references: [id])
}
```

### 5.8 Inventory & Dispense

```prisma
model StockLot {
  id           String   @id @default(uuid())
  drugId       String
  lotNumber    String
  expiryDate   DateTime
  quantityOnHand Int    @default(0)
  unitCost     Decimal?
  receivedAt   DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  drug     Drug            @relation(fields: [drugId], references: [id])
  movements StockMovement[]
  dispenseItems DispenseItem[]

  @@unique([drugId, lotNumber])
}

enum StockMovementType {
  IN
  OUT
  ADJUSTMENT
}

model StockMovement {
  id            String            @id @default(uuid())
  drugId        String
  lotId         String
  movementType  StockMovementType
  quantity      Int
  referenceType String?           // DISPENSE | IMPORT | ADJUSTMENT
  referenceId   String?
  note          String?
  createdById   String
  createdAt     DateTime          @default(now())

  drug      Drug      @relation(fields: [drugId], references: [id])
  lot       StockLot  @relation(fields: [lotId], references: [id])
  createdBy User      @relation(fields: [createdById], references: [id])
}

enum DispenseStatus {
  PENDING
  DISPENSED
  CANCELLED
}

model Dispense {
  id               String         @id @default(uuid())
  prescriptionId   String
  visitId          String
  dispensedById    String
  status           DispenseStatus @default(PENDING)
  dispensedAt      DateTime?
  note             String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  prescription Prescription  @relation(fields: [prescriptionId], references: [id])
  visit        Visit         @relation(fields: [visitId], references: [id])
  dispensedBy  User          @relation(fields: [dispensedById], references: [id])
  items        DispenseItem[]
}

model DispenseItem {
  id                  String   @id @default(uuid())
  dispenseId          String
  prescriptionItemId  String
  drugId              String
  lotId               String
  quantity            Int
  unitPriceSnapshot   Decimal
  createdAt           DateTime @default(now())

  dispense         Dispense         @relation(fields: [dispenseId], references: [id])
  prescriptionItem PrescriptionItem @relation(fields: [prescriptionItemId], references: [id])
  drug             Drug             @relation(fields: [drugId], references: [id])
  lot              StockLot         @relation(fields: [lotId], references: [id])
}
```

### 5.9 InvoiceItem mở rộng

```prisma
// Thêm field vào InvoiceItem hiện có
model InvoiceItem {
  // ... existing fields ...
  itemType       String?  // CONSULTATION | LAB_TEST | MEDICINE | PROCEDURE | MATERIAL
  referenceType  String?  // SERVICE_ORDER | DISPENSE_ITEM | EXAM_FEE
  referenceId    String?
  // description, quantity, unitPrice, lineTotal đã có
}
```

---

## 6. API Endpoints Phase 2A

### Roles mới

```typescript
export const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  RECEPTIONIST: 'RECEPTIONIST',
  CASHIER: 'CASHIER',
  MANAGER: 'MANAGER',
  NURSE: 'NURSE',                  // mới
  LAB_TECHNICIAN: 'LAB_TECHNICIAN', // mới
  PHARMACIST: 'PHARMACIST',         // mới
} as const
```

### Departments & Rooms

```
GET    /departments                    ADMIN, MANAGER
POST   /departments                    ADMIN
PATCH  /departments/:id                ADMIN
GET    /departments/:id/rooms          ADMIN, MANAGER, RECEPTIONIST
POST   /rooms                          ADMIN
PATCH  /rooms/:id                      ADMIN
```

### Staff & Schedule

```
GET    /staff/doctors                  ALL authenticated
GET    /staff/schedules                ADMIN, MANAGER, RECEPTIONIST
POST   /staff/schedules                ADMIN, MANAGER
PATCH  /staff/schedules/:id            ADMIN, MANAGER
```

### Appointments

```
GET    /appointments                   ADMIN, RECEPTIONIST, DOCTOR, MANAGER
POST   /appointments                   ADMIN, RECEPTIONIST
GET    /appointments/:id               ADMIN, RECEPTIONIST, DOCTOR
PATCH  /appointments/:id/cancel        ADMIN, RECEPTIONIST
POST   /appointments/:id/check-in      ADMIN, RECEPTIONIST
```

**Business rules bắt buộc:**
- Không đặt lịch trùng cùng bác sĩ, cùng slot
- Không đặt lịch ngoài giờ làm việc của bác sĩ
- Check-in tạo Visit mới và QueueTicket
- Visit tạo từ appointment gắn `appointmentId`

### Queue

```
GET    /queues?departmentId=&date=     ADMIN, RECEPTIONIST, NURSE, DOCTOR, MANAGER
PATCH  /queues/:id/call                ADMIN, RECEPTIONIST, NURSE
PATCH  /queues/:id/complete            ADMIN, NURSE, DOCTOR
PATCH  /queues/:id/skip                ADMIN, RECEPTIONIST, NURSE
```

### Vital Signs

```
POST   /visits/:id/vital-signs         ADMIN, NURSE, DOCTOR
GET    /visits/:id/vital-signs         ADMIN, NURSE, DOCTOR, MANAGER
```

**Business rules:**
- Không tạo vital sign nếu visit CANCELLED
- BMI tự tính trong service
- Chỉ 1 record vital sign per visit (update nếu đã có)

### Services & Lab

```
GET    /services                       ALL authenticated
POST   /services                       ADMIN
PATCH  /services/:id                   ADMIN

POST   /examinations/:id/service-orders    ADMIN, DOCTOR
GET    /visits/:id/service-orders          ADMIN, DOCTOR, NURSE, CASHIER, MANAGER

GET    /lab/orders                     ADMIN, LAB_TECHNICIAN, DOCTOR, MANAGER
GET    /lab/orders/:id                 ADMIN, LAB_TECHNICIAN, DOCTOR
POST   /lab/orders/:id/collect-sample  ADMIN, LAB_TECHNICIAN
POST   /lab/orders/:id/results         ADMIN, LAB_TECHNICIAN
PATCH  /lab/orders/:id/verify          ADMIN, DOCTOR
GET    /examinations/:id/lab-results   ADMIN, DOCTOR, MANAGER
```

**Business rules:**
- Không nhập kết quả nếu lab order CANCELLED
- Doctor xem kết quả mọi lúc
- Technician không xem phiếu khám hoàn chỉnh

### Inventory

```
GET    /inventory/stock                ADMIN, PHARMACIST, MANAGER
POST   /inventory/stock-lots           ADMIN, PHARMACIST
GET    /inventory/movements            ADMIN, PHARMACIST, MANAGER
POST   /inventory/adjustments          ADMIN, PHARMACIST
```

### Pharmacy

```
GET    /pharmacy/prescriptions/pending ADMIN, PHARMACIST
GET    /pharmacy/prescriptions/:id     ADMIN, PHARMACIST
POST   /pharmacy/dispenses             ADMIN, PHARMACIST
PATCH  /pharmacy/dispenses/:id/cancel  ADMIN, PHARMACIST
```

**Business rules quan trọng — không được sai:**
- Trừ kho chỉ khi dược sĩ dispense, **KHÔNG trừ khi bác sĩ hoàn tất khám**
- Không dispense thuốc hết hạn (expiryDate < today)
- Không dispense quá `quantityOnHand`
- StockMovement OUT và Dispense tạo trong `$transaction`
- Xuất thuốc theo FEFO (First Expire, First Out)

### Billing mở rộng

```
GET    /visits?status=COMPLETED&hasInvoice=false   ADMIN, CASHIER
POST   /visits/:id/invoice                         ADMIN, CASHIER
GET    /invoices/:id                               ADMIN, CASHIER, MANAGER
POST   /invoices/:id/payments                      ADMIN, CASHIER
```

**Invoice item:** khi tạo invoice, system tự snapshot tất cả:
- Phí khám từ Examination
- Phí service orders (lab, thủ thuật)
- Thuốc từ Dispense đã hoàn tất

### Reports nâng cao

```
GET    /reports/monthly?month=YYYY-MM              ADMIN, MANAGER
GET    /reports/by-department?month=YYYY-MM        ADMIN, MANAGER
GET    /reports/lab-stats?month=YYYY-MM            ADMIN, MANAGER
GET    /inventory/low-stock?threshold=10           ADMIN, PHARMACIST, MANAGER
```

---

## 7. Business Rules — ĐÃ CHỐT

### Appointment

```
BR-P2-01: Không đặt lịch trùng slot bác sĩ (cùng doctorId, cùng scheduledAt ±15min)
BR-P2-02: Không đặt lịch ngoài StaffSchedule.startTime - endTime của bác sĩ hôm đó
BR-P2-03: Check-in appointment → tạo Visit với appointmentId, tạo QueueTicket priority=1
BR-P2-04: Walk-in → tạo Visit không có appointmentId, tạo QueueTicket priority=0
BR-P2-05: Không cancel appointment nếu đã check-in
```

### Queue

```
BR-P2-06: Queue number unique per department per date
BR-P2-07: Appointment priority (1) xếp trước walk-in (0) nếu cùng thời điểm check-in
BR-P2-08: Status transition: WAITING → CALLED → IN_SERVICE → DONE (không bỏ bước)
BR-P2-09: CALLED → SKIPPED nếu bệnh nhân không có mặt sau 2 lần gọi
```

### Vital Signs

```
BR-P2-10: BMI = weight_kg / (height_m)^2, làm tròn 1 chữ số thập phân
BR-P2-11: Không tạo vital sign nếu Visit.status = CANCELLED hoặc COMPLETED
BR-P2-12: Chỉ một VitalSign per Visit, update nếu đã tồn tại
```

### Lab

```
BR-P2-13: Chỉ DOCTOR hoặc ADMIN được tạo ServiceOrder/LabOrder
BR-P2-14: Status LabOrder: ORDERED → SAMPLE_COLLECTED → RESULT_ENTERED → VERIFIED
BR-P2-15: Không verify kết quả bởi chính người nhập
BR-P2-16: Không nhập kết quả nếu LabOrder.status = CANCELLED
BR-P2-17: Examination.complete() kiểm tra: nếu có lab order "required" chưa có kết quả thì báo warning (không block cứng nếu team chọn soft rule)
```

### Pharmacy & Inventory

```
BR-P2-18: Trừ kho KHI PHARMACIST DISPENSE, không phải khi bác sĩ kê đơn
BR-P2-19: Không dispense thuốc có expiryDate < today
BR-P2-20: Không dispense quá quantityOnHand của lot được chọn
BR-P2-21: Dispense + StockMovement phải trong $transaction
BR-P2-22: Chọn lot theo FEFO (expiry sớm nhất còn hàng)
BR-P2-23: Pharmacist chỉ dispense prescription từ examination đã COMPLETED
BR-P2-24: Inventory adjustment phải có reason
```

### Billing

```
BR-P2-25: Invoice bao gồm: exam fee + service orders + medicine từ dispense đã hoàn tất
BR-P2-26: InvoiceItem phải snapshot price tại thời điểm tạo invoice
BR-P2-27: Không edit invoice đã PAID
BR-P2-28: Payment amount không được vượt remaining (totalAmount - paidAmount)
```

---

## 8. Frontend cấu trúc Phase 2

### Pages mới cần thêm

```
frontend/src/features/
  departments/
    api.ts
    types.ts
    DepartmentPage.tsx

  appointments/
    api.ts
    types.ts
    AppointmentListPage.tsx
    AppointmentCreateDialog.tsx

  queues/
    api.ts
    types.ts
    QueuePage.tsx           ← real-time queue view

  vitals/
    api.ts
    types.ts
    VitalSignForm.tsx       ← embedded in visit detail

  lab/
    api.ts
    types.ts
    LabWorklistPage.tsx     ← for lab technician
    LabResultForm.tsx

  pharmacy/
    api.ts
    types.ts
    PrescriptionPendingPage.tsx
    DispenseForm.tsx

  inventory/
    api.ts
    types.ts
    StockPage.tsx
    StockImportForm.tsx
```

### Navigation mở rộng

Cập nhật `frontend/src/config/navigation.ts`:

```typescript
// Thêm vào navigationConfig
{
  title: 'Lịch hẹn',
  items: [
    { path: '/app/appointments', label: 'Danh sách lịch hẹn', icon: 'Calendar',
      roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'MANAGER'] },
    { path: '/app/queues', label: 'Hàng chờ', icon: 'List',
      roles: ['ADMIN', 'RECEPTIONIST', 'NURSE', 'DOCTOR'] },
  ]
},
{
  title: 'Cận lâm sàng',
  items: [
    { path: '/app/lab/worklist', label: 'Danh sách xét nghiệm', icon: 'Microscope',
      roles: ['ADMIN', 'LAB_TECHNICIAN', 'DOCTOR', 'MANAGER'] },
  ]
},
{
  title: 'Nhà thuốc & Kho',
  items: [
    { path: '/app/pharmacy/pending', label: 'Đơn chờ cấp phát', icon: 'Pill',
      roles: ['ADMIN', 'PHARMACIST'] },
    { path: '/app/inventory', label: 'Tồn kho thuốc', icon: 'Package',
      roles: ['ADMIN', 'PHARMACIST', 'MANAGER'] },
  ]
},
```

---

## 9. Quy tắc code Phase 2

### 9.1 Bắt buộc

```
✅ Tất cả route phải có @UseGuards(JwtAuthGuard, RolesGuard)
✅ Tất cả route phải có @Roles(...) cụ thể
✅ Business logic trong service, không trong controller
✅ Transaction bắt buộc cho: dispense, invoice create, queue ticket create, appointment check-in
✅ AuditService.log() cho mọi action create/update/delete trên entity lâm sàng
✅ DTO có đầy đủ @IsOptional(), @IsString(), @IsNumber() đúng với schema
✅ Frontend: mọi trang API-driven phải có loading/empty/error state
✅ Frontend: destructive action phải có ConfirmDialog
✅ npm run build && npm run lint phải pass sau mỗi task
```

### 9.2 Không được làm

```
❌ Không để raw error stack ra response
❌ Không trả passwordHash trong bất kỳ response nào
❌ Không tạo endpoint không có user story trong backlog
❌ Không dùng any trong TypeScript nếu biết type
❌ Không trừ kho khi bác sĩ kê đơn hoặc hoàn tất khám
❌ Không hard-code role string ở frontend, dùng ROLE_LABELS và config
❌ Không bỏ qua kiểm tra expiryDate khi dispense
❌ Không tạo controller mà không có guard
```

### 9.3 Pattern bắt buộc giữ nguyên từ Phase 1

```typescript
// Controller — luôn mỏng
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  @Post()
  @Roles(ROLES.ADMIN, ROLES.RECEPTIONIST)
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: { sub: string }) {
    return this.appointmentsService.create(dto, user.sub)
  }
}

// Service — chứa toàn bộ business logic
export class AppointmentsService {
  async create(dto: CreateAppointmentDto, createdById: string) {
    // Validate slot availability
    // Check doctor schedule
    // $transaction: create appointment
    // AuditService.log(...)
    return appointment
  }
}

// Dispense — bắt buộc dùng $transaction
async dispense(dto: CreateDispenseDto, dispensedById: string) {
  return this.prisma.$transaction(async (tx) => {
    // 1. Check prescription is COMPLETED
    // 2. Check lot availability and expiry
    // 3. Create Dispense + DispenseItems
    // 4. Create StockMovement OUT per item
    // 5. Update StockLot.quantityOnHand
    // 6. AuditService.log(...)
  })
}
```

---

## 10. Test Cases bắt buộc Phase 2

Với mỗi module, phải có test cho:

### Appointments

```
✅ Tạo appointment với slot hợp lệ → thành công
✅ Tạo appointment trùng slot bác sĩ → 409
✅ Tạo appointment ngoài giờ làm → 400
✅ Check-in appointment → tạo Visit + QueueTicket
✅ Cancel appointment đã check-in → 400
```

### Queue

```
✅ Queue number unique per department per date
✅ Appointment priority > walk-in
✅ Status transition WAITING → CALLED → IN_SERVICE → DONE
✅ Bỏ qua CALLED step → 400
```

### Vital Signs

```
✅ Tạo với height + weight → BMI tính đúng
✅ Tạo với visit CANCELLED → 400
✅ Tạo lần 2 → update (không tạo mới)
```

### Lab

```
✅ Doctor tạo lab order → thành công
✅ Technician nhập result → status đổi
✅ Nhập result của order CANCELLED → 400
✅ Doctor verify → verifiedById không phải người nhập → thành công
✅ Verify bởi chính người nhập → 400
```

### Dispense

```
✅ Pharmacist dispense đơn COMPLETED → thành công, tồn kho giảm
✅ Dispense thuốc hết hạn → 400
✅ Dispense quá tồn → 400
✅ Dispense đơn chưa COMPLETED → 400
✅ StockMovement được tạo cùng transaction
```

### RBAC

```
✅ NURSE không tạo invoice → 403
✅ PHARMACIST không sửa examination → 403
✅ LAB_TECHNICIAN không xem phiếu khám → 403
✅ CASHIER không tạo lab order → 403
```

---

## 11. Demo Script cuối Phase 2

Khi hoàn thành, demo theo đúng script này:

```
1. Login admin → vào Department Management
2. Tạo department "Nội khoa"
3. Tạo room "Phòng khám 1"
4. Tạo DoctorProfile cho user doctor
5. Tạo StaffSchedule cho doctor ngày hôm nay

6. Login receptionist → tạo Appointment cho bệnh nhân
7. Check-in appointment → tạo Visit + QueueTicket priority=1
8. Login receptionist → tạo walk-in visit khác → QueueTicket priority=0

9. Vào Queue page → thấy appointment xếp trước walk-in

10. Login nurse → nhập VitalSign cho bệnh nhân appointment
11. Login doctor → thấy queue, mở khám
12. Nhập triệu chứng, chỉ định xét nghiệm CBC
13. Xét nghiệm tạo ServiceOrder → LabOrder

14. Login lab_technician → thấy worklist
15. Mark sample collected
16. Nhập kết quả CBC
17. Login doctor → xem kết quả
18. Nhập chẩn đoán, kê đơn thuốc
19. Complete examination

20. Login pharmacist → thấy pending prescription
21. Import stock nếu chưa có thuốc
22. Dispense đơn → tồn kho giảm

23. Login cashier → thấy visit COMPLETED, tạo invoice
24. Invoice có: phí khám + xét nghiệm + thuốc
25. Ghi nhận thanh toán

26. Login manager → xem report tháng, thấy doanh thu
27. Login admin → xem audit log, thấy tất cả hành động đã được ghi
```

---

## 12. Lệnh hay dùng Phase 2

```bash
# Sau khi sửa schema
cd backend
npx prisma migrate dev --name "add_phase2_departments"
npx prisma generate
npx prisma db seed   # nếu seed được cập nhật

# Chạy tests
npm run test
npm run test:e2e

# Build check
npm run build
npm run lint

# Frontend
cd frontend
npm run build
npm run lint
```

---

## 13. Thứ tự đọc tài liệu trước khi code

1. `CLAUDE.md` — quy tắc chung của project
2. `CLAUDE_PHASE2.md` — file này (Phase 2 specific)
3. `docs/business/business-rules.md` — business rules Phase 1 vẫn còn hiệu lực
4. `docs/evaluation-report-2026-05-20.md` — danh sách debt cần fix
5. `backend/prisma/schema.prisma` — schema hiện tại trước khi add Phase 2 models
6. `frontend-docs/api-endpoint-inventory.md` — Phase 1 endpoints đã có

**Không được code Phase 2 module nếu chưa đọc section 5 (Data Model) và section 7 (Business Rules) trong file này.**
