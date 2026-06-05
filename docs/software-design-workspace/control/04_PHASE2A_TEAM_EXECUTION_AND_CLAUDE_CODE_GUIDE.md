# 4N CLINIC MANAGEMENT SYSTEM
## Tài liệu kiểm tra prompt Claude Code và kế hoạch phân công Phase 2A

*Nguồn: Cung cấp qua conversation 2026-05-27*  
*Dành cho team 4 người triển khai trong 1 tháng*

---

# 1. Executive Summary

File CLAUDE_PHASE2.md hiện tại đi đúng hướng lớn: giữ modular monolith, khóa scope Phase 2A, ưu tiên workflow appointment → queue → vitals → lab → pharmacy → billing, và nhấn mạnh các lỗi Phase 1 phải sửa trước. Tuy nhiên, tài liệu vẫn cần chỉnh lại một số điểm trước khi đưa Claude Code thực thi: có một số ràng buộc Prisma chưa chuẩn, một số business rule chưa testable, một số dependency với model Phase 1 chưa được ghi rõ, và chưa có phân công đủ rõ cho team 4 người.

**Kết luận:** có thể dùng file prompt này làm nền, nhưng không nên đưa Claude Code chạy trực tiếp toàn bộ. Cần tách thành tài liệu team execution + prompt nhỏ theo từng module, có owner review schema/API/test ở mỗi sprint.

---

# 2. Kiểm tra mức độ khớp của prompt hiện tại

## 2.1. Những điểm đang khớp hướng Phase 2A

- Giữ nguyên tech stack và modular monolith. Đây là hướng đúng với team 4 người trong 1 tháng.
- Scope đã cắt đúng: không làm patient portal, SMS/email thật, BHYT, telemedicine, multi-branch, LIS/PACS.
- Flow demo đã bám nghiệp vụ phòng khám lớn hơn: đặt lịch, hàng đợi, sinh hiệu, xét nghiệm, cấp phát thuốc, tồn kho, hóa đơn nhiều khoản mục.
- Đưa security debt của PrescriptionsController lên trước Phase 2 là chính xác vì đây là lỗi critical.
- Nhấn mạnh trừ kho tại thời điểm dược sĩ dispense, không trừ khi bác sĩ kê đơn hoặc hoàn tất khám. Đây là rule rất quan trọng.
- Quy tắc không làm chart/report trước data model là hợp lý; report cần dữ liệu lab, service order, inventory, dispense trước.

## 2.2. Những điểm cần sửa trước khi đưa Claude Code thực thi

| Mã | Vấn đề | Tác động | Cách sửa |
|---|---|---|---|
| P2-FIX-01 | QueueTicket unique chưa chuẩn | `@@unique([departmentId, queueNumber, createdAt])` không đảm bảo unique theo ngày vì createdAt là timestamp khác nhau | Thêm `queueDate DateTime @db.Date` và unique `[departmentId, queueDate, queueNumber]` |
| P2-FIX-02 | Visit refactor chưa ghi rõ | Appointment check-in tạo Visit gắn appointmentId, queue theo department/doctor nhưng schema Visit Phase 1 chưa có các field này | Ghi rõ cần thêm `appointmentId`, `departmentId`, `doctorProfileId` hoặc `doctorUserId` vào Visit |
| P2-FIX-03 | Lab required rule chưa có field | BR-P2-17 nói lab order required nhưng ServiceOrder/LabOrder không có `isRequired` | Thêm `isRequired Boolean @default(false)` vào ServiceOrder |
| P2-FIX-04 | Status dùng String quá nhiều | ServiceOrder.status, billingStatus, LabOrder.status, LabSample.status, LabResult.status đang là String | Đổi sang enum cho các state quan trọng hoặc viết DTO validation enum rất chặt |
| P2-FIX-05 | Appointment conflict ±15min chưa đủ | Nếu durationMinutes khác 15, rule ±15min sẽ sai | Dùng interval overlap: `newStart < oldEnd AND newEnd > oldStart` |
| P2-FIX-06 | StaffSchedule start/end dạng String cần rule parse | String "08:00" dễ sai format và khó so sánh nếu không validate | Giữ String cho MVP nhưng bắt buộc validate HH:mm và parse trong service; hoặc đổi sang `startAt/endAt DateTime` |
| P2-FIX-07 | Audit login fail cần cẩn trọng | Log login fail là tốt nhưng không nên ghi raw password hoặc thông tin nhạy cảm | Audit only username/email input, IP/userAgent nếu có, reason generic |
| P2-FIX-08 | Invoice item refactor chưa đủ rõ | InvoiceItem chỉ thêm optional `itemType/referenceType/referenceId`; cần rule mapping source item sang invoice | Định nghĩa rõ exam fee/service order/dispense được snapshot thế nào và không tạo trùng invoice item |
| P2-FIX-09 | Global guards wording dễ gây hiểu nhầm | Prompt nói global guards bắt buộc trên tất cả route, nhưng code có thể đang dùng @UseGuards theo controller | Viết lại: mọi controller non-public phải có `@UseGuards(JwtAuthGuard, RolesGuard)` và mỗi handler có `@Roles` |
| P2-FIX-10 | Thiếu seed/permission migration | Thêm role mới nhưng chưa nói seed NURSE/LAB_TECHNICIAN/PHARMACIST và permissions | Thêm migration/seed roles, permissions, demo users, navigation labels |

---

# 3. Tài liệu triển khai Phase 2A cho team 4 người

## 3.1. Mục tiêu sản phẩm trong 1 tháng

Admin/Manager cấu hình phòng ban, phòng, bác sĩ, lịch làm việc  
→ Receptionist đặt lịch hoặc tiếp nhận walk-in  
→ Check-in tạo Visit + QueueTicket  
→ Nurse đo sinh hiệu  
→ Doctor khám, chỉ định xét nghiệm  
→ Lab technician nhập kết quả  
→ Doctor xem kết quả, kết luận, kê đơn  
→ Pharmacist cấp phát thuốc và trừ kho  
→ Cashier lập hóa đơn nhiều khoản mục và thanh toán  
→ Manager xem báo cáo + Admin/Manager xem audit log  

**In-scope:** Department, Room, DoctorProfile, StaffSchedule, Appointment + check-in, Queue theo department/doctor, VitalSign, ServiceCatalog, ServiceOrder, Lab basic, Inventory lot, stock movement, dispense, InvoiceItem nhiều khoản mục, Reports MVP + Audit UI.

**Out-of-scope:** Patient portal/mobile app, SMS/email thật, BHYT, Telemedicine/video call, LIS/PACS/máy xét nghiệm thật, Multi-branch/multi-tenant, Purchase order/supplier đầy đủ, AI diagnosis.

## 3.2. Phân vai team 4 người

| Người | Vai trò chính | Phạm vi đảm nhiệm | Quyền chặn merge |
|---|---|---|---|
| Member A | Backend/DB Owner | Schema Prisma, migration, transaction, state model, review mọi thay đổi DB | Quyết định schema cuối cùng, không để Claude tự thêm field |
| Member B | Backend Workflow Owner | Service/controller/API cho appointment, queue, vitals, lab, pharmacy, billing extension | Đảm bảo business rule nằm trong service, route có guard và tests |
| Member C | Frontend Owner | Page, dialog, form, navigation, RBAC UI, integration với API | Đảm bảo mỗi page có loading/empty/error state, không invented endpoint |
| Member D | QA/Integration/Docs Owner | Seed data, E2E script, test cases, changelog, demo checklist, review regression | Không cho merge nếu build/lint/test/demo flow fail |

## 3.3. RACI theo module

| Module | Responsible | Accountable | Frontend | QA/Reviewer |
|---|---|---|---|---|
| Hardening Phase 1 | A/B | C | D | A/B |
| Department/Room/DoctorProfile | A | B | C | D |
| StaffSchedule/Appointment | B | A | C | D |
| Queue/VitalSign | B | A | C | D |
| ServiceCatalog/ServiceOrder | A/B | A | C | D |
| Lab workflow | B | A | C | D |
| Inventory/Dispense | A/B | A | C | D |
| Billing multi-item | B | A | C | D |
| Reports/Audit UI | C/D | A/B | C | D |

---

# 4. Roadmap 1 tháng

| Thời gian | Chặng | Nội dung chính | Kết quả bắt buộc |
|---|---|---|---|
| Ngày 1-3 | Phase 1.5 Hardening | Fix PrescriptionsController, RBAC UI thật, cashier invoice flow, audit coverage | Security pass, UC03/UC14 usable, audit baseline |
| Tuần 1 | Foundation | Department, Room, DoctorProfile, StaffSchedule, Appointment, check-in | Tạo lịch bác sĩ, đặt lịch, check-in tạo Visit |
| Tuần 2 | Queue + Vitals | QueueTicket, queue page, VitalSign, doctor view integration | Queue theo khoa/bác sĩ, nurse nhập sinh hiệu, doctor xem được |
| Tuần 3 | Service + Lab | ServiceCatalog, ServiceOrder, LabOrder, LabSample, LabResult | Doctor order lab, technician nhập result, doctor xem kết quả |
| Tuần 4 | Pharmacy + Billing + Polish | StockLot, StockMovement, Dispense, InvoiceItem refactor, reports, audit UI | End-to-end demo từ check-in đến payment + report |

---

# 5. Definition of Done và Quality Gates

| Gate | Điều kiện bắt buộc |
|---|---|
| Build/Lint | Backend `npm run build + npm run lint` pass; Frontend `npm run build + npm run lint` pass |
| Security | Không có controller non-public thiếu `@UseGuards`; mỗi handler sensitive có `@Roles` |
| DTO/Validation | Không nhận body `Record<string, unknown>`; không dùng any nếu có thể type rõ |
| Transaction | Appointment check-in, queue create, dispense, invoice create, payment phải dùng transaction khi có nhiều bảng |
| Audit | Create/update/delete hoặc state transition của clinical/finance/inventory phải log |
| Test | Mỗi module có unit/integration test cho happy path + ít nhất 2 lỗi nghiệp vụ |
| Frontend UX | Loading, empty, error state; confirm dialog cho cancel/delete/dispense/pay |
| Demo | D chạy demo script cuối ngày hoặc cuối sprint; lỗi demo là blocker |

---

# 6. Quy trình dùng Claude Code

Không dùng một prompt lớn để yêu cầu Claude Code "làm toàn bộ Phase 2". Mỗi lần chỉ yêu cầu một module hoặc một vertical slice nhỏ.

**Bước 1:** Owner module chuẩn bị prompt nhỏ — chỉ rõ files allowed, endpoint, DTO, business rules, tests required.  
**Bước 2:** Chạy Claude Code — không cho sửa ngoài phạm vi; nếu cần sửa schema phải hỏi A.  
**Bước 3:** Review diff — kiểm tra route guards, DTO, transaction, invented endpoint, schema drift.  
**Bước 4:** Build/lint/test — không merge nếu một trong các lệnh fail.  
**Bước 5:** Update changelog — ghi việc đã làm, lỗi gặp, API mới, migration mới, test coverage.

---

# 7. Interface contracts giữa các module

| Luồng | Contract bắt buộc |
|---|---|
| Appointment → Visit | Check-in appointment tạo Visit có `appointmentId`, `departmentId`, doctor reference và QueueTicket `priority=1` trong một transaction |
| Walk-in → Visit | Walk-in tạo Visit không có `appointmentId` và QueueTicket `priority=0`. Không duplicate queue ticket |
| Visit → VitalSign | VitalSign gắn `visitId`, chỉ một record trong MVP; tạo lần hai là update |
| Examination → ServiceOrder | Doctor tạo ServiceOrder từ Examination; `priceSnapshot` lấy từ ServiceCatalog tại thời điểm order |
| ServiceOrder → LabOrder | Nếu `ServiceType=LAB_TEST` thì tạo LabOrder tương ứng; trạng thái đồng bộ |
| Prescription → Dispense | Pharmacist chỉ dispense prescription thuộc examination COMPLETED; trừ kho khi dispense, không trừ khi prescribe |
| Dispense → StockMovement | Mỗi DispenseItem tạo StockMovement OUT và giảm `StockLot.quantityOnHand` trong cùng transaction |
| Visit → Invoice | Invoice gom exam fee, completed service orders, dispensed medicines; snapshot toàn bộ giá/mô tả |

---

# 8. Rủi ro và cách kiểm soát

| Rủi ro | Nguyên nhân | Mitigation |
|---|---|---|
| Scope creep | Thêm patient portal, SMS thật, BHYT, telemedicine | Khóa scope Phase 2A; mọi đề xuất mới đưa vào Future Scope |
| Schema drift do Claude | Claude tự thêm/bỏ field, tạo model trùng ý nghĩa | A là DB owner; mọi migration phải review trước khi chạy |
| Sai thời điểm trừ kho | Trừ kho khi kê đơn hoặc complete exam | Rule bắt buộc: chỉ trừ khi dispense; test riêng |
| Billing sai | Invoice tạo trùng item hoặc lấy giá hiện tại thay vì snapshot | Billing service dùng `referenceType/referenceId` và snapshot; test đổi giá sau invoice |
| RBAC sai | Role mới xem/sửa nhầm dữ liệu lâm sàng hoặc tài chính | D có checklist RBAC; test 403 cho Nurse/Pharmacist/Lab/Cashier |
| Queue race condition | Hai bệnh nhân cùng queueNumber | Tạo queueNumber trong transaction; unique `departmentId+queueDate+queueNumber` |
| Lab state lỏng | Technician nhập result cho cancelled order hoặc verify chính result của mình | Enum/validation status; test negative cases |
| Frontend invented endpoint | FE gọi API chưa có hoặc khác backend | C phải cập nhật api.ts từ OpenAPI/backend route thật; D kiểm tra integration |

---

# Phụ lục A — Bản rút gọn hướng dẫn Claude Code nên dùng

1. Do not change tech stack. Keep NestJS + Prisma + PostgreSQL + React.
2. Do not implement the whole Phase 2A at once.
3. Fix Phase 1.5 blockers first: prescription route security, RBAC UI, cashier invoice flow, audit coverage.
4. Follow module order: foundation → appointment → queue/vitals → service/lab → inventory/dispense → billing/report/audit.
5. Every non-public controller must have `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles` on sensitive handlers.
6. Business logic belongs in services. Controllers are thin delegates.
7. Transaction required for appointment check-in, queue creation, dispense, invoice creation, payment.
8. Never deduct stock during prescription or examination complete. Deduct only on pharmacist dispense.
9. Invoice items must snapshot price and description at invoice creation time.
10. Do not add fields/models/endpoints not listed in the task prompt. Stop and ask if current schema conflicts.
11. Add tests for state transitions, RBAC, inventory quantity, invoice snapshot, and appointment conflicts.
12. After each task run build, lint, and tests before reporting success.
