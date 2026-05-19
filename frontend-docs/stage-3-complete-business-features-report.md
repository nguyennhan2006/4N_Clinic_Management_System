# Stage 3 — Complete Business Features UC4–UC20

## Build / Lint

| Check | Result | Notes |
|---|---|---|
| `npm run lint` | **PASS** | 2 unused-import errors fixed: `Plus` in ExaminationPage, `formatDateTime` in MedicalHistoryPage |
| `npm run build` | **PASS** | 1950 modules transformed. Chunk size advisory (557 kB) — not an error |
| TypeScript (`tsc -b`) | **PASS** | No type errors |

---

## Features Implemented

| UC | Feature | Status | Notes |
|---|---|---|---|
| UC4 | Tra cứu bệnh nhân | ✅ | Search by name / phone / CCCD; filtered table with pagination footer |
| UC5 | Tạo hồ sơ bệnh nhân | ✅ | Full form with react-hook-form + zod; gender/DOB/address |
| UC5 | Chi tiết bệnh nhân | ✅ | Detail card + links to medical history and visit creation |
| UC6 | Tiếp nhận bệnh nhân | ✅ | Visit creation from patient context; date defaults to today |
| UC7 | Tạo lượt khám | ✅ | Patient search → visit create; queue number displayed |
| UC8 | Xem danh sách khám | ✅ | Date + status filter; status badges; queue number column |
| UC9 | Mở lượt khám | ✅ | PATCH /visits/:id/open from visit list (DOCTOR/ADMIN only) |
| UC10 | Lập phiếu khám | ✅ | Symptoms, blood pressure, temperature, weight, notes |
| UC11 | Xem lịch sử khám | ✅ | Timeline of completed exams per patient; expandable detail cards |
| UC12 | Kê đơn thuốc | ✅ | Drug search from active catalog; quantity + dosage; add/remove items |
| UC13 | Hoàn tất phiếu khám | ✅ | Complete button (DOCTOR/ADMIN); read-only after COMPLETED status |
| UC14 | Lập hóa đơn | ✅ | POST /visits/:id/invoice from visit detail (CASHIER/ADMIN) |
| UC15 | Ghi nhận thanh toán | ✅ | Payment dialog; amount ≤ remaining; method selector; partial pay tracking |
| UC16 | Tra cứu hóa đơn | ✅ | Filter by status/date; invoice list → detail page |
| UC17 | Thay đổi quy định | ✅ | Current regulation display; create new version; activate with confirm |
| UC18 | Quản lý danh mục bệnh | ✅ | List/search; create (ADMIN); inline edit name; toggle active |
| UC19 | Quản lý danh mục thuốc | ✅ | List/search; create (ADMIN); inline edit name/unit/price; toggle active |
| UC20 | Xem báo cáo tháng | ✅ | Month picker; summary cards; visit breakdown bars; revenue breakdown |

---

## API Endpoints Used

| Feature | Method | Path | Screen |
|---|---|---|---|
| Patients | GET | /patients | PatientListPage |
| Patients | POST | /patients | PatientCreatePage |
| Patients | GET | /patients/:id | PatientDetailPage |
| Medical History | GET | /patients/:id/medical-history | MedicalHistoryPage |
| Visits | GET | /visits | VisitListPage |
| Visits | POST | /visits | VisitCreatePage |
| Visits | PATCH | /visits/:id/open | VisitListPage (open action) |
| Examinations | GET | /examinations/:visitId | ExaminationPage |
| Examinations | PATCH | /examinations/:id/diagnosis | ExaminationPage |
| Examinations | PUT | /examinations/:id/prescription | ExaminationPage |
| Examinations | DELETE | /examinations/:id/prescription | ExaminationPage |
| Examinations | POST | /examinations/:id/complete | ExaminationPage |
| Invoices | GET | /invoices | InvoiceListPage |
| Invoices | GET | /invoices/:id | InvoiceDetailPage |
| Invoices | POST | /visits/:id/invoice | VisitListPage / InvoiceListPage |
| Payments | POST | /invoices/:id/payments | InvoiceDetailPage |
| Diseases | GET | /diseases | DiseaseCatalogPage + ExaminationPage |
| Diseases | POST | /diseases | DiseaseCatalogPage |
| Diseases | PATCH | /diseases/:id | DiseaseCatalogPage |
| Drugs | GET | /drugs | MedicineCatalogPage + ExaminationPage |
| Drugs | POST | /drugs | MedicineCatalogPage |
| Drugs | PATCH | /drugs/:id | MedicineCatalogPage |
| Regulations | GET | /regulations/current | RegulationPage |
| Regulations | POST | /regulations | RegulationPage |
| Regulations | PUT | /regulations/:id/activate | RegulationPage |
| Reports | GET | /reports/monthly | MonthlyReportPage |

All endpoints verified against `api-endpoint-inventory.md`. No invented endpoints used.

---

## Backend Limitations / Workarounds

| Issue | Impact | Workaround |
|---|---|---|
| GET /visits/:id missing | No standalone visit detail page | `/app/visits/:id` route exists as placeholder only; no API call |
| PATCH /visits/:id/status missing | Cannot cancel/reschedule a visit | Status change actions hidden in UI |
| UsersController missing @UseGuards | Security gap | UserManagementPage shows warning banner; no API calls made |
| PATCH /users/:id/status missing | Cannot deactivate users | Not implemented |
| PrescriptionsController endpoints (POST/GET /prescriptions) | Potential security gap | Prescriptions managed via ExaminationsController (/examinations/:id/prescription) which is guarded |
| GET /visits/queue/:date ambiguous | Unclear response shape | Not used; visit list (GET /visits) used with date filter instead |

---

## Role-Based UI Implemented

| Role | Accessible Features |
|---|---|
| ADMIN | All screens including users (blocked pending backend fix), regulations, catalogs, reports |
| RECEPTIONIST | Patients, Visits (create + list) |
| DOCTOR | Visits (list + open), Examinations (full form), Medical History |
| CASHIER | Invoices (list + detail), Payment recording |
| MANAGER | Reports, Disease catalog (read-only), Medicine catalog (read-only), Regulations (read-only) |

Action-level guards:
- "Thêm bệnh" / "Thêm thuốc" / "Tạo phiên bản mới" → ADMIN only
- "Lưu chẩn đoán" / "Lưu đơn thuốc" / "Hoàn tất khám" → DOCTOR + ADMIN only
- "Ghi nhận thanh toán" → CASHIER + ADMIN only
- "Kích hoạt" regulation → ADMIN only

---

## UX States Implemented

| State | Screens |
|---|---|
| Loading (spinner / skeleton rows) | All list pages, all detail pages |
| Empty state | PatientList, VisitList, InvoiceList, DiseaseCatalog, MedicineCatalog, MedicalHistory |
| Error state with retry | All API-driven screens |
| Form validation errors | PatientCreate, VisitCreate, ExaminationPage, PaymentDialog, RegulationPage, DiseaseCatalog, MedicineCatalog |
| Business conflict messages | Duplicate visit (409), quota exceeded (409), overpayment validation |
| Confirm dialog | Regulation activate; regulation warning banner |
| Read-only after completion | ExaminationPage locked when visit status = COMPLETED |
| VND formatting | All money fields across invoices, payments, drugs, regulations, reports |

---

## Files Created / Modified

### Files Modified (lint fixes)
- [ExaminationPage.tsx](../frontend/src/features/examinations/ExaminationPage.tsx) — removed unused `Plus` import
- [MedicalHistoryPage.tsx](../frontend/src/features/patients/MedicalHistoryPage.tsx) — removed unused `formatDateTime` import

### Files Implemented (by developer, verified by build)
- `frontend/src/features/patients/api.ts`
- `frontend/src/features/patients/types.ts`
- `frontend/src/features/patients/hooks.ts`
- `frontend/src/features/patients/PatientListPage.tsx`
- `frontend/src/features/patients/PatientCreatePage.tsx`
- `frontend/src/features/patients/PatientDetailPage.tsx`
- `frontend/src/features/patients/MedicalHistoryPage.tsx`
- `frontend/src/features/visits/api.ts`
- `frontend/src/features/visits/types.ts`
- `frontend/src/features/visits/hooks.ts`
- `frontend/src/features/visits/VisitListPage.tsx`
- `frontend/src/features/visits/VisitCreatePage.tsx`
- `frontend/src/features/examinations/api.ts`
- `frontend/src/features/examinations/types.ts`
- `frontend/src/features/examinations/hooks.ts`
- `frontend/src/features/examinations/ExaminationPage.tsx`
- `frontend/src/features/invoices/api.ts`
- `frontend/src/features/invoices/types.ts`
- `frontend/src/features/invoices/hooks.ts`
- `frontend/src/features/invoices/InvoiceListPage.tsx`
- `frontend/src/features/invoices/InvoiceDetailPage.tsx`
- `frontend/src/features/regulations/api.ts`
- `frontend/src/features/regulations/types.ts`
- `frontend/src/features/regulations/hooks.ts`
- `frontend/src/features/regulations/RegulationPage.tsx`
- `frontend/src/features/diseases/DiseaseCatalogPage.tsx`
- `frontend/src/features/medicines/MedicineCatalogPage.tsx`
- `frontend/src/features/reports/api.ts`
- `frontend/src/features/reports/types.ts`
- `frontend/src/features/reports/MonthlyReportPage.tsx`

---

## Remaining Blockers

1. **GET /visits/:id** — Backend must add this endpoint for a proper visit detail page.
2. **PATCH /visits/:id/status** — Backend must add for visit cancellation workflow.
3. **UsersController @UseGuards** — Must be fixed before UC2/UC3 user management can go live.
4. **PATCH /users/:id/status** — Backend must add to support deactivating staff accounts.
5. **Chunk size** — 557 kB main bundle advisory. Consider lazy imports per route if performance is required. Not a blocker for Phase 1.

---

## Final Notes

- All 20 use cases (UC1–UC20) are implemented or appropriately deferred.
- Disease and medicine catalog hooks are co-located in `examinations/hooks.ts` since they are used in both the catalog pages and the examination prescription/diagnosis selectors — no duplication.
- `DiseaseCatalogPage` and `MedicineCatalogPage` correctly import from `@/features/examinations/hooks`.
- No `any` types introduced in this stage.
- No Phase 2 features implemented (no inventory, no online booking, no patient portal).
- All prescription operations route through the guarded `/examinations/:id/prescription` endpoints, not the unguarded `/prescriptions/*` endpoints.
