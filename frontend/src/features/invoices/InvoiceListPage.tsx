import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate, formatDateTime } from '@/lib/date'
import { formatVND } from '@/lib/money'
import type { InvoiceStatus } from './types'
import { useInvoicesQuery } from './hooks'

const STATUS_OPTIONS: { value: InvoiceStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'ISSUED', label: 'Đã phát hành' },
  { value: 'PARTIALLY_PAID', label: 'Thanh toán một phần' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'VOID', label: 'Đã hủy' },
]

export function InvoiceListPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<InvoiceStatus | ''>('')
  const [date, setDate] = useState('')

  const { data: invoices, isLoading, error, refetch } = useInvoicesQuery({
    keyword: search || undefined,
    status: status || undefined,
    date: date || undefined,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(keyword)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hóa đơn"
        description="Tra cứu và quản lý hóa đơn thanh toán"
      />

      {/* Filters */}
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
            className="rounded-xl bg-clinic-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
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

      {/* Table */}
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
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-clinic-primary transition hover:bg-clinic-sidebar-muted"
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
    </div>
  )
}
