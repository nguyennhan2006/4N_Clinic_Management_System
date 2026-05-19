import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAuthStore } from '@/features/auth/store'
import { formatDate, formatDateTime } from '@/lib/date'
import { formatVND } from '@/lib/money'
import { isApiError } from '@/lib/errors'
import type { PaymentMethod } from './types'
import { useCreatePaymentMutation, useInvoiceQuery } from './hooks'

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'TRANSFER', label: 'Chuyển khoản' },
  { value: 'CARD', label: 'Thẻ' },
]

function PaymentDialog({
  remaining,
  onClose,
  onSubmit,
  loading,
  error,
}: {
  remaining: number
  onClose: () => void
  onSubmit: (amount: number, method: PaymentMethod, note: string) => void
  loading: boolean
  error: string | null
}) {
  const [amount, setAmount] = useState(remaining)
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [note, setNote] = useState('')

  const inputCls = 'w-full rounded-xl border border-clinic-border bg-clinic-bg px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-clinic-surface p-6 shadow-clinic">
        <h2 className="text-lg font-semibold text-clinic-text">Ghi nhận thanh toán</h2>
        <p className="mt-1 text-sm text-clinic-muted">Còn cần thanh toán: {formatVND(remaining)}</p>

        {error && (
          <div role="alert" className="mt-3 rounded-xl bg-[#FEE2E2] px-4 py-2 text-sm text-clinic-danger">{error}</div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-clinic-text">Số tiền (VND)</label>
            <input
              type="number"
              min={1}
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className={inputCls}
            />
            {amount > remaining && (
              <p className="mt-1 text-xs text-clinic-danger">Số tiền không được vượt quá số tiền còn lại.</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-clinic-text">Phương thức</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputCls}>
              {METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-clinic-text">Ghi chú</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tùy chọn..."
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-clinic-border px-4 py-2 text-sm text-clinic-muted transition hover:bg-clinic-bg"
          >
            Hủy
          </button>
          <button
            onClick={() => onSubmit(amount, method, note)}
            disabled={loading || amount <= 0 || amount > remaining}
            className="rounded-xl bg-clinic-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
          >
            {loading ? 'Đang ghi nhận...' : 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const hasRole = useAuthStore((s) => s.hasRole)
  const canPay = hasRole(['ADMIN', 'CASHIER'])

  const { data: invoice, isLoading, error, refetch } = useInvoiceQuery(id ?? '')
  const paymentMutation = useCreatePaymentMutation(id ?? '')

  const [showPayDialog, setShowPayDialog] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const handlePayment = async (amount: number, method: PaymentMethod, note: string) => {
    setPayError(null)
    try {
      await paymentMutation.mutateAsync({ amount, method, note: note || undefined })
      setShowPayDialog(false)
    } catch (err) {
      const msg = isApiError(err) ? err.message : 'Thanh toán thất bại.'
      setPayError(msg)
    }
  }

  if (isLoading) return <LoadingSpinner className="mt-20" />
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />

  const totalAmount = Number(invoice?.totalAmount ?? 0)
  const paidAmount = Number(invoice?.paidAmount ?? 0)
  const remaining = totalAmount - paidAmount
  const canPayNow = canPay && invoice?.status !== 'PAID' && invoice?.status !== 'VOID' && remaining > 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chi tiết hóa đơn"
        description={`${invoice?.visit.patient.fullName ?? '—'} · ${formatDate(invoice?.visit.visitDate)}`}
        action={
          canPayNow ? (
            <button
              onClick={() => setShowPayDialog(true)}
              className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
            >
              <CreditCard className="h-4 w-4" />
              Ghi nhận thanh toán
            </button>
          ) : undefined
        }
      />

      {showPayDialog && (
        <PaymentDialog
          remaining={remaining}
          onClose={() => { setShowPayDialog(false); setPayError(null) }}
          onSubmit={(a, m, n) => void handlePayment(a, m, n)}
          loading={paymentMutation.isPending}
          error={payError}
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-clinic-surface p-5 shadow-clinic">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-clinic-muted">Bệnh nhân</h2>
          <div className="space-y-1">
            <div className="text-sm font-medium text-clinic-text">{invoice?.visit.patient.fullName}</div>
            <div className="text-xs text-clinic-muted">{invoice?.visit.patient.patientCode}</div>
            {invoice?.visit.patient.phone && (
              <div className="text-xs text-clinic-muted">{invoice.visit.patient.phone}</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-clinic-surface p-5 shadow-clinic">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-clinic-muted">Hóa đơn</h2>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-clinic-muted">Trạng thái:</span>
              {invoice?.status && <StatusBadge status={invoice.status} />}
            </div>
            <div className="text-xs text-clinic-muted">Ngày tạo: {formatDateTime(invoice?.createdAt)}</div>
            <div className="text-xs text-clinic-muted">Ngày khám: {formatDate(invoice?.visit.visitDate)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-clinic-muted">Chi tiết dịch vụ</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-clinic-border">
            <tr>
              {['Mô tả', 'SL', 'Đơn giá', 'Thành tiền'].map((h) => (
                <th key={h} className="pb-2 text-left text-xs font-semibold uppercase text-clinic-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-clinic-border">
            {invoice?.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2.5 text-clinic-text">{item.description}</td>
                <td className="py-2.5 text-clinic-muted">{item.quantity}</td>
                <td className="py-2.5 text-clinic-muted">{formatVND(Number(item.unitPrice))}</td>
                <td className="py-2.5 font-medium text-clinic-text">{formatVND(Number(item.lineTotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 border-t border-clinic-border pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-clinic-muted">Tổng tiền</span>
            <span className="font-semibold text-clinic-text">{formatVND(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-clinic-muted">Đã thanh toán</span>
            <span className="text-[#065F46]">{formatVND(paidAmount)}</span>
          </div>
          {remaining > 0 && (
            <div className="flex justify-between text-sm">
              <span className="font-medium text-clinic-text">Còn lại</span>
              <span className="font-bold text-clinic-danger">{formatVND(remaining)}</span>
            </div>
          )}
        </div>
      </div>

      {invoice?.payments && invoice.payments.length > 0 && (
        <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-clinic-muted">Lịch sử thanh toán</h2>
          <div className="space-y-2">
            {invoice.payments.map((pay) => (
              <div key={pay.id} className="flex items-center justify-between rounded-xl bg-clinic-bg px-4 py-2.5">
                <div>
                  <div className="text-sm font-medium text-clinic-text">{formatVND(Number(pay.amount))}</div>
                  <div className="text-xs text-clinic-muted">
                    {pay.method === 'CASH' ? 'Tiền mặt' : pay.method === 'TRANSFER' ? 'Chuyển khoản' : 'Thẻ'}
                    {pay.note ? ` · ${pay.note}` : ''}
                  </div>
                </div>
                <div className="text-xs text-clinic-muted">{formatDateTime(pay.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/app/invoices')}
        className="rounded-xl border border-clinic-border px-6 py-2.5 text-sm text-clinic-muted transition hover:bg-clinic-bg"
      >
        Quay lại danh sách
      </button>
    </div>
  )
}
