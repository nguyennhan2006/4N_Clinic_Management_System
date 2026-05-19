import type { Role } from '@/features/auth/types'

export interface NavItem {
  label: string
  path: string
  icon: string
  roles: Role[]
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export const navigationConfig: NavSection[] = [
  {
    items: [
      {
        label: 'Dashboard',
        path: '/app/dashboard',
        icon: 'LayoutDashboard',
        roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'CASHIER', 'MANAGER'],
      },
    ],
  },
  {
    title: 'Bệnh nhân & Khám bệnh',
    items: [
      {
        label: 'Bệnh nhân',
        path: '/app/patients',
        icon: 'Users',
        roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'MANAGER'],
      },
      {
        label: 'Lượt khám',
        path: '/app/visits',
        icon: 'Calendar',
        roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'MANAGER'],
      },
      {
        label: 'Phiếu khám',
        path: '/app/examinations',
        icon: 'Stethoscope',
        roles: ['ADMIN', 'DOCTOR'],
      },
    ],
  },
  {
    title: 'Tài chính',
    items: [
      {
        label: 'Hóa đơn',
        path: '/app/invoices',
        icon: 'Receipt',
        roles: ['ADMIN', 'CASHIER', 'MANAGER'],
      },
    ],
  },
  {
    title: 'Báo cáo & Danh mục',
    items: [
      {
        label: 'Báo cáo tháng',
        path: '/app/reports/monthly',
        icon: 'BarChart3',
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        label: 'Danh mục bệnh',
        path: '/app/catalog/diseases',
        icon: 'BookOpen',
        // MANAGER can view catalog for reference (read-only actions enforced at page level)
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        label: 'Danh mục thuốc',
        path: '/app/catalog/medicines',
        icon: 'Pill',
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
  {
    title: 'Quản trị',
    items: [
      {
        label: 'Quy định',
        path: '/app/settings/regulations',
        icon: 'Settings',
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        label: 'Tài khoản',
        path: '/app/admin/users',
        icon: 'UserCog',
        roles: ['ADMIN'],
      },
    ],
  },
]
