import { useQuery } from '@tanstack/react-query'
import { Activity, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { useAuthStore } from '@/features/auth/store'
import { ROLE_LABELS } from '@/config/permissions'
import { reportApi } from '@/features/reports/api'
import { visitApi } from '@/features/visits/api'
import { toApiDate, toApiMonth, formatDate, formatMonth } from '@/lib/date'
import { formatVND } from '@/lib/money'

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  loading,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  colorClass: string
  loading?: boolean
}) {
  return (
    <div className="rounded-2xl bg-clinic-surface border border-clinic-border p-5 shadow-clinic">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium text-clinic-muted">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 animate-pulse rounded-lg bg-white/5" />
      ) : (
        <p className="text-2xl font-bold text-clinic-text">{value}</p>
      )}
    </div>
  )
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const today = toApiDate(new Date())
  const currentMonth = toApiMonth(new Date())

  const { data: visitsToday, isLoading: visitsLoading } = useQuery({
    queryKey: ['visits', { date: today }],
    queryFn: () => visitApi.list({ date: today }),
  })

  const canViewRevenue = user?.roles.some((r) =>
    ['ADMIN', 'MANAGER', 'CASHIER'].includes(r),
  )

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['reports', 'monthly', currentMonth],
    queryFn: () => reportApi.getMonthly(currentMonth),
    enabled: !!canViewRevenue,
  })

  const totalToday = visitsToday?.length ?? 0
  const waitingToday = visitsToday?.filter((v) => v.status === 'WAITING').length ?? 0
  const completedToday = visitsToday?.filter((v) => v.status === 'COMPLETED').length ?? 0
  const monthRevenue = report?.revenue.totalCollected ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          user
            ? `Xin chào, ${user.fullName} — ${ROLE_LABELS[user.roles[0]] ?? user.roles[0]}`
            : ''
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Lượt khám hôm nay"
          value={totalToday}
          icon={Activity}
          colorClass="bg-blue-500/15 text-blue-400"
          loading={visitsLoading}
        />
        <StatCard
          label="Đang chờ khám"
          value={waitingToday}
          icon={Clock}
          colorClass="bg-amber-500/15 text-amber-400"
          loading={visitsLoading}
        />
        <StatCard
          label="Đã hoàn tất hôm nay"
          value={completedToday}
          icon={CheckCircle2}
          colorClass="bg-green-500/15 text-green-400"
          loading={visitsLoading}
        />
        {canViewRevenue ? (
          <StatCard
            label={`Doanh thu tháng ${formatMonth(currentMonth)}`}
            value={formatVND(monthRevenue)}
            icon={TrendingUp}
            colorClass="bg-blue-500/15 text-blue-400"
            loading={reportLoading}
          />
        ) : (
          <StatCard
            label="Đang khám"
            value={visitsToday?.filter((v) => v.status === 'IN_EXAMINATION').length ?? 0}
            icon={TrendingUp}
            colorClass="bg-blue-500/15 text-blue-400"
            loading={visitsLoading}
          />
        )}
      </div>

      {/* Visit status breakdown */}
      <div className="rounded-2xl bg-clinic-surface border border-clinic-border p-6 shadow-clinic">
        <h2 className="mb-4 text-sm font-semibold text-clinic-text">
          Lượt khám hôm nay — {formatDate(new Date())}
        </h2>
        {visitsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        ) : !visitsToday || visitsToday.length === 0 ? (
          <p className="text-sm text-clinic-muted">Chưa có lượt khám nào hôm nay.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-clinic-border text-left text-xs font-medium uppercase tracking-wider text-clinic-muted">
                  <th className="pb-2 pr-4">STT</th>
                  <th className="pb-2 pr-4">Bệnh nhân</th>
                  <th className="pb-2 pr-4">SĐT</th>
                  <th className="pb-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clinic-border">
                {visitsToday.map((visit) => (
                  <tr key={visit.id} className="py-2">
                    <td className="py-2.5 pr-4 font-mono text-xs text-clinic-muted">
                      #{visit.queueNumber}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-clinic-text">
                      {visit.patient.fullName}
                    </td>
                    <td className="py-2.5 pr-4 text-clinic-muted">
                      {visit.patient.phone ?? '—'}
                    </td>
                    <td className="py-2.5">
                      <VisitStatusBadge status={visit.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue summary for admin/manager/cashier */}
      {canViewRevenue && report && (
        <div className="rounded-2xl bg-clinic-surface border border-clinic-border p-6 shadow-clinic">
          <h2 className="mb-4 text-sm font-semibold text-clinic-text">
            Tổng kết tháng {formatMonth(currentMonth)}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ReportStat label="Tổng lượt khám" value={String(report.visits.total)} />
            <ReportStat label="Đã hoàn tất" value={String(report.completedVisits)} />
            <ReportStat label="Đã thanh toán" value={String(report.revenue.paidCount)} />
            <ReportStat label="Doanh thu thu được" value={formatVND(report.revenue.totalCollected)} />
          </div>
        </div>
      )}
    </div>
  )
}

function VisitStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    WAITING: { label: 'Chờ khám', className: 'bg-amber-500/15 text-amber-400' },
    IN_EXAMINATION: { label: 'Đang khám', className: 'bg-blue-500/15 text-blue-400' },
    COMPLETED: { label: 'Hoàn tất', className: 'bg-green-500/15 text-green-400' },
    CANCELLED: { label: 'Đã hủy', className: 'bg-red-500/15 text-red-400' },
  }
  const config = map[status] ?? { label: status, className: 'bg-white/5 text-clinic-muted' }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-clinic-bg p-3">
      <p className="mb-1 text-xs text-clinic-muted">{label}</p>
      <p className="text-base font-semibold text-clinic-text">{value}</p>
    </div>
  )
}
