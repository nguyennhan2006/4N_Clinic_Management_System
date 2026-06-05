import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { currentMonth, formatMonth } from '@/lib/date'
import { formatVND } from '@/lib/money'
import { reportApi } from './api'

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-clinic-surface p-5 shadow-clinic">
      <div className="text-xs font-semibold uppercase tracking-wide text-clinic-muted">{label}</div>
      <div className="mt-2 text-2xl font-bold text-clinic-primary">{value}</div>
      {sub && <div className="mt-1 text-xs text-clinic-muted">{sub}</div>}
    </div>
  )
}

export function MonthlyReportPage() {
  const [month, setMonth] = useState(currentMonth())

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', 'monthly', month],
    queryFn: () => reportApi.getMonthly(month),
    enabled: !!month,
  })

  const { data: breakdown } = useQuery({
    queryKey: ['reports', 'revenue-breakdown', month],
    queryFn: () => reportApi.getRevenueBreakdown(month),
    enabled: !!month,
  })

  const visitStatusLabels: Record<string, string> = {
    WAITING: 'Đang chờ',
    IN_EXAMINATION: 'Đang khám',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo tháng"
        description="Thống kê doanh thu và hoạt động theo tháng"
        action={
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-clinic-border bg-clinic-surface px-3.5 py-2 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
          />
        }
      />

      {isLoading ? (
        <LoadingSpinner className="mt-20" />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : data ? (
        <>
          <div className="text-sm text-clinic-muted">
            Báo cáo tháng <strong>{formatMonth(data.month)}</strong>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard
              label="Tổng lượt khám"
              value={String(data.visits.total)}
              sub={`${data.completedVisits} hoàn tất hoặc hủy`}
            />
            <SummaryCard
              label="Doanh thu phát sinh"
              value={formatVND(data.revenue.totalBilled)}
              sub={`${data.revenue.paidCount + data.revenue.partialCount} hóa đơn`}
            />
            <SummaryCard
              label="Đã thu"
              value={formatVND(data.revenue.totalCollected)}
              sub={`${data.revenue.paidCount} hóa đơn đã thanh toán đủ`}
            />
            <SummaryCard
              label="Thanh toán 1 phần"
              value={String(data.revenue.partialCount)}
              sub="Hóa đơn chưa thu đủ"
            />
          </div>

          {/* Visit breakdown */}
          <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-clinic-muted">
              Chi tiết lượt khám theo trạng thái
            </h2>
            {Object.keys(data.visits.byStatus).length === 0 ? (
              <p className="text-sm text-clinic-muted">Không có dữ liệu cho tháng này.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.visits.byStatus).map(([status, count]) => {
                  const pct = data.visits.total > 0 ? Math.round((count / data.visits.total) * 100) : 0
                  return (
                    <div key={status}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-clinic-text">{visitStatusLabels[status] ?? status}</span>
                        <span className="font-medium text-clinic-text">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-clinic-bg overflow-hidden">
                        <div
                          className="h-full rounded-full bg-clinic-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Revenue breakdown */}
          <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-clinic-muted">
              Chi tiết doanh thu
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between rounded-xl bg-clinic-bg px-4 py-3 text-sm">
                <span className="text-clinic-text">Tổng doanh thu phát sinh</span>
                <span className="font-semibold text-clinic-text">{formatVND(data.revenue.totalBilled)}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-clinic-bg px-4 py-3 text-sm">
                <span className="text-clinic-text">Đã thu</span>
                <span className="font-semibold text-[#065F46]">{formatVND(data.revenue.totalCollected)}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-clinic-bg px-4 py-3 text-sm">
                <span className="text-clinic-text">Chưa thu</span>
                <span className="font-semibold text-clinic-danger">
                  {formatVND(data.revenue.totalBilled - data.revenue.totalCollected)}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue by type (Phase 2) */}
          {breakdown && (
            <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-clinic-muted">
                Doanh thu theo loại dịch vụ
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { key: 'CONSULTATION', label: 'Tiền khám', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { key: 'SERVICE', label: 'Dịch vụ', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                  { key: 'DRUG', label: 'Thuốc', color: 'bg-green-50 text-green-700 border-green-100' },
                ].map(({ key, label, color }) => {
                  const value = breakdown.byType[key as keyof typeof breakdown.byType] ?? 0
                  const pct = breakdown.total > 0 ? Math.round((value / breakdown.total) * 100) : 0
                  return (
                    <div key={key} className={`rounded-xl border p-4 ${color}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
                      <p className="mt-2 text-xl font-bold">{formatVND(value)}</p>
                      <p className="mt-1 text-xs opacity-70">{pct}% tổng doanh thu</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
