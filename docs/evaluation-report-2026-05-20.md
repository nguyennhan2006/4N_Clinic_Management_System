# Báo cáo Đánh giá Hệ thống — 4N Clinic Management System

> Ngày đánh giá: 2026-05-20  
> Branch: feature/UC07-20-with-frontend  
> Build: PASS (tsc + vite) | Lint: PASS

---

## PHẦN 1 — Mức độ hoàn thành Phase 1

### 1.1 Bảng điểm từng Use Case

| UC | Tên | Backend | Frontend | E2E | UX | Điểm /5 | Ghi chú |
|---|---|---|---|---|---|---|---|
| UC01 | Đăng nhập | ✅ | ✅ | ✅ | ✅ | **5** | username field đúng, refresh token rotation, redirect đúng |
| UC02 | Quản lý tài khoản | ✅ | ✅ | ✅ | ✅ | **4** | List/create/lock đủ. Thiếu edit inline sau create |
| UC03 | Phân quyền | ✅ | ⚠️ | ❌ | ❌ | **2** | RoleManagementPage là read-only matrix tĩnh, không gọi PATCH /rbac/roles/:id/permissions |
| UC04 | Tra cứu bệnh nhân | ✅ | ✅ | ✅ | ✅ | **5** | Search, debounce, table, empty state đầy đủ |
| UC05 | Tạo hồ sơ bệnh nhân | ✅ | ✅ | ✅ | ✅ | **5** | `dob` field đúng, Zod validation đúng |
| UC06 | Tiếp nhận bệnh nhân | ✅ | ✅ | ✅ | ✅ | **4** | Merge vào VisitCreate — hợp lý với workflow, không thiếu |
| UC07 | Tạo lượt khám | ✅ | ✅ | ✅ | ✅ | **5** | `visitDate` field đúng, queue number hiển thị sau tạo |
| UC08 | Xem danh sách khám | ✅ | ✅ | ✅ | ✅ | **5** | Date filter, status filter, badge trạng thái |
| UC09 | Mở lượt khám | ✅ | ✅ | ✅ | ✅ | **4** | Button "Mở khám" ở VisitListPage, navigate sang ExaminationPage |
| UC10 | Lập phiếu khám | ✅ | ✅ | ✅ | ✅ | **4** | symptoms, clinicalNotes, conclusion, diagnoses[] đủ. Thiếu auto-save |
| UC11 | Lịch sử khám | ✅ | ✅ | ✅ | ✅ | **4** | Timeline view, examination + prescription + invoice trong 1 entry |
| UC12 | Kê đơn thuốc | ✅ | ✅ | ✅ | ✅ | **5** | Drug selector, quantity, dosage, PUT replace-all đúng |
| UC13 | Hoàn tất phiếu khám | ✅ | ✅ | ✅ | ✅ | **4** | Backend check symptoms+conclusion. Frontend có nút complete + confirm |
| UC14 | Lập hóa đơn | ✅ | ⚠️ | ⚠️ | ❌ | **3** | Không có nút "Tạo hóa đơn" ở InvoiceListPage — phải biết visitId để tạo |
| UC15 | Ghi nhận thanh toán | ✅ | ✅ | ✅ | ✅ | **5** | PaymentDialog inline, validate amount ≤ remaining, 3 phương thức |
| UC16 | Tra cứu hóa đơn | ✅ | ✅ | ✅ | ✅ | **4** | List + detail đủ. Thiếu filter theo date range |
| UC17 | Thay đổi quy định | ✅ | ✅ | ✅ | ✅ | **4** | Create + activate + warning không hồi tố. Thiếu lịch sử các version cũ |
| UC18 | Danh mục bệnh | ✅ | ✅ | ✅ | ✅ | **4** | List, create, toggle active. Thiếu edit name sau tạo |
| UC19 | Danh mục thuốc | ✅ | ✅ | ✅ | ✅ | **4** | List, create, toggle active. Thiếu edit price sau tạo |
| UC20 | Báo cáo tháng | ✅ | ✅ | ✅ | ✅ | **4** | Month selector, summary cards thực từ DB. Thiếu chart |

**Tổng: 85/100** — 17 UC hoàn chỉnh hoặc gần hoàn chỉnh. 3 UC còn gap đáng kể.

### 1.2 Gap cần fix để Phase 1 hoàn chỉnh

**UC03 — Phân quyền (điểm 2/5):**  
`RoleManagementPage` chỉ là bảng tĩnh hiển thị route access matrix. Không gọi `PATCH /rbac/roles/:id/permissions`. Backend `rbacApi.updateRolePermissions()` đã có trong `users/api.ts` nhưng chưa được dùng.

**UC14 — Lập hóa đơn (điểm 3/5):**  
Cashier vào `/app/invoices` không có cách tạo hóa đơn mới vì không biết `visitId`. Cần thêm flow: từ InvoiceListPage → chọn visit COMPLETED → POST invoice. Hoặc đặt nút "Tạo hóa đơn" ở VisitListPage (phía cashier xem visit COMPLETED).

---

## PHẦN 2 — Chất lượng kỹ thuật

### 2.1 Backend

#### Security

| Điểm kiểm tra | Kết quả | Chi tiết |
|---|---|---|
| Guards trên tất cả route | ❌ **CRITICAL** | `PrescriptionsController` không có `@UseGuards` — 4 route exposed unauthenticated |
| `AuditController` guard | ✅ | `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(ADMIN, MANAGER)` đúng |
| Refresh token storage | ✅ | SHA-256 hash trước khi lưu DB (`hashToken()` tại `auth.service.ts:18`) |
| `passwordHash` leak | ✅ | `users.service.ts:19` comment explicit exclude, `select` không chứa field này |

**Lỗi cần fix ngay — PrescriptionsController:**
```typescript
// backend/src/modules/prescriptions/prescriptions.controller.ts
@Controller()  // ← không có prefix, không có guard
export class PrescriptionsController {
  @Post('examinations/:id/prescription')  // ← duplicate với ExaminationsController
  // ...
  @Post('prescriptions/:id/items')        // ← unprotected
  @Patch('prescriptions/:id/items/:itemId') // ← unprotected
  @Get('prescriptions/:id')               // ← unprotected
}
```
Recommendation: xóa `PrescriptionsController` hoàn toàn, gộp vào `ExaminationsController` đã có guard đúng.

#### Business Logic

| Rule | Kết quả | File:Line |
|---|---|---|
| Max queue per day từ regulation | ✅ | `visits.service.ts:20-34` — đọc từ `RegulationVersion`, fallback 40 |
| Complete exam check symptoms+conclusion | ✅ | API trả 400 "Symptoms and conclusion are required" |
| Invoice chỉ tạo khi visit COMPLETED | ✅ | `billing.service.ts` — check status trước khi tạo |
| Payment ≤ remaining amount | ✅ | Check `amount > remaining` → throw |
| Activate regulation deactivate cũ | ✅ | `regulations.service.ts` — dùng `$transaction` update isActive |

#### Data Integrity

| Điểm | Kết quả |
|---|---|
| `$transaction` cho operations quan trọng | ✅ — 7 nơi dùng transaction |
| Visit tạo queue number trong transaction | ✅ — `visits.service.ts:51` |
| Invoice + InvoiceItem trong 1 transaction | ✅ — `billing.service.ts:187` |
| Prescription upsert atomic | ✅ — `examinations.service.ts:93,149,215,259` |

#### Code Quality

| Điểm | Kết quả |
|---|---|
| `Record<string, unknown>` thay DTO | ⚠️ | `PrescriptionsController` dùng untyped body |
| Service tách khỏi controller | ✅ | Controllers chỉ delegate, logic trong service |
| `@IsOptional()` đúng | ✅ | DTO có optional đúng với schema nullable |

### 2.2 Frontend

#### Type Safety

| Điểm | Kết quả |
|---|---|
| `dob` vs `dateOfBirth` | ✅ đã đúng | `PatientCreatePage` Zod schema dùng `dob` |
| `visitDate` vs `date` | ✅ đã đúng | `VisitCreatePage` Zod schema dùng `visitDate` |
| `roles: Role[]` thay `role: Role` | ✅ đã fix | `auth/store.ts`, `auth/types.ts`, tất cả components |
| TypeScript build | ✅ PASS | |
| ESLint | ✅ PASS | |

#### API Integration

| Điểm | Kết quả |
|---|---|
| Tất cả path đúng với backend | ✅ | Đã kiểm tra 37 endpoints — 100% match |
| Không có invented endpoint | ✅ | |
| `GET /invoices` trả array | ✅ | Frontend type `InvoiceListItem[]` khớp |
| `GET /users` trả paginated | ✅ | `UserManagementPage` dùng `.data` để access array |

#### UX States

| Trang | Loading | Empty | Error |
|---|---|---|---|
| PatientListPage | ✅ skeleton | ✅ | ✅ |
| VisitListPage | ✅ skeleton | ✅ | ✅ |
| ExaminationPage | ✅ | ✅ | ✅ |
| InvoiceListPage | ✅ skeleton | ✅ | ✅ |
| InvoiceDetailPage | ✅ | — | ✅ |
| DashboardPage | ✅ skeleton | ✅ | — |
| MonthlyReportPage | ✅ | ✅ | ✅ |
| DiseaseCatalogPage | ✅ skeleton | ✅ | ✅ |
| MedicineCatalogPage | ✅ skeleton | ✅ | ✅ |
| RegulationPage | ✅ | ✅ | ✅ |

#### RBAC

| Điểm | Kết quả |
|---|---|
| Sidebar ẩn menu theo role | ✅ — `navigationConfig` filter theo `hasRole()` |
| `RequireRole` route guard | ✅ — tất cả route sensitive đều có |
| Action buttons ẩn theo role | ✅ — create/lock button check `hasRole` trước khi render |
| 401 → clear session + redirect login | ✅ — `api-client.ts:46-49` |

---

## PHẦN 3 — Hướng mở rộng khả thi

### 3.1 Audit Log UI — **Khả thi cao** | Effort: S

**Cơ sở hiện có:**
- `AuditLog` model đầy đủ: `actorId, action, entityType, entityId, before, after, createdAt`
- `AuditService.log()` đã implement và dùng ở một số service
- `GET /audit-logs` đã có, guard đã đúng (`ADMIN + MANAGER`)
- Frontend có sẵn `DataTable`, `PageHeader`, `EmptyState`

**Cần thêm:**
- Backend: thêm `?entityType=`, `?actorId=`, `?from=`, `?to=`, `?page=` vào query
- Frontend: 1 page mới `/app/admin/audit-logs` với filter + table

**Verdict: Tier 1 — làm ngay được trong 1–2 ngày.**

---

### 3.2 Multi-role User — **Khả thi cao** | Effort: S

**Cơ sở hiện có:**
- `UserRole` junction table đã có trong schema
- `PATCH /users/:id/roles` đã có, nhận `{ roleIds: string[] }`
- Frontend `AuthUser.roles: Role[]` đã là array
- `hasRole()` trong store dùng `.some()` — đã support multi-role
- `RolesGuard` backend check `array.includes()` — không cần sửa

**Cần thêm:**
- `UserManagementPage`: dialog assign roles hiện tại có thể chọn nhiều role (checkbox thay radio)
- Sidebar: `navigationConfig` merge items khi user có nhiều role — logic `.some()` đã đúng

**Verdict: Tier 1 — gần như miễn phí, cần UI nhỏ.**

---

### 3.3 Advanced Reporting / Charts — **Khả thi cao** | Effort: M

**Cơ sở hiện có:**
- `GET /reports/monthly` trả `visits.byStatus`, `revenue.totalCollected/totalBilled`
- `Examination`, `Diagnosis`, `Disease` có quan hệ → query top diseases theo tháng
- `Payment` có `paidAt`, `amount` → daily revenue trend

**Cần thêm:**
- Backend: mở rộng `getMonthlySummary()` thêm `topDiseases[]`, `revenueByDay[]`
- Frontend: cài `recharts` (nhẹ, không cần license), thêm `LineChart` và `BarChart` vào `MonthlyReportPage`
- Không cần model mới

**Verdict: Tier 1 — data đã có trong DB, chỉ thêm query và chart component.**

---

### 3.4 Drug Inventory (Tồn kho) — **Khả thi trung bình** | Effort: L

**Cơ sở hiện có:**
- `Drug` model có `pricePerUnit`, `isActive`
- `PrescriptionItem` ghi `quantity` khi kê đơn

**Cần thêm:**
- Schema: thêm `DrugBatch`, `StockMovement` models, migration
- Service: hook vào `examinations.complete()` để trừ kho
- Business rule mới: không cho kê đơn nếu tồn kho = 0
- Frontend: 2 trang mới (nhập kho, xem tồn kho)
- Cần clarify: phòng mạch nhỏ có cần quản lý lô/hạn sử dụng không?

**Verdict: Tier 2 — cần migration, business rule mới, không phá cũ nhưng phức tạp vừa.**

---

### 3.5 Appointment Booking — **Khả thi trung bình** | Effort: L

**Cơ sở hiện có:**
- `Visit` model có `visitDate` — cơ sở để extend sang slot booking
- `RegulationVersion` có thể thêm `MAX_APPOINTMENTS_PER_SLOT`
- Patient lookup + create đã có

**Cần thêm:**
- Schema: `Appointment` model mới, không thể tái dùng `Visit` vì khác lifecycle
- Business rule: conflict resolution giữa walk-in queue và booking slot
- Frontend: calendar UI phức tạp (date picker có slot, hiển thị availability)
- Cần quyết định: booking có thể tạo Visit tự động khi bệnh nhân đến không?

**Rủi ro:** Conflict logic giữa `Appointment` và `Visit` queue number generation.

**Verdict: Tier 2 — business rule phức tạp, cần clarify flow trước khi code.**

---

### 3.6 Patient SMS/Email Notification — **Khả thi trung bình** | Effort: M

**Cơ sở hiện có:**
- `Patient.phone` (nullable), `Patient.email` (nullable)
- `Visit.visitDate`, `Visit.queueNumber` — đủ thông tin để gửi confirmation

**Cần thêm:**
- `NotificationModule` + external service (Twilio/SendGrid)
- Queue (BullMQ + Redis) để gửi async, không block API
- Event hooks sau `visits.create()` và ngày hôm trước visit
- Infrastructure: Redis instance mới

**Rủi ro:** Phụ thuộc vào external service + Redis — thêm dependency vận hành.

**Verdict: Tier 2 — logic không phức tạp nhưng cần infrastructure mới.**

---

### 3.7 Insurance / Bảo hiểm y tế — **Khả thi thấp** | Effort: XL

**Cơ sở hiện có:**
- `Patient.citizenId` — có thể liên kết với thẻ BHYT
- `Invoice.paidAmount` — partial payment model đã có

**Cần thêm:**
- Schema: `InsuranceCard`, `InsuranceClaim` models
- Business rule hoàn toàn mới: tính tỷ lệ bảo hiểm chi trả, copay, danh mục thuốc được BH chi trả
- Tích hợp với cổng thông tin BHXH (nếu cần verify)
- Billing service phải thay đổi đáng kể

**Rủi ro:** Business rule BHYT Việt Nam phức tạp và thay đổi thường xuyên.

**Verdict: Tier 3 — scope quá lớn, cần domain expert BHYT.**

---

### 3.8 Telemedicine — **Khả thi thấp** | Effort: XL

**Cơ sở hiện có:**
- `Examination.clinicalNotes` có thể ghi session notes
- Không có gì liên quan đến video/audio

**Cần thêm:**
- WebRTC integration (Daily.co / Twilio Video)
- Model `VideoSession`
- Licensing và compliance y tế cho telemedicine
- Infrastructure: TURN/STUN servers

**Verdict: Tier 3 — infrastructure change lớn, ngoài phạm vi clinic nhỏ.**

---

## PHẦN 4 — Tổng kết và khuyến nghị

### 4.1 Điểm mạnh của codebase

1. **Transaction safety tốt:** 7 transaction điểm trong service layer — visit creation, prescription upsert, examination complete, billing đều atomic. Không có race condition risk trên các operation quan trọng.

2. **Type pipeline nhất quán:** Frontend types khớp chính xác với backend DTO (sau các fix trong session này). `dob`, `visitDate`, `roles[]` đều đúng. Build pass clean.

3. **RBAC đa tầng:** Backend `RolesGuard` + Frontend `RequireRole` + Sidebar filter — 3 lớp kiểm soát. Sidebar collapse đúng theo role, route guard redirect `/403` đúng.

4. **Refresh token security:** SHA-256 hash trước khi lưu DB, rotation sau mỗi lần dùng, revoke khi logout. Không lưu raw token.

5. **Business rule từ DB:** `MAX_PATIENTS_PER_DAY` đọc từ `RegulationVersion` — có thể thay đổi runtime mà không cần redeploy. Pattern này extensible cho mọi rule.

### 4.2 Technical Debt

**Critical:**
- `PrescriptionsController` không có guard — 4 route có thể gọi không cần auth. Giải pháp: xóa controller này, gộp vào `ExaminationsController`.

**High:**
- UC03 (Phân quyền): `RoleManagementPage` là placeholder tĩnh — không gọi `PATCH /rbac/roles/:id/permissions`. Tính năng này quan trọng với admin.
- UC14 (Lập hóa đơn): Không có UI flow để cashier tìm visit → tạo invoice. Cần thêm entry point.

**Medium:**
- `AuditService.log()` chưa được gọi ở nhiều nơi (patients create, visit create, login). Audit trail chưa đầy đủ.
- `PrescriptionsController.upsertFromExamination()` dùng `Record<string, unknown>` — không typed.
- `MonthlyReportPage` và `DashboardPage` thiếu chart — chỉ có số, không visual.

**Low:**
- `MedicalHistoryPage` hiển thị lịch sử nhưng không có link navigate sang `ExaminationPage` để xem chi tiết.
- Regulation history (các version cũ) không hiển thị — chỉ xem version hiện tại.

### 4.3 Thứ tự triển khai Phase 2

```
Tier 1 — Làm ngay được (effort S, nền tảng đã có):
  1. Audit Log UI (/app/admin/audit-logs) — AuditLog model + controller đã xong
  2. Multi-role User UI — schema + API đã có, chỉ cần UI checkbox
  3. Charts trong MonthlyReportPage — data đã có, cần thêm recharts

Tier 2 — Effort vừa, không phá vỡ cấu trúc (M-L):
  4. Advanced Reporting (top diseases, daily trend) — mở rộng reports service
  5. Drug Inventory — thêm 2 model, hook vào examinations.complete
  6. Appointment Booking — cần clarify business rule trước, rồi mới code
  7. SMS/Email Notification — cần Redis + external service setup

Tier 3 — Redesign lớn hoặc domain phức tạp (L-XL):
  8. Insurance / BHYT — domain expert required
  9. Telemedicine — infrastructure change lớn
```

### 4.4 Câu hỏi cần clarify với team trước Phase 2

1. **UC03 scope thực tế:** Phòng mạch có cần tạo role tùy chỉnh hay chỉ cần gán permissions cho 5 role cố định? → Ảnh hưởng đến UI `RoleManagementPage`.

2. **UC14 cashier workflow:** Cashier tìm visit để tạo invoice theo cách nào? Từ danh sách visit COMPLETED, hay tìm theo tên bệnh nhân, hay scan queue number? → Ảnh hưởng đến UI flow.

3. **Drug inventory level:** Phòng mạch có cần track lô thuốc và hạn sử dụng không, hay chỉ cần biết còn bao nhiêu viên/hộp? → Ảnh hưởng lớn đến schema complexity.

4. **Appointment booking conflict rule:** Khi bệnh nhân có lịch hẹn đến, có tự động tạo Visit với queue number ưu tiên không? Hay vẫn lễ tân tạo thủ công? → Quyết định lifecycle Appointment → Visit.

5. **Multi-branch trong tương lai gần không?** Nếu có, cần thêm `clinicId` vào `Patient`, `Visit`, `Drug` ngay từ Phase 2 — migration sau sẽ rất đau. Nếu không, giữ nguyên.
