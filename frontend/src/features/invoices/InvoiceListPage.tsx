import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate, formatDateTime } from '@/lib/date'
import { formatVND } from '@/lib/money'
import { visitApi } from '@/features/visits/api'
import { invoiceApi } from './api'
import type { InvoiceStatus } from './types'

type Tab = 'invoices' | 'pending'

const STATUS_OPTIONS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ISSUED', label: 'Đã phát hành' },
  { value: 'PARTIALLY_PAID', label: 'Thanh toán một phần' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'VOID', label: 'Đã hủy' },
]

export function InvoiceListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('invoices')

  // Invoice list filters
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<InvoiceStatus | ''>('')
  const [date, setDate] = useState('')

  const { data: invoices, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', { keyword: search, status, date }],
    queryFn: () => invoiceApi.list({
      keyword: search || undefined,
      status: status || undefined,
      date: date || undefined,
    }),
    enabled: tab === 'invoices',
  })

  // Pending-invoice visits: COMPLETED + no invoice
  const { data: pendingVisits, isLoading: pendingLoading, error: pendingError, refetch: refetchPending } = useQuery({
    queryKey: ['visits-pending-invoice'],
    queryFn: () => visitApi.list({ status: 'COMPLETED', hasInvoice: false }),
    enabled: tab === 'pending',
  })

  const createInvoiceMutation = useMutation({
    mutationFn: (visitId: string) => invoiceApi.createFromVisit(visitId),
    onSuccess: (invoice) => {
      toast.success('Đã tạo hóa đơn thành công')
      void queryClient.invalidateQueries({ queryKey: ['visits-pending-invoice'] })
      void queryClient.invalidateQueries({ queryKey: ['invoices'] })
      navigate(`/app/invoices/${invoice.id}`)
    },
    onError: () => {
      toast.error('Tạo hóa đơn thất bại')
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(keyword)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hóa đơn"
        description="Tra cứu, lập và quản lý hóa đơn thanh toán"
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-clinic-border bg-clinic-bg p-1 w-fit">
        {([
          { key: 'invoices', label: 'Danh sách hóa đơn' },
          { key: 'pending', label: 'Chờ lập hóa đơn' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? 'bg-clinic-surface text-clinic-primary shadow-sm'
                : 'text-clinic-muted hover:text-clinic-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Invoice list ── */}
      {tab === 'invoices' && (
        <>
          <div className="flex flex-wrap gap-3">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-clinic-muted" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo tên, mã BN, SĐT..."
                  className="w-full rounded-xl border border-clinic-border bg-clinic-surface py-2.5 pl-10 pr-4 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-clinic-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-clinic-primaryHover"
              >
                Tìm
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => { setKeyword(''); setSearch('') }}
                  className="rounded-xl border border-clinic-border px-4 py-2.5 text-sm text-clinic-muted transition hover:bg-clinic-bg"
                >
                  Xóa
                </button>
              )}
            </form>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus | '')}
              className="rounded-xl border border-clinic-border bg-clinic-surface px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-clinic-border bg-clinic-surface px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
            />
          </div>

          <div className="rounded-2xl bg-clinic-surface shadow-clinic">
            {isLoading ? (
              <div className="p-6"><LoadingState rows={6} /></div>
            ) : error ? (
              <ErrorState error={error} onRetry={() => void refetch()} />
            ) : !invoices?.length ? (
              <EmptyState
                title="Không có hóa đơn"
                description={search ? `Không tìm thấy hóa đơn cho "${search}".` : 'Chưa có hóa đơn nào.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-clinic-border bg-clinic-bg">
                    <tr>
                      {['Ngày tạo', 'Bệnh nhân', 'Ngày khám', 'Tổng tiền', 'Đã trả', 'Trạng thái', ''].map((h) => (
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
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="cursor-pointer transition hover:bg-clinic-bg/60"
                        onClick={() => navigate(`/app/invoices/${inv.id}`)}
                      >
                        <td className="px-5 py-3 text-clinic-muted text-xs">{formatDateTime(inv.createdAt)}</td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-clinic-text">{inv.visit.patient.fullName}</div>
                          <div className="text-xs text-clinic-muted">{inv.visit.patient.patientCode}</div>
                        </td>
                        <td className="px-5 py-3 text-clinic-muted">{formatDate(inv.visit.visitDate)}</td>
                        <td className="px-5 py-3 font-semibold text-clinic-text">{formatVND(Number(inv.totalAmount))}</td>
                        <td className="px-5 py-3 text-clinic-muted">{formatVND(Number(inv.paidAmount))}</td>
                        <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                        <td className="px-5 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/app/invoices/${inv.id}`) }}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-clinic-primary transition hover:bg-clinic-primary/10"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-clinic-border px-5 py-3 text-xs text-clinic-muted">
                  {invoices.length} hóa đơn
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Tab: Pending invoice ── */}
      {tab === 'pending' && (
        <div className="rounded-2xl bg-clinic-surface shadow-clinic">
          <div className="border-b border-clinic-border px-6 py-4">
            <h2 className="text-base font-semibold text-clinic-text">Lượt khám chờ lập hóa đơn</h2>
            <p className="mt-0.5 text-xs text-clinic-muted">
              Danh sách lượt khám đã hoàn tất nhưng chưa có hóa đơn
            </p>
          </div>

          {pendingLoading ? (
            <div className="p-6"><LoadingState rows={5} /></div>
          ) : pendingError ? (
            <ErrorState error={pendingError} onRetry={() => void refetchPending()} />
          ) : !pendingVisits?.length ? (
            <EmptyState
              title="Không có lượt khám chờ"
              description="Tất cả lượt khám đã hoàn tất đều đã có hóa đơn."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-clinic-border bg-clinic-bg">
                  <tr>
                    {['STT', 'Bệnh nhân', 'Ngày khám', 'Lý do khám', 'Trạng thái', ''].map((h) => (
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
                  {pendingVisits.map((visit) => (
                    <tr key={visit.id} className="transition hover:bg-clinic-bg/40">
                      <td className="px-5 py-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-clinic-primary/15 text-xs font-bold text-clinic-primary">
                          {visit.queueNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-clinic-text">{visit.patient.fullName}</div>
                        <div className="text-xs text-clinic-muted">{visit.patient.patientCode}</div>
                        {visit.patient.phone && (
                          <div className="text-xs text-clinic-muted">{visit.patient.phone}</div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-clinic-muted">{formatDate(visit.visitDate)}</td>
                      <td className="px-5 py-3 text-clinic-muted max-w-48 truncate">
                        {visit.reason ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={visit.status} />
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => createInvoiceMutation.mutate(visit.id)}
                          disabled={createInvoiceMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-clinic-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-clinic-primaryHover disabled:opacity-60"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Tạo hóa đơn
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-clinic-border px-5 py-3 text-xs text-clinic-muted">
                {pendingVisits.length} lượt khám chờ lập hóa đơn
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
