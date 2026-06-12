import { cn } from '@/lib/cn'

type VisitStatus = 'REGISTERED' | 'WAITING' | 'IN_EXAMINATION' | 'COMPLETED' | 'CANCELLED'
type ExaminationStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED'
type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED'

type StatusVariant = VisitStatus | ExaminationStatus | InvoiceStatus | UserStatus

const STATUS_CONFIG: Record<StatusVariant, { label: string; className: string }> = {
  // Visit
  REGISTERED:    { label: 'Đã đăng ký',          className: 'bg-blue-500/15 text-blue-400' },
  WAITING:       { label: 'Đang chờ',             className: 'bg-amber-500/15 text-amber-400' },
  IN_EXAMINATION:{ label: 'Đang khám',            className: 'bg-cyan-500/15 text-cyan-400' },
  COMPLETED:     { label: 'Hoàn tất',             className: 'bg-green-500/15 text-green-400' },
  CANCELLED:     { label: 'Đã hủy',               className: 'bg-red-500/15 text-red-400' },
  // Examination
  OPEN:          { label: 'Đang mở',              className: 'bg-cyan-500/15 text-cyan-400' },
  // Invoice
  DRAFT:         { label: 'Nháp',                 className: 'bg-white/5 text-clinic-muted' },
  ISSUED:        { label: 'Đã phát hành',          className: 'bg-blue-500/15 text-blue-400' },
  PARTIALLY_PAID:{ label: 'Thanh toán một phần',  className: 'bg-amber-500/15 text-amber-400' },
  PAID:          { label: 'Đã thanh toán',         className: 'bg-green-500/15 text-green-400' },
  VOID:          { label: 'Đã hủy',               className: 'bg-red-500/15 text-red-400' },
  // User
  ACTIVE:        { label: 'Hoạt động',            className: 'bg-green-500/15 text-green-400' },
  INACTIVE:      { label: 'Không hoạt động',       className: 'bg-white/5 text-clinic-muted' },
  LOCKED:        { label: 'Đã khóa',              className: 'bg-red-500/15 text-red-400' },
}

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-white/5 text-clinic-muted' }

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
