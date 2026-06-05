# Task 02 — Organization: Department, Room, DoctorProfile, StaffSchedule

> Branch: `feat/phase2-organization`  
> Merge vào: `develop`  
> Phụ thuộc: Task 01 (`feat/phase2-schema`) phải merged trước  
> Owner: 1 người (Backend + Frontend)  
> Estimated: 2–3 ngày

---

## Mục tiêu

Xây dựng module quản lý cơ cấu tổ chức phòng khám:
- CRUD Department (khoa)
- CRUD Room (phòng khám)
- DoctorProfile (thông tin chi tiết bác sĩ, liên kết với User)
- StaffSchedule (lịch làm việc)

Đây là foundation cho Task 03 (Appointment + Queue).

---

## Files được tạo mới

### Backend
```
backend/src/modules/organization/
  organization.module.ts
  organization.controller.ts
  organization.service.ts
  dto/
    create-department.dto.ts
    update-department.dto.ts
    create-room.dto.ts
    update-room.dto.ts
    create-doctor-profile.dto.ts
    update-doctor-profile.dto.ts
    create-staff-schedule.dto.ts
    query-schedule.dto.ts
```

### Frontend
```
frontend/src/features/organization/
  api.ts
  types.ts
  DepartmentListPage.tsx
  RoomListPage.tsx
  DoctorProfilePage.tsx
  StaffSchedulePage.tsx
  components/
    DepartmentForm.tsx
    RoomForm.tsx
    DoctorProfileForm.tsx
    ScheduleGrid.tsx
```

## Files được sửa

- `backend/src/app.module.ts` — import `OrganizationModule`
- `frontend/src/app/router.tsx` — thêm routes organization
- `frontend/src/components/common/Sidebar.tsx` — thêm menu "Tổ chức"

**Không được sửa:** schema.prisma, auth, patients, visits, examinations, billing

---

## Backend — DTOs

### create-department.dto.ts
```typescript
import { IsString, IsOptional, IsBoolean } from 'class-validator'

export class CreateDepartmentDto {
  @IsString()
  name: string

  @IsOptional()
  @IsString()
  code?: string

  @IsOptional()
  @IsString()
  description?: string
}

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
```

### create-room.dto.ts
```typescript
export class CreateRoomDto {
  @IsString()
  name: string

  @IsString()
  departmentId: string

  @IsOptional()
  @IsString()
  code?: string
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
```

### create-doctor-profile.dto.ts
```typescript
export class CreateDoctorProfileDto {
  @IsString()
  userId: string       // phải là User có role DOCTOR

  @IsString()
  departmentId: string

  @IsOptional()
  @IsString()
  specialization?: string

  @IsOptional()
  @IsString()
  licenseNumber?: string

  @IsOptional()
  @IsInt()
  consultationFee?: number  // VND, override regulation default nếu có
}
```

### create-staff-schedule.dto.ts
```typescript
export class CreateStaffScheduleDto {
  @IsString()
  userId: string

  @IsDateString()
  workDate: string      // 'YYYY-MM-DD'

  @IsString()
  shiftStart: string    // 'HH:MM' 24h

  @IsString()
  shiftEnd: string      // 'HH:MM' 24h

  @IsOptional()
  @IsString()
  roomId?: string
}

export class QueryScheduleDto {
  @IsOptional()
  @IsDateString()
  from?: string

  @IsOptional()
  @IsDateString()
  to?: string

  @IsOptional()
  @IsString()
  userId?: string

  @IsOptional()
  @IsString()
  departmentId?: string
}
```

---

## Backend — API Endpoints

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | /organization/departments | ALL | Danh sách khoa (có filter isActive) |
| POST | /organization/departments | ADMIN | Tạo khoa mới |
| PATCH | /organization/departments/:id | ADMIN | Cập nhật khoa |
| GET | /organization/rooms | ALL | Danh sách phòng (filter by departmentId) |
| POST | /organization/rooms | ADMIN | Tạo phòng |
| PATCH | /organization/rooms/:id | ADMIN | Cập nhật phòng |
| GET | /organization/doctors | ALL | Danh sách DoctorProfile |
| POST | /organization/doctors | ADMIN | Tạo DoctorProfile |
| PATCH | /organization/doctors/:id | ADMIN | Cập nhật DoctorProfile |
| GET | /organization/schedules | ADMIN, MANAGER, NURSE | Xem lịch làm việc |
| POST | /organization/schedules | ADMIN | Tạo lịch làm việc |
| DELETE | /organization/schedules/:id | ADMIN | Xóa lịch làm việc |

**Controller prefix:** `@Controller('organization')` — tất cả route có `/organization/` prefix

---

## Backend — Service Logic

### OrganizationService.findDepartments()
```typescript
async findDepartments(isActive?: boolean) {
  return this.prisma.department.findMany({
    where: isActive !== undefined ? { isActive } : {},
    include: { rooms: { where: { isActive: true } } },
    orderBy: { name: 'asc' },
  })
}
```

### OrganizationService.createDoctorProfile()
- Validate: `userId` phải tồn tại và có `role.code === 'DOCTOR'`
- Validate: mỗi User chỉ có 1 DoctorProfile (unique constraint đã có trong schema)
- Nếu userId không phải DOCTOR → throw `BadRequestException('User must have DOCTOR role')`

### OrganizationService.findSchedules(query)
```typescript
async findSchedules(query: QueryScheduleDto) {
  return this.prisma.staffSchedule.findMany({
    where: {
      workDate: {
        gte: query.from ? new Date(query.from) : undefined,
        lte: query.to ? new Date(query.to) : undefined,
      },
      userId: query.userId,
      user: query.departmentId ? {
        doctorProfile: { departmentId: query.departmentId }
      } : undefined,
    },
    include: { user: { select: { fullName: true, id: true } }, room: true },
    orderBy: [{ workDate: 'asc' }, { shiftStart: 'asc' }],
  })
}
```

---

## Business Rules

| Rule | Mô tả |
|------|-------|
| BR-ORG-01 | Department phải có `name` unique. Nếu trùng → 409 |
| BR-ORG-02 | Room phải thuộc 1 Department đang active. Nếu Department inactive → 400 |
| BR-ORG-03 | DoctorProfile chỉ tạo được cho User có role DOCTOR |
| BR-ORG-04 | Mỗi User chỉ có 1 DoctorProfile |
| BR-ORG-05 | StaffSchedule: shiftEnd phải sau shiftStart |
| BR-ORG-06 | Không được xóa Department/Room nếu còn active Visit/Appointment tham chiếu |

---

## Frontend — API Client

### frontend/src/features/organization/api.ts
```typescript
import { apiClient } from '@/lib/api-client'
import type {
  Department, Room, DoctorProfile, StaffSchedule,
  CreateDepartmentPayload, CreateRoomPayload,
  CreateDoctorProfilePayload, CreateStaffSchedulePayload,
  QueryScheduleParams,
} from './types'

export const organizationApi = {
  // Departments
  listDepartments: (isActive?: boolean) =>
    apiClient.get<Department[]>('/organization/departments', isActive !== undefined ? { isActive } : {}),
  createDepartment: (data: CreateDepartmentPayload) =>
    apiClient.post<Department>('/organization/departments', data),
  updateDepartment: (id: string, data: Partial<CreateDepartmentPayload> & { isActive?: boolean }) =>
    apiClient.patch<Department>(`/organization/departments/${id}`, data),

  // Rooms
  listRooms: (departmentId?: string) =>
    apiClient.get<Room[]>('/organization/rooms', departmentId ? { departmentId } : {}),
  createRoom: (data: CreateRoomPayload) =>
    apiClient.post<Room>('/organization/rooms', data),
  updateRoom: (id: string, data: Partial<CreateRoomPayload> & { isActive?: boolean }) =>
    apiClient.patch<Room>(`/organization/rooms/${id}`, data),

  // Doctors
  listDoctors: () =>
    apiClient.get<DoctorProfile[]>('/organization/doctors'),
  createDoctorProfile: (data: CreateDoctorProfilePayload) =>
    apiClient.post<DoctorProfile>('/organization/doctors', data),

  // Schedules
  listSchedules: (params: QueryScheduleParams) =>
    apiClient.get<StaffSchedule[]>('/organization/schedules', params),
  createSchedule: (data: CreateStaffSchedulePayload) =>
    apiClient.post<StaffSchedule>('/organization/schedules', data),
  deleteSchedule: (id: string) =>
    apiClient.delete<void>(`/organization/schedules/${id}`),
}
```

### frontend/src/features/organization/types.ts
```typescript
export interface Department {
  id: string
  name: string
  code: string | null
  description: string | null
  isActive: boolean
  rooms?: Room[]
  createdAt: string
}

export interface Room {
  id: string
  name: string
  code: string | null
  departmentId: string
  isActive: boolean
}

export interface DoctorProfile {
  id: string
  userId: string
  departmentId: string
  specialization: string | null
  licenseNumber: string | null
  consultationFee: number | null
  user?: { id: string; fullName: string; email: string }
  department?: { id: string; name: string }
}

export interface StaffSchedule {
  id: string
  userId: string
  workDate: string
  shiftStart: string
  shiftEnd: string
  roomId: string | null
  user?: { id: string; fullName: string }
  room?: { id: string; name: string } | null
}

export interface CreateDepartmentPayload {
  name: string
  code?: string
  description?: string
}

export interface CreateRoomPayload {
  name: string
  departmentId: string
  code?: string
}

export interface CreateDoctorProfilePayload {
  userId: string
  departmentId: string
  specialization?: string
  licenseNumber?: string
  consultationFee?: number
}

export interface CreateStaffSchedulePayload {
  userId: string
  workDate: string
  shiftStart: string
  shiftEnd: string
  roomId?: string
}

export interface QueryScheduleParams {
  from?: string
  to?: string
  userId?: string
  departmentId?: string
}
```

---

## Frontend — Pages

### DepartmentListPage.tsx
- Bảng: name, code, số phòng active, trạng thái (badge Active/Inactive)
- Nút "Thêm khoa" → dialog form → POST
- Nút "Sửa" → inline edit hoặc dialog → PATCH
- Filter: tất cả / đang hoạt động
- Chỉ ADMIN thấy nút Thêm/Sửa

### RoomListPage.tsx
- Filter dropdown: chọn Department
- Bảng: name, code, department, trạng thái
- Nút thêm/sửa phòng (ADMIN only)

### DoctorProfilePage.tsx
- Bảng doctor: avatar placeholder, fullName, email, department, specialization, licenseNumber, consultationFee
- Nút "Thêm hồ sơ bác sĩ" (ADMIN) → chọn User từ dropdown (filter role=DOCTOR, chưa có profile)
- Nút "Sửa"

### StaffSchedulePage.tsx
- Date range picker (from/to)
- Filter by Department
- Bảng hoặc calendar view (bảng là đủ)
- Nút "Thêm lịch" (ADMIN) → form: chọn User, workDate, shiftStart, shiftEnd, Room
- Nút "Xóa" với confirm dialog

---

## Routes cần thêm vào router.tsx

```typescript
// Trong /app children
{ path: 'organization/departments', element: <RequireRole roles={['ADMIN', 'MANAGER']}><DepartmentListPage /></RequireRole> },
{ path: 'organization/rooms', element: <RequireRole roles={['ADMIN', 'MANAGER']}><RoomListPage /></RequireRole> },
{ path: 'organization/doctors', element: <RequireRole roles={['ADMIN', 'MANAGER']}><DoctorProfilePage /></RequireRole> },
{ path: 'organization/schedules', element: <RequireRole roles={['ADMIN', 'MANAGER', 'NURSE']}><StaffSchedulePage /></RequireRole> },
```

---

## Sidebar — menu item mới

Thêm group "Tổ chức" sau "Cài đặt", chỉ hiển thị với ADMIN và MANAGER:

```typescript
{
  group: 'Tổ chức',
  roles: ['ADMIN', 'MANAGER'],
  items: [
    { label: 'Khoa & Phòng', icon: Building2, path: '/app/organization/departments' },
    { label: 'Hồ sơ bác sĩ', icon: Stethoscope, path: '/app/organization/doctors' },
    { label: 'Lịch làm việc', icon: CalendarDays, path: '/app/organization/schedules' },
  ]
}
```

---

## Test Cases

### Backend (file: `backend/src/modules/organization/organization.controller.spec.ts`)

```typescript
// GET /organization/departments — no auth → 401
// GET /organization/departments — DOCTOR token → 200 []
// POST /organization/departments — ADMIN → 201 { id, name }
// POST /organization/departments — duplicate name → 409
// POST /organization/departments — DOCTOR token → 403
// POST /organization/rooms — departmentId không tồn tại → 404
// POST /organization/doctors — userId không phải DOCTOR → 400
// POST /organization/doctors — duplicate userId → 409
// POST /organization/schedules — shiftEnd < shiftStart → 400
```

### Frontend manual
- ADMIN: thấy nút Thêm, tạo department, tạo room thuộc department đó
- MANAGER: thấy trang, không thấy nút Thêm/Sửa
- DOCTOR: không thấy menu Tổ chức

---

## Kiểm tra

```bash
cd backend
npm run build
npm run test -- --testPathPattern organization
```

```bash
cd frontend
npm run build
npm run lint
```

---

## Definition of Done

```
☐ GET /organization/departments trả về danh sách có rooms[]
☐ POST /organization/departments ADMIN → 201
☐ POST /organization/departments DOCTOR → 403
☐ POST /organization/doctors userId không phải DOCTOR → 400
☐ DepartmentListPage render đúng, ADMIN thấy nút thêm
☐ RoomListPage filter theo Department hoạt động
☐ DoctorProfilePage hiển thị doctor + department
☐ StaffSchedulePage có date range filter
☐ npm run build PASS (backend + frontend)
☐ npm run lint PASS (frontend)
```
