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
        label: 'Lịch hẹn',
        path: '/app/appointments',
        icon: 'CalendarCheck',
        roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'MANAGER'],
      },
      {
        label: 'Lượt khám',
        path: '/app/visits',
        icon: 'Calendar',
        roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'MANAGER'],
      },
      {
        label: 'Hàng đợi',
        path: '/app/queue',
        icon: 'ListOrdered',
        roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'],
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
    title: 'Lâm sàng',
    items: [
      {
        label: 'Xét nghiệm',
        path: '/app/lab',
        icon: 'FlaskConical',
        roles: ['ADMIN', 'DOCTOR', 'NURSE', 'LAB_TECH'],
      },
      {
        label: 'Phát thuốc',
        path: '/app/pharmacy',
        icon: 'Pill',
        roles: ['ADMIN', 'PHARMACIST'],
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
    title: 'Kho & Dịch vụ',
    items: [
      {
        label: 'Tồn kho thuốc',
        path: '/app/inventory',
        icon: 'Package',
        roles: ['ADMIN', 'PHARMACIST', 'MANAGER'],
      },
      {
        label: 'Danh mục dịch vụ',
        path: '/app/catalog/services',
        icon: 'LayoutList',
        roles: ['ADMIN', 'MANAGER'],
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
    title: 'Tổ chức',
    items: [
      {
        label: 'Khoa & Phòng',
        path: '/app/organization/departments',
        icon: 'Building2',
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        label: 'Hồ sơ bác sĩ',
        path: '/app/organization/doctors',
        icon: 'Stethoscope',
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
      {
        label: 'Nhật ký hệ thống',
        path: '/app/admin/audit-log',
        icon: 'ShieldCheck',
        roles: ['ADMIN'],
      },
    ],
  },
]
