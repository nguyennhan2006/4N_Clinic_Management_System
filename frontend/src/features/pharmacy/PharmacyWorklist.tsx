import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pill, RefreshCw, X } from 'lucide-react'
import { formatDate, formatTime, today as getTodayStr } from '@/lib/date'
import { toast } from 'sonner'
import { pharmacyApi } from './api'
import type { CreateDispensePayload } from './types'
import { useAuthStore } from '@/features/auth/store'
import { formatMoney } from '@/lib/money'
import { apiClient } from '@/lib/api-client'

// Types for dispense form data
interface VisitWithPrescription {
  id: string
  queueNumber: number
  patient?: { fullName: string }
  examination?: {
    prescription?: {
      id: string
      items?: {
        id: string
        drugId: string
        quantity: number
        dosageInstruction: string | null
        drug?: { id: string; name: string; unit: string; pricePerUnit: number }
      }[]
    }
  }
}

interface StockLot {
  id: string
  drugId: string
  lotNumber: string
  quantityOnHand: number
  expiryDate: string
}

export function PharmacyWorklist() {
  const { hasRole } = useAuthStore()
  const canDispense = hasRole(['ADMIN', 'PHARMACIST'])

  const qc = useQueryClient()
  const [dispenseModal, setDispenseModal] = useState<VisitWithPrescription | null>(null)
  const [lotSelections, setLotSelections] = useState<Record<string, string>>({})

  const today = getTodayStr()

  const { data: dispenses, isLoading } = useQuery({
    queryKey: ['dispenses'],
    queryFn: () => pharmacyApi.list({ date: today }),
    refetchInterval: 30_000,
  })

  const { data: availableLots } = useQuery({
    queryKey: ['lots-for-dispense'],
    queryFn: () => apiClient.get<StockLot[]>('/inventory/lots', { available: 'true' }),
    enabled: !!dispenseModal,
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => pharmacyApi.cancel(id),
    onSuccess: () => {
      toast.success('Đã hủy phiếu phát thuốc')
      qc.invalidateQueries({ queryKey: ['dispenses'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const dispenseMut = useMutation({
    mutationFn: (payload: CreateDispensePayload) => pharmacyApi.create(payload),
    onSuccess: () => {
      toast.success('Phát thuốc thành công')
      setDispenseModal(null)
      setLotSelections({})
      qc.invalidateQueries({ queryKey: ['dispenses'] })
      qc.invalidateQueries({ queryKey: ['stock-summary'] })
      qc.invalidateQueries({ queryKey: ['stock-lots'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleDispense = () => {
    if (!dispenseModal?.examination?.prescription) return
    const prescriptionId = dispenseModal.examination.prescription.id
    const items = dispenseModal.examination.prescription.items ?? []

    const dispenseItems = items.map((item) => ({
      prescriptionItemId: item.id,
      stockLotId: lotSelections[item.id] ?? '',
      quantity: item.quantity,
    }))

    const missing = dispenseItems.filter((i) => !i.stockLotId)
    if (missing.length > 0) {
      toast.error('Chọn lô thuốc cho tất cả các mục đơn thuốc')
      return
    }

    dispenseMut.mutate({
      visitId: dispenseModal.id,
      prescriptionId,
      items: dispenseItems,
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pill className="h-6 w-6 text-clinic-sidebar" />
          <div>
            <h1 className="text-xl font-semibold text-clinic-text">Danh sách phát thuốc</h1>
            <p className="text-xs text-clinic-muted">Ngày {formatDate(new Date())}</p>
          </div>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['dispenses'] })}
          className="flex items-center gap-2 rounded-lg border border-clinic-border px-3 py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {/* Dispense records table */}
      <div className="overflow-hidden rounded-2xl border border-clinic-border bg-white shadow-clinic">
        <table className="w-full text-sm">
          <thead className="border-b border-clinic-border bg-clinic-bg">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-clinic-text">Bệnh nhân</th>
              <th className="px-4 py-3 text-left font-semibold text-clinic-text">Giờ phát</th>
              <th className="px-4 py-3 text-right font-semibold text-clinic-text">Tổng tiền</th>
              <th className="px-4 py-3 text-center font-semibold text-clinic-text">Trạng thái</th>
              {canDispense && <th className="px-4 py-3 text-center font-semibold text-clinic-text">Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))
            ) : !dispenses?.length ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-clinic-muted">
                  Chưa có phiếu phát thuốc hôm nay
                </td>
              </tr>
            ) : (
              dispenses.map((d) => (
                <tr key={d.id} className="border-b border-clinic-border last:border-0 hover:bg-clinic-bg/50">
                  <td className="px-4 py-3 font-medium text-clinic-text">
                    {d.visit?.patient?.fullName ?? '—'}
                    {d.visit?.queueNumber && (
                      <span className="ml-2 rounded-full bg-clinic-sidebarMuted px-2 py-0.5 text-xs text-clinic-sidebar">
                        #{d.visit.queueNumber}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-clinic-muted">
                    {formatTime(d.dispensedAt)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-clinic-text">
                    {formatMoney(Number(d.totalAmount))}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.status === 'DISPENSED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {d.status === 'DISPENSED' ? 'Đã phát' : 'Đã hủy'}
                    </span>
                  </td>
                  {canDispense && (
                    <td className="px-4 py-3 text-center">
                      {d.status === 'DISPENSED' && (
                        <button
                          onClick={() => cancelMut.mutate(d.id)}
                          disabled={cancelMut.isPending}
                          className="rounded-lg bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100 disabled:opacity-50"
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

      {/* Dispense modal */}
      {dispenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-clinic-text">
                Phát thuốc — {dispenseModal.patient?.fullName}
              </h2>
              <button onClick={() => setDispenseModal(null)} className="text-clinic-muted hover:text-clinic-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {dispenseModal.examination?.prescription?.items?.map((item) => {
                const lotsForDrug = availableLots?.filter((l) => l.drugId === item.drugId && l.quantityOnHand >= item.quantity) ?? []
                return (
                  <div key={item.id} className="rounded-xl border border-clinic-border p-3">
                    <div className="mb-2 flex items-center justify-between">
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
                      <label className="mb-1 block text-xs text-clinic-muted">Chọn lô thuốc *</label>
                      <select
                        value={lotSelections[item.id] ?? ''}
                        onChange={(e) => setLotSelections((s) => ({ ...s, [item.id]: e.target.value }))}
                        className="w-full rounded-lg border border-clinic-border px-2 py-1.5 text-sm"
                      >
                        <option value="">-- Chọn lô --</option>
                        {lotsForDrug.length === 0 ? (
                          <option disabled>Không đủ tồn kho</option>
                        ) : (
                          lotsForDrug.map((lot) => (
                            <option key={lot.id} value={lot.id}>
                              {lot.lotNumber} · HSD: {formatDate(lot.expiryDate)} · Còn: {lot.quantityOnHand}
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
                className="flex-1 rounded-xl bg-clinic-primary py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover disabled:opacity-60"
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
