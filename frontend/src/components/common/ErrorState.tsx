import { cn } from '@/lib/cn'
import { isApiError } from '@/lib/errors'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
  className?: string
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const message = isApiError(error)
    ? error.message
    : 'Đã xảy ra lỗi không xác định.'

  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
        <svg
          className="h-8 w-8 text-clinic-danger"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <h3 className="mb-1 text-base font-semibold text-clinic-text">Đã xảy ra lỗi</h3>
      <p className="mb-4 max-w-sm text-sm text-clinic-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-clinic-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
        >
          Thử lại
        </button>
      )}
    </div>
  )
}
