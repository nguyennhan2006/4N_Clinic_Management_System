# Gemini Image Generation Prompts — UML Class Diagram
## 4N Clinic Management System — SE104

**Cách dùng:**
1. Mở **gemini.google.com** (hoặc Google AI Studio)
2. Copy toàn bộ nội dung trong block `=== PROMPT ===` ... `=== END ===`
3. Paste vào Gemini → nhấn Enter
4. Gemini sẽ sinh ảnh trực tiếp → Download PNG

**Lưu ý:** Mỗi prompt chỉ sinh 1 phần diagram. Sinh 10 ảnh riêng biệt,
đặt tên theo quy ước: CD_P01.png, CD_P02.png, ... CD_P10.png

---

## P01 — Identity & Access (User, Role, Permission)

=== PROMPT ===
Generate a high-resolution professional UML class diagram image on a clean white background.

The diagram shows 3 classes arranged horizontally from left to right:

BOX 1 — Class "User" (leftmost):
Header: dark blue (#1565C0), white text, label "User"
Body: light blue (#E3F2FD)
Attributes section:
  - id : String
  - username : String
  - fullName : String
  - email : String
  - status : UserStatus
Methods section:
  + lock() : void
  + unlock() : void
  + assignRoles() : void

BOX 2 — Class "Role" (center):
Header: dark blue (#1565C0), white text, label "Role"
Body: light blue (#E3F2FD)
Attributes:
  - id : String
  - code : String
  - name : String
Methods:
  + updatePermissions() : void

BOX 3 — Class "Permission" (rightmost):
Header: dark blue (#1565C0), white text, label "Permission"
Body: light blue (#E3F2FD)
Attributes:
  - id : String
  - code : String
  - name : String

ARROWS:
1. From User to Role: open arrowhead, label "assigned" above the line, multiplicity "0..*" near Role end, "1" near User end. Arrow goes left to right horizontally.
2. From Role to Permission: open arrowhead, label "grants" above the line, multiplicity "0..*" near Permission end, "1" near Role end. Arrow goes left to right horizontally.

STYLE:
- White background, no grid
- Each class box has a horizontal dividing line separating header from attributes, and another dividing line separating attributes from methods
- Attribute lines start with minus sign (-)
- Method lines start with plus sign (+)
- All text uses clean sans-serif font (Arial or Helvetica), 13pt
- Class name in header is bold 15pt
- Arrow lines are dark gray (#333333), 2px thick
- Labels on arrows are italic gray (#555555), 11pt
- Multiplicity labels are small black text, 10pt
- Rounded corners on class boxes (4px radius)
- Subtle drop shadow on each box
- Image size: 1200 x 500 pixels
- Section title at top: "2.1 — Identity & Access Management" in dark blue, bold 16pt
=== END ===

---

## P02 — Clinical Flow Chain (Patient → Visit → Examination)

=== PROMPT ===
Generate a high-resolution professional UML class diagram image on a clean white background.

The diagram shows the core clinical workflow with 4 classes. Layout: vertical chain in the center, User class floating to the right.

BOX 1 — Class "Patient" (top center):
Header: dark green (#2E7D32), white text, label "Patient"
Body: light green (#E8F5E9)
Attributes:
  - id : String
  - patientCode : String
  - fullName : String
  - dob : Date
  - gender : String
  - phone : String
Methods:
  + updateProfile() : void
  + getMedicalHistory() : List

BOX 2 — Class "Visit" (middle center, below Patient):
Header: dark green (#2E7D32), white text, label "Visit"
Body: light green (#E8F5E9)
Attributes:
  - id : String
  - visitDate : Date
  - queueNumber : Int
  - reason : String
  - status : VisitStatus
Methods:
  + cancel() : void
  + openExamination() : Examination

BOX 3 — Class "Examination" (bottom center, below Visit):
Header: dark green (#2E7D32), white text, label "Examination"
Body: light green (#E8F5E9)
Attributes:
  - id : String
  - symptoms : String
  - clinicalNotes : String
  - conclusion : String
  - status : ExaminationStatus
Methods:
  + update() : void
  + addDiagnosis() : void
  + upsertPrescription() : void
  + complete() : void

BOX 4 — Class "User" (right side, vertically centered between Visit and Examination):
Header: #546E7A (gray-blue), white text, label "User"
Body: #ECEFF1 (light gray)
Dashed border to indicate it is a shared entity
Attributes:
  - id : String
  - fullName : String
  - status : UserStatus

ARROWS:
1. Patient → Visit: solid line, open arrowhead pointing down, label "has", multiplicity "1" near Patient, "0..*" near Visit
2. Visit → Examination: solid line, open arrowhead pointing down, label "has", multiplicity "1" near Visit, "0..1" near Examination
3. User → Visit: solid line, open arrowhead, label "creates", dashed line style, multiplicity "1" near User, "0..*" near Visit. Arrow goes from the right side of User to the right side of Visit.
4. User → Examination: solid line, open arrowhead, label "performs", dashed line style. Arrow goes from the right side of User to the right side of Examination.

STYLE:
- White background, clean layout
- Arrows 1 and 2 are vertical, centered
- Arrows 3 and 4 are horizontal connecting from User on the right to the main chain on the left
- All arrows dark gray, 2px
- Sans-serif font, 13pt attributes, 15pt bold headers
- Subtle drop shadow on boxes
- Rounded corners 4px
- Image size: 900 x 1100 pixels
- Section title at top: "2.2 — Core Clinical Flow" in dark green, bold 16pt
=== END ===

---

## P03 — Examination Detail (Diagnosis + Prescription Chain)

=== PROMPT ===
Generate a high-resolution professional UML class diagram image on a clean white background.

The diagram shows how an Examination connects to its Diagnoses (linked to Disease catalog) and its Prescription (which contains PrescriptionItems referencing Drugs). Layout: left to right flow.

LAYOUT (left to right):
Column 1 (far left): "Examination" class
Column 2 (center-left): "Diagnosis" class (above), "Disease" class (below)
Column 3 (center-right): "Prescription" class
Column 4 (far right): "PrescriptionItem" class (above), "Drug" class (below)

BOX — Class "Examination" (far left, anchor):
Header: #1565C0 (deep blue), white text
Body: #E3F2FD
Attributes: - id : String  |  - status : ExaminationStatus
(Minimal, it is an anchor class)

BOX — Class "Diagnosis" (center-left, upper):
Header: #1565C0, white text
Body: #E3F2FD
Attributes:
  - id : String
  - name : String
  - isPrimary : Boolean

BOX — Class "Disease" (center-left, lower):
Header: #1565C0, white text
Body: #E3F2FD
Attributes:
  - id : String
  - code : String
  - name : String
  - isActive : Boolean
Methods:
  + activate() : void
  + deactivate() : void

BOX — Class "Prescription" (center-right):
Header: #1565C0, white text
Body: #E3F2FD
Attributes:
  - id : String
  - note : String
Methods:
  + replaceAllItems() : void
  + calculateTotal() : Decimal

BOX — Class "PrescriptionItem" (far right, upper):
Header: #1565C0, white text
Body: #E3F2FD
Attributes:
  - id : String
  - quantity : Int
  - dosage : String
  - unitPrice : Decimal
  - lineTotal : Decimal
Methods:
  + calculateLineTotal() : Decimal

BOX — Class "Drug" (far right, lower):
Header: #1565C0, white text
Body: #E3F2FD
Attributes:
  - id : String
  - name : String
  - unit : String
  - price : Decimal
  - isActive : Boolean
Methods:
  + activate() : void
  + deactivate() : void

ARROWS:
1. Examination → Prescription: open arrowhead, solid line, horizontal, label "has", "1" to "0..1"
2. Examination to Diagnosis: COMPOSITION arrow (filled black diamond at Examination end), label "contains", "1" to "0..*". Arrow goes from Examination right side down-right to Diagnosis.
3. Diagnosis → Disease: open arrowhead, solid line, vertical downward, label "classifies", "0..*" to "0..1"
4. Prescription to PrescriptionItem: COMPOSITION arrow (filled black diamond at Prescription end), label "contains", "1" to "1..*". Arrow goes from Prescription right side to PrescriptionItem.
5. PrescriptionItem → Drug: open arrowhead, solid line, vertical downward, label "references", "0..*" to "1"

STYLE:
- Composition arrows have filled black diamonds at the "whole" end
- All other arrows have simple open arrowheads
- White background, clean
- Sans-serif 13pt text, bold 15pt headers
- Drop shadow on boxes
- Image size: 1400 x 700 pixels
- Section title at top: "2.3 — Examination Detail: Diagnosis & Prescription" in deep blue, bold 16pt
=== END ===

---

## P04 — Financial Module (Invoice + Payment)

=== PROMPT ===
Generate a high-resolution professional UML class diagram image on a clean white background.

The diagram shows the financial module: Visit generates Invoice, Invoice contains InvoiceItems, Invoice is paid by Payments.

LAYOUT:
- Top-left: "Visit" class (anchor, dashed border)
- Center: "Invoice" class (main entity)
- Bottom-left of Invoice: "InvoiceItem" class
- Bottom-right of Invoice: "Payment" class

BOX — Class "Visit" (top-left, anchor):
Header: #607D8B (gray-blue), white text, dashed border
Body: #ECEFF1
Attributes: - id : String  |  - status : VisitStatus

BOX — Class "Invoice" (center, main):
Header: #E65100 (dark orange), white text
Body: #FFF3E0 (warm light orange)
Attributes:
  - id : String
  - totalAmount : Decimal
  - paidAmount : Decimal
  - status : InvoiceStatus
Methods:
  + issue() : void
  + voidInvoice() : void
  + getRemainingAmount() : Decimal

Small sticky-note shape attached to Invoice showing state flow text:
"DRAFT → ISSUED → PARTIALLY_PAID → PAID / VOID"
Note background: #FFFDE7, dashed yellow border

BOX — Class "InvoiceItem" (bottom-left):
Header: #E65100 (dark orange), white text
Body: #FFF3E0
Attributes:
  - id : String
  - description : String
  - quantity : Int
  - unitPrice : Decimal
  - lineTotal : Decimal
  - itemType : String
Methods:
  + calculateLineTotal() : Decimal

Small italic note below InvoiceItem: "price snapshot at invoice time"

BOX — Class "Payment" (bottom-right):
Header: #E65100 (dark orange), white text
Body: #FFF3E0
Attributes:
  - id : String
  - amount : Decimal
  - method : PaymentMethod
  - paidAt : Date
Methods:
  + confirm() : void

ARROWS:
1. Visit → Invoice: open arrowhead, solid line, label "billed_as", "1" to "0..1"
2. Invoice to InvoiceItem: COMPOSITION (filled black diamond at Invoice), label "contains", "1" to "1..*", arrow points downward-left
3. Invoice to Payment: COMPOSITION (filled black diamond at Invoice), label "paid_by", "1" to "0..*", arrow points downward-right

STYLE:
- White background, no grid
- Drop shadow on each class
- Note boxes are slightly tilted like sticky notes or use a folded corner
- Composition diamonds are solid black, clearly visible
- Image size: 1100 x 900 pixels
- Section title: "2.4 — Financial Module: Invoice & Payment" in dark orange, bold 16pt
=== END ===

---

## P05 — Configuration Module (Regulation)

=== PROMPT ===
Generate a high-resolution professional UML class diagram image on a clean white background.

The diagram is simple and compact: two classes side by side with a composition relationship.

BOX — Class "RegulationVersion" (left):
Header: #6A1B9A (dark purple), white text
Body: #F3E5F5 (light purple)
Attributes:
  - id : String
  - isActive : Boolean
  - activatedAt : Date
Methods:
  + activate() : void
  + getValue(key : String) : String

BOX — Class "RegulationItem" (right):
Header: #6A1B9A, white text
Body: #F3E5F5
Attributes:
  - id : String
  - key : String
  - value : String

Sticky note attached below RegulationVersion:
"Immutable once activated.
Create new version to update any rule.
Only one version is active at a time."
Note background: #EDE7F6, purple dashed border.

Sticky note attached below RegulationItem:
"Example keys:
MAX_PATIENTS_PER_DAY
CONSULTATION_FEE"
Note background: #EDE7F6, dashed border.

ARROW:
RegulationVersion to RegulationItem: COMPOSITION (filled black diamond at RegulationVersion end), horizontal arrow pointing right, label "contains", multiplicity "1" to "1..*"

STYLE:
- Centered layout, generous whitespace
- Clean drop shadow
- Purple theme throughout
- Image size: 1000 x 600 pixels
- Section title: "2.5 — Configuration: Regulation Version" in dark purple, bold 16pt
=== END ===

---

## P06 — Service Layer (Business Orchestrators)

=== PROMPT ===
Generate a high-resolution professional UML class diagram image on a clean white background.

The diagram shows 3 service classes on the LEFT side that have dependency arrows pointing to entity classes on the RIGHT side.

LEFT COLUMN — Service classes (pink/red theme):

BOX — Class "VisitsService":
Header: #B71C1C (dark red), white text
Body: #FFEBEE (light pink)
Methods only (no attributes):
  + create(dto, actorId) : Visit
  + findAll(query) : List
  + openExamination(id, actorId) : Examination
  - getActiveDailyCap() : Int
  - generateQueueNumber() : Int

BOX — Class "ExaminationsService" (below VisitsService):
Header: #B71C1C, white text
Body: #FFEBEE
Methods:
  + findOne(id) : Examination
  + update(id, dto) : Examination
  + upsertPrescription(id, items) : Prescription
  + complete(id, actorId) : Examination

BOX — Class "BillingService" (below ExaminationsService):
Header: #B71C1C, white text
Body: #FFEBEE
Methods:
  + createInvoiceFromVisit(visitId, actorId) : Invoice
  + findMany(query) : List
  + createPayment(invoiceId, dto, actorId) : Payment

RIGHT COLUMN — Entity reference classes (gray theme, dashed borders):

Show 6 small entity reference boxes stacked vertically on the right:
- "Visit", "Patient", "Examination", "Prescription", "Invoice", "Payment"
Each has: gray header (#546E7A), light gray body (#ECEFF1), dashed border
Each shows only the class name (no attributes or methods needed)

ARROWS (all are dependency arrows — dashed lines with open arrowhead):
1. VisitsService → Visit: label "manages"
2. VisitsService → Patient: label "reads"
3. VisitsService → Examination: label "creates"
4. ExaminationsService → Examination: label "manages"
5. ExaminationsService → Prescription: label "manages"
6. BillingService → Invoice: label "creates"
7. BillingService → Visit: label "validates"
8. BillingService → Payment: label "records"

IMPORTANT LAYOUT NOTE: All arrows must be horizontal from left service boxes to right entity boxes. No arrows should cross each other. Adjust vertical positioning of entity boxes to align with their connecting service.

STYLE:
- Clear left/right separation with a light vertical divider line between services and entities
- Service boxes are larger (more content), entity boxes are compact
- Dashed arrows for all dependency relationships
- Labels on arrows are small italic gray
- Image size: 1400 x 1000 pixels
- Section title: "2.6 — Service Layer: Business Logic Orchestrators" in dark red, bold 16pt
=== END ===

---

## P07 — Organization Module / Phase 2A

=== PROMPT ===
Generate a high-resolution professional UML class diagram image on a clean white background.

The diagram shows the clinic organization structure: Department contains Rooms, Department has DoctorProfiles, Doctors work on StaffSchedules, each DoctorProfile belongs to one User.

LAYOUT (top-down tree):
- "Department" at the top center
- "Room" at the bottom-left (child of Department)
- "DoctorProfile" at the bottom-center (child of Department)
- "StaffSchedule" at the bottom-right (connected to both Department and DoctorProfile)
- "User" small box to the far right of DoctorProfile (anchor)

BOX — Class "Department" (top center):
Header: #00695C (dark teal), white text
Body: #E0F2F1 (light teal)
Attributes:
  - id : String
  - code : String
  - name : String
  - isActive : Boolean
Methods:
  + activate() : void
  + deactivate() : void

BOX — Class "Room" (bottom-left):
Header: #00695C, white text
Body: #E0F2F1
Attributes:
  - id : String
  - code : String
  - name : String
  - roomType : String
  - isActive : Boolean

BOX — Class "DoctorProfile" (bottom-center):
Header: #00695C, white text
Body: #E0F2F1
Attributes:
  - id : String
  - title : String
  - specialty : String
  - isActive : Boolean
Methods:
  + updateProfile() : void

BOX — Class "StaffSchedule" (bottom-right):
Header: #00695C, white text
Body: #E0F2F1
Attributes:
  - id : String
  - workDate : Date
  - startTime : String
  - endTime : String
  - slotDurationMinutes : Int
  - maxAppointments : Int
Methods:
  + isAvailable() : Boolean

BOX — Class "User" (far right, small anchor):
Header: #546E7A (gray), white text, dashed border
Body: #ECEFF1 (light gray)
Attributes: - id : String  |  - fullName : String

ARROWS:
1. Department → Room: open arrowhead, label "contains", "1" to "0..*"
2. Department → DoctorProfile: open arrowhead, label "has", "1" to "0..*"
3. Department → StaffSchedule: open arrowhead, label "schedules", "1" to "0..*"
4. DoctorProfile → User: open arrowhead solid, label "belongs_to", "1" to "1"
5. DoctorProfile → StaffSchedule: open arrowhead, label "works", "1" to "0..*"

STYLE:
- Teal color theme
- Tree-like structure with Department as root
- Clean drop shadows
- Image size: 1300 x 900 pixels
- Section title: "3.1 — Organization Module" in dark teal, bold 16pt
=== END ===

---

## P08 — Appointment & Queue Module / Phase 2A

=== PROMPT ===
Generate a high-resolution professional UML class diagram image on a clean white background.

The diagram shows the appointment booking and queue management flow. Layout: left-to-right flow showing how a Patient books an Appointment, checks in to create a Visit, and gets a QueueTicket.

LAYOUT:
Left side: "Patient" and "DoctorProfile" (small anchor boxes, stacked vertically)
Center: "Appointment" (main class)
Right-center: "Visit" (small anchor)
Right: "QueueTicket" (main class)
Bottom: "Department" (small anchor, connected to QueueTicket)

BOX — Class "Patient" (top-left, anchor):
Header: #607D8B (gray), dashed border
Body: #ECEFF1
Attributes: - fullName : String

BOX — Class "DoctorProfile" (bottom-left, anchor):
Header: #607D8B, dashed border
Body: #ECEFF1
Attributes: - specialty : String

BOX — Class "Appointment" (center, main):
Header: #E65100 (dark orange), white text
Body: #FFF8E1 (warm yellow)
Attributes:
  - id : String
  - scheduledAt : DateTime
  - durationMinutes : Int
  - status : AppointmentStatus
  - reason : String
Methods:
  + checkIn() : Visit
  + cancel() : void
  + markNoShow() : void

Sticky note attached above Appointment:
"SCHEDULED → CHECKED_IN / CANCELLED / NO_SHOW"
Note style: light yellow, dashed border

BOX — Class "Visit" (right-center, small anchor):
Header: #607D8B, dashed border
Body: #ECEFF1
Attributes: - status : VisitStatus

BOX — Class "QueueTicket" (far right, main):
Header: #E65100, white text
Body: #FFF8E1
Attributes:
  - id : String
  - queueNumber : Int
  - queueDate : Date
  - priority : Int
  - status : QueueStatus
Methods:
  + call() : void
  + startService() : void
  + complete() : void
  + skip() : void

Sticky note attached to QueueTicket:
"priority: 1 = appointment
 priority: 0 = walk-in"
Note style: light yellow, dashed border

BOX — Class "Department" (bottom-right, small anchor):
Header: #607D8B, dashed border
Body: #ECEFF1
Attributes: - name : String

ARROWS:
1. Patient → Appointment: open arrowhead, label "books", "1" to "0..*"
2. DoctorProfile → Appointment: open arrowhead, label "receives", "1" to "0..*"
3. Appointment → Visit: open arrowhead, DASHED line (dependency), label "check_in_creates", "0..1" to "1"
4. Visit → QueueTicket: open arrowhead, solid line, label "has", "1" to "0..1"
5. Department → QueueTicket: open arrowhead, solid line, label "in", "1" to "0..*", arrow from bottom

STYLE:
- Warm orange/yellow palette for main classes
- Gray dashed borders for anchor classes
- Image size: 1400 x 800 pixels
- Section title: "3.2 — Appointment & Queue Module" in dark orange, bold 16pt
=== END ===

---

## P09 — Laboratory Workflow / Phase 2A

=== PROMPT ===
Generate a high-resolution professional UML class diagram image on a clean white background.

The diagram shows the laboratory workflow: Doctor orders a ServiceOrder that maps to a LabOrder, Lab Technician collects samples and enters results, Doctor reviews.

LAYOUT (left to right pipeline):
Far left: "Visit" and "Examination" anchors (small, stacked)
Center-left: "ServiceCatalog" (above) and "LabTestCatalog" (below)
Center: "ServiceOrder"
Center-right: "LabOrder"
Far right top: "LabSample"
Far right bottom: "LabResult"
Bottom-right: "User" anchor

BOX — "Visit" (top-left anchor, dashed):
Header: #546E7A, Body: #ECEFF1
Attributes: - status : VisitStatus

BOX — "Examination" (below Visit, dashed):
Header: #546E7A, Body: #ECEFF1
Attributes: - status : ExaminationStatus

BOX — "ServiceCatalog" (center-left, upper):
Header: #BF360C (dark red-amber), white text
Body: #FBE9E7
Attributes:
  - id : String
  - code : String
  - name : String
  - type : ServiceType
  - price : Decimal
  - isActive : Boolean

BOX — "LabTestCatalog" (center-left, lower, connected below ServiceCatalog):
Header: #BF360C, white text
Body: #FBE9E7
Attributes:
  - sampleType : String
  - turnaroundHours : Int
  - referenceRange : String

BOX — "ServiceOrder" (center):
Header: #BF360C, white text
Body: #FBE9E7
Attributes:
  - id : String
  - status : ServiceOrderStatus
  - isRequired : Boolean
  - priceSnapshot : Decimal
Methods:
  + order() : void
  + complete() : void
  + cancel() : void

BOX — "LabOrder" (center-right):
Header: #BF360C, white text
Body: #FBE9E7
Attributes:
  - id : String
  - status : LabOrderStatus
Methods:
  + collectSample() : void
  + enterResult() : void
  + review() : void

Sticky note on LabOrder:
"ORDERED → SAMPLE_COLLECTED
→ RESULT_ENTERED → REVIEWED"
Note: light amber background, dashed border

BOX — "LabSample" (far right upper):
Header: #BF360C, white text
Body: #FBE9E7
Attributes:
  - sampleType : String
  - collectedAt : DateTime
Methods:
  + collect() : void

BOX — "LabResult" (far right lower):
Header: #BF360C, white text
Body: #FBE9E7
Attributes:
  - resultText : String
  - resultValue : Decimal
  - unit : String
  - status : String
Methods:
  + enter() : void
  + review() : void

Sticky note on LabResult:
"Reviewer must be different from
the person who entered the result"
Note: light red (#FFCDD2), dashed red border

BOX — "User" (bottom-right, small anchor, dashed):
Header: #546E7A, Body: #ECEFF1
Attributes: - fullName : String

ARROWS:
1. Visit → ServiceOrder: open arrowhead, label "has", "1" to "0..*"
2. Examination → ServiceOrder: open arrowhead, label "ordered_in", "1" to "0..*"
3. ServiceCatalog → ServiceOrder: open arrowhead, label "catalog_ref", "1" to "0..*"
4. ServiceCatalog → LabTestCatalog: open arrowhead solid, label "lab_detail", "1" to "0..1" (vertical downward)
5. ServiceOrder → LabOrder: open arrowhead, label "creates", "1" to "0..1"
6. LabTestCatalog → LabOrder: open arrowhead, label "for", "1" to "0..*"
7. LabOrder → LabSample: open arrowhead, label "has", "1" to "0..*"
8. LabOrder → LabResult: open arrowhead, label "has", "1" to "0..*"
9. User → LabSample: dashed arrow, label "collected_by"
10. User → LabResult: dashed arrow, label "entered_by"

STYLE:
- Amber-red palette for core classes
- Dashed gray for anchor classes
- Notes clearly positioned without overlapping arrows
- Image size: 1600 x 900 pixels
- Section title: "3.3 — Laboratory Workflow" in dark red-amber, bold 16pt
=== END ===

---

## P10 — Pharmacy & Inventory Workflow / Phase 2A

=== PROMPT ===
Generate a high-resolution professional UML class diagram image on a clean white background.

The diagram shows the pharmacy and inventory workflow: FEFO lot selection, atomic stock deduction on dispense, and dispense reversal. Includes a critical highlighted business rule note.

LAYOUT:
Top row: "Drug" anchor (left), "StockLot" (center-left), "StockMovement" (center-right)
Middle row: "Prescription" anchor (left), "Dispense" (center)
Bottom row: "PrescriptionItem" anchor (left), "DispenseItem" (center)
Right side: "User" anchor

BOX — "Drug" (top-left, anchor, dashed):
Header: #546E7A, Body: #ECEFF1
Attributes: - name : String  |  - price : Decimal

BOX — "StockLot" (top-center):
Header: #4A148C (dark purple), white text
Body: #F3E5F5 (light purple)
Attributes:
  - id : String
  - lotNumber : String
  - expiryDate : Date
  - quantityOnHand : Int
  - unitCost : Decimal
Methods:
  + decrementStock(qty : Int) : void
  + incrementStock(qty : Int) : void
  + isExpired() : Boolean

Sticky note on StockLot:
"FEFO: First Expiry First Out
Select lot with nearest expiryDate"
Note: light purple background, dashed purple border

BOX — "StockMovement" (top-right):
Header: #4A148C, white text
Body: #F3E5F5
Attributes:
  - id : String
  - movementType : StockMovementType
  - quantity : Int
  - referenceType : String
Methods:
  + record() : void

BOX — "Prescription" (middle-left, anchor, dashed):
Header: #546E7A, Body: #ECEFF1
Attributes: - id : String  |  - note : String

BOX — "Dispense" (middle-center, main):
Header: #4A148C, white text
Body: #F3E5F5
Attributes:
  - id : String
  - status : DispenseStatus
  - dispensedAt : DateTime
Methods:
  + dispense() : void
  + reverse() : void

Sticky note on Dispense status:
"DISPENSED → REVERSED
(only before payment)"
Note: light purple, dashed border

BOX — "PrescriptionItem" (bottom-left, anchor, dashed):
Header: #546E7A, Body: #ECEFF1
Attributes: - quantity : Int  |  - unitPrice : Decimal

BOX — "DispenseItem" (bottom-center):
Header: #4A148C, white text
Body: #F3E5F5
Attributes:
  - id : String
  - quantity : Int
  - unitPriceSnapshot : Decimal
Methods:
  + fulfill() : void

BOX — "User" (right side, anchor, dashed):
Header: #546E7A, Body: #ECEFF1
Attributes: - fullName : String

CRITICAL BUSINESS RULE NOTE (large red box, prominent):
"IMPORTANT BUSINESS RULE:
Stock is deducted ONLY when Pharmacist performs Dispense.
NOT when Doctor writes Prescription.
NOT when Doctor completes Examination."
Note box: #FFCDD2 background, #B71C1C red border, bold red text, placed at the bottom center

ARROWS:
1. Drug → StockLot: open arrowhead, label "stored_in", "1" to "0..*"
2. StockLot → StockMovement: open arrowhead, label "tracked_by", "1" to "0..*"
3. Prescription → Dispense: open arrowhead, label "dispensed_as", "1" to "0..1"
4. Dispense to DispenseItem: COMPOSITION (filled black diamond at Dispense), label "contains", "1" to "1..*"
5. DispenseItem → StockLot: open arrowhead, dashed, label "from_lot FEFO", "0..*" to "1"
6. DispenseItem → PrescriptionItem: open arrowhead, label "fulfills", "0..*" to "1"
7. User → Dispense: dashed dependency arrow, label "dispensed_by"

STYLE:
- Purple palette for core pharmacy classes
- Gray dashed borders for anchor classes
- Critical rule note is visually prominent with red border
- Composition diamond is clearly filled black
- Image size: 1500 x 1100 pixels
- Section title: "3.4 — Pharmacy & Inventory Workflow" in dark purple, bold 16pt
=== END ===

---

## Lưu ý khi dùng các prompt này với Gemini

**Nếu ảnh sinh ra có text bị sai hoặc không rõ:**
Thêm vào cuối prompt: *"Make all text inside boxes perfectly legible, crisp black text, no blurring. Use exactly the class names, attribute names, and method names as specified."*

**Nếu các đường bị chồng lên nhau:**
Thêm: *"Ensure zero line crossings. Reroute any crossing arrows by adding elbows or waypoints. Every arrow must have a clear, unobstructed path."*

**Nếu muốn nền tối (dark mode):**
Thêm: *"Use dark theme: background #1E1E2E, class headers #7289DA, class body #2A2A3E, white text, arrows #CDD6F4"*

**Nếu muốn phong cách tối giản để in đen trắng:**
Thêm: *"Convert to black and white minimal style: white background, black borders, no color fill, black text, simple black arrows. Suitable for academic paper printing."*
