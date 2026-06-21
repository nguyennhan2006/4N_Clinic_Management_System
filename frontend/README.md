# Frontend — 4N Clinic Management System

Tài liệu này mô tả toàn bộ kiến trúc, công nghệ, và quy ước của phần frontend.

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Tech stack](#2-tech-stack)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Các trang và route](#4-các-trang-và-route)
5. [Giao diện và layout](#5-giao-diện-và-layout)
6. [Hệ thống màu sắc](#6-hệ-thống-màu-sắc)
7. [Xác thực và phân quyền](#7-xác-thực-và-phân-quyền)
8. [Quản lý state](#8-quản-lý-state)
9. [Gọi API](#9-gọi-api)
10. [Form và validation](#10-form-và-validation)
11. [Các component dùng chung](#11-các-component-dùng-chung)
12. [Build và môi trường](#12-build-và-môi-trường)
13. [Quy ước code](#13-quy-ước-code)

---

## 1. Tổng quan

Frontend là một **SPA (Single Page Application)** viết bằng **React 19 + TypeScript**, giao tiếp với backend thông qua REST API. Toàn bộ giao diện được thiết kế theo phong cách y tế chuyên nghiệp với màu chủ đạo xanh đậm (sidebar) và hồng đỏ (primary action).

Điểm vào: `src/main.tsx` → render vào `index.html`.

---

## 2. Tech stack

| Hạng mục | Công nghệ | Phiên bản |
|---|---|---|
| UI Framework | React | 19.2.0 |
| Ngôn ngữ | TypeScript | ~5.9.3 |
| Build tool | Vite | 7.2.2 |
| CSS | Tailwind CSS | 4.3.0 |
| Routing | React Router DOM | 7.15.1 |
| Server state | TanStack Query (React Query) | 5.100.10 |
| Client state | Zustand | 5.0.13 |
| Form | React Hook Form | 7.76.0 |
| Validation | Zod | 4.4.3 |
| Icons | Lucide React | 1.16.0 |
| Toast | Sonner | 2.0.7 |
| Class utility | clsx + tailwind-merge | — |
| Linting | ESLint + TypeScript ESLint | — |
| Package manager | npm | — |

Không dùng CDN — tất cả dependency đều được cài qua npm và bundle bởi Vite.

---

## 3. Cấu trúc thư mục

```
frontend/
├── public/                        # Static assets (favicon, vite.svg)
├── src/
│   ├── app/
│   │   ├── providers.tsx          # TanStack Query Provider + Sonner Toaster
│   │   └── router.tsx             # Toàn bộ cấu hình route
│   │
│   ├── components/
│   │   └── common/                # Component dùng chung toàn app
│   │       ├── AppShell.tsx       # Layout chính (Sidebar + Topbar + Outlet)
│   │       ├── Sidebar.tsx        # Thanh điều hướng trái, lọc theo role
│   │       ├── Topbar.tsx         # Header với user dropdown
│   │       ├── PageHeader.tsx     # Tiêu đề trang + nút action
│   │       ├── RoleBadge.tsx      # Badge hiển thị vai trò
│   │       ├── StatusBadge.tsx    # Badge hiển thị trạng thái (visit, invoice...)
│   │       ├── ConfirmDialog.tsx  # Modal xác nhận hành động
│   │       ├── LoadingState.tsx   # Skeleton loading (cấu hình số dòng)
│   │       ├── EmptyState.tsx     # Trạng thái không có dữ liệu
│   │       └── ErrorState.tsx     # Trạng thái lỗi + nút retry
│   │
│   ├── config/
│   │   ├── navigation.ts          # Cấu trúc menu sidebar, lọc theo role
│   │   └── permissions.ts         # Mapping role → label + màu sắc
│   │
│   ├── features/                  # Mỗi tính năng là một thư mục riêng
│   │   ├── auth/
│   │   ├── patients/
│   │   ├── visits/
│   │   ├── examinations/
│   │   ├── invoices/
│   │   ├── reports/
│   │   ├── regulations/
│   │   ├── diseases/
│   │   ├── medicines/
│   │   ├── users/
│   │   ├── dashboard/
│   │   └── [phase-2]/             # appointments, lab, pharmacy, queue, inventory...
│   │
│   ├── lib/
│   │   ├── api-client.ts          # HTTP client dùng fetch, tự gắn token
│   │   ├── query-client.ts        # Cấu hình TanStack Query
│   │   ├── errors.ts              # ApiError class + map HTTP status → message
│   │   ├── date.ts                # Formatter ngày/giờ locale vi-VN
│   │   ├── money.ts               # Formatter tiền VND
│   │   └── cn.ts                  # clsx + tailwind-merge helper
│   │
│   ├── pages/
│   │   ├── ForbiddenPage.tsx      # Trang 403
│   │   └── NotFoundPage.tsx       # Trang 404
│   │
│   ├── styles/
│   │   └── globals.css            # @import tailwindcss + @theme variables
│   │
│   └── main.tsx                   # Entry point
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
└── .env                           # VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Cấu trúc một feature

Mỗi thư mục trong `features/` thường có các file sau:

```
features/patients/
├── api.ts          # Các hàm gọi API (fetchPatients, createPatient...)
├── types.ts        # TypeScript types/interfaces
├── hooks.ts        # Custom hooks (useQuery, useMutation wrappers)
├── PatientListPage.tsx
├── PatientCreatePage.tsx
├── PatientDetailPage.tsx
└── MedicalHistoryPage.tsx
```

---

## 4. Các trang và route

### Route công khai

| Route | Trang |
|---|---|
| `/login` | Đăng nhập |
| `/403` | Không có quyền truy cập |
| `/404` | Trang không tồn tại |

### Route được bảo vệ (`/app/*`)

Tất cả route dưới `/app` đều yêu cầu đăng nhập. Một số route còn giới hạn theo vai trò.

| Route | Trang | Vai trò được phép |
|---|---|---|
| `/app/dashboard` | Tổng quan | Tất cả |
| `/app/patients` | Danh sách bệnh nhân | ADMIN, RECEPTIONIST, DOCTOR, MANAGER |
| `/app/patients/new` | Tiếp nhận bệnh nhân mới | ADMIN, RECEPTIONIST |
| `/app/patients/:id` | Chi tiết bệnh nhân | ADMIN, RECEPTIONIST, DOCTOR, MANAGER |
| `/app/patients/:id/history` | Lịch sử khám | ADMIN, DOCTOR, MANAGER |
| `/app/visits` | Danh sách lượt khám | ADMIN, RECEPTIONIST, DOCTOR, MANAGER |
| `/app/visits/new` | Tạo lượt khám | ADMIN, RECEPTIONIST |
| `/app/examinations/:id` | Phiếu khám bệnh | ADMIN, DOCTOR |
| `/app/invoices` | Danh sách hóa đơn | ADMIN, CASHIER, MANAGER |
| `/app/invoices/:id` | Chi tiết hóa đơn | ADMIN, CASHIER, MANAGER |
| `/app/reports/monthly` | Báo cáo tháng | ADMIN, MANAGER |
| `/app/catalog/diseases` | Danh mục bệnh | ADMIN, MANAGER |
| `/app/catalog/medicines` | Danh mục thuốc | ADMIN, MANAGER |
| `/app/settings/regulations` | Quy định phòng khám | ADMIN, MANAGER |
| `/app/admin/users` | Quản lý người dùng | ADMIN |
| `/app/admin/roles` | Quản lý vai trò | ADMIN |

### Route Phase 2 (chưa hoàn thiện)

`/app/appointments`, `/app/queue`, `/app/lab`, `/app/inventory`, `/app/pharmacy`, `/app/catalog/services`, `/app/admin/audit-log`, `/app/organization/*`

---

## 5. Giao diện và layout

### AppShell

Layout tổng thể của toàn bộ app sau khi đăng nhập:

```
┌─────────────────────────────────────────────────────┐
│                      Topbar (h-14)                   │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│   Sidebar    │         Nội dung trang                │
│   (w-64)     │         <Outlet />                    │
│              │         padding: 24px                 │
│              │                                       │
└──────────────┴──────────────────────────────────────┘
```

**Sidebar:**
- Cố định bên trái, rộng 256px
- Nền xanh đậm `#1E3A5F`
- Logo + tên hệ thống ở trên cùng
- Menu điều hướng theo nhóm chức năng, tự lọc theo vai trò đăng nhập
- Link đang active được highlight
- Thông tin user + nút đăng xuất ở dưới cùng

**Topbar:**
- Cố định phía trên, cao 56px
- Bên phải: icon thông báo + dropdown user
- Dropdown user: tên, tên đăng nhập, badge vai trò, nút đăng xuất

**Nội dung trang:**
- Padding 24px xung quanh
- Nền nhạt `#FAFBFC`
- Card trắng với bo góc và shadow nhẹ

---

## 6. Hệ thống màu sắc

Toàn bộ màu sắc được định nghĩa trong `src/styles/globals.css` thông qua `@theme` của Tailwind CSS 4:

| Token | Giá trị | Mô tả |
|---|---|---|
| `--color-clinic-bg` | `#FAFBFC` | Nền trang |
| `--color-clinic-surface` | `#FFFFFF` | Nền card/panel |
| `--color-clinic-sidebar` | `#1E3A5F` | Nền sidebar |
| `--color-clinic-sidebar-muted` | `#E8F0F7` | Accent sidebar |
| `--color-clinic-primary` | `#E04A60` | Màu chủ đạo (hồng đỏ) |
| `--color-clinic-primary-hover` | `#C73A50` | Hover state |
| `--color-clinic-secondary` | `#4A9B9F` | Màu phụ (teal) |
| `--color-clinic-accent` | `#F4A261` | Màu nhấn (cam) |
| `--color-clinic-success` | `#10B981` | Thành công (xanh lá) |
| `--color-clinic-warning` | `#F59E0B` | Cảnh báo (vàng) |
| `--color-clinic-danger` | `#DC2626` | Nguy hiểm (đỏ) |
| `--color-clinic-info` | `#3B82F6` | Thông tin (xanh dương) |
| `--color-clinic-text` | `#1A202C` | Chữ chính |
| `--color-clinic-muted` | `#64748B` | Chữ phụ/placeholder |
| `--color-clinic-border` | `#E2E8F0` | Viền |
| `--radius-clinic` | `1rem` | Bo góc chuẩn |
| `--shadow-clinic` | `0 8px 24px rgba(26,32,44,0.08)` | Shadow chuẩn |

Dùng trong JSX: `className="bg-clinic-primary text-white rounded-clinic shadow-clinic"`

---

## 7. Xác thực và phân quyền

### Luồng đăng nhập

```
1. User vào /login
2. Nhập email + mật khẩu → POST /auth/login
3. Backend trả về { accessToken, refreshToken, user }
4. Lưu token vào localStorage (key: "access_token")
5. Lưu thông tin user vào Zustand store
6. Redirect đến /app/dashboard
```

### Bảo vệ route

- **`ProtectedRoute`** — wrap tất cả `/app/*`, kiểm tra có token không. Nếu không → redirect `/login`
- **`RequireRole`** — wrap các route nhạy cảm, kiểm tra role. Nếu không đủ quyền → redirect `/403`

### Vai trò (Role)

```typescript
type Role =
  | 'ADMIN'
  | 'RECEPTIONIST'
  | 'DOCTOR'
  | 'CASHIER'
  | 'MANAGER'
  | 'NURSE'
  | 'LAB_TECHNICIAN'
  | 'PHARMACIST'
```

### Zustand Auth Store (`features/auth/store.ts`)

```typescript
// Các method chính
setAuth(user, token)  // gọi sau khi login thành công
logout()              // xóa token, redirect /login
hasRole(roles[])      // kiểm tra role của user hiện tại
```

State được persist qua `localStorage` — F5 không mất đăng nhập.

### Token trong API request

`api-client.ts` tự động gắn header:
```
Authorization: Bearer <access_token>
```

Nếu nhận 401 → tự động logout và redirect về `/login`.

---

## 8. Quản lý state

App dùng **2 lớp state** tách biệt:

### Server state — TanStack Query

Dùng cho tất cả dữ liệu từ API (danh sách bệnh nhân, lượt khám, hóa đơn...).

```typescript
// Ví dụ hook trong features/patients/hooks.ts
export function usePatientsQuery(params: SearchParams) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => fetchPatients(params),
  })
}

export function useCreatePatientMutation() {
  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Đã thêm bệnh nhân')
    },
  })
}
```

**Query key conventions:**
- Danh sách: `['patients']` hoặc `['patients', filterParams]`
- Chi tiết: `['patients', id]`

### Client state — Zustand

Chỉ dùng cho auth store. Không dùng Zustand cho server data.

---

## 9. Gọi API

### API Client (`src/lib/api-client.ts`)

Wrapper quanh `fetch` với:
- Base URL từ `import.meta.env.VITE_API_BASE_URL`
- Tự gắn `Authorization: Bearer` header
- Parse JSON response
- Map HTTP error → `ApiError` với message tiếng Việt
- 401 → auto logout

```typescript
// Các method
apiClient.get<T>(path, params?)
apiClient.post<T>(path, body?)
apiClient.put<T>(path, body?)
apiClient.patch<T>(path, body?)
apiClient.delete<T>(path)
```

### Ví dụ API file (`features/patients/api.ts`)

```typescript
export async function fetchPatients(params: SearchParams): Promise<PaginatedResponse<Patient>> {
  return apiClient.get('/patients', params)
}

export async function createPatient(data: CreatePatientRequest): Promise<Patient> {
  return apiClient.post('/patients', data)
}
```

### Cấu hình môi trường (`.env`)

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Map lỗi HTTP

| Status | Message |
|---|---|
| 400 | Dữ liệu không hợp lệ |
| 401 | Phiên đăng nhập hết hạn |
| 403 | Không có quyền thực hiện |
| 404 | Không tìm thấy |
| 409 | Xung đột dữ liệu (vi phạm nghiệp vụ) |
| 500 | Lỗi máy chủ |

---

## 10. Form và validation

App dùng **React Hook Form** + **Zod** cho tất cả form:

```typescript
const schema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  dateOfBirth: z.string().min(1, 'Vui lòng chọn ngày sinh'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại không hợp lệ'),
})

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { fullName: '', ... },
})
```

**Quy ước:**
- Tất cả message lỗi viết bằng **tiếng Việt**
- Submit button hiển thị loading khi đang gửi (`isPending`)
- Disable form khi đang submit để tránh double-submit

---

## 11. Các component dùng chung

### `PageHeader`

```tsx
<PageHeader
  title="Danh sách bệnh nhân"
  description="Quản lý hồ sơ bệnh nhân"
  action={{ label: 'Thêm bệnh nhân', onClick: () => navigate('/app/patients/new') }}
/>
```

### `StatusBadge`

Hiển thị badge màu theo trạng thái.

**Lượt khám:** `REGISTERED` · `WAITING` · `IN_EXAMINATION` · `COMPLETED` · `CANCELLED`

**Hóa đơn:** `DRAFT` · `ISSUED` · `PAID` · `CANCELLED`

### `RoleBadge`

```tsx
<RoleBadge role="DOCTOR" />  // → badge "Bác sĩ" màu tương ứng
```

### `LoadingState`

```tsx
<LoadingState rows={5} />  // skeleton 5 dòng
```

### `EmptyState`

```tsx
<EmptyState
  message="Chưa có bệnh nhân nào"
  action={{ label: 'Thêm bệnh nhân', onClick: ... }}
/>
```

### `ErrorState`

```tsx
<ErrorState message="Không thể tải dữ liệu" onRetry={refetch} />
```

### `ConfirmDialog`

Modal xác nhận trước khi thực hiện hành động nguy hiểm (xóa, hủy...).

---

## 12. Build và môi trường

### Scripts

```bash
npm run dev       # Dev server với HMR (Hot Module Replacement)
npm run build     # Kiểm tra TypeScript + build production (output: dist/)
npm run preview   # Xem trước bản build production
npm run lint      # Chạy ESLint
```

### Vite config (`vite.config.ts`)

- Plugin `@vitejs/plugin-react` — JSX transform + Fast Refresh
- Plugin `@tailwindcss/vite` — tích hợp Tailwind CSS 4
- Path alias: `@/*` → `src/*`

### TypeScript config

- `strict: true` — bật toàn bộ strict checks
- `noUnusedLocals`, `noUnusedParameters` — cảnh báo biến/param không dùng
- `target: ES2022`, `module: ESNext`

### ESLint

- `eslint-plugin-react-hooks` — enforce rules of hooks
- `eslint-plugin-react-refresh` — đảm bảo Fast Refresh hoạt động đúng
- `typescript-eslint` — type-aware linting

---

## 13. Quy ước code

### Đặt tên

| Loại | Convention | Ví dụ |
|---|---|---|
| Component | PascalCase | `PatientListPage`, `StatusBadge` |
| File component | Tên khớp component | `PatientListPage.tsx` |
| Hook | camelCase + `use` prefix | `usePatientsQuery`, `useAuthStore` |
| Type/Interface | PascalCase | `Patient`, `CreatePatientRequest` |
| Hằng số | UPPER_SNAKE_CASE | `API_BASE_URL` |
| Hàm thường | camelCase | `formatDate`, `formatMoney` |

### Formatting tiện ích

```typescript
// src/lib/date.ts — Ngày/giờ theo locale vi-VN
formatDate(date)        // → "15/06/2026"
formatDateTime(date)    // → "15/06/2026, 14:30"
formatTime(date)        // → "14:30"

// src/lib/money.ts — Tiền VND
formatMoney(150000)     // → "150.000 ₫"
```

### Class utility

```typescript
import { cn } from '@/lib/cn'

// Kết hợp clsx + tailwind-merge
cn('px-4 py-2', isActive && 'bg-clinic-primary', className)
```

### Quy tắc chung

- Không dùng `any` — dùng type rõ ràng hoặc `unknown`
- Không để `console.log` trong code production
- Mỗi trang phải xử lý đủ 3 trạng thái: loading / error / có dữ liệu
- Import tuyệt đối với alias `@/` thay vì `../../`
- Comment chỉ viết khi giải thích **lý do** (why), không giải thích code làm gì (what)
- Không dùng `any` để bỏ qua TypeScript error — sửa type cho đúng
