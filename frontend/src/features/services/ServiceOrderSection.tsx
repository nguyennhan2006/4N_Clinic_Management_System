import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stethoscope, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { serviceOrderApi, serviceCatalogApi } from './api'
import type { ServiceOrderStatus } from './types'
import { useAuthStore } from '@/features/auth/store'
import { formatMoney } from '@/lib/money'

interface Props {
  visitId: string
  visitStatus: string
}

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  PENDING: 'Chờ',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}
const STATUS_COLORS: Record<ServiceOrderStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-400',
}

export function ServiceOrderSection({ visitId, visitStatus }: Props) {
  const { hasRole } = useAuthStore()
  const canOrder = hasRole(['ADMIN', 'DOCTOR']) && visitStatus !== 'COMPLETED'
  const canUpdateStatus = hasRole(['ADMIN', 'NURSE', 'DOCTOR']) && visitStatus !== 'COMPLETED'
  const qc = useQueryClient()

  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [isRequired, setIsRequired] = useState(false)
  const [notes, setNotes] = useState('')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['service-orders', visitId],
    queryFn: () => serviceOrderApi.listByVisit(visitId),
  })

  const { data: catalog } = useQuery({
    queryKey: ['service-catalog-active'],
    queryFn: () => serviceCatalogApi.list({ isActive: 'true' }),
    enabled: showAddForm,
  })

  const addMut = useMutation({
    mutationFn: () => {
      if (!selectedServiceId) throw new Error('Chọn dịch vụ')
      return serviceOrderApi.create({ visitId, serviceId: selectedServiceId, isRequired, notes: notes || undefined })
    },
    onSuccess: () => {
      toast.success('Thêm dịch vụ thành công')
      setShowAddForm(false)
      setSelectedServiceId('')
      setIsRequired(false)
      setNotes('')
      qc.invalidateQueries({ queryKey: ['service-orders', visitId] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => serviceOrderApi.cancel(id),
    onSuccess: () => {
      toast.success('Đã hủy dịch vụ')
      qc.invalidateQueries({ queryKey: ['service-orders', visitId] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="rounded-xl border border-clinic-border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-clinic-primary" />
          <h3 className="font-semibold text-clinic-text">Dịch vụ chỉ định</h3>
        </div>
        {canOrder && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 rounded-lg bg-clinic-sidebarMuted px-3 py-1 text-xs font-medium text-clinic-sidebar hover:bg-clinic-primary/20"
          >
            <Plus className="h-3 w-3" />
            Thêm dịch vụ
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
      ) : !orders?.length ? (
        <p className="text-sm text-clinic-muted">Chưa có dịch vụ nào được chỉ định</p>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-lg border border-clinic-border px-3 py-2"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-clinic-text">{order.service?.name}</p>
                  {order.isRequired && (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">Bắt buộc</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="text-xs text-clinic-muted">{formatMoney(Number(order.priceSnapshot))}</p>
                {order.notes && <p className="text-xs text-clinic-muted italic">{order.notes}</p>}
              </div>
              {canUpdateStatus && order.status === 'PENDING' && (
                <button
                  onClick={() => cancelMut.mutate(order.id)}
                  disabled={cancelMut.isPending}
                  className="ml-2 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="mt-4 space-y-3 border-t border-clinic-border pt-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-clinic-text">Dịch vụ *</label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-primary"
            >
              <option value="">-- Chọn dịch vụ --</option>
              {catalog?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatMoney(s.price)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-clinic-text">Ghi chú</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
            />
            Bắt buộc hoàn thành trước khi kết thúc phiếu khám
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 rounded-xl border border-clinic-border py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
            >
              Hủy
            </button>
            <button
              onClick={() => addMut.mutate()}
              disabled={addMut.isPending}
              className="flex-1 rounded-xl bg-clinic-primary py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover disabled:opacity-60"
            >
              {addMut.isPending ? 'Đang thêm...' : 'Thêm'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
