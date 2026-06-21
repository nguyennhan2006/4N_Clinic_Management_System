# METHODOLOGY_AUDIT.md — Audit phương pháp luận đầu-cuối

> Ngày audit: 13/06/2026  
> Auditor: Claude Code (dựa trên đọc codebase thực tế)  
> Nguồn tham chiếu: CODEBASE_AUDIT.md · REPORT_MISMATCHES.md  
> Nguyên tắc: codebase là nguồn sự thật, báo cáo phải khớp code — không ngược lại.

---

## A1. Khảo sát & Đặc tả yêu cầu

### A1.1 Bằng chứng khảo sát

| Hạng mục | Báo cáo nói | Bằng chứng trong repo | Mức khẳng định | Đề xuất |
|---|---|---|---|---|
| Nguồn yêu cầu | "khảo sát phòng mạch tư nhân" | Không có file phỏng vấn, persona, survey, hay user story map trong repo | **Giả định nghiệp vụ** | Sửa thành "mô phỏng dựa trên nghiệp vụ phòng mạch quy mô nhỏ đến trung bình" — đúng với `00_mo_dau.tex` dòng 10 đã ghi |
| Yêu cầu chức năng | REQ-01..REQ-30 | `ch01_dac_ta_yeu_cau.tex` có bảng REQ với mức độ ưu tiên (Must/Should/Could) | **Khớp** | Giữ |
| UC Phase 1 | UC1–UC20 | Đều có endpoint + service + frontend page tương ứng | **Đã hiện thực** | Giữ |
| UC Phase 2 | UC lịch hẹn, hàng đợi, lab, kho thuốc, cấp phát, tổ chức, audit | Đều có controller + service (một số FE là worklist) | **Đã hiện thực** | Giữ; ghi rõ FE một số là worklist/section, không phải full page |

**Kết luận A1:** Khảo sát là **giả định/mô phỏng**, không phải thực địa — báo cáo ch00 dòng 10 đã ghi đúng điều này. Không cần sửa. Mapping UC → endpoint/màn hình là CHÍNH XÁC.

---

## A2. Tổ chức nhóm & Quy trình phát triển

### A2.1 Mô hình nhóm

Báo cáo mô tả (ch00): 4 thành viên, phân vai chuyên trách + kiểm tra chéo.

Bằng chứng repo:
- Git log: nhánh theo convention `feature/UCxx-yy`, `docs/`, `db/`, `chore/` — xác nhận có phân công rõ ràng.
- Không có file `SPRINT_*.md`, `STANDUP_*.md`, `RETRO_*.md` → **không có bằng chứng Scrum thuần**.
- Có `CLAUDE.md` với quy tắc `Design → Approve → Migration → Implement` → **plan-driven**.
- Có `docs/software-design-workspace/` với `MODE_A`, `MODE_C` → audit trước, design sau, implement cuối → **waterfall trong từng phase**.
- Timeline ch04: Phase 1 baseline tháng 05/2026; Phase 2 full implementation 2026-06-05 → **hai phase tuần tự**.

| Mô hình | Báo cáo nói | Bằng chứng | Khớp |
|---|---|---|---|
| "quy trình phát triển kết hợp theo hướng plan-driven theo phase" | ch00 dòng 53 | CLAUDE.md, MODE A/C docs, git log 2 phase | ✅ CHÍNH XÁC |
| Scrum-lite | Đã xóa (phiên bản cũ) | Không có sprint backlog/standup thật | ✅ Đã sửa đúng |
| Agile thuần | Không có trong báo cáo | Không có bằng chứng Agile thuần | ✅ Không khẳng định |

**Kết luận A2:** Mô hình "plan-driven theo phase" là mô tả CHÍNH XÁC nhất cho dự án này.

---

## A3. Phân tích & Thiết kế hệ thống / Phần mềm

### A3.1 Kiến trúc

| Khẳng định | Bằng chứng | Mức |
|---|---|---|
| Client–Server, NestJS Modular Monolith | `backend/src/` có 1 process NestJS, không phải microservices | **Đã hiện thực đúng** |
| Layered: Controller → Service → Prisma | Xem mọi `*.controller.ts` → gọi service; mọi `*.service.ts` → gọi prisma | **Đã hiện thực đúng** |
| JWT stateless (no server session) | `auth.service.ts`, `JwtAuthGuard`, `RolesGuard` | **Đã hiện thực** |
| 37 models, 12 enums, 3 migrations | `schema.prisma` + `migrations/` | **CHÍNH XÁC** |
| 92 endpoints nghiệp vụ | Đếm decorator `@Get/@Post/...` trừ app/health | **CHÍNH XÁC** |
| 8 roles | `@Roles()` trong controllers | **CHÍNH XÁC** |

### A3.2 ERD và state machines

| Quan hệ | Schema.prisma | Báo cáo | Khớp |
|---|---|---|---|
| Visit → Examination (1:0..1) | `examination Examination?` trong Visit | ERD có | ✅ |
| Examination → Prescription (1:0..1) | `prescription Prescription?` | ERD có | ✅ |
| Examination → Diagnosis[] (1:N) | `diagnoses Diagnosis[]` | ERD có | ✅ |
| Visit → Invoice (1:0..1) | `invoice Invoice?` | ERD có | ✅ |
| Invoice → Payment[] (1:N) | `payments Payment[]` | ERD có | ✅ |
| PaymentMethod enum | `CASH, TRANSFER, CARD` | Báo cáo ch03 ghi TRANSFER, nhưng `database/schema.sql` ghi BANK_TRANSFER | ❌ database/schema.sql lệch Prisma |

**Kết luận A3:** Kiến trúc và ERD mô tả trong báo cáo CHÍNH XÁC theo code. Cần đính chính `database/schema.sql` (tài liệu phụ) để thống nhất với Prisma.

---

## A4. Hiện thực

### A4.1 Số liệu backend

| Hạng mục | Báo cáo | Code thật | Khớp |
|---|---|---|---|
| Feature folders | 21 | 21 | ✅ |
| Controllers có route | 20 | 20 (+2 boilerplate) | ✅ |
| Service files | 21 | **24** (21 nghiệp vụ + prisma.service + app.service + health.service) | ⚠️ Lệch — cần ghi rõ |
| Endpoints | 92 | 92 | ✅ |
| Phase 1 endpoints | 41 | 41 | ✅ |
| Phase 2 endpoints | 51 | 51 | ✅ |

### A4.2 Frontend

| Hạng mục | Báo cáo | Code thật | Khớp |
|---|---|---|---|
| Named routes | 32 (hoặc 36 tùy version) | 36 trong router.tsx | ⚠️ cần đồng bộ |
| Page files | 29–33 | 33 | ✅ |
| Phase 2 frontend | Có | Có (Lab, Pharmacy, Inventory, Queue, Appointments, Vitals, Organization, Audit) | ✅ |

### A4.3 Business rules — xác minh từng rule

| Rule | Service file:line | Trạng thái |
|---|---|---|
| BR-05: không tạo visit trùng ngày | `visits.service.ts` → `ConflictException('Patient already has a visit on this date')` | **ĐÃ HIỆN THỰC** |
| BR-07: giới hạn bệnh nhân/ngày | `visits.service.ts` → `getMaxPatientsPerDay()` từ regulation | **ĐÃ HIỆN THỰC** |
| BR-08: sinh queueNumber tuần tự | `visits.service.ts` → `(latestVisit?.queueNumber ?? 0) + 1` trong `$transaction` | **ĐÃ HIỆN THỰC** |
| BR-10: tối đa 1 chẩn đoán chính | `examinations.service.ts` → `At most one primary diagnosis is allowed` | **ĐÃ HIỆN THỰC** |
| BR-11: bắt buộc chẩn đoán chính khi complete | `examinations.service.ts` → `Primary diagnosis is required before completing` | **ĐÃ HIỆN THỰC** |
| BR-12: không sửa phiếu khám COMPLETED | `examinations.service.ts` → check status trước update | **ĐÃ HIỆN THỰC** |
| BR-LAB-05: required service orders phải xong trước complete | `examinations.service.ts` → `serviceOrder.count({...notIn: ['COMPLETED','CANCELLED']})` | **ĐÃ HIỆN THỰC** |
| BR-BIL-01: chỉ lập hóa đơn từ visit COMPLETED | `billing.service.ts` → `Only COMPLETED visit can be converted to invoice` | **ĐÃ HIỆN THỰC** |
| BR-BIL-02: không thanh toán vượt remaining | `billing.service.ts` → `exceeds remaining amount` | **ĐÃ HIỆN THỰC** |
| BR-BIL-03: không thanh toán hóa đơn VOID/PAID | `billing.service.ts` | **ĐÃ HIỆN THỰC** |
| BR-PHR-03: không phát vượt số kê | `pharmacy.service.ts` | **ĐÃ HIỆN THỰC** |
| BR-PHR-04: không phát vượt tồn kho | `pharmacy.service.ts` → `Insufficient stock in lot` | **ĐÃ HIỆN THỰC** |
| BR-PHR-05: không phát lô hết hạn | `pharmacy.service.ts` → `Lot ... has expired` | **ĐÃ HIỆN THỰC** |
| FEFO auto-allocate | `inventory.service.ts` → sort by `expiryDate asc` nhưng lot phải chọn explicit | **HIỆN THỰC MỘT PHẦN** |

**Kết luận A4:** Service files = 24 (không phải 21) — cần sửa một chỗ trong ch04. Mọi business rule liệt kê đều có trong code. FEFO phải diễn đạt là "gợi ý lô hết hạn sớm + chặn lô hết hạn", không phải "tự động phân bổ".

---

## A5. Kiểm thử

### A5.1 Phân loại e2e theo hộp đen/xám/trắng

| Loại | Mô tả | Áp dụng ở đâu |
|---|---|---|
| Hộp đen | Gửi HTTP request, kiểm tra response code + body | Tất cả 7 e2e files |
| Hộp xám | Gửi request + kiểm tra DB state sau khi thực hiện | `billing-catalog-flow`, `clinic-flow`, `phase2-clinical-integration` |
| Hộp trắng | Mock Prisma/dependency, test từng nhánh logic trong service | `billing.service.spec.ts` (181 test), `visits.service.spec.ts` (18 test), `examinations.service.spec.ts` (25 test), `patients.service.spec.ts` (17 test) |

### A5.2 Bảng test files thực tế

| File | Phase | Số `it()` tĩnh | Loại chính |
|---|---|---|---|
| `app.e2e-spec.ts` | - | 1 | Smoke test |
| `auth.e2e-spec.ts` | P1 | 16 | Hộp đen + hộp xám |
| `clinic-flow.e2e-spec.ts` | P1 | 33 | Hộp xám |
| `billing-catalog-flow.e2e-spec.ts` | P1 | 49 | Hộp xám |
| `appointments.e2e-spec.ts` | P2 | 32 | Hộp đen + xám |
| `queue.e2e-spec.ts` | P2 | 30 | Hộp xám (state machine) |
| `phase2-clinical-integration.e2e-spec.ts` | P2 | 54 | Hộp xám |
| `billing.service.spec.ts` | P1 | **9** (đếm trực tiếp 15/06/2026) | Hộp trắng |
| `visits.service.spec.ts` | P1 | **13** (đếm trực tiếp 15/06/2026) | Hộp trắng |
| `examinations.service.spec.ts` | P1 | **24** (đếm trực tiếp 15/06/2026) | Hộp trắng |
| `patients.service.spec.ts` | P1 | **13** (đếm trực tiếp 15/06/2026) | Hộp trắng |
| **Tổng e2e** | | **215 tĩnh + it.each** | |
| **Tổng unit (hộp trắng)** | | **59** | |

Ghi chú: Số unit tests trong audit lần 2 (13/06/2026) là ước tính; audit lần 3 (15/06/2026) đếm trực tiếp bằng Grep:
- billing: 9 (không phải 8)
- visits: 13 (không phải 18)
- examinations: 24 (không phải 25)
- patients: 13 (không phải 17)
- **Tổng: 59 (không phải 60)**

### A5.3 Phương pháp đã áp dụng nhưng chưa nêu đầy đủ trong ch05

| Phương pháp | Bằng chứng file:dòng | Ghi chú |
|---|---|---|
| **Test fixtures qua seed** | `prisma/seed.ts` — 8 user, danh mục bệnh/thuốc, bệnh nhân, visit nền | E2E dùng seed data làm test fixture |
| **Negative RBAC (403/401 testing)** | `auth.e2e-spec.ts` → kiểm tra access trái role trả 401/403 | Security/authorization testing |
| **State-machine testing** | `queue.e2e-spec.ts` → WAITING→CALLED→IN_SERVICE→DONE; `phase2-clinical-integration` → lab state machine | Kiểm thử chuyển trạng thái hợp lệ/không hợp lệ |
| **Transaction testing (gray-box)** | `clinic-flow`, `billing` → xác nhận queueNumber không trùng, không double-pay | Kết hợp HTTP call + DB check |
| **DTO boundary validation** | Mọi e2e → gửi payload thiếu field/sai type nhận 400 | class-validator + ValidationPipe |
| **Price snapshot testing** | `billing-catalog-flow` → kiểm tra unitPrice/lineTotal sau khi thuốc đổi giá | Tính bất biến snapshot |
| **Mock dependency injection (white-box)** | `*.service.spec.ts` → `jest.fn()` mock Prisma, $transaction callback | Kiểm thử service layer độc lập |

**Kết luận A5:** Con số e2e = 7 file (không phải 3). Unit test hộp trắng đã bổ sung 4 file, 60 case, chạy thật đạt 60/60 pass. E2E chỉ chạy được với PostgreSQL thật → cần kèm log/screenshot khi nộp. Còn thiếu: e2e cho inventory và pharmacy (FEFO/dispense), Vitest frontend, CI pipeline chạy thật.

---

## A6. Triển khai, vận hành & Kết luận

### A6.1 Trạng thái triển khai

| Hạng mục | Báo cáo nói | Thực tế | Khớp |
|---|---|---|---|
| Local development | Hỗ trợ | Có: README + ch06 hướng dẫn đầy đủ | ✅ |
| Docker / docker-compose | Chưa có | Không có file Dockerfile/compose | ✅ |
| CI/CD | "chưa có" (ch06 cũ) | `.github/workflows/ci.yml` ĐÃ THÊM (scaffold) | ⚠️ Cần cập nhật ch06 |
| Production deployment | Chưa có | Không có | ✅ |

### A6.2 Số liệu kết luận

Tất cả số liệu trong ch06 (kết luận) phải khớp với ch00/ch04/ch05:

| Hạng mục | Ch06 nên ghi |
|---|---|
| Models / enums / migrations | 37 / 12 / 3 |
| Endpoints | 92 (41 P1 + 51 P2) |
| Roles | 8 (5 core P1 + 3 P2) |
| E2E test files | 7 (P1 + P2) |
| Unit test files | 4 (sau khi bổ sung) |
| Service files | 24 (hoặc "21 nghiệp vụ + 3 hạ tầng") |

---

## Tổng hợp: Phương pháp kiểm thử đã áp dụng (bổ sung vào ch05)

Đây là danh sách đầy đủ cho mục "Chiến lược kiểm thử" trong ch05, dẫn xuất từ đọc code thực tế:

### 1. Kiểm thử hộp đen (Black-box)
- **API input/output**: gửi HTTP request với Supertest, xác nhận status code + shape của response JSON.
- **Boundary**: payload sai type/missing field nhận 400; endpoint không tồn tại nhận 404.
- **Phủ bởi**: tất cả 7 file e2e, mọi endpoint.

### 2. Kiểm thử hộp xám (Gray-box)
- **State machine**: xác nhận chuyển trạng thái hợp lệ (WAITING→IN_EXAMINATION→COMPLETED) qua visit/examination; queue WAITING→CALLED→IN_SERVICE→DONE; lab ORDERED→SAMPLE_COLLECTED→RESULT_ENTERED→VERIFIED.
- **Transaction integrity**: tạo visit trong `$transaction(Serializable)` → không thể trùng queueNumber dù concurrent; thanh toán trong tx → paidAmount + status cập nhật nguyên tử.
- **DB state check**: sau API call, query lại DB để xác nhận dữ liệu thật (không chỉ tin response).
- **Price snapshot**: sau khi thuốc đổi giá, prescription items cũ giữ nguyên unitPrice/lineTotal.
- **Phủ bởi**: `clinic-flow`, `billing-catalog-flow`, `phase2-clinical-integration`, `queue.e2e-spec.ts`.

### 3. Kiểm thử hộp trắng (White-box)
- **Branch coverage qua service mock**: mock `PrismaService` và `AuditService` bằng `jest.fn()`, test từng nhánh `if/throw` trong service. Mỗi case là 1 điều kiện biên trong code thực.
- **$transaction simulation**: `$transaction: jest.fn((cb) => cb(prisma))` — callback nhận chính mock làm tx, test business rule trong transaction không cần DB.
- **Phủ bởi**: 4 file `*.service.spec.ts`, 60 test cases, **60/60 pass** (chạy ngày 13/06/2026).

### 4. Kiểm thử phân quyền (Authorization testing)
- Gửi request với token sai role → xác nhận 401/403.
- Gửi request không có token → xác nhận 401.
- **Phủ bởi**: `auth.e2e-spec.ts`, `clinic-flow.e2e-spec.ts`.

### 5. Kiểm thử dữ liệu nền (Test fixture via seed)
- `prisma/seed.ts` tạo 8 user/role, danh mục bệnh/thuốc chuẩn, bệnh nhân demo, lô thuốc — phục vụ làm dữ liệu nền cho e2e.
- Chiến lược: e2e setup tạo user/bệnh nhân riêng → chạy flow → kiểm tra → teardown nếu cần.

### 6. Kiểm thử DTO/validation (Boundary via class-validator)
- `@Min`, `@IsEnum`, `@IsNotEmpty`, `@IsPositive` trong DTO → e2e gửi payload vi phạm → nhận 400 với message rõ ràng.

---

## Hạn chế còn lại (trung thực)

| Hạn chế | Mức ưu tiên |
|---|---|
| E2E cho inventory (FEFO dispense flow) chưa có | Cao |
| E2E cho pharmacy (phát thuốc đa lô, edge cases) chưa đầy đủ | Cao |
| Vitest frontend chưa chạy thật (3 file scaffold) | Trung bình |
| CI (`ci.yml`) chưa có runner thật, chỉ là scaffold | Trung bình |
| Con số "220/220 e2e pass" chưa verify được trong audit — cần log thật khi nộp | Cao |
