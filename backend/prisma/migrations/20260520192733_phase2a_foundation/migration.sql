-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('SCHEDULED', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."QueueStatus" AS ENUM ('WAITING', 'CALLED', 'IN_SERVICE', 'DONE', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ServiceType" AS ENUM ('CONSULTATION', 'LAB_TEST', 'PROCEDURE', 'IMAGING', 'MATERIAL');

-- CreateEnum
CREATE TYPE "public"."DispenseStatus" AS ENUM ('PENDING', 'DISPENSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."StockMovementType" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."LabOrderStatus" AS ENUM ('ORDERED', 'SAMPLE_COLLECTED', 'RESULT_ENTERED', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ServiceOrderStatus" AS ENUM ('ORDERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."InvoiceItem" ADD COLUMN     "itemType" TEXT,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "referenceType" TEXT;

-- AlterTable
ALTER TABLE "public"."Visit" ADD COLUMN     "appointmentId" TEXT,
ADD COLUMN     "departmentId" TEXT;

-- CreateTable
CREATE TABLE "public"."Department" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Room" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "title" TEXT,
    "specialty" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "roomId" TEXT,
    "workDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 15,
    "maxAppointments" INTEGER NOT NULL DEFAULT 20,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "roomId" TEXT,
    "scheduleId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 15,
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "reason" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QueueTicket" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "queueDate" DATE NOT NULL,
    "queueNumber" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."QueueStatus" NOT NULL DEFAULT 'WAITING',
    "calledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueueTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VitalSign" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "measuredById" TEXT NOT NULL,
    "pulse" INTEGER,
    "systolicBp" INTEGER,
    "diastolicBp" INTEGER,
    "temperature" DECIMAL(4,1),
    "spo2" INTEGER,
    "heightCm" DECIMAL(5,1),
    "weightKg" DECIMAL(5,1),
    "bmi" DECIMAL(4,1),
    "note" TEXT,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VitalSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceCatalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ServiceType" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabTestCatalog" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "turnaroundHours" INTEGER NOT NULL DEFAULT 24,
    "referenceRange" TEXT,

    CONSTRAINT "LabTestCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceOrder" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "examinationId" TEXT,
    "serviceId" TEXT NOT NULL,
    "orderedById" TEXT NOT NULL,
    "status" "public"."ServiceOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "priceSnapshot" DECIMAL(12,2) NOT NULL,
    "billingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "orderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabOrder" (
    "id" TEXT NOT NULL,
    "serviceOrderId" TEXT NOT NULL,
    "labTestId" TEXT NOT NULL,
    "status" "public"."LabOrderStatus" NOT NULL DEFAULT 'ORDERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabSample" (
    "id" TEXT NOT NULL,
    "labOrderId" TEXT NOT NULL,
    "collectedById" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COLLECTED',
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LabResult" (
    "id" TEXT NOT NULL,
    "labOrderId" TEXT NOT NULL,
    "enteredById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "resultText" TEXT,
    "resultValue" DECIMAL(10,4),
    "unit" TEXT,
    "referenceRange" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RESULT_ENTERED',
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockLot" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "expiryDate" DATE NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(12,2),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StockMovement" (
    "id" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "movementType" "public"."StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dispense" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "dispensedById" TEXT NOT NULL,
    "status" "public"."DispenseStatus" NOT NULL DEFAULT 'PENDING',
    "dispensedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DispenseItem" (
    "id" TEXT NOT NULL,
    "dispenseId" TEXT NOT NULL,
    "prescriptionItemId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceSnapshot" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "public"."Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Room_departmentId_code_key" ON "public"."Room"("departmentId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorProfile_userId_key" ON "public"."DoctorProfile"("userId");

-- CreateIndex
CREATE INDEX "StaffSchedule_workDate_idx" ON "public"."StaffSchedule"("workDate");

-- CreateIndex
CREATE INDEX "StaffSchedule_userId_workDate_idx" ON "public"."StaffSchedule"("userId", "workDate");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "public"."Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_doctorProfileId_scheduledAt_idx" ON "public"."Appointment"("doctorProfileId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_departmentId_scheduledAt_idx" ON "public"."Appointment"("departmentId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "QueueTicket_visitId_key" ON "public"."QueueTicket"("visitId");

-- CreateIndex
CREATE INDEX "QueueTicket_departmentId_queueDate_status_idx" ON "public"."QueueTicket"("departmentId", "queueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QueueTicket_departmentId_queueDate_queueNumber_key" ON "public"."QueueTicket"("departmentId", "queueDate", "queueNumber");

-- CreateIndex
CREATE UNIQUE INDEX "VitalSign_visitId_key" ON "public"."VitalSign"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCatalog_code_key" ON "public"."ServiceCatalog"("code");

-- CreateIndex
CREATE INDEX "ServiceCatalog_type_isActive_idx" ON "public"."ServiceCatalog"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LabTestCatalog_serviceId_key" ON "public"."LabTestCatalog"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "LabTestCatalog_code_key" ON "public"."LabTestCatalog"("code");

-- CreateIndex
CREATE INDEX "ServiceOrder_visitId_idx" ON "public"."ServiceOrder"("visitId");

-- CreateIndex
CREATE INDEX "ServiceOrder_examinationId_idx" ON "public"."ServiceOrder"("examinationId");

-- CreateIndex
CREATE UNIQUE INDEX "LabOrder_serviceOrderId_key" ON "public"."LabOrder"("serviceOrderId");

-- CreateIndex
CREATE INDEX "StockLot_drugId_expiryDate_idx" ON "public"."StockLot"("drugId", "expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockLot_drugId_lotNumber_key" ON "public"."StockLot"("drugId", "lotNumber");

-- CreateIndex
CREATE INDEX "StockMovement_drugId_idx" ON "public"."StockMovement"("drugId");

-- CreateIndex
CREATE INDEX "StockMovement_lotId_idx" ON "public"."StockMovement"("lotId");

-- CreateIndex
CREATE INDEX "StockMovement_createdAt_idx" ON "public"."StockMovement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Dispense_prescriptionId_key" ON "public"."Dispense"("prescriptionId");

-- CreateIndex
CREATE INDEX "Dispense_visitId_idx" ON "public"."Dispense"("visitId");

-- CreateIndex
CREATE INDEX "Dispense_status_idx" ON "public"."Dispense"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DispenseItem_prescriptionItemId_key" ON "public"."DispenseItem"("prescriptionItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_appointmentId_key" ON "public"."Visit"("appointmentId");

-- AddForeignKey
ALTER TABLE "public"."Visit" ADD CONSTRAINT "Visit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Visit" ADD CONSTRAINT "Visit_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorProfile" ADD CONSTRAINT "DoctorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoctorProfile" ADD CONSTRAINT "DoctorProfile_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffSchedule" ADD CONSTRAINT "StaffSchedule_user_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffSchedule" ADD CONSTRAINT "StaffSchedule_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffSchedule" ADD CONSTRAINT "StaffSchedule_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffSchedule" ADD CONSTRAINT "StaffSchedule_doctorProfile_fkey" FOREIGN KEY ("userId") REFERENCES "public"."DoctorProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "public"."DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."StaffSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QueueTicket" ADD CONSTRAINT "QueueTicket_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QueueTicket" ADD CONSTRAINT "QueueTicket_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VitalSign" ADD CONSTRAINT "VitalSign_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VitalSign" ADD CONSTRAINT "VitalSign_measuredById_fkey" FOREIGN KEY ("measuredById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabTestCatalog" ADD CONSTRAINT "LabTestCatalog_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."ServiceCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceOrder" ADD CONSTRAINT "ServiceOrder_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceOrder" ADD CONSTRAINT "ServiceOrder_examinationId_fkey" FOREIGN KEY ("examinationId") REFERENCES "public"."Examination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceOrder" ADD CONSTRAINT "ServiceOrder_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."ServiceCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ServiceOrder" ADD CONSTRAINT "ServiceOrder_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabOrder" ADD CONSTRAINT "LabOrder_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "public"."ServiceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabOrder" ADD CONSTRAINT "LabOrder_labTestId_fkey" FOREIGN KEY ("labTestId") REFERENCES "public"."LabTestCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabSample" ADD CONSTRAINT "LabSample_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "public"."LabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabSample" ADD CONSTRAINT "LabSample_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabResult" ADD CONSTRAINT "LabResult_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "public"."LabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabResult" ADD CONSTRAINT "LabResult_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LabResult" ADD CONSTRAINT "LabResult_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockLot" ADD CONSTRAINT "StockLot_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "public"."Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "public"."Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."StockLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockMovement" ADD CONSTRAINT "StockMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dispense" ADD CONSTRAINT "Dispense_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "public"."Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dispense" ADD CONSTRAINT "Dispense_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Dispense" ADD CONSTRAINT "Dispense_dispensedById_fkey" FOREIGN KEY ("dispensedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DispenseItem" ADD CONSTRAINT "DispenseItem_dispenseId_fkey" FOREIGN KEY ("dispenseId") REFERENCES "public"."Dispense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DispenseItem" ADD CONSTRAINT "DispenseItem_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "public"."PrescriptionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DispenseItem" ADD CONSTRAINT "DispenseItem_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "public"."Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DispenseItem" ADD CONSTRAINT "DispenseItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "public"."StockLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

