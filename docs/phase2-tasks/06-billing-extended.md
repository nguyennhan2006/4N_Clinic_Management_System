# Task 06 — Billing Extended: Multi-item Invoice + Audit UI + Reports Extended

> Branch: `feat/phase2-billing-extended`  
> Merge vào: `develop`  
> Phụ thuộc: Task 01 (schema), Task 04 (service orders), Task 05 (pharmacy) phải merged trước  
> Owner: 1 người (Backend + Frontend)  
> Estimated: 2–3 ngày  
> **Làm sau Task 04 và 05 — cần InvoiceItem schema và ServiceOrder/Dispense IDs**

---

## Mục tiêu

Nâng cấp hệ thống billing từ single-item (Phase 1) lên multi-item:
- InvoiceItem: từng dòng trong hóa đơn (consultation fee, service orders, dispense)
- Auto-generate invoice items từ các nguồn
- Mở rộng báo cáo tháng (thêm service revenue, drug revenue)
- Audit Log UI: trang xem audit trail cho ADMIN

---

## Files được sửa (Backend)

- `backend/src/modules/billing/billing.service.ts` — refactor `createInvoice()` để thêm InvoiceItem
- `backend/src/modules/billing/billing.controller.ts` — thêm `GET /invoices/:id/items`
- `backend/src/modules/billing/dto/create-invoice.dto.ts` — không thay đổi interface (backward compatible)
- `backend/src/modules/reports/reports.service.ts` — thêm service/drug revenue vào monthly report
- `backend/src/modules/reports/reports.controller.ts` — thêm `GET /reports/revenue-breakdown`

## Files được tạo mới (Backend)

```
backend/src/modules/audit/
  audit-log.controller.ts    # mới — expose GET /audit-logs
  dto/
    query-audit-log.dto.ts
```

## Files được sửa (Frontend)

- `frontend/src/features/invoices/InvoiceDetailPage.tsx` — thêm section InvoiceItems table
- `frontend/src/features/invoices/api.ts` — thêm `getItems(invoiceId)`
- `frontend/src/features/reports/MonthlyReportPage.tsx` — thêm breakdown section

## Files được tạo mới (Frontend)

```
frontend/src/features/audit/
  api.ts
  types.ts
  AuditLogPage.tsx
  components/
    AuditLogTable.tsx
    AuditLogFilter.tsx
```

**Không được sửa:** schema.prisma, auth, patients, visits, examinations, drugs, regulations, organization, appointments, queue, vitals, service-orders, lab, inventory, pharmacy

---

## Backend — Billing Service Refactor

### billing.service.ts — createInvoice() mở rộng

```typescript
async createInvoice(visitId: string, actorId: string) {
  const visit = await this.prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      examination: {
        include: {
          prescription: { include: { items: { include: { drug: true } } } },
        },
      },
      serviceOrders: {
        where: { status: 'COMPLETED' },
        include: { serviceCatalog: true },
      },
    },
  })

  if (!visit) throw new NotFoundException('Visit not found')
  if (visit.status !== 'COMPLETED') throw new BadRequestException('Visit must be COMPLETED')

  const existingInvoice = await this.prisma.invoice.findUnique({ where: { visitId } })
  if (existingInvoice) throw new ConflictException('Invoice already exists for this visit')

  // Tính các dòng hóa đơn
  const invoiceItems: InvoiceItemData[] = []

  // 1. Consultation fee
  const regulation = await this.prisma.regulationVersion.findFirst({
    where: { isActive: true },
  })
  const consultationFee = visit.examination?.doctorProfile?.consultationFee
    ?? regulation?.consultationFee
    ?? 0
  invoiceItems.push({
    itemType: 'CONSULTATION',
    description: 'Phí khám bệnh',
    unitPrice: consultationFee,
    quantity: 1,
    amount: consultationFee,
    referenceType: 'Examination',
    referenceId: visit.examination?.id,
  })

  // 2. Service orders
  for (const order of visit.serviceOrders ?? []) {
    invoiceItems.push({
      itemType: 'SERVICE',
      description: order.serviceCatalog.name,
      unitPrice: order.serviceCatalog.price,
      quantity: 1,
      amount: order.serviceCatalog.price,
      referenceType: 'ServiceOrder',
      referenceId: order.id,
    })
  }

  // 3. Prescription items (nếu đã dispense)
  if (visit.examination?.prescription) {
    for (const item of visit.examination.prescription.items) {
      const amount = item.quantity * item.unitPrice
      invoiceItems.push({
        itemType: 'DRUG',
        description: `${item.drug.name} x${item.quantity} ${item.drug.unit}`,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        amount,
        referenceType: 'PrescriptionItem',
        referenceId: item.id,
      })
    }
  }

  const totalAmount = invoiceItems.reduce((sum, i) => sum + i.amount, 0)

  return this.prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        visitId,
        totalAmount,
        paidAmount: 0,
        status: 'UNPAID',
        items: { create: invoiceItems },
      },
      include: { items: true },
    })

    await this.auditService.log({
      actorId,
      action: 'CREATE_INVOICE',
      entityType: 'Invoice',
      entityId: invoice.id,
      after: { totalAmount, itemCount: invoiceItems.length },
    })

    return invoice
  })
}
```

### billing.controller.ts — thêm endpoint

```typescript
@Get(':id/items')
@UseGuards(JwtAuthGuard)
@Roles('ADMIN', 'CASHIER', 'MANAGER')
async getInvoiceItems(@Param('id') id: string) {
  return this.billingService.getInvoiceItems(id)
}
```

```typescript
// billing.service.ts
async getInvoiceItems(invoiceId: string) {
  const items = await this.prisma.invoiceItem.findMany({
    where: { invoiceId },
    orderBy: { itemType: 'asc' },
  })
  if (!items.length) throw new NotFoundException('Invoice not found or has no items')
  return items
}
```

---

## Backend — Audit Log Controller

```typescript
// audit-log.controller.ts
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('ADMIN')
  async findAll(@Query() query: QueryAuditLogDto) {
    const where: Prisma.AuditLogWhereInput = {
      actorId: query.actorId,
      action: query.action,
      entityType: query.entityType,
      createdAt: {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      },
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return { data, total, page: query.page, limit: query.limit }
  }
}
```

### query-audit-log.dto.ts
```typescript
export class QueryAuditLogDto {
  @IsOptional()
  @IsString()
  actorId?: string

  @IsOptional()
  @IsString()
  action?: string           // e.g. 'CREATE_PATIENT', 'LOGIN_FAILED'

  @IsOptional()
  @IsString()
  entityType?: string       // e.g. 'Patient', 'Invoice'

  @IsOptional()
  @IsDateString()
  from?: string

  @IsOptional()
  @IsDateString()
  to?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20
}
```

---

## Backend — Reports Extended

### reports.service.ts — getMonthly() mở rộng

Thêm vào response hiện tại:
```typescript
// Thêm service revenue
const serviceRevenue = await this.prisma.invoiceItem.aggregate({
  where: {
    itemType: 'SERVICE',
    invoice: {
      status: { not: 'CANCELLED' },
      createdAt: { gte: startDate, lt: endDate },
    },
  },
  _sum: { amount: true },
})

// Thêm drug revenue
const drugRevenue = await this.prisma.invoiceItem.aggregate({
  where: {
    itemType: 'DRUG',
    invoice: {
      status: { not: 'CANCELLED' },
      createdAt: { gte: startDate, lt: endDate },
    },
  },
  _sum: { amount: true },
})

// Thêm vào kết quả:
return {
  ...existingFields,
  serviceRevenue: serviceRevenue._sum.amount ?? 0,
  drugRevenue: drugRevenue._sum.amount ?? 0,
  consultationRevenue: consultationRevenue._sum.amount ?? 0,
}
```

### Thêm endpoint `GET /reports/revenue-breakdown`
- Query: `month` (YYYY-MM)
- Response: `{ month, byType: { CONSULTATION: number, SERVICE: number, DRUG: number }, total: number }`
- Roles: ADMIN, MANAGER

---

## Frontend — InvoiceDetailPage mở rộng

```typescript
// Thêm section sau payment history
const { data: items } = useQuery({
  queryKey: ['invoice-items', invoiceId],
  queryFn: () => invoiceApi.getItems(invoiceId),
})

// Render bảng items:
// | Loại | Mô tả | Đơn giá | SL | Thành tiền |
// | CONSULTATION | Phí khám bệnh | 150,000 | 1 | 150,000 |
// | SERVICE | Xét nghiệm máu | 200,000 | 1 | 200,000 |
// | DRUG | Paracetamol 500mg x10 viên | 5,000 | 10 | 50,000 |
// | Tổng | | | | 400,000 |
```

---

## Frontend — AuditLogPage.tsx (`/app/admin/audit`)

```typescript
// Filter: actorId (dropdown users), action (text input), entityType (dropdown), dateRange
// Bảng paginated:
// | Thời gian | Người thực hiện | Hành động | Loại entity | Entity ID | Chi tiết |
// Click row → expand chi tiết (before/after JSON)
// before/after: hiển thị dưới dạng diff đơn giản (2 column JSON)
// ADMIN only
```

---

## Frontend — MonthlyReportPage mở rộng

Thêm section "Phân tích doanh thu":
```typescript
// Cards:
// - Phí khám: {consultationRevenue} VND
// - Dịch vụ & XN: {serviceRevenue} VND
// - Thuốc: {drugRevenue} VND
// - Tổng: {total} VND

// Pie chart hoặc progress bars nếu có dữ liệu
// (dùng recharts nếu đã install, nếu không dùng custom progress bar)
```

---

## Frontend — API Clients

### frontend/src/features/invoices/api.ts — thêm
```typescript
getItems: (invoiceId: string) =>
  apiClient.get<InvoiceItem[]>(`/invoices/${invoiceId}/items`),
```

### frontend/src/features/audit/api.ts
```typescript
export const auditApi = {
  list: (params: QueryAuditLogParams) =>
    apiClient.get<PaginatedResponse<AuditLog>>('/audit-logs', params),
}
```

### frontend/src/features/audit/types.ts
```typescript
export interface AuditLog {
  id: string
  actorId: string | null
  action: string
  entityType: string
  entityId: string | null
  before: unknown
  after: unknown
  createdAt: string
  actor?: { fullName: string; email: string } | null
}

export interface QueryAuditLogParams {
  actorId?: string
  action?: string
  entityType?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}
```

---

## Routes

```typescript
{ path: 'admin/audit', element: <RequireRole roles={['ADMIN']}><AuditLogPage /></RequireRole> },
```

---

## Sidebar items mới

```typescript
// Trong group Admin (ADMIN only):
{ label: 'Audit Log', icon: Shield, path: '/app/admin/audit' },
```

---

## Test Cases

### Billing
```typescript
// POST /visits/:id/invoice — visit có service orders COMPLETED → items có SERVICE rows
// POST /visits/:id/invoice — consultation fee từ DoctorProfile override regulation
// GET /invoices/:id/items → array InvoiceItem[]
// GET /reports/monthly?month=YYYY-MM → có serviceRevenue, drugRevenue
```

### Audit
```typescript
// GET /audit-logs — no auth → 401
// GET /audit-logs — CASHIER token → 403
// GET /audit-logs — ADMIN token → 200 { data, total, page, limit }
// GET /audit-logs?action=CREATE_PATIENT → filter đúng
// GET /audit-logs?from=2026-01-01&to=2026-01-31 → filter theo date range
// GET /audit-logs?page=2&limit=5 → pagination đúng
```

---

## Kiểm tra

```bash
cd backend
npm run build
npm run test -- --testPathPattern "billing|audit|reports"
```

```bash
cd frontend
npm run build
npm run lint
```

---

## Definition of Done

```
☐ POST /visits/:id/invoice tạo InvoiceItem cho consultation + services + drugs
☐ GET /invoices/:id/items trả về đúng items
☐ GET /reports/monthly có serviceRevenue + drugRevenue
☐ GET /audit-logs ADMIN only, paginated
☐ InvoiceDetailPage có bảng InvoiceItems với tổng cộng
☐ AuditLogPage filter theo actor/action/entityType/date
☐ AuditLogPage expand row → before/after JSON
☐ MonthlyReportPage có section phân tích doanh thu theo loại
☐ npm run build PASS (backend + frontend)
☐ npm run lint PASS (frontend)
```
