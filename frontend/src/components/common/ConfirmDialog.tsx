import { cn } from '@/lib/cn'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'default',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-clinic-surface border border-clinic-border p-6 shadow-clinic"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h2 id="confirm-dialog-title" className="mb-2 text-lg font-semibold text-clinic-text">
          {title}
        </h2>
        <p className="mb-6 text-sm text-clinic-muted">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-clinic-border px-4 py-2 text-sm font-medium text-clinic-muted transition hover:bg-clinic-bg disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50',
              variant === 'danger'
                ? 'bg-clinic-danger text-white hover:bg-clinic-danger'
                : 'bg-clinic-primary hover:bg-clinic-primary-hover',
            )}
          >
            {isLoading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
