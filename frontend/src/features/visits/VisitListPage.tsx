import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Stethoscope } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAuthStore } from '@/features/auth/store'
import { formatDate } from '@/lib/date'
import { isApiError } from '@/lib/errors'
import type { VisitStatus } from './types'
import { useOpenExaminationMutation, useVisitsQuery } from './hooks'

const STATUS_OPTIONS: { value: VisitStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'WAITING', label: 'Đang chờ' },
  { value: 'IN_EXAMINATION', label: 'Đang khám' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

function todayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function VisitListPage() {
  const navigate = useNavigate()
  const hasRole = useAuthStore((s) => s.hasRole)
  const canCreate = hasRole(['ADMIN', 'RECEPTIONIST'])
  const canOpen = hasRole(['ADMIN', 'DOCTOR'])

  const [date, setDate] = useState(todayString())
  const [status, setStatus] = useState<VisitStatus | ''>('')
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)

  const { data: visits, isLoading, error, refetch } = useVisitsQuery({
    date,
    status: status || undefined,
  })

  const openMutation = useOpenExaminationMutation()

  const handleOpenExamination = async (visitId: string) => {
    setOpeningId(visitId)
    setOpenError(null)
    try {
      const exam = await openMutation.mutateAsync(visitId)
      navigate(`/app/examinations/${exam.id}`)
    } catch (err) {
      const msg = isApiError(err)
        ? err.status === 409
          ? 'Lượt khám này đã có phiếu khám.'
          : err.status === 400
            ? 'Không thể mở khám: lượt khám không ở trạng thái chờ.'
            : err.message
        : 'Mở phiếu khám thất bại.'
      setOpenError(msg)
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lượt khám"
        description="Danh sách lượt khám theo ngày"
        action={
          canCreate ? (
            <Link
              to="/app/visits/new"
              className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
            >
              <Plus className="h-4 w-4" />
              Tạo lượt khám
            </Link>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-clinic-border bg-clinic-surface px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as VisitStatus | '')}
          className="rounded-xl border border-clinic-border bg-clinic-surface px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {openError && (
        <div role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-clinic-danger">
          {openError}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl bg-clinic-surface shadow-clinic">
        {isLoading ? (
          <div className="p-6"><LoadingState rows={6} /></div>
        ) : error ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : !visits?.length ? (
          <EmptyState
            title="Không có lượt khám"
            description={`Chưa có lượt khám nào vào ngày ${formatDate(date)}.`}
            action={
              canCreate ? (
                <Link
                  to="/app/visits/new"
                  className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primary-hover"
                >
                  <Plus className="h-4 w-4" />
                  Tạo lượt khám
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-clinic-border bg-clinic-bg">
                <tr>
                  {['STT', 'Bệnh nhân', 'Ngày sinh', 'Lý do khám', 'Trạng thái', ''].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-clinic-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-clinic-border">
                {visits.map((v) => (
                  <tr key={v.id} className="transition hover:bg-clinic-bg/60">
                    <td className="px-5 py-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-clinic-primary/10 font-mono text-sm font-semibold text-clinic-primary">
                        {v.queueNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-clinic-text">{v.patient.fullName}</div>
                      <div className="text-xs text-clinic-muted">{v.patient.patientCode}</div>
                    </td>
                    <td className="px-5 py-3 text-clinic-muted">{formatDate(v.patient.dob) || '—'}</td>
                    <td className="px-5 py-3 text-clinic-muted">
                      <span className="block max-w-48 truncate">{v.reason || '—'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-5 py-3">
                      {canOpen && v.status === 'WAITING' && !v.examination && (
                        <button
                          onClick={() => void handleOpenExamination(v.id)}
                          disabled={openingId === v.id}
                          className="flex items-center gap-1.5 rounded-lg bg-clinic-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
                        >
                          <Stethoscope className="h-3.5 w-3.5" />
                          {openingId === v.id ? 'Đang mở...' : 'Mở khám'}
                        </button>
                      )}
                      {v.examination && (
                        <button
                          onClick={() => navigate(`/app/examinations/${v.examination!.id}`)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-clinic-primary transition hover:bg-clinic-sidebar-muted"
                        >
                          <Stethoscope className="h-3.5 w-3.5" />
                          Xem phiếu
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-clinic-border px-5 py-3 text-xs text-clinic-muted">
              {visits.length} lượt khám · {formatDate(date)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
