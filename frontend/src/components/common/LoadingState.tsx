import { cn } from '@/lib/cn'

interface LoadingStateProps {
  rows?: number
  className?: string
}

export function LoadingState({ rows = 5, className }: LoadingStateProps) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-label="Đang tải...">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-lg bg-clinic-border"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-clinic-primary border-t-transparent" />
    </div>
  )
}
