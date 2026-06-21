# CODEBASE_AUDIT.md — Nguồn sự thật từ mã nguồn

> Ngày audit: 13/06/2026, cập nhật 15/06/2026. Nguồn: đọc trực tiếp mã nguồn (schema.prisma, controllers, services, seed, frontend routes/pages, test files). Báo cáo KHÔNG được dùng làm nguồn sự thật.
>
> Quy ước: con số dưới đây là kết quả đo trực tiếp từ code tại thời điểm audit.

## 1. Roles (RBAC)

Nguồn: `backend/prisma/seed.ts` (định nghĩa Role), `@Roles(...)` trong các controller, `ROLES` constant.

**8 vai trò tồn tại thật và đều được dùng trong guard `@Roles`:**

| # | Role code | Tên | Có dùng trong @Roles? |
|---|---|---|---|
| 1 | ADMIN | Quản trị viên | Có (mọi module) |
| 2 | DOCTOR | Bác sĩ | Có (visits, examinations, lab, queue...) |
| 3 | RECEPTIONIST | Lễ tân | Có (patients, visits, appointments) |
| 4 | CASHIER | Thu ngân | Có (billing) |
| 5 | MANAGER | Quản lý | Có (reports, billing, audit, inventory) |
| 6 | NURSE | Điều dưỡng | Có (vitals, queue, lab sample, appointments) |
| 7 | LAB_TECHNICIAN | KTV xét nghiệm | Có (lab) |
| 8 | PHARMACIST | Dược sĩ | Có (pharmacy, inventory) |

Kết luận: 8 role là THẬT và được enforce ở backend, không phải định hướng. 5 role "core Phase 1" (ADMIN, DOCTOR, RECEPTIONIST, CASHIER, MANAGER) + 3 role phục vụ Phase 2 (NURSE, LAB_TECHNICIAN, PHARMACIST).

## 2. Database (Prisma schema)

Nguồn: `backend/prisma/schema.prisma`, `backend/prisma/migrations/`.

| Hạng mục | Số đo thực tế |
|---|---|
| Models | **37** |
| Enums | **12** |
| Migrations | **3** (`20250519000000_baseline`, `20260518102948_add_identity_access_system`, `20260520192733_phase2a_foundation`) |

37 models gồm cả nhóm Phase 2: `Appointment`, `QueueTicket`, `VitalSign`, `ServiceCatalog`, `LabTestCatalog`, `ServiceOrder`, `LabOrder`, `LabSample`, `LabResult`, `StockLot`, `StockMovement`, `Dispense`, `DispenseItem`, `Department`, `Room`, `DoctorProfile`, `StaffSchedule`, `AuditLog`, `RegulationVersion`/`RegulationItem` — tất cả đều có trong schema.

12 enums: UserStatus, VisitStatus, ExaminationStatus, InvoiceStatus, PaymentMethod, AppointmentStatus, QueueStatus, ServiceType, DispenseStatus, StockMovementType, LabOrderStatus, ServiceOrderStatus.

**Lưu ý enum PaymentMethod:** giá trị thật trong Prisma là `CASH`, `TRANSFER`, `CARD`. (File `database/schema.sql` ghi `CASH/BANK_TRANSFER/CARD/OTHER` — KHÔNG khớp với Prisma; Prisma là nguồn chốt.)

## 3. Backend modules & endpoints

Nguồn: `backend/src/modules/`, đếm decorator `@Get/@Post/@Patch/@Put/@Delete`.

| Hạng mục | Số đo thực tế |
|---|---|
| Feature folders | **21** (gồm `prescriptions` là service-only) |
| Controller có route | **20** module + 2 boilerplate (`app`, `health`) |
| Service files | **24** (gồm `prisma.service`, các service phụ trong auth/rbac/audit) |
| HTTP endpoints (tất cả) | **94** |
| HTTP endpoints nghiệp vụ (trừ app+health) | **92** |

Phân bố endpoint theo controller: organization 12, lab 7, services 7, inventory 6, examinations 6, appointments 6, users 6, billing 5, pharmacy 5, auth 4, queue 4, patients 4, drugs 3, diseases 3, rbac 3, regulations 3, visits 3, reports 2, vitals 2, audit 1 (+ app 1, health 1).

Kết luận: con số **92 endpoints** và **37 models / 12 enums / 3 migrations** trong báo cáo là CHÍNH XÁC. "21 feature folders, 20 controllers có route" CHÍNH XÁC. "21 service files" hơi lệch — thực tế **24** service files.

## 4. Business rules đã hiện thực (đọc service code)

| Rule | Vị trí | Trạng thái |
|---|---|---|
| Không tạo visit trùng ngày | `visits.service.ts` → `ConflictException('Patient already has a visit on this date')` | ĐÃ HIỆN THỰC |
| Giới hạn bệnh nhân/ngày (quota) | `visits.service.ts` → `maxPatientsPerDay` từ regulation, `Daily patient limit reached` | ĐÃ HIỆN THỰC |
| Sinh queueNumber tuần tự | `visits.service.ts` → `(latestVisit?.queueNumber ?? 0) + 1` trong `$transaction` | ĐÃ HIỆN THỰC |
| Tối đa 1 chẩn đoán chính | `examinations.service.ts` → `At most one primary diagnosis is allowed` | ĐÃ HIỆN THỰC |
| Bắt buộc chẩn đoán chính khi hoàn tất khám | `examinations.service.ts` → `Primary diagnosis is required before completing examination` | ĐÃ HIỆN THỰC |
| Không sửa phiếu khám đã COMPLETED | `examinations.service.ts` → chặn update khi status COMPLETED | ĐÃ HIỆN THỰC |
| Chỉ lập hóa đơn từ visit COMPLETED | `billing.service.ts` → `Only COMPLETED visit can be converted to invoice` | ĐÃ HIỆN THỰC |
| Không thanh toán vượt remaining | `billing.service.ts` → `exceeds remaining amount` | ĐÃ HIỆN THỰC |
| Không thanh toán hóa đơn VOID/PAID | `billing.service.ts` | ĐÃ HIỆN THỰC |
| Không phát thuốc vượt số kê | `pharmacy.service.ts` → BR-PHR-03 | ĐÃ HIỆN THỰC |
| Không phát vượt tồn kho | `pharmacy.service.ts` → `Insufficient stock in lot` | ĐÃ HIỆN THỰC |
| Không phát lô hết hạn | `pharmacy.service.ts` → `Lot ... has expired` | ĐÃ HIỆN THỰC |
| FEFO (ưu tiên lô hết hạn sớm) | `inventory.service.ts` → `orderBy: { expiryDate: 'asc' }`; lot truyền explicit khi dispense | HIỆN THỰC MỘT PHẦN (gợi ý theo expiry + chặn hết hạn; KHÔNG tự động phân bổ lô) |
| Lab state machine ORDERED→...→VERIFIED | `lab.service.ts` | ĐÃ HIỆN THỰC |

## 5. Frontend (pages & navigation)

Nguồn: `frontend/src/features/*`, `frontend/src/config/navigation.ts`.

**27 màn hình `*Page.tsx`** (đếm trực tiếp từ `frontend/src/features/` và `frontend/src/pages/`) + các worklist/section component bổ sung. Navigation có các mục: Dashboard, Bệnh nhân, Lịch hẹn, Lượt khám, Hàng đợi, **Xét nghiệm (/app/lab)**, **Phát thuốc (/app/pharmacy)**, Hóa đơn, **Tồn kho**, Danh mục dịch vụ, Báo cáo tháng, Danh mục bệnh/thuốc, Khoa & Phòng, Hồ sơ bác sĩ, Quy định, Tài khoản, Nhật ký hệ thống.

Phase 2 frontend có thật: `lab/LabWorklist.tsx`, `pharmacy/PharmacyWorklist.tsx`, `vitals/VitalSignSection.tsx`, `inventory/StockListPage.tsx`, `appointments/*`, `queue/QueueDashboardPage.tsx`, `services/ServiceCatalogPage.tsx`, `organization/*`, `audit/AuditLogPage.tsx`.

Kết luận: frontend bao phủ cả Phase 1 và Phase 2. Không phát hiện màn hình nào trong báo cáo mà code không có (ở mức module).

## 6. Testing

Nguồn: `backend/test/*.e2e-spec.ts`, `backend/src/**/*.spec.ts`.

| Hạng mục | Số đo thực tế |
|---|---|
| File e2e | **7** (`auth`, `clinic-flow`, `billing-catalog-flow`, `appointments`, `queue`, `phase2-clinical-integration`, `app`) |
| `it()/test()` tĩnh | **215** (1+32+16+49+33+54+30) |
| `it.each` | 1 block (mở rộng thêm vài case khi chạy → tổng ~220) |
| Unit test (trước audit) | 1 boilerplate (`app.controller.spec.ts`) |
| Unit test hộp trắng bổ sung | 4 file: `billing.service.spec.ts` (**9 tests**), `visits.service.spec.ts` (**13 tests**), `examinations.service.spec.ts` (**24 tests**), `patients.service.spec.ts` (**13 tests**) → **tổng 59 tests** |
| Vitest FE / DB / CI | Vitest FE (3 file), `constraints_test.sql`, `.github/workflows/ci.yml` |

**Về con số đơn vị test:**
- billing: 9 tests (đếm trực tiếp từ `billing.service.spec.ts`)
- visits: 13 tests
- examinations: 24 tests
- patients: 13 tests
- **Tổng unit tests hộp trắng: 59** (không phải 60 như ghi trong audit lần 2)

**Về con số 220/220 e2e:** 215 case tĩnh + mở rộng `it.each` ≈ 220 là HỢP LÝ, nhưng audit này **không tự chạy lại được** bộ test trong môi trường hiện tại (node_modules cài trên Windows, không có mạng cài lại, e2e cần PostgreSQL). Vì vậy con số 220/220 phải giữ ở mức "theo log nhóm cung cấp" và cần screenshot/log thật khi nộp.

## 7. Triển khai / DevOps

Nguồn: tìm `Dockerfile`, `docker-compose*`, `.github/workflows/`.

| Hạng mục | Thực tế |
|---|---|
| Dockerfile / docker-compose dự án | KHÔNG có (chỉ có Dockerfile bên trong `node_modules/bcrypt`) |
| CI/CD trước audit | KHÔNG có |
| CI/CD sau audit | Đã thêm `.github/workflows/ci.yml` (scaffold, cần verify chạy thật trên GitHub) |
| Production deployment | KHÔNG có; hệ thống chạy local/dev |

## 8. Tổng kết độ tin cậy số liệu báo cáo

Phần lớn số liệu headline của báo cáo (37 models, 12 enums, 3 migrations, 92 endpoints, 8 roles, 7 e2e files) **khớp với code**. Các điểm đã được sửa:
- Số service files: 21→24 ✅ đã sửa trong báo cáo ch00/ch04
- Enum PaymentMethod: BANK_TRANSFER→TRANSFER ✅ đã sửa
- "3 vs 7 e2e files": ✅ đã sửa thành 7 file
- FEFO: ✅ đã diễn đạt lại chính xác
- CI scaffold: ✅ đã cập nhật ch06
- Unit test billing: **9 tests** (không phải 8 như audit lần 2 ghi)
- Tổng unit tests hộp trắng: **59** (không phải 60)
- **LaTeX code fences** trong `04_hien_thuc.tex` và `05_kiem_thu.tex`: ✅ đã xóa (audit lần 3, 15/06/2026)
- **"Cần xác minh"** trong bảng unit tests ch05: ✅ đã thay bằng số đếm thật

Chi tiết ở `REPORT_MISMATCHES.md` và `LATEX_FIX_LOG.md`.
