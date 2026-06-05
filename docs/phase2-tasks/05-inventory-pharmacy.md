# Task 05 — Inventory + Pharmacy / Dispense

> Branch: `feat/phase2-pharmacy`  
> Merge vào: `develop`  
> Phụ thuộc: Task 01 (`feat/phase2-schema`) phải merged trước  
> Owner: 1 người (Backend + Frontend)  
> Estimated: 3–4 ngày  
> **Có thể làm song song với Task 03, 04 — không có file conflict**

---

## Mục tiêu

Triển khai quản lý kho thuốc và quy trình phát thuốc:
- StockLot: quản lý lô nhập kho thuốc
- StockMovement: theo dõi biến động tồn kho
- Dispense: dược sĩ phát thuốc theo đơn — **đây là lúc trừ kho**, không phải khi bác sĩ kê đơn
- Kiểm tra tồn kho trước khi phát

---

## Files được tạo mới

### Backend
```
backend/src/modules/inventory/
  inventory.module.ts
  inventory.controller.ts
  inventory.service.ts
  dto/
    create-stock-lot.dto.ts
    query-stock.dto.ts
    create-stock-movement.dto.ts

backend/src/modules/pharmacy/
  pharmacy.module.ts
  pharmacy.controller.ts
  pharmacy.service.ts
  dto/
    create-dispense.dto.ts
    query-dispense.dto.ts
```

### Frontend
```
frontend/src/features/inventory/
  api.ts
  types.ts
  StockListPage.tsx
  StockLotForm.tsx
  StockMovementPage.tsx

frontend/src/features/pharmacy/
  api.ts
  types.ts
  PharmacyWorklist.tsx       # trang dành cho PHARMACIST
  DispenseDetailPage.tsx
  components/
    DispenseForm.tsx
    StockBadge.tsx            # hiển thị tồn kho còn đủ/không đủ
```

## Files được sửa

- `backend/src/app.module.ts` — import `InventoryModule`, `PharmacyModule`
- `frontend/src/app/router.tsx` — thêm routes inventory, pharmacy
- `frontend/src/components/common/Sidebar.tsx` — thêm menu Kho thuốc (ADMIN), Phát thuốc (PHARMACIST)

**Không được sửa:** schema.prisma, examinations, billing, prescriptions controller, drugs module

---

## Backend — DTOs

### create-stock-lot.dto.ts
```typescript
export class CreateStockLotDto {
  @IsString()
  drugId: string

  @IsInt()
  @Min(1)
  quantity: number            // số lượng nhập

  @IsNumber()
  @Min(0)
  unitCost: number            // giá nhập (VND)

  @IsString()
  lotNumber: string           // số lô

  @IsOptional()
  @IsDateString()
  expiryDate?: string         // hạn dùng

  @IsOptional()
  @IsString()
  supplierId?: string         // nhà cung cấp (optional, chỉ ghi chú)

  @IsOptional()
  @IsString()
  supplierName?: string
}

export class QueryStockDto {
  @IsOptional()
  @IsString()
  drugId?: string

  @IsOptional()
  @IsBoolean()
  lowStock?: boolean          // filter lô sắp hết (< threshold)

  @IsOptional()
  @IsBoolean()
  expiringSoon?: boolean      // filter lô gần hết hạn (< 30 ngày)
}
```

### create-dispense.dto.ts
```typescript
export class CreateDispenseDto {
  @IsString()
  prescriptionId: string     // ExaminationId (vì prescription gắn với examination)

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispenseItemDto)
  items: DispenseItemDto[]
}

export class DispenseItemDto {
  @IsString()
  prescriptionItemId: string  // PrescriptionItem.id

  @IsString()
  stockLotId: string          // lấy từ lô nào

  @IsInt()
  @Min(1)
  quantity: number            // số lượng phát
}

export class QueryDispenseDto {
  @IsOptional()
  @IsString()
  prescriptionId?: string

  @IsOptional()
  @IsEnum(DispenseStatus)
  status?: DispenseStatus

  @IsOptional()
  @IsDateString()
  date?: string
}
```

---

## Backend — API Endpoints

### InventoryController — prefix: `/inventory`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /inventory/stock | ADMIN, MANAGER, PHARMACIST | Tổng hợp tồn kho theo drug |
| GET | /inventory/lots | ADMIN, PHARMACIST | Danh sách stock lots |
| POST | /inventory/lots | ADMIN | Nhập lô thuốc mới |
| GET | /inventory/lots/:id | ADMIN, PHARMACIST | Chi tiết lô |
| GET | /inventory/movements | ADMIN, MANAGER | Lịch sử biến động kho |
| GET | /inventory/drugs/:drugId/stock | ALL | Tồn kho của 1 thuốc (dùng trong prescription UI) |

### PharmacyController — prefix: `/pharmacy`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /pharmacy/worklist | PHARMACIST, ADMIN | DS đơn cần phát (PENDING) |
| POST | /pharmacy/dispense | PHARMACIST | Phát thuốc theo đơn |
| GET | /pharmacy/dispense/:id | ALL | Chi tiết lần phát thuốc |
| PATCH | /pharmacy/dispense/:id/cancel | PHARMACIST, ADMIN | Hủy phát thuốc (nếu chưa hoàn thành) |

---

## Backend — Service Logic

### InventoryService.getStockSummary()
```typescript
// Aggregate tồn kho còn lại per drug
async getStockSummary(query: QueryStockDto) {
  const lots = await this.prisma.stockLot.findMany({
    where: {
      drugId: query.drugId,
      remainingQuantity: { gt: 0 },
      // expiry > today nếu không muốn show hết hạn
    },
    include: { drug: true },
    orderBy: { expiryDate: 'asc' },
  })

  // Group by drugId, sum remainingQuantity
  const summary = lots.reduce((acc, lot) => {
    const key = lot.drugId
    if (!acc[key]) acc[key] = { drug: lot.drug, totalRemaining: 0, lots: [] }
    acc[key].totalRemaining += lot.remainingQuantity
    acc[key].lots.push(lot)
    return acc
  }, {} as Record<string, DrugStockSummary>)

  return Object.values(summary)
}
```

### PharmacyService.dispense(dto, actorId)

**Đây là logic trọng tâm của task:**

```typescript
async dispense(dto: CreateDispenseDto, actorId: string) {
  // 1. Validate prescription tồn tại
  const prescription = await this.prisma.prescription.findFirst({
    where: { examinationId: dto.prescriptionId },
    include: { items: true, examination: { include: { visit: true } } },
  })
  if (!prescription) throw new NotFoundException('Prescription not found')

  // 2. Validate prescription chưa được phát (PENDING)
  const existingDispense = await this.prisma.dispense.findFirst({
    where: { prescriptionId: dto.prescriptionId, status: { not: 'CANCELLED' } },
  })
  if (existingDispense) throw new ConflictException('Prescription already dispensed')

  // 3. Validate từng item
  for (const item of dto.items) {
    const lot = await this.prisma.stockLot.findUnique({ where: { id: item.stockLotId } })
    if (!lot) throw new NotFoundException(`StockLot ${item.stockLotId} not found`)
    if (lot.remainingQuantity < item.quantity) {
      throw new BadRequestException(`Insufficient stock in lot ${lot.lotNumber}: need ${item.quantity}, have ${lot.remainingQuantity}`)
    }
    // Validate quantity không vượt quá prescribed quantity
    const prescItem = prescription.items.find(p => p.id === item.prescriptionItemId)
    if (!prescItem) throw new NotFoundException(`PrescriptionItem ${item.prescriptionItemId} not found`)
    if (item.quantity > prescItem.quantity) {
      throw new BadRequestException(`Cannot dispense more than prescribed (${prescItem.quantity})`)
    }
  }

  // 4. Atomic transaction: tạo Dispense + trừ kho
  return this.prisma.$transaction(async (tx) => {
    const dispense = await tx.dispense.create({
      data: {
        prescriptionId: dto.prescriptionId,
        dispensedBy: actorId,
        dispensedAt: new Date(),
        status: 'COMPLETED',
        items: {
          create: dto.items.map(item => ({
            prescriptionItemId: item.prescriptionItemId,
            stockLotId: item.stockLotId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    })

    // Trừ kho và ghi movement
    for (const item of dto.items) {
      await tx.stockLot.update({
        where: { id: item.stockLotId },
        data: { remainingQuantity: { decrement: item.quantity } },
      })
      await tx.stockMovement.create({
        data: {
          stockLotId: item.stockLotId,
          type: 'DISPENSE',
          quantity: -item.quantity,
          reference: `DISPENSE-${dispense.id}`,
          performedBy: actorId,
        },
      })
    }

    return dispense
  })
}
```

### InventoryService.createStockLot(dto, actorId)
```typescript
// Tạo lô nhập kho + ghi StockMovement type=IMPORT
return this.prisma.$transaction(async (tx) => {
  const lot = await tx.stockLot.create({
    data: {
      drugId: dto.drugId,
      quantity: dto.quantity,
      remainingQuantity: dto.quantity,
      unitCost: dto.unitCost,
      lotNumber: dto.lotNumber,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      supplierName: dto.supplierName,
    },
  })
  await tx.stockMovement.create({
    data: {
      stockLotId: lot.id,
      type: 'IMPORT',
      quantity: dto.quantity,
      reference: `IMPORT-${lot.lotNumber}`,
      performedBy: actorId,
    },
  })
  return lot
})
```

---

## Business Rules

| Rule | Mô tả |
|------|-------|
| BR-INV-01 | Nhập kho phải có lotNumber unique per drugId |
| BR-INV-02 | remainingQuantity không được âm (validate trước khi trừ) |
| BR-INV-03 | Không xóa StockLot đã có movement |
| BR-PHR-01 | Chỉ PHARMACIST mới phát thuốc |
| BR-PHR-02 | Mỗi prescription chỉ phát 1 lần (trừ khi dispense bị CANCELLED) |
| BR-PHR-03 | Số lượng phát không vượt quá số kê đơn |
| BR-PHR-04 | Tồn kho phải đủ trước khi phát — kiểm tra trong transaction |
| BR-PHR-05 | Khi phát thuốc, **bắt buộc ghi StockMovement type=DISPENSE** |
| BR-PHR-06 | Dispense COMPLETED không được sửa nội dung, chỉ có thể CANCELLED (nếu cần hoàn trả) |
| BR-PHR-07 | Bác sĩ kê đơn **không trừ kho** — chỉ PHARMACIST dispense mới trừ |

---

## Frontend — Types

### frontend/src/features/inventory/types.ts
```typescript
export interface StockLot {
  id: string
  drugId: string
  lotNumber: string
  quantity: number
  remainingQuantity: number
  unitCost: number
  expiryDate: string | null
  supplierName: string | null
  drug?: { id: string; name: string; unit: string }
  createdAt: string
}

export interface StockMovement {
  id: string
  stockLotId: string
  type: 'IMPORT' | 'DISPENSE' | 'ADJUSTMENT' | 'EXPIRED'
  quantity: number
  reference: string
  performedBy: string
  performedAt: string
  lot?: { lotNumber: string; drug?: { name: string } }
}

export interface DrugStockSummary {
  drug: { id: string; name: string; unit: string }
  totalRemaining: number
  lots: StockLot[]
}
```

### frontend/src/features/pharmacy/types.ts
```typescript
export type DispenseStatus = 'COMPLETED' | 'CANCELLED'

export interface Dispense {
  id: string
  prescriptionId: string
  dispensedBy: string
  dispensedAt: string
  status: DispenseStatus
  items: DispenseItem[]
}

export interface DispenseItem {
  id: string
  prescriptionItemId: string
  stockLotId: string
  quantity: number
  lot?: { lotNumber: string; expiryDate: string | null }
}

export interface CreateDispensePayload {
  prescriptionId: string
  items: {
    prescriptionItemId: string
    stockLotId: string
    quantity: number
  }[]
}
```

---

## Frontend — API Clients

### frontend/src/features/inventory/api.ts
```typescript
export const inventoryApi = {
  getStockSummary: (params?: QueryStockParams) =>
    apiClient.get<DrugStockSummary[]>('/inventory/stock', params ?? {}),
  listLots: (drugId?: string) =>
    apiClient.get<StockLot[]>('/inventory/lots', drugId ? { drugId } : {}),
  createLot: (data: CreateStockLotPayload) =>
    apiClient.post<StockLot>('/inventory/lots', data),
  listMovements: (params?: QueryMovementParams) =>
    apiClient.get<StockMovement[]>('/inventory/movements', params ?? {}),
  getDrugStock: (drugId: string) =>
    apiClient.get<DrugStockSummary>(`/inventory/drugs/${drugId}/stock`),
}
```

### frontend/src/features/pharmacy/api.ts
```typescript
export const pharmacyApi = {
  getWorklist: (params?: { date?: string }) =>
    apiClient.get<PrescriptionWithPatient[]>('/pharmacy/worklist', params ?? {}),
  dispense: (data: CreateDispensePayload) =>
    apiClient.post<Dispense>('/pharmacy/dispense', data),
  getDispense: (id: string) =>
    apiClient.get<Dispense>(`/pharmacy/dispense/${id}`),
  cancelDispense: (id: string) =>
    apiClient.patch<Dispense>(`/pharmacy/dispense/${id}/cancel`, {}),
}
```

---

## Frontend — Pages

### StockListPage.tsx (`/app/inventory/stock`)
- Bảng: thuốc, tổng tồn kho, cảnh báo (badge đỏ nếu < threshold)
- Filter: tất cả / sắp hết / gần hết hạn
- Mở rộng row: danh sách lô thuốc (lotNumber, quantity, remainingQuantity, expiryDate)
- ADMIN: nút "Nhập kho" → dialog form

### PharmacyWorklist.tsx (`/app/pharmacy`)
- Danh sách đơn thuốc cần phát (PENDING) theo ngày
- Mỗi row: bệnh nhân, bác sĩ kê, số thuốc, trạng thái
- Nút "Phát thuốc" → mở DispenseForm dialog
- Hiển thị đơn đã phát (COMPLETED) theo ngày

### DispenseForm.tsx (modal dialog)
- Hiển thị đơn thuốc: drug name, prescribed quantity, unit
- Mỗi dòng: chọn StockLot (dropdown, filter by drugId, show lotNumber + remainingQty + expiry), nhập quantity
- Validate: quantity <= prescribed quantity, lot đủ hàng
- StockBadge: `✓ Đủ hàng` (green) / `⚠ Thiếu` (red) — real-time từ selectedLot.remainingQuantity
- Submit → POST /pharmacy/dispense → toast thành công, close dialog

---

## Routes

```typescript
{ path: 'inventory/stock', element: <RequireRole roles={['ADMIN', 'MANAGER', 'PHARMACIST']}><StockListPage /></RequireRole> },
{ path: 'inventory/movements', element: <RequireRole roles={['ADMIN', 'MANAGER']}><StockMovementPage /></RequireRole> },
{ path: 'pharmacy', element: <RequireRole roles={['PHARMACIST', 'ADMIN']}><PharmacyWorklist /></RequireRole> },
{ path: 'pharmacy/dispense/:id', element: <DispenseDetailPage /> },
```

---

## Sidebar items mới

```typescript
// Group "Kho & Dược" — hiển thị với ADMIN, MANAGER, PHARMACIST:
{ label: 'Tồn kho thuốc', icon: Package, path: '/app/inventory/stock', roles: ['ADMIN', 'MANAGER', 'PHARMACIST'] },
{ label: 'Lịch sử xuất nhập', icon: ArrowLeftRight, path: '/app/inventory/movements', roles: ['ADMIN', 'MANAGER'] },
{ label: 'Phát thuốc', icon: Pill, path: '/app/pharmacy', roles: ['PHARMACIST', 'ADMIN'] },
```

---

## Test Cases

```typescript
// POST /inventory/lots — ADMIN → 201, StockMovement IMPORT được tạo
// POST /inventory/lots — lotNumber trùng same drug → 409
// GET /inventory/drugs/:id/stock — tổng hợp đúng
// POST /pharmacy/dispense — không đủ kho → 400
// POST /pharmacy/dispense — DOCTOR token → 403
// POST /pharmacy/dispense — PHARMACIST → 201, remainingQuantity giảm, StockMovement DISPENSE được tạo
// POST /pharmacy/dispense cùng prescription lần 2 → 409
// POST /pharmacy/dispense quantity > prescribed → 400
// PATCH /pharmacy/dispense/:id/cancel — status COMPLETED → cân nhắc: có thể allow với business reason
```

---

## Kiểm tra

```bash
cd backend
npm run build
npm run test -- --testPathPattern "inventory|pharmacy"
```

```bash
cd frontend
npm run build
npm run lint
```

---

## Definition of Done

```
☐ POST /inventory/lots → StockMovement IMPORT được tạo trong transaction
☐ POST /pharmacy/dispense → remainingQuantity giảm chính xác
☐ POST /pharmacy/dispense — PHARMACIST only (DOCTOR → 403)
☐ Duplicate dispense same prescription → 409
☐ Overfill (quantity > prescribed) → 400
☐ Insufficient stock → 400
☐ PharmacyWorklist hiển thị đơn PENDING
☐ DispenseForm StockBadge cảnh báo thiếu hàng real-time
☐ StockListPage ADMIN thấy nút Nhập kho
☐ npm run build PASS (backend + frontend)
☐ npm run lint PASS (frontend)
```
