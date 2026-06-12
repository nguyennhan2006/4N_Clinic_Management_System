# Task 03 — Appointment + Check-in + QueueTicket

> Branch: `feat/phase2-appointment`  
> Merge vào: `develop`  
> Phụ thuộc: Task 01 (`feat/phase2-schema`) + Task 02 (`feat/phase2-organization`) phải merged trước  
> Owner: 1 người (Backend + Frontend)  
> Estimated: 3–4 ngày

---

## Mục tiêu

Triển khai luồng đặt lịch khám và quản lý hàng đợi:
- CRUD Appointment (đặt lịch, hủy lịch)
- Check-in → tự động tạo QueueTicket
- Xem hàng đợi real-time theo Department/Room
- Gọi bệnh nhân (CALLED → IN_SERVICE → DONE)

---

## Files được tạo mới

### Backend
```
backend/src/modules/appointments/
  appointments.module.ts
  appointments.controller.ts
  appointments.service.ts
  dto/
    create-appointment.dto.ts
    update-appointment.dto.ts
    query-appointments.dto.ts
    checkin-appointment.dto.ts

backend/src/modules/queue/
  queue.module.ts
  queue.controller.ts
  queue.service.ts
  dto/
    query-queue.dto.ts
    update-queue-status.dto.ts
```

### Frontend
```
frontend/src/features/appointments/
  api.ts
  types.ts
  AppointmentListPage.tsx
  AppointmentCreatePage.tsx
  AppointmentDetailPage.tsx
  components/
    AppointmentForm.tsx
    AppointmentStatusBadge.tsx

frontend/src/features/queue/
  api.ts
  types.ts
  QueueDashboardPage.tsx
  components/
    QueueTicketCard.tsx
    QueueStatusBadge.tsx
```

## Files được sửa

- `backend/src/app.module.ts` — import `AppointmentsModule`, `QueueModule`
- `frontend/src/app/router.tsx` — thêm routes appointments, queue
- `frontend/src/components/common/Sidebar.tsx` — thêm menu Lịch hẹn, Hàng đợi

**Không được sửa:** schema.prisma, visits, examinations, billing, organization

---

## Backend — DTOs

### create-appointment.dto.ts
```typescript
export class CreateAppointmentDto {
  @IsString()
  patientId: string

  @IsString()
  doctorId: string        // DoctorProfile.id (không phải userId)

  @IsDateString()
  scheduledAt: string     // ISO datetime 'YYYY-MM-DDTHH:MM:SS'

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(120)
  durationMinutes?: number  // default 30

  @IsOptional()
  @IsString()
  notes?: string
}

export class QueryAppointmentsDto {
  @IsOptional()
  @IsDateString()
  date?: string           // filter theo ngày (YYYY-MM-DD)

  @IsOptional()
  @IsString()
  doctorId?: string

  @IsOptional()
  @IsString()
  patientId?: string

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus
}

export class CheckinAppointmentDto {
  @IsOptional()
  @IsString()
  roomId?: string         // override room nếu cần
}
```

### query-queue.dto.ts
```typescript
export class QueryQueueDto {
  @IsOptional()
  @IsString()
  departmentId?: string

  @IsOptional()
  @IsString()
  roomId?: string

  @IsOptional()
  @IsDateString()
  date?: string           // default: today

  @IsOptional()
  @IsEnum(QueueStatus)
  status?: QueueStatus
}

export class UpdateQueueStatusDto {
  @IsEnum(QueueStatus)
  status: QueueStatus
}
```

---

## Backend — API Endpoints

### AppointmentsController — prefix: `/appointments`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /appointments | ALL | Danh sách lịch hẹn (filter by date/doctor/patient/status) |
| POST | /appointments | RECEPTIONIST, ADMIN | Đặt lịch mới |
| GET | /appointments/:id | ALL | Chi tiết lịch hẹn |
| PATCH | /appointments/:id | RECEPTIONIST, ADMIN | Cập nhật (chỉ SCHEDULED) |
| PATCH | /appointments/:id/cancel | RECEPTIONIST, ADMIN | Hủy lịch |
| POST | /appointments/:id/checkin | RECEPTIONIST, NURSE | Check-in → tạo QueueTicket |

### QueueController — prefix: `/queue`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /queue | ALL | Danh sách queue tickets hôm nay |
| GET | /queue/:id | ALL | Chi tiết ticket |
| PATCH | /queue/:id/status | NURSE, DOCTOR, ADMIN | Cập nhật trạng thái ticket |
| GET | /queue/next | DOCTOR, NURSE | Ticket tiếp theo chờ trong room của doctor |

---

## Backend — Service Logic

### AppointmentsService.create(dto, actorId)

**Conflict check (BR-P2-07):**
```typescript
// Kiểm tra bác sĩ không có lịch chồng trong ±durationMinutes
const newStart = new Date(dto.scheduledAt)
const newEnd = new Date(newStart.getTime() + (dto.durationMinutes ?? 30) * 60_000)

const conflict = await this.prisma.appointment.findFirst({
  where: {
    doctorId: dto.doctorId,
    status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    // Overlap: existing.start < newEnd AND existing.end > newStart
    scheduledAt: { lt: newEnd },
    // existing end = scheduledAt + durationMinutes
    // Prisma không support computed field trong where → dùng raw query
  },
})
// Dùng $queryRaw nếu cần tính existing.scheduledAt + interval
```

**Gợi ý dùng raw query cho conflict check:**
```typescript
const conflicts = await this.prisma.$queryRaw<{id: string}[]>`
  SELECT id FROM "Appointment"
  WHERE "doctorId" = ${dto.doctorId}
    AND status NOT IN ('CANCELLED', 'NO_SHOW')
    AND "scheduledAt" < ${newEnd}
    AND ("scheduledAt" + ("durationMinutes" * INTERVAL '1 minute')) > ${newStart}
`
if (conflicts.length > 0) throw new ConflictException('Doctor has conflicting appointment')
```

### AppointmentsService.checkin(id, dto, actorId)

```typescript
async checkin(id: string, dto: CheckinAppointmentDto, actorId: string) {
  const appointment = await this.findOne(id)
  if (appointment.status !== 'SCHEDULED') {
    throw new BadRequestException('Only SCHEDULED appointments can be checked in')
  }

  // Tạo QueueTicket + update Appointment trong transaction
  return this.prisma.$transaction(async (tx) => {
    // Lấy số thứ tự tiếp theo trong ngày của department
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lastTicket = await tx.queueTicket.findFirst({
      where: {
        departmentId: appointment.doctor.departmentId,
        queueDate: today,
      },
      orderBy: { queueNumber: 'desc' },
    })
    const queueNumber = (lastTicket?.queueNumber ?? 0) + 1

    const ticket = await tx.queueTicket.create({
      data: {
        appointmentId: id,
        patientId: appointment.patientId,
        departmentId: appointment.doctor.departmentId,
        roomId: dto.roomId ?? appointment.doctor.currentRoomId ?? null,
        queueDate: today,
        queueNumber,
        status: 'WAITING',
      },
    })

    await tx.appointment.update({
      where: { id },
      data: { status: 'CHECKED_IN' },
    })

    return ticket
  })
}
```

### QueueService.updateStatus(id, status, actorId)

**Allowed transitions:**
```
WAITING → CALLED (NURSE, DOCTOR)
CALLED → IN_SERVICE (DOCTOR)
IN_SERVICE → DONE (DOCTOR)
WAITING → SKIPPED (NURSE)
WAITING → CANCELLED (NURSE, ADMIN)
CALLED → CANCELLED (NURSE, ADMIN)
```

Validate transition hợp lệ, throw `BadRequestException` nếu không hợp lệ.

---

## Business Rules

| Rule | Mô tả |
|------|-------|
| BR-APT-01 | scheduledAt phải trong tương lai (> now) |
| BR-APT-02 | Doctor phải có DoctorProfile tồn tại và active |
| BR-APT-03 | Patient phải tồn tại |
| BR-APT-04 | Conflict: bác sĩ không có 2 appointment overlap (dùng interval overlap check) |
| BR-APT-05 | Chỉ cancel appointment có status SCHEDULED |
| BR-APT-06 | Check-in chỉ được khi status = SCHEDULED |
| BR-APT-07 | QueueNumber tăng dần trong ngày per Department, reset mỗi ngày |
| BR-APT-08 | QueueTicket unique: (departmentId, queueDate, queueNumber) |
| BR-APT-09 | Không xóa vật lý appointment — chỉ CANCELLED / NO_SHOW |

---

## Frontend — API Client

### frontend/src/features/appointments/api.ts
```typescript
export const appointmentApi = {
  list: (params: QueryAppointmentParams) =>
    apiClient.get<Appointment[]>('/appointments', params),
  get: (id: string) =>
    apiClient.get<Appointment>(`/appointments/${id}`),
  create: (data: CreateAppointmentPayload) =>
    apiClient.post<Appointment>('/appointments', data),
  update: (id: string, data: UpdateAppointmentPayload) =>
    apiClient.patch<Appointment>(`/appointments/${id}`, data),
  cancel: (id: string) =>
    apiClient.patch<Appointment>(`/appointments/${id}/cancel`, {}),
  checkin: (id: string, data?: { roomId?: string }) =>
    apiClient.post<QueueTicket>(`/appointments/${id}/checkin`, data ?? {}),
}

export const queueApi = {
  list: (params: QueryQueueParams) =>
    apiClient.get<QueueTicket[]>('/queue', params),
  get: (id: string) =>
    apiClient.get<QueueTicket>(`/queue/${id}`),
  updateStatus: (id: string, status: QueueStatus) =>
    apiClient.patch<QueueTicket>(`/queue/${id}/status`, { status }),
  getNext: () =>
    apiClient.get<QueueTicket | null>('/queue/next'),
}
```

### frontend/src/features/appointments/types.ts
```typescript
export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'CANCELLED' | 'NO_SHOW'
export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'DONE' | 'SKIPPED' | 'CANCELLED'

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  scheduledAt: string
  durationMinutes: number
  status: AppointmentStatus
  notes: string | null
  patient?: { id: string; fullName: string; phone: string }
  doctor?: {
    id: string
    specialization: string | null
    user?: { fullName: string }
    department?: { name: string }
  }
  createdAt: string
}

export interface QueueTicket {
  id: string
  queueNumber: number
  queueDate: string
  status: QueueStatus
  patientId: string
  departmentId: string
  roomId: string | null
  appointmentId: string | null
  patient?: { fullName: string; phone: string }
  department?: { name: string }
  room?: { name: string } | null
  createdAt: string
}

export interface CreateAppointmentPayload {
  patientId: string
  doctorId: string
  scheduledAt: string
  durationMinutes?: number
  notes?: string
}

export interface QueryAppointmentParams {
  date?: string
  doctorId?: string
  patientId?: string
  status?: AppointmentStatus
}

export interface QueryQueueParams {
  departmentId?: string
  roomId?: string
  date?: string
  status?: QueueStatus
}
```

---

## Frontend — Pages

### AppointmentListPage.tsx
- Filter: ngày, bác sĩ, trạng thái
- Bảng: queue#, tên bệnh nhân, bác sĩ, giờ hẹn, trạng thái badge, actions
- Nút "Đặt lịch" (RECEPTIONIST, ADMIN)
- Nút "Check-in" cho SCHEDULED appointments (RECEPTIONIST, NURSE)
- Nút "Hủy" với confirm dialog

### AppointmentCreatePage.tsx (`/app/appointments/new`)
- Form: chọn Patient (search dropdown), chọn Doctor (từ DoctorProfile list), scheduledAt (datetime picker), durationMinutes (15/30/45/60), notes
- Validation: scheduledAt > now
- Submit → POST → redirect về AppointmentListPage

### QueueDashboardPage.tsx (`/app/queue`)
- Filter: Department, Room, Date (default today)
- Cards theo trạng thái (Chờ, Đang khám, Hoàn thành)
- NURSE: nút "Gọi" (WAITING → CALLED), "Bỏ qua" (WAITING → SKIPPED)
- DOCTOR: nút "Bắt đầu khám" (CALLED → IN_SERVICE), "Hoàn thành" (IN_SERVICE → DONE)
- Auto-refresh mỗi 30s (sử dụng `refetchInterval: 30000` trong useQuery)

---

## Routes

```typescript
{ path: 'appointments', element: <AppointmentListPage /> },
{ path: 'appointments/new', element: <RequireRole roles={['RECEPTIONIST', 'ADMIN']}><AppointmentCreatePage /></RequireRole> },
{ path: 'appointments/:id', element: <AppointmentDetailPage /> },
{ path: 'queue', element: <RequireRole roles={['DOCTOR', 'NURSE', 'ADMIN', 'MANAGER']}><QueueDashboardPage /></RequireRole> },
```

---

## Sidebar items mới

```typescript
// Trong group chính, hiển thị với RECEPTIONIST, DOCTOR, NURSE, ADMIN:
{ label: 'Lịch hẹn', icon: CalendarCheck, path: '/app/appointments' },
{ label: 'Hàng đợi', icon: ListOrdered, path: '/app/queue' },
```

---

## Test Cases

```typescript
// POST /appointments — scheduledAt trong quá khứ → 400
// POST /appointments — bác sĩ không có DoctorProfile → 400
// POST /appointments — conflict → 409
// PATCH /appointments/:id/cancel — status CHECKED_IN → 400
// POST /appointments/:id/checkin — status CANCELLED → 400
// POST /appointments/:id/checkin — SCHEDULED → 201 QueueTicket { queueNumber: 1 }
// POST /appointments/:id/checkin lần 2 (cùng appointment) → 400
// GET /queue?date=today — trả về đúng tickets của ngày
// PATCH /queue/:id/status { status: DONE } từ WAITING → 400 (invalid transition)
// PATCH /queue/:id/status { status: CALLED } từ WAITING → 200
```

---

## Kiểm tra

```bash
cd backend
npm run build
npm run test -- --testPathPattern "appointment|queue"
```

```bash
cd frontend
npm run build
npm run lint
```

---

## Definition of Done

```
☐ POST /appointments kiểm tra conflict bác sĩ
☐ POST /appointments/:id/checkin tạo QueueTicket với queueNumber tăng dần
☐ Duplicate checkin trả 400
☐ PATCH /queue/:id/status validate state transition
☐ AppointmentListPage: RECEPTIONIST thấy nút "Check-in", MANAGER chỉ xem
☐ QueueDashboardPage auto-refresh 30s
☐ NURSE thấy nút "Gọi"/"Bỏ qua", DOCTOR thấy "Bắt đầu"/"Hoàn thành"
☐ npm run build PASS (backend + frontend)
☐ npm run lint PASS (frontend)
```
