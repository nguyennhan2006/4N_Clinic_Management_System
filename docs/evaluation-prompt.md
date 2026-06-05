# Evaluation Prompt — 4N Clinic Management System

> Dùng prompt này để đánh giá mức độ hoàn thành và hướng mở rộng khả thi của hệ thống.  
> Paste toàn bộ vào Claude (hoặc LLM tương đương) kèm theo codebase context.

---

## PROMPT

Bạn là kỹ sư phần mềm cao cấp được giao đánh giá hệ thống **4N Clinic Management System** — web app quản lý phòng mạch tư nhân xây dựng theo mô hình Modular Monolith, Backend NestJS + Prisma + PostgreSQL, Frontend React + Vite.

Hãy thực hiện đánh giá toàn diện theo 4 phần dưới đây. Với mỗi mục, đưa ra nhận xét cụ thể dựa trên code thực tế, không phán xét chung chung.

---

### PHẦN 1 — Đánh giá mức độ hoàn thành Phase 1 (20 Use Cases)

#### 1.1 Kiểm tra từng Use Case

Với mỗi UC, đánh giá theo 3 chiều:

| Chiều | Câu hỏi kiểm tra |
|---|---|
| **Backend** | Controller route có tồn tại không? DTO có validate đúng không? Service có implement business rule không? Guard có đúng role không? |
| **Frontend** | Page có render không? Form submit đúng endpoint không? Có xử lý loading/empty/error state không? RBAC route guard có đúng không? |
| **Luồng end-to-end** | Gọi API từ frontend có nhận đúng response không? Có conflict nào giữa DTO backend và type frontend không? |

Các UC cần kiểm tra:

```
UC01 — Đăng nhập
  Backend: POST /auth/login → JWT access + refresh token
  Frontend: LoginPage, form username/password, redirect sau login
  Lưu ý: username field (không phải email)

UC02 — Quản lý tài khoản
  Backend: GET/POST/PATCH /users, PATCH /users/:id/lock
  Frontend: UserManagementPage — list, create, lock/unlock
  Lưu ý: GET /users trả { data[], total, page, limit } — paginated

UC03 — Phân quyền
  Backend: GET /rbac/roles, GET /rbac/permissions, PATCH /rbac/roles/:id/permissions
  Frontend: RoleManagementPage
  Lưu ý: Kiểm tra xem RoleManagementPage có thực sự gọi API không hay vẫn placeholder

UC04 — Tra cứu bệnh nhân
  Backend: GET /patients?keyword=...
  Frontend: PatientListPage — search input, table

UC05 — Tạo hồ sơ bệnh nhân
  Backend: POST /patients — field dob (không phải dateOfBirth)
  Frontend: PatientCreatePage — Zod schema có dùng dob không?

UC06 — Tiếp nhận bệnh nhân
  Backend: Không có endpoint riêng — tiếp nhận = tạo visit
  Frontend: Xem có màn hình reception riêng hay merge vào VisitCreate

UC07 — Tạo lượt khám
  Backend: POST /visits — field visitDate (không phải date)
  Frontend: VisitCreatePage — Zod schema có dùng visitDate không?

UC08 — Xem danh sách khám
  Backend: GET /visits?date=YYYY-MM-DD&status=...
  Frontend: VisitListPage — date picker, status filter, table

UC09 — Mở lượt khám
  Backend: POST /visits/:id/open-examination
  Frontend: Button "Mở khám" trên VisitListPage hay ExaminationPage?

UC10 — Lập phiếu khám
  Backend: PATCH /examinations/:id — body { symptoms, clinicalNotes, conclusion, diagnoses[] }
  Frontend: ExaminationPage — form có đủ các field không?

UC11 — Xem lịch sử khám
  Backend: GET /patients/:id/medical-history
  Frontend: MedicalHistoryPage

UC12 — Kê đơn thuốc
  Backend: PUT /examinations/:id/prescription — body { items: [{ drugId, quantity, dosage }] }
  Frontend: ExaminationPage — prescription section, drug selector

UC13 — Hoàn tất phiếu khám
  Backend: POST /examinations/:id/complete — yêu cầu symptoms + conclusion đã có
  Frontend: Button complete, validation trước khi submit

UC14 — Lập hóa đơn
  Backend: POST /visits/:visitId/invoice — chỉ tạo được khi visit COMPLETED
  Frontend: Button tạo hóa đơn ở InvoiceListPage hay InvoiceDetailPage?

UC15 — Ghi nhận thanh toán
  Backend: POST /invoices/:id/payments — body { amount, method: CASH|TRANSFER|CARD }
  Frontend: PaymentDialog — validate amount không vượt còn lại

UC16 — Tra cứu hóa đơn
  Backend: GET /invoices (array), GET /invoices/:id
  Frontend: InvoiceListPage, InvoiceDetailPage

UC17 — Thay đổi quy định
  Backend: GET /regulations/current, POST /regulations, PATCH /regulations/:id/activate
  Frontend: RegulationPage — create + activate + warning không hồi tố

UC18 — Quản lý danh mục bệnh
  Backend: GET/POST /diseases, PATCH /diseases/:id
  Frontend: DiseaseCatalogPage

UC19 — Quản lý danh mục thuốc
  Backend: GET/POST /drugs, PATCH /drugs/:id
  Frontend: MedicineCatalogPage

UC20 — Báo cáo tháng
  Backend: GET /reports/monthly?month=YYYY-MM → { visits, completedVisits, revenue }
  Frontend: MonthlyReportPage — month selector, summary cards
```

#### 1.2 Thang điểm đề xuất

Với mỗi UC, cho điểm theo thang:

| Điểm | Mức |
|---|---|
| 0 | Chưa làm |
| 1 | Backend có, frontend chưa có (hoặc ngược lại) |
| 2 | Cả hai có nhưng chưa kết nối / còn lỗi type conflict |
| 3 | Kết nối được, chạy được, nhưng thiếu UX states (loading/empty/error) |
| 4 | Đầy đủ, UX states có, RBAC đúng, không lỗi TS |
| 5 | Hoàn chỉnh, có form validation, error mapping từ backend, edge cases xử lý |

Tổng hợp thành bảng: `UC | Backend | Frontend | E2E | UX | Điểm /5 | Ghi chú`

---

### PHẦN 2 — Đánh giá chất lượng kỹ thuật

#### 2.1 Backend

Kiểm tra từng điểm sau và cho nhận xét cụ thể (file:line nếu có thể):

**Security:**
- [ ] Tất cả route có `@UseGuards(JwtAuthGuard, RolesGuard)` không? (trừ `/auth/login`)
- [ ] `PrescriptionsController` có guard không? Có bị expose unprotected không?
- [ ] `AuditController` — guard có đúng không?
- [ ] Refresh token có được hash/lưu an toàn không?
- [ ] `passwordHash` có bị leak qua response không?

**Business Logic:**
- [ ] Tạo visit có enforce max queue per day không? (BR business rule)
- [ ] Complete examination có check symptoms + conclusion không?
- [ ] Create invoice có check visit status = COMPLETED không?
- [ ] Payment có check amount ≤ remaining không?
- [ ] Activate regulation có deactivate cái cũ không?

**Data Integrity:**
- [ ] Các operation quan trọng có dùng `prisma.$transaction()` không?
- [ ] Cascade delete có được config đúng không?
- [ ] Unique constraint có xử lý đúng ở service layer không?

**Code Quality:**
- [ ] Có `any` nào không cần thiết không?
- [ ] DTO có `@IsOptional()` đúng với schema Prisma không?
- [ ] Service có tách business logic khỏi controller không?

#### 2.2 Frontend

**Type Safety:**
- [ ] Có field nào trong frontend type không khớp với backend DTO không?
  - `dob` vs `dateOfBirth` (patients)
  - `visitDate` vs `date` (visits)
  - `roles: Role[]` vs `role: Role` (user — đã fix chưa?)
- [ ] Có `as any` nào không?
- [ ] `build` và `lint` có pass không?

**API Integration:**
- [ ] Tất cả `apiClient.get/post/patch/put` có đúng path không?
- [ ] Có endpoint nào bị invented (không có trong backend) không?
- [ ] Response type có khớp không? (`InvoiceListItem[]` vs paginated object?)

**UX States:**
- [ ] Loading skeleton có ở tất cả các trang data-driven không?
- [ ] Empty state có message + action button không?
- [ ] Error state có hiện message thân thiện không (không hiện raw stack)?
- [ ] Form submit có disable button khi đang loading không?
- [ ] Destructive actions (lock user, activate regulation) có ConfirmDialog không?

**RBAC:**
- [ ] Sidebar có ẩn đúng menu theo role không?
- [ ] Route guard `RequireRole` có cover đúng không?
- [ ] Action buttons (create, edit, lock) có ẩn với role không được phép không?

---

### PHẦN 3 — Đánh giá hướng mở rộng khả thi

Với mỗi hướng dưới đây, đánh giá theo:
- **Cơ sở hiện có**: schema/module/component nào đã có sẵn
- **Công việc cần thêm**: ước tính effort (S/M/L/XL)
- **Rủi ro / blocker**: gì có thể cản trở
- **Verdict**: Khả thi cao / Trung bình / Thấp

#### 3.1 Appointment Booking (Đặt lịch hẹn)

```
Cơ sở hiện có:
- Model Visit có visitDate, queueNumber, status
- PatientModule đã có patient lookup
- RegulationVersion có thể mở rộng chứa booking rules

Cần thêm:
- Model Appointment (appointedAt, slot, status: PENDING/CONFIRMED/CANCELLED)
- API: POST /appointments, GET /appointments, PATCH /appointments/:id/confirm
- Frontend: booking calendar UI, slot picker
- Business rule: conflict với queue walk-in, max slots per day

Verdict: ?
```

#### 3.2 Drug Inventory (Tồn kho thuốc)

```
Cơ sở hiện có:
- Model Drug đã có (id, name, unit, pricePerUnit, isActive)
- PrescriptionItem ghi quantity khi kê đơn
- Không có model stock, import, export

Cần thêm:
- Model DrugBatch (drugId, quantity, importedAt, expiredAt, costPrice)
- Model StockMovement (type: IN/OUT, quantity, reason, relatedId)
- Logic trừ kho khi hoàn tất đơn thuốc (hook vào examinations.complete)
- Frontend: trang nhập kho, xem tồn kho, cảnh báo hết hàng

Verdict: ?
```

#### 3.3 Audit Log UI (Nhật ký thao tác)

```
Cơ sở hiện có:

  - Model AuditLog đã có đầy đủ (actorId, action, entityType, entityId, before, after)
- AuditService.log() đã implement
- AuditController GET /audit-logs đã có (nhưng thiếu guard)
- Không có frontend UI

Cần thêm:
- Fix guard trên AuditController (ADMIN + MANAGER)
- Frontend: trang audit logs với filter theo entityType, actorId, date range
- Pagination (backend đã trả list, cần thêm pagination params)

Verdict: ?
```

#### 3.4 Patient SMS/Email Notification

```
Cơ sở hiện có:
- Patient có phone, email (nullable)
- Visit có visitDate, queueNumber
- Không có notification module

Cần thêm:
- Integration với Twilio / SendGrid / SMTP
- NotificationModule với queue (Bull/BullMQ)
- Trigger: sau tạo visit → gửi SMS xác nhận
- Trigger: ngày hôm trước → gửi reminder

Verdict: ?
```

#### 3.5 Advanced Reporting / Dashboard Analytics

```
Cơ sở hiện có:
- ReportsService.getMonthlySummary() đã trả visits, revenue, byStatus
- Model Invoice, Payment có đầy đủ timestamp và amount
- Model Examination, Diagnosis có liên kết Disease

Cần thêm:
- Thêm query: top diseases by month, revenue by doctor, daily visit trend
- Chart library (Recharts / Chart.js)
- Dashboard widget với sparklines
- Export CSV/PDF

Verdict: ?
```

#### 3.6 Multi-role User (một user nhiều role)

```
Cơ sở hiện có:
- Schema đã có UserRole junction table (userId, roleId)
- User.userRoles là array — model đã sẵn sàng
- Auth.me() trả roles[] array
- Frontend AuthUser.roles: Role[] đã là array

Cần thêm:
- UI trong UserManagementPage để assign multiple roles (đã có assignRoles endpoint)
- Logic frontend khi user có nhiều role: sidebar merge items, hasRole() dùng .some()
- RolesGuard backend đã check array — không cần sửa backend

Verdict: ?
```

#### 3.7 Insurance / Bảo hiểm y tế

```
Cơ sở hiện có:
- Invoice có totalAmount, paidAmount, status — đủ để track partial payment
- Patient có citizenId
- Không có model InsuranceCard, Coverage

Cần thêm:
- Model InsuranceCard (patientId, cardNumber, provider, coveragePercent, validFrom, validTo)
- Logic billing: tính phần bảo hiểm vs bệnh nhân tự trả
- Frontend: nhập thông tin bảo hiểm, hiển thị breakdown

Verdict: ?
```

#### 3.8 Telemedicine / Video Consultation

```
Cơ sở hiện có:
- Examination model có clinicalNotes, conclusion — có thể ghi remote session
- Không có model VideoSession, không có WebRTC setup

Cần thêm:
- Integration WebRTC (Daily.co / Twilio Video / Jitsi)
- Model VideoSession (examinationId, roomUrl, startedAt, endedAt)
- Significant infrastructure change

Verdict: ?
```

---

### PHẦN 4 — Tổng kết và khuyến nghị

#### 4.1 Điểm mạnh của codebase hiện tại

Liệt kê 3–5 điểm mạnh cụ thể dựa trên code thực tế (không chung chung).

#### 4.2 Technical debt cần giải quyết trước mở rộng

Liệt kê theo thứ tự ưu tiên:

1. **Critical** — ảnh hưởng security hoặc data integrity
2. **High** — ảnh hưởng đến correctness hoặc UX nghiêm trọng  
3. **Medium** — code quality, type safety
4. **Low** — style, DX

#### 4.3 Khuyến nghị thứ tự triển khai Phase 2

Dựa trên đánh giá ở Phần 3, xếp các hướng mở rộng theo:

```
Tier 1 — Làm ngay được (nền tảng đã có, effort S-M):
  ...

Tier 2 — Làm được với effort vừa (M-L, không phá vỡ cấu trúc):
  ...

Tier 3 — Cần redesign đáng kể hoặc external dependency phức tạp (L-XL):
  ...
```

#### 4.4 Câu hỏi cần clarify với team trước khi mở rộng

Liệt kê 3–5 câu hỏi business/technical mà câu trả lời sẽ ảnh hưởng đến quyết định kiến trúc Phase 2.

---

## CONTEXT CẦN CUNG CẤP KHI DÙNG PROMPT NÀY

Trước khi chạy prompt, cung cấp cho AI các file sau (hoặc paste nội dung):

```
backend/prisma/schema.prisma          ← data model chốt
backend/src/modules/*/               ← tất cả controllers, services, DTOs
frontend/src/features/*/api.ts       ← tất cả API calls
frontend/src/features/*/types.ts     ← tất cả frontend types
frontend/src/app/router.tsx          ← route + RBAC config
frontend-docs/missing-backend-endpoints.md  ← known gaps
```

Hoặc chạy lệnh sau để export snapshot nhanh:

```bash
# Backend endpoints
grep -rn "@Get\|@Post\|@Patch\|@Put\|@Delete" backend/src/modules --include="*.ts" -A1

# Frontend API calls
grep -rn "apiClient\." frontend/src/features --include="*.ts"

# TypeScript errors
cd frontend && npx tsc --noEmit 2>&1
cd backend && npx tsc --noEmit 2>&1
```

---

## GHI CHÚ

- Prompt này được thiết kế để chạy **sau mỗi milestone** (cuối sprint, trước release, trước mở rộng).
- Kết quả đánh giá nên được lưu vào `frontend-docs/evaluation-report-<date>.md`.
- Phần 3 (hướng mở rộng) nên được đối chiếu với `docs/business/business-rules.md` để đảm bảo không vi phạm constraint nghiệp vụ đã định.
- Verdict của Phần 3 chỉ có nghĩa khi người đánh giá đã đọc code thực tế — không phán xét từ description.
