import { Link, useParams } from 'react-router-dom'
import { History, Plus } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { useAuthStore } from '@/features/auth/store'
import { formatDate, formatDateTime } from '@/lib/date'
import { usePatientQuery } from './hooks'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-clinic-border last:border-0">
      <span className="w-40 shrink-0 text-sm text-clinic-muted">{label}</span>
      <span className="text-sm text-clinic-text">{value || '—'}</span>
    </div>
  )
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const hasRole = useAuthStore((s) => s.hasRole)
  const canViewHistory = hasRole(['ADMIN', 'DOCTOR', 'MANAGER'])
  const canCreateVisit = hasRole(['ADMIN', 'RECEPTIONIST'])

  const { data: patient, isLoading, error, refetch } = usePatientQuery(id ?? '')

  if (isLoading) return <LoadingSpinner className="mt-20" />
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={patient?.fullName ?? 'Chi tiết bệnh nhân'}
        description={`Mã: ${patient?.patientCode ?? '—'} · Tạo: ${formatDateTime(patient?.createdAt)}`}
        action={
          <div className="flex gap-2">
            {canViewHistory && patient && (
              <Link
                to={`/app/patients/${patient.id}/history`}
                className="flex items-center gap-2 rounded-xl border border-clinic-border px-4 py-2 text-sm font-medium text-clinic-text transition hover:bg-clinic-bg"
              >
                <History className="h-4 w-4" />
                Lịch sử khám
              </Link>
            )}
            {canCreateVisit && patient && (
              <Link
                to={`/app/visits/new?patientId=${patient.id}`}
                className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
              >
                <Plus className="h-4 w-4" />
                Tạo lượt khám
              </Link>
            )}
          </div>
        }
      />

      <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-clinic-muted">
          Thông tin cá nhân
        </h2>
        <InfoRow label="Họ và tên" value={patient?.fullName} />
        <InfoRow label="Ngày sinh" value={formatDate(patient?.dob)} />
        <InfoRow label="Giới tính" value={patient?.gender} />
        <InfoRow label="Số điện thoại" value={patient?.phone} />
        <InfoRow label="CCCD/CMND" value={patient?.citizenId} />
        <InfoRow label="Địa chỉ" value={patient?.address} />
        <InfoRow label="Mã bệnh nhân" value={patient?.patientCode} />
        <InfoRow label="Ngày tạo hồ sơ" value={formatDateTime(patient?.createdAt)} />
      </div>
    </div>
  )
}
