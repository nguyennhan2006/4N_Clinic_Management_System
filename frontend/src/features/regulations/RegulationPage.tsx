import { useState } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { useAuthStore } from '@/features/auth/store'
import { formatDateTime } from '@/lib/date'
import { formatVND } from '@/lib/money'
import { isApiError } from '@/lib/errors'
import type { RegulationKey } from './types'
import {
  useActivateRegulationMutation,
  useCreateRegulationMutation,
  useCurrentRegulationQuery,
} from './hooks'

const KEY_LABELS: Record<RegulationKey, string> = {
  MAX_PATIENTS_PER_DAY: 'Số bệnh nhân tối đa / ngày',
  CONSULTATION_FEE: 'Phí khám bệnh (VND)',
}

const ALLOWED_KEYS: RegulationKey[] = ['MAX_PATIENTS_PER_DAY', 'CONSULTATION_FEE']

function formatRegValue(key: RegulationKey, value: string) {
  if (key === 'CONSULTATION_FEE') return formatVND(Number(value))
  return value
}

export function RegulationPage() {
  const hasRole = useAuthStore((s) => s.hasRole)
  const isAdmin = hasRole(['ADMIN'])

  const { data: current, isLoading, error, refetch } = useCurrentRegulationQuery()
  const createMutation = useCreateRegulationMutation()
  const activateMutation = useActivateRegulationMutation()

  const [showForm, setShowForm] = useState(false)
  const [maxPatients, setMaxPatients] = useState('40')
  const [consultationFee, setConsultationFee] = useState('150000')
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ id: string; note?: string | null; createdAt: string } | null>(null)

  const [showActivateConfirm, setShowActivateConfirm] = useState(false)
  const [activateError, setActivateError] = useState<string | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const handleCreate = async () => {
    setFormError(null)
    const parsedMax = parseInt(maxPatients)
    const parsedFee = parseFloat(consultationFee)

    if (!parsedMax || parsedMax < 1) {
      setFormError('Số bệnh nhân tối đa phải là số nguyên dương.')
      return
    }
    if (!parsedFee || parsedFee < 1) {
      setFormError('Phí khám phải lớn hơn 0.')
      return
    }

    try {
      const result = await createMutation.mutateAsync({
        note: note || undefined,
        items: [
          { key: 'MAX_PATIENTS_PER_DAY', value: String(parsedMax) },
          { key: 'CONSULTATION_FEE', value: String(parsedFee) },
        ],
      })
      setCreated(result)
      setShowForm(false)
      setNote('')
    } catch (err) {
      const msg = isApiError(err) ? err.message : 'Tạo quy định thất bại.'
      setFormError(msg)
    }
  }

  const handleActivate = async (id: string) => {
    setActivatingId(id)
    setActivateError(null)
    try {
      await activateMutation.mutateAsync(id)
      setShowActivateConfirm(false)
      setCreated(null)
    } catch (err) {
      const msg = isApiError(err) ? err.message : 'Kích hoạt thất bại.'
      setActivateError(msg)
    } finally {
      setActivatingId(null)
    }
  }

  const inputCls = 'w-full rounded-xl border border-clinic-border bg-clinic-bg px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20'

  if (isLoading) return <LoadingSpinner className="mt-20" />
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quy định phòng mạch"
        description="Quản lý phiên bản quy định hiện hành"
        action={
          isAdmin ? (
            <button
              onClick={() => setShowForm((p) => !p)}
              className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
            >
              <Plus className="h-4 w-4" />
              Tạo phiên bản mới
            </button>
          ) : undefined
        }
      />

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-xl border border-clinic-warning bg-[#FEF3C7] px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#92400E]" />
        <p className="text-sm text-[#92400E]">
          Thay đổi quy định <strong>không có hiệu lực hồi tố</strong>. Chỉ áp dụng cho các lượt khám và hóa đơn tạo mới sau khi kích hoạt.
        </p>
      </div>

      {/* Activate confirm dialog */}
      {showActivateConfirm && created && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-clinic-surface p-6 shadow-clinic">
            <h2 className="text-lg font-semibold text-clinic-text">Xác nhận kích hoạt quy định</h2>
            <p className="mt-2 text-sm text-clinic-muted">
              Quy định mới sẽ thay thế phiên bản hiện tại và có hiệu lực ngay lập tức với các lượt khám mới.
              Lịch sử cũ không bị ảnh hưởng.
            </p>
            {activateError && (
              <p className="mt-3 rounded-xl bg-[#FEE2E2] px-4 py-2 text-sm text-clinic-danger">{activateError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowActivateConfirm(false); setActivateError(null) }}
                className="rounded-xl border border-clinic-border px-4 py-2 text-sm text-clinic-muted transition hover:bg-clinic-bg"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleActivate(created.id)}
                disabled={activatingId === created.id}
                className="rounded-xl bg-clinic-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
              >
                {activatingId === created.id ? 'Đang kích hoạt...' : 'Kích hoạt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current active regulation */}
      <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-clinic-muted">Quy định đang hiệu lực</h2>
          {current?.activatedAt && (
            <span className="text-xs text-clinic-muted">Kích hoạt: {formatDateTime(current.activatedAt)}</span>
          )}
        </div>

        {current?.note && (
          <p className="mb-4 text-sm text-clinic-muted italic">"{current.note}"</p>
        )}

        <div className="space-y-3">
          {ALLOWED_KEYS.map((key) => {
            const item = current?.items.find((i) => i.key === key)
            return (
              <div key={key} className="flex items-center justify-between rounded-xl bg-clinic-bg px-4 py-3">
                <span className="text-sm text-clinic-text">{KEY_LABELS[key]}</span>
                <span className="font-semibold text-clinic-primary">
                  {item ? formatRegValue(key, item.value) : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending created version */}
      {created && (
        <div className="rounded-2xl border border-clinic-warning bg-[#FEF3C7] p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#92400E]">Phiên bản mới (chưa kích hoạt)</h2>
            {isAdmin && (
              <button
                onClick={() => setShowActivateConfirm(true)}
                className="rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
              >
                Kích hoạt
              </button>
            )}
          </div>
          {created.note && <p className="mb-2 text-xs text-[#92400E] italic">"{created.note}"</p>}
          <p className="text-xs text-[#92400E]">Tạo lúc: {formatDateTime(created.createdAt)}</p>
        </div>
      )}

      {/* Create form */}
      {showForm && isAdmin && (
        <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-clinic-muted">Tạo phiên bản quy định mới</h2>

          {formError && (
            <div role="alert" className="mb-4 rounded-xl bg-[#FEE2E2] px-4 py-3 text-sm text-clinic-danger">{formError}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-clinic-text">
                Số bệnh nhân tối đa / ngày
              </label>
              <input
                type="number"
                min={1}
                value={maxPatients}
                onChange={(e) => setMaxPatients(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-clinic-text">
                Phí khám bệnh (VND)
              </label>
              <input
                type="number"
                min={1}
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                className={inputCls}
              />
              {consultationFee && <p className="mt-1 text-xs text-clinic-muted">{formatVND(Number(consultationFee))}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-clinic-text">Ghi chú (tùy chọn)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Lý do thay đổi quy định..."
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => void handleCreate()}
                disabled={createMutation.isPending}
                className="rounded-xl bg-clinic-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo phiên bản'}
              </button>
              <button
                onClick={() => { setShowForm(false); setFormError(null) }}
                className="rounded-xl border border-clinic-border px-6 py-2.5 text-sm text-clinic-muted transition hover:bg-clinic-bg"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
