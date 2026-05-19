import { cn } from '@/lib/cn'

type VisitStatus = 'REGISTERED' | 'WAITING' | 'IN_EXAMINATION' | 'COMPLETED' | 'CANCELLED'
type ExaminationStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED'
type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED'

type StatusVariant = VisitStatus | ExaminationStatus | InvoiceStatus | UserStatus

const STATUS_CONFIG: Record<StatusVariant, { label: string; className: string }> = {
  // Visit
  REGISTERED:    { label: 'Đã đăng ký',          className: 'bg-clinic-sidebar-muted text-clinic-sidebar' },
  WAITING:       { label: 'Đang chờ',             className: 'bg-[#FEF3C7] text-[#92400E]' },
  IN_EXAMINATION:{ label: 'Đang khám',            className: 'bg-[#CCFBF1] text-[#0F766E]' },
  COMPLETED:     { label: 'Hoàn tất',             className: 'bg-[#D1FAE5] text-[#065F46]' },
  CANCELLED:     { label: 'Đã hủy',               className: 'bg-[#FEE2E2] text-clinic-danger' },
  // Examination
  OPEN:          { label: 'Đang mở',              className: 'bg-[#CCFBF1] text-[#0F766E]' },
  // Invoice
  DRAFT:         { label: 'Nháp',                 className: 'bg-clinic-border text-clinic-muted' },
  ISSUED:        { label: 'Đã phát hành',          className: 'bg-[#DBEAFE] text-[#1D4ED8]' },
  PARTIALLY_PAID:{ label: 'Thanh toán một phần',  className: 'bg-[#FEF3C7] text-[#92400E]' },
  PAID:          { label: 'Đã thanh toán',         className: 'bg-[#D1FAE5] text-[#065F46]' },
  VOID:          { label: 'Đã hủy',               className: 'bg-[#FEE2E2] text-clinic-danger' },
  // User
  ACTIVE:        { label: 'Hoạt động',            className: 'bg-[#D1FAE5] text-[#065F46]' },
  INACTIVE:      { label: 'Không hoạt động',       className: 'bg-clinic-border text-clinic-muted' },
  LOCKED:        { label: 'Đã khóa',              className: 'bg-[#FEE2E2] text-clinic-danger' },
}

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
