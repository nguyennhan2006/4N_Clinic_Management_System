import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate } from '@/lib/date'
import { formatVND } from '@/lib/money'
import type { MedicalHistoryEntry } from './types'
import { useMedicalHistoryQuery } from './hooks'

function HistoryCard({ entry }: { entry: MedicalHistoryEntry }) {
  const [expanded, setExpanded] = useState(false)
  const exam = entry.examination

  return (
    <div className="rounded-2xl bg-clinic-surface shadow-clinic overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-clinic-bg/40"
      >
        <div className="flex items-center gap-4">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clinic-primary/10 font-mono text-sm font-semibold text-clinic-primary">
            {entry.queueNumber}
          </span>
          <div>
            <div className="text-sm font-semibold text-clinic-text">{formatDate(entry.visitDate)}</div>
            {entry.reason && <div className="text-xs text-clinic-muted">{entry.reason}</div>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {exam && <StatusBadge status={exam.status as 'OPEN' | 'COMPLETED' | 'CANCELLED'} />}
          {entry.invoice && <StatusBadge status={entry.invoice.status as 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'} />}
          {expanded ? <ChevronUp className="h-4 w-4 text-clinic-muted" /> : <ChevronDown className="h-4 w-4 text-clinic-muted" />}
        </div>
      </button>

      {/* Expandable detail */}
      {expanded && exam && (
        <div className="border-t border-clinic-border px-5 py-4 space-y-4">
          {/* Doctor */}
          {exam.doctor && (
            <p className="text-xs text-clinic-muted">Bác sĩ: {exam.doctor.fullName}</p>
          )}

          {/* Symptoms / Clinical / Conclusion */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-clinic-muted">Triệu chứng</div>
              <p className="text-sm text-clinic-text">{exam.symptoms || '—'}</p>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-clinic-muted">Lâm sàng</div>
              <p className="text-sm text-clinic-text">{exam.clinicalNotes || '—'}</p>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase text-clinic-muted">Kết luận</div>
              <p className="text-sm text-clinic-text">{exam.conclusion || '—'}</p>
            </div>
          </div>

          {/* Diagnoses */}
          {exam.diagnoses.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase text-clinic-muted">Chẩn đoán</div>
              <div className="flex flex-wrap gap-2">
                {exam.diagnoses.map((d) => (
                  <span
                    key={d.id}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                      d.isPrimary
                        ? 'bg-clinic-primary/10 text-clinic-primary'
                        : 'bg-clinic-bg text-clinic-muted'
                    }`}
                  >
                    {d.name}
                    {d.isPrimary && <span className="font-semibold">(Chính)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prescription */}
          {exam.prescription && exam.prescription.items.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase text-clinic-muted">Đơn thuốc</div>
              <div className="space-y-1">
                {exam.prescription.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg bg-clinic-bg px-3 py-1.5 text-sm">
                    <span className="text-clinic-text">
                      {item.drug?.name ?? '—'} ({item.drug?.unit}) × {item.quantity}
                    </span>
                    <span className="text-clinic-muted">{item.dosage}</span>
                    <span className="font-medium text-clinic-text">{formatVND(Number(item.lineTotal))}</span>
                  </div>
                ))}
                {exam.prescription.note && (
                  <p className="text-xs text-clinic-muted italic">{exam.prescription.note}</p>
                )}
              </div>
            </div>
          )}

          {/* Invoice */}
          {entry.invoice && (
            <div className="flex items-center justify-between rounded-xl border border-clinic-border px-4 py-2.5">
              <div className="text-sm text-clinic-text">
                Hóa đơn
                <StatusBadge
                  status={entry.invoice.status as 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'}
                  className="ml-2"
                />
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-clinic-text">{formatVND(Number(entry.invoice.totalAmount))}</div>
                <div className="text-xs text-clinic-muted">Đã trả: {formatVND(Number(entry.invoice.paidAmount))}</div>
              </div>
            </div>
          )}

          {/* Link to examination */}
          <div className="flex justify-end">
            <Link
              to={`/app/examinations/${exam.id}`}
              className="text-xs font-medium text-clinic-primary transition hover:underline"
            >
              Xem phiếu khám đầy đủ →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export function MedicalHistoryPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error, refetch } = useMedicalHistoryQuery(id ?? '')

  if (isLoading) return <LoadingSpinner className="mt-20" />
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />

  const patient = data?.patient
  const histories = data?.histories ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sử khám"
        description={patient ? `${patient.fullName} · ${patient.patientCode}` : 'Đang tải...'}
        action={
          patient ? (
            <Link
              to={`/app/patients/${patient.id}`}
              className="rounded-xl border border-clinic-border px-4 py-2 text-sm font-medium text-clinic-text transition hover:bg-clinic-bg"
            >
              Hồ sơ bệnh nhân
            </Link>
          ) : undefined
        }
      />

      {histories.length === 0 ? (
        <EmptyState
          title="Chưa có lịch sử khám"
          description="Bệnh nhân này chưa có lần khám nào được ghi nhận."
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-clinic-muted">{data?.total ?? 0} lần khám</p>
          {histories.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
