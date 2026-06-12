import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pill, RefreshCw, X, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/date'
import { toast } from 'sonner'
import { pharmacyApi } from './api'
import type { CreateDispensePayload, Prescription } from './types'
import { useAuthStore } from '@/features/auth/store'
import { formatMoney } from '@/lib/money'
import { apiClient } from '@/lib/api-client'

interface StockLot {
  id: string
  drugId: string
  lotNumber: string
  quantityOnHand: number
  expiryDate: string
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function PharmacyWorklist() {
  const { hasRole } = useAuthStore()
  const canDispense = hasRole(['ADMIN', 'PHARMACIST'])

  const qc = useQueryClient()
  const [date, setDate] = useState(todayStr())
  const [dispenseModal, setDispenseModal] = useState<Prescription | null>(null)
  const [lotSelections, setLotSelections] = useState<Record<string, string>>({})
  const [historyOpen, setHistoryOpen] = useState(false)

  // Danh sách đơn thuốc chờ phát (PENDING)
  const { data: worklist = [], isLoading: wlLoading, refetch: refetchWl } = useQuery({
    queryKey: ['pharmacy-worklist', date],
    queryFn: () => pharmacyApi.worklist(date),
  })

  // Lịch sử phát thuốc theo ngày
  const { data: history = [], isLoading: histLoading, refetch: refetchHist } = useQuery({
    queryKey: ['pharmacy-history', date],
    queryFn: () => pharmacyApi.list({ date }),
    enabled: historyOpen,
  })

  // Load tất cả lots khi mở modal, filter theo drugId ở client
  const { data: availableLots = [] } = useQuery({
    queryKey: ['lots-for-dispense'],
    queryFn: () => apiClient.get<StockLot[]>('/inventory/lots'),
    enabled: !!dispenseModal,
    staleTime: 30_000,
  })

  const dispenseMut = useMutation({
    mutationFn: (payload: CreateDispensePayload) => pharmacyApi.create(payload),
    onSuccess: () => {
      toast.success('Phát thuốc thành công')
      setDispenseModal(null)
      setLotSelections({})
      qc.invalidateQueries({ queryKey: ['pharmacy-worklist', date] })
      qc.invalidateQueries({ queryKey: ['pharmacy-history', date] })
      qc.invalidateQueries({ queryKey: ['stock-summary'] })
      qc.invalidateQueries({ queryKey: ['stock-lots'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => pharmacyApi.cancel(id),
    onSuccess: () => {
      toast.success('Đã hủy phiếu phát thuốc')
      qc.invalidateQueries({ queryKey: ['pharmacy-history', date] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const openModal = (rx: Prescription) => {
    setDispenseModal(rx)
    setLotSelections({})
  }

  const handleDispense = () => {
    if (!dispenseModal?.examination?.visit) return
    const items = dispenseModal.items ?? []

    const dispenseItems = items.map((item) => ({
      prescriptionItemId: item.id,
      stockLotId: lotSelections[item.id] ?? '',
      quantity: item.quantity,
    }))

    const missing = dispenseItems.filter((i) => !i.stockLotId)
    if (missing.length > 0) {
      toast.error('Chọn lô thuốc cho tất cả các mục trong đơn')
      return
    }

    dispenseMut.mutate({
      visitId: dispenseModal.examination.visit.id,
      prescriptionId: dispenseModal.id,
      items: dispenseItems,
    })
  }

  const handleRefresh = () => {
    refetchWl()
    if (historyOpen) refetchHist()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header + date picker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
            <Pill className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-clinic-text">Phát thuốc</h1>
            <p className="text-xs text-clinic-muted">Worklist + Lịch sử theo ngày</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
          />
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-xl border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-muted hover:bg-white"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* ── SECTION 1: WORKLIST (đơn chờ phát) ── */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-clinic-text">
            Đơn thuốc chờ phát
          </h2>
          {!wlLoading && (
            <span className="rounded-full bg-clinic-warning/30 px-2 py-0.5 text-xs font-medium text-amber-700">
              {worklist.length} đơn
            </span>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-clinic-border bg-clinic-surface shadow-clinic">
          <table className="w-full text-sm">
            <thead className="border-b border-clinic-border bg-clinic-bg">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Bệnh nhân</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Bác sĩ kê</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-clinic-muted">Số loại thuốc</th>
                {canDispense && (
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-clinic-muted">Thao tác</th>
                )}
              </tr>
            </thead>
            <tbody>
              {wlLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-clinic-border">
                    <td colSpan={4} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-clinic-border" />
                    </td>
                  </tr>
                ))
              ) : worklist.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-clinic-muted">
                    Không có đơn thuốc chờ phát ngày {formatDate(date)}
                  </td>
                </tr>
              ) : (
                worklist.map((rx) => (
                  <tr key={rx.id} className="border-b border-clinic-border last:border-0 hover:bg-clinic-primary/5">
                    <td className="px-4 py-3">
                      <p className="font-medium text-clinic-text">
                        {rx.examination?.visit?.patient?.fullName ?? '—'}
                      </p>
                      {rx.examination?.visit?.queueNumber && (
                        <span className="text-xs text-clinic-muted">
                          STT #{rx.examination.visit.queueNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-clinic-muted">
                      {rx.examination?.doctor?.fullName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-clinic-text">
                      {rx.items?.length ?? 0} loại
                    </td>
                    {canDispense && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openModal(rx)}
                          className="rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-600 hover:bg-cyan-500/25"
                        >
                          Phát thuốc
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 2: HISTORY (đã phát) ── */}
      <div>
        <button
          onClick={() => setHistoryOpen((o) => !o)}
          className="mb-3 flex items-center gap-2 text-sm font-semibold text-clinic-text"
        >
          {historyOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Lịch sử phát thuốc ngày {formatDate(date)}
          {!histLoading && historyOpen && (
            <span className="rounded-full bg-clinic-success/30 px-2 py-0.5 text-xs font-medium text-green-700">
              {history.length} phiếu
            </span>
          )}
        </button>

        {historyOpen && (
          <div className="overflow-hidden rounded-2xl border border-clinic-border bg-clinic-surface shadow-clinic">
            <table className="w-full text-sm">
              <thead className="border-b border-clinic-border bg-clinic-bg">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Bệnh nhân</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Giờ phát</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-clinic-muted">Tổng tiền</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-clinic-muted">Trạng thái</th>
                  {canDispense && (
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-clinic-muted">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {histLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-clinic-border">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-clinic-border" />
                      </td>
                    </tr>
                  ))
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-clinic-muted">
                      Chưa có phiếu phát thuốc ngày {formatDate(date)}
                    </td>
                  </tr>
                ) : (
                  history.map((d) => (
                    <tr key={d.id} className="border-b border-clinic-border last:border-0 hover:bg-clinic-primary/5">
                      <td className="px-4 py-3 font-medium text-clinic-text">
                        {d.visit?.patient?.fullName ?? '—'}
                        {d.visit?.queueNumber && (
                          <span className="ml-2 rounded-full bg-clinic-primary/15 px-2 py-0.5 text-xs text-clinic-primary">
                            #{d.visit.queueNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-clinic-muted">{formatTime(d.dispensedAt)}</td>
                      <td className="px-4 py-3 text-right font-medium text-clinic-text">
                        {formatMoney(Number(d.totalAmount))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.status === 'DISPENSED'
                            ? 'bg-green-500/15 text-green-600'
                            : 'bg-red-500/15 text-red-500'
                        }`}>
                          {d.status === 'DISPENSED' ? 'Đã phát' : 'Đã hủy'}
                        </span>
                      </td>
                      {canDispense && (
                        <td className="px-4 py-3 text-center">
                          {d.status === 'DISPENSED' && (
                            <button
                              onClick={() => cancelMut.mutate(d.id)}
                              disabled={cancelMut.isPending}
                              className="rounded-lg bg-red-500/15 px-2 py-1 text-xs text-red-500 hover:bg-red-500/25 disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL PHÁT THUỐC ── */}
      {dispenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-clinic-border bg-clinic-surface p-6 shadow-clinic">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-clinic-text">
                  Phát thuốc — {dispenseModal.examination?.visit?.patient?.fullName}
                </h2>
                {dispenseModal.examination?.doctor?.fullName && (
                  <p className="text-xs text-clinic-muted">
                    Bác sĩ kê: {dispenseModal.examination.doctor.fullName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDispenseModal(null)}
                className="text-clinic-muted hover:text-clinic-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[50vh] space-y-3 overflow-y-auto">
              {(dispenseModal.items ?? []).map((item) => {
                const lotsForDrug = availableLots.filter(
                  (l) => l.drugId === item.drugId && l.quantityOnHand >= item.quantity,
                )
                return (
                  <div key={item.id} className="rounded-xl border border-clinic-border p-3">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="font-medium text-clinic-text">{item.drug?.name}</p>
                        <p className="text-xs text-clinic-muted">
                          {item.quantity} {item.drug?.unit}
                          {item.dosageInstruction && ` · ${item.dosageInstruction}`}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-clinic-primary">
                        {formatMoney((item.drug?.pricePerUnit ?? 0) * item.quantity)}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-clinic-muted">
                        Chọn lô thuốc *
                      </label>
                      <select
                        value={lotSelections[item.id] ?? ''}
                        onChange={(e) =>
                          setLotSelections((s) => ({ ...s, [item.id]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-clinic-border bg-clinic-bg px-2 py-1.5 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
                      >
                        <option value="">-- Chọn lô --</option>
                        {lotsForDrug.length === 0 ? (
                          <option disabled>Không đủ tồn kho ({item.quantity} {item.drug?.unit})</option>
                        ) : (
                          lotsForDrug.map((lot) => (
                            <option key={lot.id} value={lot.id}>
                              {lot.lotNumber} · HSD: {formatDate(lot.expiryDate)} · Còn: {lot.quantityOnHand} {item.drug?.unit}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setDispenseModal(null)}
                className="flex-1 rounded-xl border border-clinic-border py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
              >
                Hủy
              </button>
              <button
                onClick={handleDispense}
                disabled={dispenseMut.isPending}
                className="flex-1 rounded-xl bg-cyan-500 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-60"
              >
                {dispenseMut.isPending ? 'Đang phát...' : 'Xác nhận phát thuốc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
