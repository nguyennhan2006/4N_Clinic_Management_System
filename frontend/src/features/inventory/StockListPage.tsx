import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package, Plus, AlertTriangle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/date'
import { toast } from 'sonner'
import { inventoryApi } from './api'
import type { CreateStockLotPayload } from './types'
import { useAuthStore } from '@/features/auth/store'
import { formatMoney } from '@/lib/money'
import { apiClient } from '@/lib/api-client'

interface Drug {
  id: string
  name: string
  unit: string
}

const inputCls = 'w-full rounded-lg border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text placeholder:text-clinic-muted focus:outline-none focus:ring-2 focus:ring-clinic-primary/40'

function ExpiryBadge({ date }: { date: string }) {
  const d = new Date(date)
  const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  const expired = diff < 0
  const soon = diff >= 0 && diff <= 30

  if (expired)
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
        <AlertTriangle className="h-3 w-3" /> Hết hạn
      </span>
    )
  if (soon)
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-clinic-text">{formatDate(date)}</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
          <Clock className="h-3 w-3" /> Sắp hết hạn
        </span>
      </div>
    )
  return <span className="text-xs text-clinic-muted">{formatDate(date)}</span>
}

function StockBadge({ qty, threshold = 10 }: { qty: number; threshold?: number }) {
  if (qty === 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-400">
        <AlertTriangle className="h-3 w-3" /> Hết
      </span>
    )
  if (qty <= threshold)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
        <AlertTriangle className="h-3 w-3" /> {qty}
      </span>
    )
  return <span className="rounded-md bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-400">{qty}</span>
}

export function StockListPage() {
  const { hasRole } = useAuthStore()
  const canReceive = hasRole(['ADMIN', 'PHARMACIST', 'MANAGER'])
  const qc = useQueryClient()

  const [view, setView] = useState<'summary' | 'lots'>('lots')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [expiringSoonFilter, setExpiringSoonFilter] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<CreateStockLotPayload>>({})
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null)

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['stock-summary', { lowStock: lowStockFilter, expiringSoon: expiringSoonFilter }],
    queryFn: () =>
      inventoryApi.getSummary({
        ...(lowStockFilter ? { lowStock: true } : {}),
        ...(expiringSoonFilter ? { expiringSoon: true } : {}),
      }),
    enabled: view === 'summary',
  })

  const { data: lots, isLoading: loadingLots } = useQuery({
    queryKey: ['stock-lots'],
    queryFn: () => inventoryApi.listLots(),
    enabled: view === 'lots',
  })

  const { data: drugs } = useQuery({
    queryKey: ['drugs-for-stock'],
    queryFn: () => apiClient.get<Drug[]>('/drugs'),
    enabled: showForm,
  })

  const createMut = useMutation({
    mutationFn: () => {
      const { drugId, lotNumber, quantityReceived, unitCost, expiryDate } = form
      if (!drugId || !lotNumber || !quantityReceived || !unitCost || !expiryDate)
        throw new Error('Nhập đủ thông tin lô hàng')
      return inventoryApi.createLot({
        drugId,
        lotNumber,
        quantityReceived: Number(quantityReceived),
        unitCost: Number(unitCost),
        expiryDate: new Date(expiryDate).toISOString(),
        notes: form.notes,
      })
    },
    onSuccess: () => {
      toast.success('Nhập kho thành công')
      setShowForm(false)
      setForm({})
      qc.invalidateQueries({ queryKey: ['stock-summary'] })
      qc.invalidateQueries({ queryKey: ['stock-lots'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-6">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinic-primary/15">
            <Package className="h-5 w-5 text-clinic-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-clinic-text">Tồn kho thuốc</h1>
            <p className="text-xs text-clinic-muted">Quản lý lô hàng và tồn kho</p>
          </div>
        </div>
        {canReceive && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-clinic-primary/25 transition hover:bg-clinic-primary-hover active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nhập kho
          </button>
        )}
      </div>

      {/* ── Nhập lô form ── */}
      {showForm && canReceive && (
        <div className="mb-6 rounded-2xl border border-clinic-primary/20 bg-clinic-surface p-5 shadow-clinic ring-1 ring-clinic-primary/10">
          <h3 className="mb-4 font-semibold text-clinic-text">Nhập lô thuốc mới</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-clinic-muted">Thuốc *</label>
              <select
                value={form.drugId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, drugId: e.target.value }))}
                className={inputCls}
              >
                <option value="">-- Chọn thuốc --</option>
                {drugs?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-clinic-muted">Số lô *</label>
              <input
                type="text"
                value={form.lotNumber ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, lotNumber: e.target.value }))}
                className={inputCls}
                placeholder="LOT-2024-001"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-clinic-muted">Số lượng nhập *</label>
              <input
                type="number"
                min="1"
                value={form.quantityReceived ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, quantityReceived: Number(e.target.value) }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-clinic-muted">Giá nhập / đơn vị (VND) *</label>
              <input
                type="number"
                min="0"
                value={form.unitCost ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, unitCost: Number(e.target.value) }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-clinic-muted">Hạn sử dụng *</label>
              <input
                type="date"
                value={form.expiryDate ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                min={new Date().toISOString().slice(0, 10)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-clinic-muted">Ghi chú</label>
              <input
                type="text"
                value={form.notes ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-clinic-border px-4 py-2 text-sm text-clinic-muted transition hover:bg-clinic-bg"
            >
              Hủy
            </button>
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
              className="rounded-xl bg-clinic-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
            >
              {createMut.isPending ? 'Đang lưu...' : 'Xác nhận nhập kho'}
            </button>
          </div>
        </div>
      )}

      {/* ── Toolbar: tabs + filters ── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Segmented control */}
        <div className="flex rounded-xl border border-clinic-border bg-clinic-bg p-0.5">
          {(['lots', 'summary'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-5 py-1.5 text-sm font-medium transition ${
                view === v
                  ? 'bg-clinic-primary text-white shadow-sm'
                  : 'text-clinic-muted hover:text-clinic-text'
              }`}
            >
              {v === 'lots' ? 'Lô hàng' : 'Tóm tắt'}
            </button>
          ))}
        </div>

        {view === 'summary' && (
          <div className="flex gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-clinic-border px-3 py-1.5 text-sm text-clinic-muted transition hover:border-amber-500/40 hover:text-amber-400">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="accent-clinic-primary"
              />
              <AlertTriangle className="h-3.5 w-3.5" />
              Tồn kho thấp
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-clinic-border px-3 py-1.5 text-sm text-clinic-muted transition hover:border-orange-500/40 hover:text-orange-400">
              <input
                type="checkbox"
                checked={expiringSoonFilter}
                onChange={(e) => setExpiringSoonFilter(e.target.checked)}
                className="accent-clinic-primary"
              />
              <Clock className="h-3.5 w-3.5" />
              Sắp hết hạn
            </label>
          </div>
        )}
      </div>

      {/* ── Tables ── */}
      {view === 'summary' ? (
        <div className="overflow-hidden rounded-2xl border border-clinic-border bg-clinic-surface shadow-clinic">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-clinic-border bg-clinic-bg">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Thuốc</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Đơn vị</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-clinic-muted">Tổng tồn kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-border">
              {loadingSummary ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={3} className="px-4 py-3.5">
                      <div className="h-4 animate-pulse rounded-md bg-white/5" />
                    </td>
                  </tr>
                ))
              ) : !summary?.length ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center">
                    <Package className="mx-auto mb-2 h-8 w-8 text-clinic-border" />
                    <p className="text-sm text-clinic-muted">Kho trống</p>
                  </td>
                </tr>
              ) : (
                summary.map((item) => (
                  <tr
                    key={item.drug.id}
                    onClick={() => setExpandedDrug(expandedDrug === item.drug.id ? null : item.drug.id)}
                    className="cursor-pointer transition-colors hover:bg-clinic-primary/5"
                  >
                    <td className="px-4 py-3.5 font-medium text-clinic-text">{item.drug.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-md bg-clinic-bg px-2 py-0.5 text-xs text-clinic-muted">
                        {item.drug.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <StockBadge qty={item.totalOnHand} threshold={10} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-clinic-border bg-clinic-surface shadow-clinic">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-clinic-border bg-clinic-bg">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Thuốc</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Số lô</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-clinic-muted">Tồn kho</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Hạn dùng</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-clinic-muted">Giá nhập</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-border">
              {loadingLots ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3.5">
                      <div className="h-4 animate-pulse rounded-md bg-white/5" />
                    </td>
                  </tr>
                ))
              ) : !lots?.length ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Package className="mx-auto mb-2 h-8 w-8 text-clinic-border" />
                    <p className="text-sm text-clinic-muted">Không có lô hàng</p>
                  </td>
                </tr>
              ) : (
                lots.map((lot) => (
                  <tr key={lot.id} className="transition-colors hover:bg-clinic-primary/5">
                    {/* Drug name */}
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-clinic-text">{lot.drug?.name}</span>
                    </td>

                    {/* Lot number — monospace badge */}
                    <td className="px-4 py-3.5">
                      <code className="rounded-md bg-clinic-bg px-2 py-0.5 font-mono text-xs text-clinic-muted">
                        {lot.lotNumber}
                      </code>
                    </td>

                    {/* Quantity badge */}
                    <td className="px-4 py-3.5 text-right">
                      <StockBadge qty={lot.quantityOnHand} threshold={5} />
                    </td>

                    {/* Expiry with badge */}
                    <td className="px-4 py-3.5">
                      <ExpiryBadge date={lot.expiryDate} />
                    </td>

                    {/* Price — bright, right-align */}
                    <td className="px-4 py-3.5 text-right font-medium text-clinic-text">
                      {formatMoney(Number(lot.unitCost))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
