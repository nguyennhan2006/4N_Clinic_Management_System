import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ListOrdered, RefreshCw, Stethoscope } from 'lucide-react'
import { formatDate } from '@/lib/date'
import { isApiError } from '@/lib/errors'
import { useAuthStore } from '@/features/auth/store'
import { useVisitsQuery, useOpenExaminationMutation, VISIT_KEYS } from '@/features/visits/hooks'
import type { Visit, VisitStatus } from '@/features/visits/types'

const STATUS_LABELS: Record<VisitStatus, string> = {
  WAITING: 'Chờ khám',
  IN_EXAMINATION: 'Đang khám',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

const STATUS_COLORS: Record<VisitStatus, string> = {
  WAITING: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  IN_EXAMINATION: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-green-500/15 text-green-400 border-green-500/20',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
}

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function QueueDashboardPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { hasRole } = useAuthStore()
  const canOpen = hasRole(['DOCTOR', 'ADMIN'])

  const [date, setDate] = useState(todayString())
  const [statusFilter, setStatusFilter] = useState<VisitStatus | ''>('WAITING')
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [openError, setOpenError] = useState<string | null>(null)

  const { data: visits, isLoading } = useVisitsQuery({
    date,
    status: statusFilter || undefined,
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

  const counts = {
    WAITING: visits?.filter((v) => v.status === 'WAITING').length ?? 0,
    IN_EXAMINATION: visits?.filter((v) => v.status === 'IN_EXAMINATION').length ?? 0,
    COMPLETED: visits?.filter((v) => v.status === 'COMPLETED').length ?? 0,
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinic-primary/15">
            <ListOrdered className="h-5 w-5 text-clinic-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-clinic-text">Hàng đợi khám bệnh</h1>
            <p className="text-xs text-clinic-muted">{formatDate(date)}</p>
          </div>
        </div>
        <button
          onClick={() => void qc.invalidateQueries({ queryKey: VISIT_KEYS.all })}
          className="flex items-center gap-2 rounded-lg border border-clinic-border px-3 py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VisitStatus | '')}
          className="rounded-lg border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="WAITING">Chờ khám</option>
          <option value="IN_EXAMINATION">Đang khám</option>
          <option value="COMPLETED">Hoàn tất</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* Summary badges */}
      {visits && (
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-400">
            Chờ khám: {counts.WAITING}
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-400">
            Đang khám: {counts.IN_EXAMINATION}
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/15 px-4 py-2 text-sm font-medium text-green-400">
            Hoàn tất: {counts.COMPLETED}
          </div>
        </div>
      )}

      {openError && (
        <div role="alert" className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-clinic-danger">
          {openError}
        </div>
      )}

      {/* Queue list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : !visits?.length ? (
          <div className="rounded-xl border border-dashed border-clinic-border py-16 text-center">
            <ListOrdered className="mx-auto mb-3 h-10 w-10 text-clinic-border" />
            <p className="text-sm text-clinic-muted">
              {statusFilter === 'WAITING'
                ? 'Không có bệnh nhân đang chờ'
                : 'Không có lượt khám nào'}
            </p>
          </div>
        ) : (
          (visits as Visit[]).map((visit) => (
            <div
              key={visit.id}
              className="flex items-center gap-4 rounded-xl border border-clinic-border bg-clinic-surface px-4 py-3 shadow-clinic"
            >
              {/* Queue number */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clinic-primary/15 text-lg font-bold text-clinic-primary">
                {visit.queueNumber}
              </div>

              {/* Patient info */}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-clinic-text">{visit.patient.fullName}</p>
                <p className="text-xs text-clinic-muted">
                  {visit.patient.patientCode}
                  {visit.patient.phone ? ` · ${visit.patient.phone}` : ''}
                  {visit.reason ? ` · ${visit.reason}` : ''}
                </p>
              </div>

              {/* Status badge */}
              <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[visit.status]}`}>
                {STATUS_LABELS[visit.status]}
              </span>

              {/* Actions */}
              <div className="flex shrink-0 gap-2">
                {canOpen && visit.status === 'WAITING' && !visit.examination && (
                  <button
                    onClick={() => void handleOpenExamination(visit.id)}
                    disabled={openingId === visit.id}
                    className="flex items-center gap-1.5 rounded-lg bg-clinic-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                    {openingId === visit.id ? 'Đang mở...' : 'Mở khám'}
                  </button>
                )}
                {visit.examination && (
                  <button
                    onClick={() => navigate(`/app/examinations/${visit.examination!.id}`)}
                    className="flex items-center gap-1.5 rounded-lg border border-clinic-primary/40 px-3 py-1.5 text-xs font-medium text-clinic-primary transition hover:bg-clinic-primary/10"
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                    Xem phiếu
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
