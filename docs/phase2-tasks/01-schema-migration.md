# Task 01 — Phase 2A Schema Migration

> Branch: `feat/phase2-schema`  
> Merge vào: `develop`  
> Phụ thuộc: Task 00 phải merged trước  
> Owner: Backend Architect (người sở hữu Prisma schema)  
> **Chỉ sửa schema và seed — không viết service/controller nào**

---

## Mục tiêu

Thêm toàn bộ model Phase 2A vào `schema.prisma` trong một migration duy nhất.  
Tất cả Phase 2 feature tasks (02–07) sẽ implement service/controller dựa trên schema này.

---

## Files được sửa

- `backend/prisma/schema.prisma` — thêm models và enums
- `backend/prisma/seed.ts` — thêm seed cho Department, Room, ServiceCatalog, LabTestCatalog
- Tạo migration: `npx prisma migrate dev --name "phase2a_foundation"`

**Không được sửa:** bất kỳ file `.ts` nào trong `src/`

---

## Enums mới — thêm vào cuối file

```prisma
enum AppointmentStatus {
  SCHEDULED
  CHECKED_IN
  CANCELLED
  NO_SHOW
}

enum QueueStatus {
  WAITING
  CALLED
  IN_SERVICE
  DONE
  SKIPPED
  CANCELLED
}

enum ServiceType {
  CONSULTATION
  LAB_TEST
  PROCEDURE
  IMAGING
  MATERIAL
}

enum DispenseStatus {
  PENDING
  DISPENSED
  CANCELLED
}

enum StockMovementType {
  IN
  OUT
  ADJUSTMENT
}

enum LabOrderStatus {
  ORDERED
  SAMPLE_COLLECTED
  RESULT_ENTERED
  VERIFIED
  CANCELLED
}

enum ServiceOrderStatus {
  ORDERED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

---

## Models mới

Thêm vào `schema.prisma` sau phần Clinical, trước phần Enums:

```prisma
// ─── Organization ──────────────────────────────────────────────────────────

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
}

model Room {
  id           String   @id @default(uuid())
  departmentId String
  code         String
  name         String
  roomType     String   // CONSULTATION | LAB | PHARMACY | PROCEDURE
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  department     Department      @relation(fields: [departmentId], references: [id])
  staffSchedules StaffSchedule[]
  appointments   Appointment[]

  @@unique([departmentId, code])
}

model DoctorProfile {
  id           String   @id @default(uuid())
  userId       String   @unique
  departmentId String
  title        String?
  specialty    String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user        User   @relation(fields: [userId], references: [id])
  department  Department @relation(fields: [departmentId], references: [id])
  schedules   StaffSchedule[]
  appointments Appointment[]
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
  status              String   @default("ACTIVE")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user          User           @relation(fields: [userId], references: [id])
  department    Department     @relation(fields: [departmentId], references: [id])
  room          Room?          @relation(fields: [roomId], references: [id])
  doctorProfile DoctorProfile? @relation(fields: [userId], references: [userId])
  appointments  Appointment[]

  @@index([workDate])
  @@index([userId, workDate])
}

model Appointment {
  id              String            @id @default(uuid())
  patientId       String
  doctorProfileId String
  departmentId    String
  roomId          String?
  scheduleId      String?
  scheduledAt     DateTime
  durationMinutes Int               @default(15)
  status          AppointmentStatus @default(SCHEDULED)
  reason          String?
  createdById     String
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  patient       Patient        @relation(fields: [patientId], references: [id])
  doctorProfile DoctorProfile  @relation(fields: [doctorProfileId], references: [id])
  department    Department     @relation(fields: [departmentId], references: [id])
  room          Room?          @relation(fields: [roomId], references: [id])
  schedule      StaffSchedule? @relation(fields: [scheduleId], references: [id])
  createdBy     User           @relation("AppointmentCreatedBy", fields: [createdById], references: [id])
  visit         Visit?         @relation("AppointmentVisit")

  @@index([patientId])
  @@index([doctorProfileId, scheduledAt])
  @@index([departmentId, scheduledAt])
}

model QueueTicket {
  id           String      @id @default(uuid())
  visitId      String      @unique
  departmentId String
  queueDate    DateTime    @db.Date
  queueNumber  Int
  priority     Int         @default(0)
  status       QueueStatus @default(WAITING)
  calledAt     DateTime?
  completedAt  DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  visit      Visit      @relation(fields: [visitId], references: [id])
  department Department @relation(fields: [departmentId], references: [id])

  @@unique([departmentId, queueDate, queueNumber])
  @@index([departmentId, queueDate, status])
}

model VitalSign {
  id           String   @id @default(uuid())
  visitId      String   @unique
  measuredById String
  pulse        Int?
  systolicBp   Int?
  diastolicBp  Int?
  temperature  Decimal? @db.Decimal(4, 1)
  spo2         Int?
  heightCm     Decimal? @db.Decimal(5, 1)
  weightKg     Decimal? @db.Decimal(5, 1)
  bmi          Decimal? @db.Decimal(4, 1)
  note         String?
  measuredAt   DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  visit      Visit @relation(fields: [visitId], references: [id])
  measuredBy User  @relation("VitalSignMeasuredBy", fields: [measuredById], references: [id])
}

// ─── Services & Lab ────────────────────────────────────────────────────────

model ServiceCatalog {
  id        String      @id @default(uuid())
  code      String      @unique
  name      String
  type      ServiceType
  price     Decimal     @db.Decimal(12, 2)
  isActive  Boolean     @default(true)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  serviceOrders ServiceOrder[]
  labTest       LabTestCatalog?

  @@index([type, isActive])
}

model LabTestCatalog {
  id              String   @id @default(uuid())
  serviceId       String   @unique
  code            String   @unique
  sampleType      String
  turnaroundHours Int      @default(24)
  referenceRange  String?

  service   ServiceCatalog @relation(fields: [serviceId], references: [id])
  labOrders LabOrder[]
}

model ServiceOrder {
  id            String             @id @default(uuid())
  visitId       String
  examinationId String?
  serviceId     String
  orderedById   String
  status        ServiceOrderStatus @default(ORDERED)
  isRequired    Boolean            @default(false)
  priceSnapshot Decimal            @db.Decimal(12, 2)
  billingStatus String             @default("PENDING")
  orderedAt     DateTime           @default(now())
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  visit       Visit          @relation(fields: [visitId], references: [id])
  examination Examination?   @relation(fields: [examinationId], references: [id])
  service     ServiceCatalog @relation(fields: [serviceId], references: [id])
  orderedBy   User           @relation("ServiceOrderedBy", fields: [orderedById], references: [id])
  labOrder    LabOrder?

  @@index([visitId])
  @@index([examinationId])
}

model LabOrder {
  id             String         @id @default(uuid())
  serviceOrderId String         @unique
  labTestId      String
  status         LabOrderStatus @default(ORDERED)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

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
  status        String   @default("COLLECTED")
  collectedAt   DateTime @default(now())
  note          String?
  createdAt     DateTime @default(now())

  labOrder    LabOrder @relation(fields: [labOrderId], references: [id])
  collectedBy User     @relation("LabSampleCollectedBy", fields: [collectedById], references: [id])
}

model LabResult {
  id             String    @id @default(uuid())
  labOrderId     String
  enteredById    String
  verifiedById   String?
  resultText     String?
  resultValue    Decimal?  @db.Decimal(10, 4)
  unit           String?
  referenceRange String?
  status         String    @default("RESULT_ENTERED")
  enteredAt      DateTime  @default(now())
  verifiedAt     DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  labOrder   LabOrder @relation(fields: [labOrderId], references: [id])
  enteredBy  User     @relation("LabResultEnteredBy", fields: [enteredById], references: [id])
  verifiedBy User?    @relation("LabResultVerifiedBy", fields: [verifiedById], references: [id])
}

// ─── Pharmacy & Inventory ─────────────────────────────────────────────────

model StockLot {
  id             String    @id @default(uuid())
  drugId         String
  lotNumber      String
  expiryDate     DateTime  @db.Date
  quantityOnHand Int       @default(0)
  unitCost       Decimal?  @db.Decimal(12, 2)
  receivedAt     DateTime  @default(now())
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  drug      Drug            @relation(fields: [drugId], references: [id])
  movements StockMovement[]
  dispenseItems DispenseItem[]

  @@unique([drugId, lotNumber])
  @@index([drugId, expiryDate])
}

model StockMovement {
  id            String            @id @default(uuid())
  drugId        String
  lotId         String
  movementType  StockMovementType
  quantity      Int
  referenceType String?
  referenceId   String?
  note          String?
  createdById   String
  createdAt     DateTime          @default(now())

  drug      Drug      @relation(fields: [drugId], references: [id])
  lot       StockLot  @relation(fields: [lotId], references: [id])
  createdBy User      @relation("StockMovementCreatedBy", fields: [createdById], references: [id])

  @@index([drugId])
  @@index([lotId])
  @@index([createdAt])
}

model Dispense {
  id             String         @id @default(uuid())
  prescriptionId String         @unique
  visitId        String
  dispensedById  String
  status         DispenseStatus @default(PENDING)
  dispensedAt    DateTime?
  note           String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  prescription Prescription  @relation(fields: [prescriptionId], references: [id])
  visit        Visit         @relation(fields: [visitId], references: [id])
  dispensedBy  User          @relation("DispensedBy", fields: [dispensedById], references: [id])
  items        DispenseItem[]

  @@index([visitId])
  @@index([status])
}

model DispenseItem {
  id                 String   @id @default(uuid())
  dispenseId         String
  prescriptionItemId String   @unique
  drugId             String
  lotId              String
  quantity           Int
  unitPriceSnapshot  Decimal  @db.Decimal(12, 2)
  createdAt          DateTime @default(now())

  dispense         Dispense         @relation(fields: [dispenseId], references: [id], onDelete: Cascade)
  prescriptionItem PrescriptionItem @relation(fields: [prescriptionItemId], references: [id])
  drug             Drug             @relation(fields: [drugId], references: [id])
  lot              StockLot         @relation(fields: [lotId], references: [id])
}
```

---

## Models hiện có cần sửa (back-fill fields)

```prisma
// Visit — thêm 3 fields
model Visit {
  // ... existing fields ...
  departmentId    String?   // nullable — walk-in có thể không biết khoa
  appointmentId   String?   @unique  // nullable — walk-in không có appointment

  department  Department?  @relation(fields: [departmentId], references: [id])
  appointment Appointment? @relation("AppointmentVisit", fields: [appointmentId], references: [id])
  queueTicket QueueTicket?
  vitalSign   VitalSign?
  serviceOrders ServiceOrder[]
  dispenses   Dispense[]
}

// Examination — thêm relation
model Examination {
  // ... existing fields ...
  serviceOrders ServiceOrder[]
}

// Drug — thêm relations
model Drug {
  // ... existing fields ...
  stockLots     StockLot[]
  stockMovements StockMovement[]
  dispenseItems  DispenseItem[]
}

// Prescription — thêm relation
model Prescription {
  // ... existing fields ...
  dispense Dispense?
}

// PrescriptionItem — thêm relation
model PrescriptionItem {
  // ... existing fields ...
  dispenseItem DispenseItem?
}

// User — thêm relations
model User {
  // ... existing fields ...
  doctorProfile   DoctorProfile?
  staffSchedules  StaffSchedule[]
  createdAppointments Appointment[] @relation("AppointmentCreatedBy")
  measuredVitals  VitalSign[]    @relation("VitalSignMeasuredBy")
  orderedServices ServiceOrder[] @relation("ServiceOrderedBy")
  collectedSamples LabSample[]   @relation("LabSampleCollectedBy")
  enteredLabResults LabResult[]  @relation("LabResultEnteredBy")
  verifiedLabResults LabResult[] @relation("LabResultVerifiedBy")
  stockMovements  StockMovement[] @relation("StockMovementCreatedBy")
  dispenses       Dispense[]     @relation("DispensedBy")
}

// InvoiceItem — thêm fields tracking
model InvoiceItem {
  // ... existing fields ...
  itemType      String?   // CONSULTATION | LAB_TEST | MEDICINE | PROCEDURE | MATERIAL
  referenceType String?   // SERVICE_ORDER | DISPENSE_ITEM | EXAM_FEE
  referenceId   String?
}
```

---

## Seed Phase 2 cần thêm

```typescript
// Thêm vào seed.ts sau phần drugs

// 1. Departments
const departments = [
  { code: 'GENERAL', name: 'Nội khoa tổng quát' },
  { code: 'LAB', name: 'Xét nghiệm' },
  { code: 'PHARMACY', name: 'Nhà thuốc' },
]

// 2. Rooms
// Room LAB-01 thuộc department LAB
// Room CONS-01 thuộc department GENERAL
// Room PHARM-01 thuộc department PHARMACY

// 3. DoctorProfile cho user doctor
// departmentId = GENERAL department

// 4. ServiceCatalog
const services = [
  { code: 'CBC', name: 'Công thức máu toàn phần', type: 'LAB_TEST', price: 80000 },
  { code: 'URINE', name: 'Tổng phân tích nước tiểu', type: 'LAB_TEST', price: 60000 },
  { code: 'CONSULT', name: 'Phí khám bệnh', type: 'CONSULTATION', price: 150000 },
]

// 5. LabTestCatalog cho CBC và URINE
// CBC: sampleType BLOOD, turnaround 4h
// URINE: sampleType URINE, turnaround 2h

// 6. StockLot cho các drugs đã seed
// Mỗi drug: 1 lot, số lượng 100, expiry 2027-12-31
```

---

## Kiểm tra sau migration

```bash
cd backend

# Chạy migration
npx prisma migrate dev --name "phase2a_foundation"

# Generate client
npx prisma generate

# Seed
npx prisma db seed

# Build phải pass (schema compile đúng)
npm run build

# Kiểm tra Prisma Studio — xem các model mới
npx prisma studio
```

**Không có test service/controller trong task này** — chỉ kiểm tra schema compile và seed thành công.

## Definition of Done

```
☐ Migration chạy không lỗi
☐ npx prisma generate không có warning
☐ Tất cả model mới xuất hiện trong Prisma Studio
☐ Seed tạo departments, rooms, doctor profile, service catalog, stock lots
☐ npm run build PASS
☐ Visit model có 3 fields mới: departmentId, appointmentId, queueTicket relation
☐ User model có đủ relations mới
☐ QueueTicket unique: [departmentId, queueDate, queueNumber] — không dùng createdAt
```
