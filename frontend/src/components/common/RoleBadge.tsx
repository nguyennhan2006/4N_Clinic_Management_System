import { cn } from '@/lib/cn'
import { ROLE_COLORS, ROLE_LABELS } from '@/config/permissions'
import type { Role } from '@/features/auth/types'

interface RoleBadgeProps {
  role: Role
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        ROLE_COLORS[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
