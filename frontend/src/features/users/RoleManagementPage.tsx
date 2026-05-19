import { PageHeader } from '@/components/common/PageHeader'
import { RoleBadge } from '@/components/common/RoleBadge'
import { ROLE_LABELS } from '@/config/permissions'
import type { Role } from '@/features/auth/types'

interface RouteAccess {
  path: string
  label: string
  roles: Role[]
}

const ROUTE_ACCESS: RouteAccess[] = [
  { path: '/app/dashboard',            label: 'Dashboard',          roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'CASHIER', 'MANAGER'] },
  { path: '/app/patients',             label: 'Danh sách bệnh nhân', roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'MANAGER'] },
  { path: '/app/patients/new',         label: 'Thêm bệnh nhân',     roles: ['ADMIN', 'RECEPTIONIST'] },
  { path: '/app/patients/:id',         label: 'Chi tiết bệnh nhân', roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'MANAGER'] },
  { path: '/app/patients/:id/history', label: 'Lịch sử khám',       roles: ['ADMIN', 'DOCTOR', 'MANAGER'] },
  { path: '/app/visits',               label: 'Danh sách lượt khám',roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'MANAGER'] },
  { path: '/app/visits/new',           label: 'Tạo lượt khám',      roles: ['ADMIN', 'RECEPTIONIST'] },
  { path: '/app/examinations/:id',     label: 'Phiếu khám bệnh',    roles: ['ADMIN', 'DOCTOR'] },
  { path: '/app/invoices',             label: 'Danh sách hóa đơn',  roles: ['ADMIN', 'CASHIER', 'MANAGER'] },
  { path: '/app/invoices/:id',         label: 'Chi tiết hóa đơn',   roles: ['ADMIN', 'CASHIER', 'MANAGER'] },
  { path: '/app/reports/monthly',      label: 'Báo cáo tháng',      roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/catalog/diseases',     label: 'Danh mục bệnh',      roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/catalog/medicines',    label: 'Danh mục thuốc',     roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/settings/regulations', label: 'Quy định',           roles: ['ADMIN', 'MANAGER'] },
  { path: '/app/admin/users',          label: 'Quản lý tài khoản',  roles: ['ADMIN'] },
  { path: '/app/admin/roles',          label: 'Phân quyền',         roles: ['ADMIN'] },
]

const ALL_ROLES: Role[] = ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'CASHIER', 'MANAGER']

export function RoleManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân quyền"
        description="Ma trận quyền truy cập theo vai trò — chỉ đọc, cấu hình trong frontend/src/app/router.tsx"
      />

      {/* Role descriptions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ALL_ROLES.map((role) => (
          <div key={role} className="rounded-2xl bg-clinic-surface p-4 shadow-clinic">
            <RoleBadge role={role} className="mb-2" />
            <p className="text-xs text-clinic-muted">{ROLE_LABELS[role]}</p>
          </div>
        ))}
      </div>

      {/* Access matrix */}
      <div className="rounded-2xl bg-clinic-surface shadow-clinic">
        <div className="border-b border-clinic-border px-6 py-4">
          <h2 className="text-base font-semibold text-clinic-text">Ma trận quyền truy cập</h2>
          <p className="mt-0.5 text-xs text-clinic-muted">
            ✓ = có quyền truy cập &nbsp;·&nbsp; — = không có quyền (chuyển hướng /403)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-clinic-bg">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-clinic-muted">
                  Màn hình / Route
                </th>
                {ALL_ROLES.map((role) => (
                  <th
                    key={role}
                    className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-clinic-muted"
                  >
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-border">
              {ROUTE_ACCESS.map((row) => (
                <tr key={row.path} className="transition hover:bg-clinic-bg/50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-clinic-text">{row.label}</p>
                    <p className="font-mono text-[10px] text-clinic-muted">{row.path}</p>
                  </td>
                  {ALL_ROLES.map((role) => (
                    <td key={role} className="px-3 py-3 text-center">
                      {row.roles.includes(role) ? (
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-clinic-success text-xs font-bold text-[#065F46]"
                          aria-label="Có quyền"
                        >
                          ✓
                        </span>
                      ) : (
                        <span className="text-clinic-border" aria-label="Không có quyền">
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-clinic-muted">
        * Phân quyền backend được thực thi độc lập tại mỗi endpoint. Ma trận này chỉ phản ánh
        cấu hình frontend UI. Nguồn chính xác:{' '}
        <code className="rounded bg-clinic-bg px-1 font-mono">frontend-docs/rbac-matrix.md</code>
      </p>
    </div>
  )
}
