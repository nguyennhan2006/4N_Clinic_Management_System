# Task 04 — VitalSign + ServiceOrder + Lab Workflow

> Branch: `feat/phase2-clinical`  
> Merge vào: `develop`  
> Phụ thuộc: Task 01 (`feat/phase2-schema`) + Task 02 (`feat/phase2-organization`) phải merged trước  
> Owner: 1 người (Backend + Frontend)  
> Estimated: 3–4 ngày  
> **Có thể làm song song với Task 03 — không có file conflict**

---

## Mục tiêu

Triển khai luồng lâm sàng trong phòng khám:
- VitalSign: y tá ghi chỉ số sinh tồn (huyết áp, mạch, nhiệt độ, cân nặng, chiều cao) gắn với Visit
- ServiceOrder: bác sĩ chỉ định dịch vụ/xét nghiệm cho bệnh nhân
- LabOrder / LabSample / LabResult: quy trình xét nghiệm đầy đủ

---

## Files được tạo mới

### Backend
```
backend/src/modules/vitals/
  vitals.module.ts
  vitals.controller.ts
  vitals.service.ts
  dto/
    create-vital-sign.dto.ts

backend/src/modules/services/
  services.module.ts
  services.controller.ts
  services.service.ts
  dto/
    create-service-order.dto.ts
    query-service-orders.dto.ts

backend/src/modules/lab/
  lab.module.ts
  lab.controller.ts
  lab.service.ts
  dto/
    create-lab-order.dto.ts
    update-lab-sample.dto.ts
    create-lab-result.dto.ts
    query-lab-orders.dto.ts
```

### Frontend
```
frontend/src/features/vitals/
  api.ts
  types.ts
  VitalSignSection.tsx      # embedded trong ExaminationPage

frontend/src/features/services/
  api.ts
  types.ts
  ServiceOrderSection.tsx   # embedded trong ExaminationPage
  ServiceCatalogPage.tsx    # admin manage catalog

frontend/src/features/lab/
  api.ts
  types.ts
  LabWorklist.tsx           # trang làm việc của Lab Technician
  LabOrderDetailPage.tsx
  components/
    LabResultForm.tsx
    LabOrderStatusBadge.tsx
```

## Files được sửa

- `backend/src/app.module.ts` — import `VitalsModule`, `ServicesModule`, `LabModule`
- `frontend/src/features/examinations/ExaminationPage.tsx` — embed VitalSignSection + ServiceOrderSection
- `frontend/src/app/router.tsx` — thêm routes lab, service-catalog
- `frontend/src/components/common/Sidebar.tsx` — thêm menu Lab Worklist (LAB_TECHNICIAN role)

**Không được sửa:** schema.prisma, appointments, queue, billing, prescriptions

---

## Backend — DTOs

### create-vital-sign.dto.ts
```typescript
export class CreateVitalSignDto {
  @IsString()
  visitId: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  bloodPressureSystolic?: number   // mmHg

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  bloodPressureDiastolic?: number  // mmHg

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  heartRate?: number               // bpm

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(45)
  temperature?: number             // Celsius

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  weight?: number                  // kg

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  height?: number                  // cm

  @IsOptional()
  @IsString()
  notes?: string
}
```

### create-service-order.dto.ts
```typescript
export class CreateServiceOrderDto {
  @IsString()
  visitId: string

  @IsString()
  serviceCatalogId: string

  @IsOptional()
  @IsString()
  notes?: string
}

export class QueryServiceOrdersDto {
  @IsOptional()
  @IsString()
  visitId?: string

  @IsOptional()
  @IsEnum(ServiceOrderStatus)
  status?: ServiceOrderStatus

  @IsOptional()
  @IsEnum(ServiceType)
  type?: ServiceType
}
```

### create-lab-order.dto.ts
```typescript
export class CreateLabOrderDto {
  @IsString()
  serviceOrderId: string    // ServiceOrder phải có type=LAB_TEST

  @IsString()
  labTestCatalogId: string

  @IsOptional()
  @IsString()
  clinicalInfo?: string     // thông tin lâm sàng gửi kèm
}

export class UpdateLabSampleDto {
  @IsOptional()
  @IsString()
  sampleType?: string       // 'blood', 'urine', 'swab', etc.

  @IsOptional()
  @IsDateString()
  collectedAt?: string
}

export class CreateLabResultDto {
  @IsString()
  labOrderId: string

  @IsString()
  resultData: string        // JSON string hoặc text mô tả kết quả

  @IsOptional()
  @IsString()
  interpretation?: string   // normal / abnormal / critical

  @IsOptional()
  @IsString()
  notes?: string
}
```

---

## Backend — API Endpoints

### VitalsController — prefix: `/vitals`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /vitals | NURSE, DOCTOR, ADMIN | Ghi chỉ số sinh tồn cho visit |
| GET | /vitals/visit/:visitId | ALL | Lấy vital signs của visit |
| PATCH | /vitals/:id | NURSE, ADMIN | Cập nhật vital sign |

### ServicesController — prefix: `/service-orders`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /service-orders | DOCTOR, ADMIN | Chỉ định dịch vụ |
| GET | /service-orders | ALL | Danh sách service orders |
| GET | /service-orders/:id | ALL | Chi tiết service order |
| PATCH | /service-orders/:id/status | NURSE, LAB_TECHNICIAN, ADMIN | Cập nhật status |
| GET | /service-catalog | ALL | Danh sách catalog dịch vụ |
| POST | /service-catalog | ADMIN | Thêm dịch vụ vào catalog |
| PATCH | /service-catalog/:id | ADMIN | Sửa dịch vụ |

### LabController — prefix: `/lab`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /lab/orders | DOCTOR, ADMIN | Tạo lab order (sau khi có service order) |
| GET | /lab/orders | LAB_TECHNICIAN, DOCTOR, ADMIN | Danh sách lab orders |
| GET | /lab/orders/:id | ALL | Chi tiết lab order |
| PATCH | /lab/orders/:id/sample | LAB_TECHNICIAN | Cập nhật thông tin mẫu |
| POST | /lab/orders/:id/result | LAB_TECHNICIAN | Nhập kết quả xét nghiệm |
| GET | /lab/orders/:id/result | ALL | Lấy kết quả |

---

## Backend — Service Logic

### VitalsService.create(dto, actorId)
- Validate: `visitId` tồn tại và `status` khác `COMPLETED` (không cho ghi vitals khi visit đã kết thúc)
- Validate: ít nhất 1 trường đo lường phải có giá trị (không được gửi request rỗng)
- Ghi audit log: `action: 'RECORD_VITAL_SIGN'`

### ServicesService.create(dto, actorId)
- Validate: `visitId` tồn tại
- Validate: `serviceCatalogId` tồn tại và `isActive = true`
- Validate: không chỉ định trùng dịch vụ (same serviceCatalogId cho same visitId, status khác CANCELLED)
- Set `status = 'PENDING'`, `orderedBy = actorId`

### LabService.createOrder(dto, actorId)
- Validate: `serviceOrderId` tồn tại, có `type = LAB_TEST`
- Validate: `labTestCatalogId` tồn tại
- Tạo LabOrder với `status = 'PENDING'`
- Cập nhật ServiceOrder status → `'IN_PROGRESS'`

### LabService.submitResult(labOrderId, dto, actorId)
- Validate: LabOrder status phải là `'PROCESSING'` (sample đã được lấy)
- Cập nhật LabOrder:
  - `status = 'RESULTED'`
  - `resultData = dto.resultData`
  - `interpretation = dto.interpretation`
  - `resultedAt = now()`
  - `resultedBy = actorId`
- Cập nhật ServiceOrder status → `'COMPLETED'`
- Ghi audit log: `action: 'SUBMIT_LAB_RESULT'`

---

## Business Rules

| Rule | Mô tả |
|------|-------|
| BR-VS-01 | VitalSign chỉ ghi được khi Visit chưa COMPLETED |
| BR-VS-02 | Request VitalSign không được rỗng (ít nhất 1 field đo lường) |
| BR-SVC-01 | ServiceCatalog phải active thì mới đặt được |
| BR-SVC-02 | Không chỉ định trùng dịch vụ cho cùng visit (trừ khi cái cũ đã CANCELLED) |
| BR-LAB-01 | LabOrder chỉ tạo được từ ServiceOrder type=LAB_TEST |
| BR-LAB-02 | Lấy mẫu (sample) phải trước khi nhập kết quả |
| BR-LAB-03 | Chỉ LAB_TECHNICIAN mới nhập kết quả |
| BR-LAB-04 | Kết quả không được sửa sau khi đã RESULTED (immutable) |
| BR-LAB-05 | Nếu ServiceOrder có `isRequired=true`, Visit không được COMPLETED khi còn order chưa COMPLETED |

**BR-LAB-05 implementation:** Trong `ExaminationsService.complete()`, thêm check:
```typescript
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

**Lưu ý:** File `examinations.service.ts` được phép sửa chỉ phần `complete()` để thêm check này. Không thêm logic khác.

---

## Frontend — Components

### VitalSignSection.tsx (embedded trong ExaminationPage)
```typescript
// Props: visitId, visitStatus
// - Hiển thị vital signs đã có (nếu có)
// - Form nhập mới (NURSE, DOCTOR thấy; nếu visit COMPLETED thì read-only)
// - Fields: bloodPressure (systolic/diastolic), heartRate, temperature, weight, height
// - Validation: các range hợp lệ (dùng Zod)
// - Submit → POST /vitals → invalidate query
```

### ServiceOrderSection.tsx (embedded trong ExaminationPage)
```typescript
// Props: visitId, visitStatus
// - Danh sách service orders của visit
// - DOCTOR: dropdown chọn service từ catalog, nút "Chỉ định"
// - Hiển thị status badge cho mỗi order
// - Visit COMPLETED: read-only
```

### LabWorklist.tsx (`/app/lab`)
- Filter: date, status (PENDING/PROCESSING/RESULTED)
- Bảng: bệnh nhân, xét nghiệm, ordered by, trạng thái, thời gian
- LAB_TECHNICIAN: nút "Lấy mẫu" (PENDING → PROCESSING), "Nhập kết quả" → modal form
- Auto-refresh mỗi 60s

### LabResultForm.tsx (modal)
- Fields: resultData (textarea), interpretation (dropdown: normal/abnormal/critical), notes
- Validate không để trống
- Submit → POST /lab/orders/:id/result → close modal, refresh list

### ServiceCatalogPage.tsx (`/app/catalog/services`)
- ADMIN: xem + thêm + sửa dịch vụ
- Bảng: name, type, price, isActive
- Filter by type (CONSULTATION/LAB_TEST/PROCEDURE)

---

## Frontend — API Clients

### frontend/src/features/vitals/api.ts
```typescript
export const vitalsApi = {
  create: (data: CreateVitalSignPayload) =>
    apiClient.post<VitalSign>('/vitals', data),
  getByVisit: (visitId: string) =>
    apiClient.get<VitalSign[]>(`/vitals/visit/${visitId}`),
  update: (id: string, data: Partial<CreateVitalSignPayload>) =>
    apiClient.patch<VitalSign>(`/vitals/${id}`, data),
}
```

### frontend/src/features/services/api.ts
```typescript
export const serviceOrderApi = {
  create: (data: CreateServiceOrderPayload) =>
    apiClient.post<ServiceOrder>('/service-orders', data),
  list: (params: QueryServiceOrderParams) =>
    apiClient.get<ServiceOrder[]>('/service-orders', params),
  get: (id: string) =>
    apiClient.get<ServiceOrder>(`/service-orders/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.patch<ServiceOrder>(`/service-orders/${id}/status`, { status }),
}

export const serviceCatalogApi = {
  list: (type?: string) =>
    apiClient.get<ServiceCatalogItem[]>('/service-catalog', type ? { type } : {}),
  create: (data: CreateServiceCatalogPayload) =>
    apiClient.post<ServiceCatalogItem>('/service-catalog', data),
  update: (id: string, data: Partial<CreateServiceCatalogPayload>) =>
    apiClient.patch<ServiceCatalogItem>(`/service-catalog/${id}`, data),
}
```

### frontend/src/features/lab/api.ts
```typescript
export const labApi = {
  createOrder: (data: CreateLabOrderPayload) =>
    apiClient.post<LabOrder>('/lab/orders', data),
  listOrders: (params: QueryLabOrderParams) =>
    apiClient.get<LabOrder[]>('/lab/orders', params),
  getOrder: (id: string) =>
    apiClient.get<LabOrder>(`/lab/orders/${id}`),
  updateSample: (id: string, data: UpdateLabSamplePayload) =>
    apiClient.patch<LabOrder>(`/lab/orders/${id}/sample`, data),
  submitResult: (id: string, data: CreateLabResultPayload) =>
    apiClient.post<LabResult>(`/lab/orders/${id}/result`, data),
  getResult: (id: string) =>
    apiClient.get<LabResult>(`/lab/orders/${id}/result`),
}
```

---

## Routes

```typescript
{ path: 'lab', element: <RequireRole roles={['LAB_TECHNICIAN', 'DOCTOR', 'ADMIN']}><LabWorklist /></RequireRole> },
{ path: 'lab/orders/:id', element: <LabOrderDetailPage /> },
{ path: 'catalog/services', element: <RequireRole roles={['ADMIN', 'MANAGER']}><ServiceCatalogPage /></RequireRole> },
```

---

## Sidebar items mới

```typescript
// Hiển thị với LAB_TECHNICIAN, DOCTOR, ADMIN:
{ label: 'Xét nghiệm', icon: FlaskConical, path: '/app/lab' },
// Trong group Danh mục (ADMIN, MANAGER):
{ label: 'Dịch vụ', icon: Layers, path: '/app/catalog/services' },
```

---

## Test Cases

```typescript
// POST /vitals — visitId COMPLETED → 400
// POST /vitals — không có field nào → 400
// POST /vitals — NURSE token → 201
// POST /service-orders — serviceCatalogId inactive → 400
// POST /service-orders — trùng dịch vụ cùng visit → 409
// POST /lab/orders — serviceOrderId type=CONSULTATION → 400
// POST /lab/orders/:id/result — status=PENDING (chưa lấy mẫu) → 400
// POST /lab/orders/:id/result — LAB_TECHNICIAN → 201
// POST /lab/orders/:id/result lần 2 → 400 (immutable)
// ExaminationService.complete() khi còn required service pending → 400
```

---

## Kiểm tra

```bash
cd backend
npm run build
npm run test -- --testPathPattern "vitals|services|lab"
```

```bash
cd frontend
npm run build
npm run lint
```

---

## Definition of Done

```
☐ POST /vitals — NURSE ghi được vital signs
☐ POST /vitals — visit COMPLETED → 400
☐ ServiceOrder không trùng dịch vụ cùng visit
☐ LabOrder chỉ tạo được từ LAB_TEST service
☐ POST /lab/orders/:id/result immutable sau khi RESULTED
☐ Examination complete bị chặn nếu có required service pending
☐ VitalSignSection embedded đúng trong ExaminationPage
☐ LabWorklist auto-refresh 60s
☐ ServiceCatalogPage ADMIN thêm/sửa được dịch vụ
☐ npm run build PASS (backend + frontend)
☐ npm run lint PASS (frontend)
```
