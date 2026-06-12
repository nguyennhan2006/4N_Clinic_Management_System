# A4 — Proposed Document Outline and Diagram Plan

**Mục tiêu:** Phác thảo cấu trúc tài liệu final và các diagram cần tạo  
**Lưu ý:** Outline này dựa trên evidence đã audit; chưa phải final document

---

## 1. Package Structure

```text
docs/software-design-workspace/final-output/
├── 00_READ_FIRST/
│   ├── HUONG_DAN_DOC_VA_DOI_CHIEU.md
│   ├── Source_Register_and_Trust_Level.md    ← từ A0
│   ├── Conflict_Debt_OpenQuestion_Log.md      ← từ A3
│   └── Glossary.md
├── 01_PHASE1_AS_BUILT/
│   ├── 4N_Clinic_SDD_Phase1_AsBuilt_Verified.md      ← main doc
│   ├── P1_Data_Module_API_RBAC.md
│   └── P1_Test_Traceability_and_Debt.md
├── 02_PHASE2A_TARGET_DESIGN/
│   ├── 4N_Clinic_SDD_Phase2A_Target_Design.md        ← main doc
│   ├── P2A_Data_Design_and_Migration.md
│   ├── P2A_Module_API_RBAC_and_UI.md
│   ├── P2A_State_Workflow_Transaction.md
│   └── P2A_Test_Acceptance_and_Roadmap.md
├── 03_GOVERNANCE/
│   ├── Security_Privacy_Audit_Backup.md
│   ├── ADR_Register.md
│   └── Master_Traceability_Matrix.csv
└── 04_DIAGRAM_SOURCES/
    ├── P1_C4_and_ERD.mmd
    └── P2A_C4_ERD_State_Sequences.mmd
```

---

## 2. Phase 1 Main Document — Outline

**File:** `4N_Clinic_SDD_Phase1_AsBuilt_Verified.md`  
**Label:** `IMPLEMENTED-VERIFIED (working tree, pre-commit; Phase 2A schema present but unimplemented)`

| Section | Nội dung | Source |
|---|---|---|
| 1. Document Control | Branch, commit, scope, caveats | A0 |
| 2. System Context | C4 Level 1: Browser → React SPA → NestJS API → PostgreSQL | Codebase |
| 3. Container Architecture | C4 Level 2: SPA, API Server, DB, Auth flow | Codebase |
| 4. Module Overview | 14 modules, responsibilities | A1 §1 |
| 5. UC Coverage | UC01-UC20 status | A1 §5.2 |
| 6. API Inventory | All 37 endpoints + method/path/roles | A1 §2.2 |
| 7. RBAC Matrix | Role × Route | A1 §2.2 |
| 8. Data Model | Phase 1 entities, relations, constraints | schema.prisma |
| 9. State Machines | Visit, Examination, Invoice, Payment | services + enums |
| 10. Transaction Boundaries | 6 atomic operations | A1 §3.1 |
| 11. Audit Coverage | 8 logged actions | A1 §3.3 |
| 12. Security Design | JWT, token hash, RBAC, no passwordHash exposure | A1 §2.3, §2.4 |
| 13. Frontend Architecture | Routes, RBAC guards, UX states | A1 §5 |
| 14. Technical Debt | TD-001..009 | A3 §2 |
| 15. Build Evidence | Build/lint/test results | A1 §7 |

---

## 3. Phase 2A Main Document — Outline

**File:** `4N_Clinic_SDD_Phase2A_Target_Design.md`  
**Label:** `PROPOSED-APPROVED per Decision Baseline v2.0`  
**Prerequisite:** CF-001..009 schema corrections must be resolved before implementation

| Section | Nội dung | Source |
|---|---|---|
| 1. Document Control | Authority, scope, relationship to Phase 1 | Baseline v2.0 |
| 2. Business Motivation | Why Phase 2A — large clinic workflow | Baseline B.1 |
| 3. Phase 1→Phase 2A Delta | What changes, what stays | A1 + Baseline |
| 4. Scope In/Out | B.1 / B.2 tables | Baseline |
| 5. Actors & Roles | 8 roles + responsibilities | Baseline D-P2-001 |
| 6. Architecture | Modular Monolith, single site | Baseline ADR-P2A-001 |
| 7. Organization Design | Department, Room, DoctorProfile, StaffSchedule | Baseline D-P2-007, D-P2-013 |
| 8. Appointment & Queue | Appointment → Check-in → Visit + QueueTicket | Baseline D-P2-002, D-P2-008 |
| 9. Nursing / VitalSign | One per visit, BMI server-side | Baseline D-P2-013 |
| 10. Clinical Extension | ServiceOrder, isRequiredForCompletion | Baseline D-P2-009 |
| 11. Laboratory | LabOrder/Sample/Result, REVIEWED state | Baseline D-P2-009, D-P2-010 |
| 12. Pharmacy & Inventory | StockLot, FEFO, Dispense, Reversal | Baseline D-P2-004, D-P2-011 |
| 13. Billing Extension | Multi-item invoice from dispense | Baseline D-P2-005, D-P2-012 |
| 14. State Machines | 7 canonical state machines | Baseline D-P2-009 |
| 15. Data Design & Migration | Schema corrections, backfill, rollback | A2 + CF log |
| 16. API Contract | New endpoints per module | Baseline + module design |
| 17. RBAC Matrix Phase 2A | New roles + existing roles | Baseline D-P2-001, D-P2-014 |
| 18. Security & Privacy | Access rules, audit events, no hard-delete | Baseline D-P2-014 |
| 19. Test & Acceptance | E2E scenarios, RBAC tests, concurrency | Execution guide §6 |
| 20. 4-person 20-day Roadmap | Sprint 0-4 | Execution guide §4 |
| 21. Gate I0 Inherited Debt | CF-001..009 + TD-005/006 | A3 |
| 22. Traceability | Goal→UC→Rule→Module→API→Table→UI→Test | Cross-reference |

---

## 4. Diagrams Required

### Phase 1 Diagrams

| Diagram | Type | Content | Tool |
|---|---|---|---|
| C4-P1-01 | System Context | Browser → SPA → NestJS → PostgreSQL; JWT auth | Mermaid C4 |
| C4-P1-02 | Container | React SPA, NestJS API, PostgreSQL DB | Mermaid C4 |
| C4-P1-03 | Component (Backend) | 14 modules + PrismaModule | Mermaid |
| ERD-P1-01 | Phase 1 Entity-Relationship | 20 entities, key relations | Mermaid ERD |
| SM-P1-01 | Visit state machine | REGISTERED→WAITING→IN_EXAMINATION→COMPLETED/CANCELLED | Mermaid stateDiagram |
| SM-P1-02 | Examination state machine | OPEN→COMPLETED/CANCELLED | Mermaid stateDiagram |
| SM-P1-03 | Invoice state machine | DRAFT→ISSUED→PARTIALLY_PAID→PAID / VOID | Mermaid stateDiagram |
| SEQ-P1-01 | Visit creation sequence | Receptionist → API → DB → Queue number | Mermaid sequence |
| SEQ-P1-02 | Exam + Invoice sequence | Doctor → complete → cashier → invoice → payment | Mermaid sequence |

### Phase 2A Diagrams

| Diagram | Type | Content | Tool |
|---|---|---|---|
| C4-P2-01 | System Context | Same topology + new roles | Mermaid C4 |
| C4-P2-02 | Container | Same + new modules | Mermaid C4 |
| C4-P2-03 | Component (Backend) | 14 + ~6 new modules | Mermaid |
| ERD-P2-01 | Phase 2A ERD delta | New entities + Visit delta | Mermaid ERD |
| SM-P2-01 | Appointment state machine | SCHEDULED→CHECKED_IN/CANCELLED/NO_SHOW | Mermaid |
| SM-P2-02 | QueueTicket state machine | WAITING→CALLED→IN_SERVICE→DONE / SKIPPED / CANCELLED | Mermaid |
| SM-P2-03 | ServiceOrder state machine | ORDERED→IN_PROGRESS→COMPLETED / CANCELLED | Mermaid |
| SM-P2-04 | LabOrder state machine | ORDERED→SAMPLE_COLLECTED→RESULT_ENTERED→REVIEWED / CANCELLED | Mermaid |
| SM-P2-05 | Dispense state machine | DISPENSED→REVERSED | Mermaid |
| SM-P2-06 | Invoice Phase 2A | ISSUED→PARTIALLY_PAID→PAID / VOID | Mermaid |
| SEQ-P2-01 | Appointment → Exam flow | Receptionist→Check-in→Queue→Nurse→Doctor | Mermaid |
| SEQ-P2-02 | Lab order → Result → Review | Doctor→Order→Tech→Result→Doctor Review | Mermaid |
| SEQ-P2-03 | Dispense + Stock | Pharmacist→Dispense→FEFO→Stock OUT atomic | Mermaid |
| SEQ-P2-04 | Multi-item Invoice | Cashier→services+dispense→invoice→payment | Mermaid |
| MIG-P2-01 | Migration plan | Phase 1 schema → corrections → Phase 2A full | Table/diagram |

---

## 5. Traceability Matrix Columns

```csv
Goal, UC/FR, Business Rule, Module, API Endpoint, DB Table, Frontend Page/Component, Test Scenario, Status
```

Key rows to populate:
- UC01-UC20 (Phase 1)
- Phase 2A: Organization, Appointment, Queue, VitalSign, ServiceOrder, Lab, Dispense, Inventory, MultiInvoice, AuditUI, Reports
