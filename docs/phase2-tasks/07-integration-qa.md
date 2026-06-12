# Task 07 — Integration QA + Final Polish

> Branch: `feat/phase2-integration`  
> Merge vào: `develop`  
> Phụ thuộc: Tất cả Task 00–06 phải merged trước  
> Owner: Toàn team review, 1 người thực hiện  
> Estimated: 1–2 ngày

---

## Mục tiêu

Sau khi tất cả feature tasks được merge, task này:
1. Kiểm tra end-to-end flow hoàn chỉnh
2. Fix integration bugs phát sinh khi các module hoạt động cùng nhau
3. Cập nhật seed để demo flow đầy đủ Phase 2
4. Hoàn thiện navigation + RBAC sidebar cho roles mới
5. Tạo `frontend-docs/phase2-qa-report.md`

---

## Checklist E2E Flow

### Flow 1: Appointment → Check-in → Queue → Examination → Lab → Pharmacy → Invoice

```
1. RECEPTIONIST: tạo appointment cho patient + doctor
2. RECEPTIONIST/NURSE: check-in → QueueTicket số 1 created
3. NURSE: ghi vital signs cho visit
4. NURSE/DOCTOR: gọi bệnh nhân (WAITING → CALLED)
5. DOCTOR: bắt đầu khám (CALLED → IN_SERVICE)
6. DOCTOR: lập phiếu khám (diagnosis, symptoms)
7. DOCTOR: chỉ định dịch vụ xét nghiệm
8. DOCTOR: kê đơn thuốc
9. DOCTOR: hoàn tất phiếu khám → queue DONE
10. LAB_TECHNICIAN: lấy mẫu xét nghiệm
11. LAB_TECHNICIAN: nhập kết quả
12. PHARMACIST: phát thuốc → trừ kho
13. CASHIER: tạo hóa đơn (items: consultation + service + drugs)
14. CASHIER: ghi nhận thanh toán
15. ADMIN: xem audit log của toàn bộ flow trên
```

### Flow 2: Walk-in (không có appointment)

```
1. RECEPTIONIST: tạo visit trực tiếp (UC7 cũ — vẫn hoạt động)
2. Tiếp tục từ bước 3 ở Flow 1
```

Cả 2 flow phải hoạt động độc lập.

---

## Backend — Integration Fixes

### Kiểm tra Visit.status transitions

Sau Phase 2, Visit.status có thêm các trigger:
- `WAITING` (tạo visit ban đầu)
- `IN_EXAMINATION` (khi doctor open examination — UC9 Phase 1)
- `COMPLETED` (khi doctor complete examination — UC13 Phase 1)

Không thay đổi transitions hiện tại. QueueTicket.status là separate state.

### Kiểm tra examination complete với required services

`ExaminationsService.complete()` phải đã có check từ Task 04:
```typescript
// Verify task 04 đã merge đúng check này:
const requiredPending = await this.prisma.serviceOrder.count({
  where: {
    visitId: examination.visitId,
    isRequired: true,
    status: { notIn: ['COMPLETED', 'CANCELLED'] },
  },
})
if (requiredPending > 0) {
  throw new BadRequestException('Required services must be completed before finishing examination')
}
```

Nếu chưa có → thêm vào `examinations.service.ts`.

### Kiểm tra RBAC guard coverage

```bash
cd backend
grep -rn "@Controller\|@UseGuards\|@Roles" src/modules/ | grep -v ".spec."
```

Verify mọi controller đều có `@UseGuards(JwtAuthGuard)`. Mọi route nhạy cảm đều có `@Roles()`.

Expected: không có route nào thiếu guard (trừ health check và docs).

### Kiểm tra build sạch

```bash
cd backend
npm run build
# Không được có TypeScript errors
npm run lint
# Không được có lint errors
```

---

## Frontend — Integration Fixes

### Sidebar cuối cùng (tất cả roles)

Verify sidebar hiển thị đúng menu theo role:

| Menu item | ADMIN | MANAGER | RECEPTIONIST | DOCTOR | CASHIER | NURSE | LAB_TECH | PHARMACIST |
|-----------|-------|---------|--------------|--------|---------|-------|----------|------------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bệnh nhân | ✓ | ✓ | ✓ | ✓ | | | | |
| Lịch hẹn | ✓ | ✓ | ✓ | ✓ | | ✓ | | |
| Hàng đợi | ✓ | ✓ | | ✓ | | ✓ | | |
| Lượt khám | ✓ | ✓ | ✓ | ✓ | | | | |
| Hóa đơn | ✓ | ✓ | | | ✓ | | | |
| Xét nghiệm | ✓ | | | ✓ | | | ✓ | |
| Phát thuốc | ✓ | | | | | | | ✓ |
| Tồn kho | ✓ | ✓ | | | | | | ✓ |
| Báo cáo | ✓ | ✓ | | | ✓ | | | |
| Danh mục bệnh | ✓ | ✓ | | | | | | |
| Danh mục thuốc | ✓ | ✓ | | | | | | ✓ |
| Dịch vụ | ✓ | ✓ | | | | | | |
| Tổ chức | ✓ | ✓ | | | | | | |
| Lịch làm việc | ✓ | ✓ | | | | ✓ | | |
| Người dùng | ✓ | | | | | | | |
| Phân quyền | ✓ | | | | | | | |
| Quy định | ✓ | | | | | | | |
| Audit Log | ✓ | | | | | | | |

### 403 / Redirect kiểm tra

- NURSE truy cập `/app/admin/users` → redirect `/403`
- LAB_TECHNICIAN truy cập `/app/pharmacy` → redirect `/403`
- Không logged in truy cập bất kỳ `/app/*` → redirect `/login`

### Loading / Empty / Error states

Verify tất cả pages có:
- Skeleton khi loading
- EmptyState khi không có data
- ErrorState khi API fail (+ retry button nếu có thể)

---

## Seed Phase 2 đầy đủ

Cập nhật `backend/prisma/seed.ts` để demo Phase 2:

```typescript
// 1. Departments
const departments = await createDepartmentsIfNotExist([
  { name: 'Nội khoa', code: 'INTERNAL' },
  { name: 'Ngoại khoa', code: 'SURGERY' },
  { name: 'Xét nghiệm', code: 'LAB' },
])

// 2. Rooms
await createRoomsIfNotExist([
  { name: 'Phòng khám 1', departmentId: departments[0].id, code: 'P01' },
  { name: 'Phòng khám 2', departmentId: departments[0].id, code: 'P02' },
  { name: 'Phòng xét nghiệm', departmentId: departments[2].id, code: 'LAB01' },
])

// 3. DoctorProfile cho doctor user
const doctorUser = await prisma.user.findFirst({ where: { username: 'doctor' } })
if (doctorUser) {
  await prisma.doctorProfile.upsert({
    where: { userId: doctorUser.id },
    create: { userId: doctorUser.id, departmentId: departments[0].id, specialization: 'Nội khoa tổng quát', consultationFee: 150000 },
    update: {},
  })
}

// 4. ServiceCatalog
await createServiceCatalogIfNotExist([
  { name: 'Xét nghiệm máu toàn phần', type: 'LAB_TEST', price: 200000, isRequired: false },
  { name: 'Xét nghiệm nước tiểu', type: 'LAB_TEST', price: 150000, isRequired: false },
  { name: 'Siêu âm bụng', type: 'PROCEDURE', price: 300000, isRequired: false },
  { name: 'Điện tâm đồ (ECG)', type: 'PROCEDURE', price: 250000, isRequired: false },
])

// 5. StockLots cho các thuốc đã seed
const drugs = await prisma.drug.findMany({ take: 5 })
for (const drug of drugs) {
  await prisma.stockLot.upsert({
    where: { /* không có unique đơn giản, dùng findFirst */ id: 'placeholder' },
    create: {
      drugId: drug.id,
      quantity: 500,
      remainingQuantity: 500,
      unitCost: drug.pricePerUnit * 0.7,
      lotNumber: `LOT-${drug.id.slice(0, 8).toUpperCase()}-001`,
      expiryDate: new Date('2027-12-31'),
      supplierName: 'Nhà cung cấp Demo',
    },
    update: {},
  })
}
```

Lưu ý: dùng `upsert` hoặc `findFirst → create if not exists` để seed idempotent.

---

## Frontend — Final QA Report

Tạo `frontend-docs/phase2-qa-report.md`:

```markdown
# Phase 2 QA Report — [date]

## E2E Flow Results

| Flow | Steps Verified | Issues Found |
|------|---------------|-------------|
| Appointment → Invoice | 15/15 | ... |
| Walk-in → Invoice | 10/10 | ... |

## RBAC Coverage

| Role | Menu correct | Routes guarded | 403 behavior |
|------|-------------|---------------|-------------|
| ADMIN | ✓/✗ | ✓/✗ | ✓/✗ |
| ...

## UX States

| Page | Loading | Empty | Error | Toast |
|------|---------|-------|-------|-------|
| AppointmentListPage | ✓ | ✓ | ✓ | ✓ |
| ...

## Build/Lint

- Backend build: PASS/FAIL
- Backend lint: PASS/FAIL  
- Frontend build: PASS/FAIL
- Frontend lint: PASS/FAIL

## Issues / Regressions

- ...

## Verdict

Phase 2A: DONE / NOT DONE
```

---

## Kiểm tra cuối cùng

```bash
# Backend
cd backend
npm run build      # phải PASS
npm run lint       # phải PASS
npm run test       # phải PASS (hoặc ghi rõ test nào skip)
npx prisma db seed # chạy seed idempotent

# Frontend
cd frontend
npm run build      # phải PASS
npm run lint       # phải PASS
```

---

## Definition of Done

```
☐ E2E Flow 1 (appointment → invoice) hoàn thành thủ công không có lỗi
☐ E2E Flow 2 (walk-in → invoice) hoàn thành thủ công không có lỗi
☐ Sidebar đúng theo role matrix
☐ 403 redirect hoạt động cho mọi role unauthorized
☐ Tất cả main pages có loading/empty/error state
☐ Required service check trong examination complete
☐ Seed Phase 2 chạy idempotent
☐ Backend: npm run build PASS, npm run test PASS
☐ Frontend: npm run build PASS, npm run lint PASS
☐ frontend-docs/phase2-qa-report.md tồn tại và điền đầy đủ
```
