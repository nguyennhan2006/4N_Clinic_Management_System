import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package, Plus, AlertTriangle } from 'lucide-react'
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

export function StockListPage() {
  const { hasRole } = useAuthStore()
  const canReceive = hasRole(['ADMIN', 'PHARMACIST', 'MANAGER'])
  const qc = useQueryClient()

  const [view, setView] = useState<'summary' | 'lots'>('summary')
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [expiringSoonFilter, setExpiringSoonFilter] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<CreateStockLotPayload>>({})

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

  const isExpiringSoon = (date: string) => {
    const d = new Date(date)
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff > 0 && diff <= 30
  }

  const isExpired = (date: string) => new Date(date) < new Date()

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-clinic-sidebar" />
          <h1 className="text-xl font-semibold text-clinic-text">Tồn kho thuốc</h1>
        </div>
        {canReceive && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover"
          >
            <Plus className="h-4 w-4" />
            Nhập kho
          </button>
        )}
      </div>

      {showForm && canReceive && (
        <div className="mb-6 rounded-2xl border border-clinic-border bg-white p-5 shadow-clinic">
          <h3 className="mb-4 font-semibold text-clinic-text">Nhập lô thuốc mới</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-clinic-text">Thuốc *</label>
              <select
                value={form.drugId ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, drugId: e.target.value }))}
                className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm"
              >
                <option value="">-- Chọn thuốc --</option>
                {drugs?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-clinic-text">Số lô *</label>
              <input
                type="text"
                value={form.lotNumber ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, lotNumber: e.target.value }))}
                className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm"
                placeholder="LOT-2024-001"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-clinic-text">Số lượng nhập *</label>
              <input
                type="number"
                min="1"
                value={form.quantityReceived ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, quantityReceived: Number(e.target.value) }))}
                className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-clinic-text">Giá nhập / đơn vị (VND) *</label>
              <input
                type="number"
                min="0"
                value={form.unitCost ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, unitCost: Number(e.target.value) }))}
                className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-clinic-text">Hạn sử dụng *</label>
              <input
                type="date"
                value={form.expiryDate ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-clinic-text">Ghi chú</label>
              <input
                type="text"
                value={form.notes ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-clinic-border px-4 py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
            >
              Hủy
            </button>
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
              className="rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover disabled:opacity-60"
            >
              {createMut.isPending ? 'Đang lưu...' : 'Nhập kho'}
            </button>
          </div>
        </div>
      )}

      {/* View toggle + filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-xl border border-clinic-border bg-white">
          <button
            onClick={() => setView('summary')}
            className={`px-4 py-2 text-sm font-medium ${view === 'summary' ? 'bg-clinic-primary text-white' : 'text-clinic-muted hover:bg-clinic-bg'}`}
          >
            Tóm tắt
          </button>
          <button
            onClick={() => setView('lots')}
            className={`px-4 py-2 text-sm font-medium ${view === 'lots' ? 'bg-clinic-primary text-white' : 'text-clinic-muted hover:bg-clinic-bg'}`}
          >
            Lô hàng
          </button>
        </div>
        {view === 'summary' && (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={lowStockFilter} onChange={(e) => setLowStockFilter(e.target.checked)} />
              Tồn kho thấp
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={expiringSoonFilter} onChange={(e) => setExpiringSoonFilter(e.target.checked)} />
              Sắp hết hạn
            </label>
          </>
        )}
      </div>

      {view === 'summary' ? (
        <div className="overflow-hidden rounded-2xl border border-clinic-border bg-white shadow-clinic">
          <table className="w-full text-sm">
            <thead className="border-b border-clinic-border bg-clinic-bg">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-clinic-text">Thuốc</th>
                <th className="px-4 py-3 text-left font-semibold text-clinic-text">Đơn vị</th>
                <th className="px-4 py-3 text-right font-semibold text-clinic-text">Tổng tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {loadingSummary ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={3} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : !summary?.length ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-clinic-muted">Kho trống</td>
                </tr>
              ) : (
                summary.map((item) => (
                  <tr key={item.drugId} className="border-b border-clinic-border last:border-0 hover:bg-clinic-bg/50">
                    <td className="px-4 py-3 font-medium text-clinic-text">{item.drugName}</td>
                    <td className="px-4 py-3 text-clinic-muted">{item.unit}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${item.totalOnHand <= 10 ? 'text-red-600' : 'text-clinic-text'}`}>
                        {item.totalOnHand}
                      </span>
                      {item.totalOnHand <= 10 && (
                        <AlertTriangle className="ml-1 inline h-4 w-4 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-clinic-border bg-white shadow-clinic">
          <table className="w-full text-sm">
            <thead className="border-b border-clinic-border bg-clinic-bg">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-clinic-text">Thuốc</th>
                <th className="px-4 py-3 text-left font-semibold text-clinic-text">Số lô</th>
                <th className="px-4 py-3 text-right font-semibold text-clinic-text">Tồn kho</th>
                <th className="px-4 py-3 text-left font-semibold text-clinic-text">Hạn dùng</th>
                <th className="px-4 py-3 text-right font-semibold text-clinic-text">Giá nhập</th>
              </tr>
            </thead>
            <tbody>
              {loadingLots ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : !lots?.length ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-clinic-muted">Không có lô hàng</td>
                </tr>
              ) : (
                lots.map((lot) => (
                  <tr key={lot.id} className="border-b border-clinic-border last:border-0 hover:bg-clinic-bg/50">
                    <td className="px-4 py-3 font-medium text-clinic-text">{lot.drug?.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-clinic-muted">{lot.lotNumber}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${lot.quantityOnHand <= 5 ? 'text-red-600' : 'text-clinic-text'}`}>
                        {lot.quantityOnHand}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${isExpired(lot.expiryDate) ? 'font-semibold text-red-600' : isExpiringSoon(lot.expiryDate) ? 'font-medium text-orange-600' : 'text-clinic-muted'}`}>
                        {formatDate(lot.expiryDate)}
                        {isExpired(lot.expiryDate) && ' (Hết hạn)'}
                        {!isExpired(lot.expiryDate) && isExpiringSoon(lot.expiryDate) && ' (Sắp hết hạn)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-clinic-muted">{formatMoney(Number(lot.unitCost))}</td>
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
