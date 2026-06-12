# 03 — Module Inventory Phase 1 & Phase 2

> Audit date: 2026-06-07 | Nguồn: `backend/src/modules/` scan thật

---

## Canonical counts (thống nhất với file 00)

- Backend feature folders: **21**
- Controllers: **20** (prescriptions = service-only, không có controller)
- Service files: **21**
- Phase 1 modules: **11** (auth, users, rbac, patients, visits, examinations, prescriptions, diseases, drugs, billing, regulations) + reports(P1 phần monthly)
- Phase 2 modules: **10** (appointments, queue, vitals, services, lab, inventory, pharmacy, organization, audit) + reports(P2 phần revenue-breakdown)

---

## 1. Module Inventory đầy đủ

| # | Module | Phase | Controller | Service | DTO folder | Guard | Prisma Models | API endpoints | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | auth | P1 | auth.controller.ts | auth.service.ts | dto/ | Public (login), JwtAuth (rest) | User, RefreshToken | 4 | CONFIRMED |
| 2 | users | P1 | users.controller.ts | users.service.ts | dto/ | JwtAuth + Roles(ADMIN) | User, Role, UserRole | 6 | CONFIRMED |
| 3 | rbac | P1 | rbac.controller.ts | rbac.service.ts | dto/ | JwtAuth + Roles(ADMIN) | Role, Permission, RolePermission | 3 | CONFIRMED |
| 4 | patients | P1 | patients.controller.ts | patients.service.ts | dto/ | JwtAuth + Roles | Patient | 4 | CONFIRMED |
| 5 | visits | P1 | visits.controller.ts | visits.service.ts | dto/ | JwtAuth + Roles | Visit | 3 | CONFIRMED |
| 6 | examinations | P1 | examinations.controller.ts | examinations.service.ts | dto/ | JwtAuth + Roles | Examination, Diagnosis | 6 | CONFIRMED |
| 7 | prescriptions | P1 | **KHÔNG CÓ** | prescriptions.service.ts | — | — | Prescription, PrescriptionItem | 0 (service-only) | CONFIRMED |
| 8 | diseases | P1 | diseases.controller.ts | diseases.service.ts | dto/ | JwtAuth + Roles | Disease | 3 | CONFIRMED |
| 9 | drugs | P1 | drugs.controller.ts | drugs.service.ts | dto/ | JwtAuth + Roles | Drug | 3 | CONFIRMED |
| 10 | billing | P1 | billing.controller.ts | billing.service.ts | dto/ | JwtAuth + Roles | Invoice, InvoiceItem, Payment | 5 | CONFIRMED |
| 11 | regulations | P1 | regulations.controller.ts | regulations.service.ts | dto/ | JwtAuth + Roles | RegulationVersion, RegulationItem | 3 | CONFIRMED |
| 12 | reports | P1+P2 | reports.controller.ts | reports.service.ts | dto/ | JwtAuth + Roles | — (aggregate) | 2 (monthly P1 + revenue-breakdown P2) | CONFIRMED |
| 13 | appointments | P2 | appointments.controller.ts | appointments.service.ts | dto/ | JwtAuth + Roles | Appointment | 6 | CONFIRMED |
| 14 | queue | P2 | queue.controller.ts | queue.service.ts | dto/ | JwtAuth + Roles | QueueTicket | 4 | CONFIRMED |
| 15 | vitals | P2 | vitals.controller.ts | vitals.service.ts | dto/ | JwtAuth + Roles | VitalSign | 2 | CONFIRMED |
| 16 | services | P2 | services.controller.ts | services.service.ts | dto/ | JwtAuth + Roles | ServiceCatalog, LabTestCatalog, ServiceOrder | 7 | CONFIRMED |
| 17 | lab | P2 | lab.controller.ts | lab.service.ts | dto/ | JwtAuth + Roles | LabOrder, LabSample, LabResult | 7 | CONFIRMED |
| 18 | inventory | P2 | inventory.controller.ts | inventory.service.ts | dto/ | JwtAuth + Roles | StockLot, StockMovement | 6 | CONFIRMED |
| 19 | pharmacy | P2 | pharmacy.controller.ts | pharmacy.service.ts | dto/ | JwtAuth + Roles | Dispense, DispenseItem | 5 | CONFIRMED |
| 20 | organization | P2 | organization.controller.ts | organization.service.ts | dto/ | JwtAuth + Roles | Department, Room, DoctorProfile, StaffSchedule | 12 | CONFIRMED |
| 21 | audit | P2 | audit.controller.ts | audit.service.ts | — | JwtAuth + Roles(ADMIN) | AuditLog | 1 | CONFIRMED |

> `prescriptions` là **service-only module** — được gọi từ `examinations.service.ts`, không có route HTTP trực tiếp. Không được tính là 1 API module.

---

## 2. Shared/Common (không phải feature module)

| Thành phần | Path | Vai trò |
|---|---|---|
| PrismaModule / PrismaService | `backend/src/prisma/` | DB client, shared toàn app |
| JwtAuthGuard | `backend/src/common/guards/jwt-auth.guard.ts` | Validate Bearer token |
| RolesGuard | `backend/src/common/guards/roles.guard.ts` | Check @Roles() decorator |
| PrismaExceptionFilter | `backend/src/common/filters/` | Map Prisma errors → HTTP exceptions |
| @Roles() decorator | `backend/src/common/decorators/` | Khai báo role yêu cầu |
| @CurrentUser() decorator | `backend/src/common/decorators/` | Inject user từ JWT payload |

---

## 3. Phase 1 — Nghiệp vụ lõi

```text
Phase 1 = Quy trình cốt lõi của phòng mạch tư:
  Xác thực (auth, users, rbac)
  → Tiếp nhận bệnh nhân (patients, visits)
  → Khám bệnh & kê đơn (examinations, prescriptions, diseases, drugs)
  → Thanh toán (billing)
  → Quy định & danh mục (regulations)
  → Báo cáo tháng (reports/monthly)
```

Phase 1 endpoints: **41**

---

## 4. Phase 2 — Mở rộng vận hành phòng khám

```text
Phase 2 = Mở rộng quy trình vận hành:
  Lịch hẹn & hàng đợi (appointments, queue)
  → Sinh hiệu & dịch vụ lâm sàng (vitals, services)
  → Xét nghiệm (lab)
  → Kho thuốc & cấp phát (inventory, pharmacy)
  → Tổ chức nhân sự (organization)
  → Nhật ký hệ thống (audit)
  → Báo cáo doanh thu mở rộng (reports/revenue-breakdown)
```

Phase 2 endpoints: **51**

---

## 5. Dependency giữa Phase 1 và Phase 2

| Module P2 | Phụ thuộc P1 (data/logic) |
|---|---|
| appointments | patients, users, organization (DoctorProfile) |
| queue | visits |
| vitals | visits, users |
| services | visits, examinations, billing (InvoiceItem) |
| lab | services (ServiceOrder → LabOrder) |
| inventory | drugs |
| pharmacy | prescriptions, drugs, inventory (StockLot FEFO) |
| organization | users |
| audit | users |
| reports (P2) | billing, pharmacy, services |

---

## 6. Module Missing / Out-of-scope

| Module | Trạng thái | Ghi chú |
|---|---|---|
| Patient portal | MISSING (out-of-scope) | Không có trong Phase 1 hoặc Phase 2 |
| Online booking (public) | MISSING (out-of-scope) | Chỉ có internal appointments |
| SMS / email reminder | MISSING (out-of-scope) | Không có notification service |
| Insurance workflow | MISSING (out-of-scope) | Chưa có trong codebase |
| Multi-branch | MISSING (out-of-scope) | Single-tenant |
| Telemedicine | MISSING (out-of-scope) | Không có video/chat |
| Docker / CI-CD | MISSING | Không tìm thấy Dockerfile hoặc .github/workflows/ |
