import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FlaskConical, RefreshCw } from 'lucide-react'
import { formatDateTime } from '@/lib/date'
import { toast } from 'sonner'
import { labApi } from './api'
import type { LabOrder, LabStatus, SubmitResultPayload } from './types'
import { useAuthStore } from '@/features/auth/store'

const STATUS_LABELS: Record<LabStatus, string> = {
  PENDING: 'Chờ lấy mẫu',
  SAMPLE_COLLECTED: 'Đã lấy mẫu',
  RESULT_ENTERED: 'Có kết quả',
  VERIFIED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
}
const STATUS_COLORS: Record<LabStatus, string> = {
  PENDING: 'bg-amber-500/15 text-amber-400',
  SAMPLE_COLLECTED: 'bg-blue-500/15 text-blue-400',
  RESULT_ENTERED: 'bg-purple-500/15 text-purple-400',
  VERIFIED: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-white/5 text-clinic-muted',
}

export function LabWorklist() {
  const { hasRole } = useAuthStore()
  const canCollect = hasRole(['ADMIN', 'NURSE', 'LAB_TECHNICIAN'])
  const canEnterResult = hasRole(['ADMIN', 'LAB_TECHNICIAN'])
  const canVerify = hasRole(['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN'])

  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<LabStatus | ''>('')
  const [resultModal, setResultModal] = useState<LabOrder | null>(null)
  const [resultData, setResultData] = useState('')
  const [resultNotes, setResultNotes] = useState('')

  const { data: orders, isLoading } = useQuery({
    queryKey: ['lab-orders', statusFilter],
    queryFn: () => labApi.list(statusFilter ? { status: statusFilter } : undefined),
    refetchInterval: 60_000,
  })

  const collectMut = useMutation({
    mutationFn: (id: string) => labApi.collectSample(id),
    onSuccess: () => {
      toast.success('Đã xác nhận lấy mẫu')
      qc.invalidateQueries({ queryKey: ['lab-orders'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const submitMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SubmitResultPayload }) =>
      labApi.submitResult(id, payload),
    onSuccess: () => {
      toast.success('Đã nhập kết quả xét nghiệm')
      setResultModal(null)
      setResultData('')
      setResultNotes('')
      qc.invalidateQueries({ queryKey: ['lab-orders'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const verifyMut = useMutation({
    mutationFn: (id: string) => labApi.verify(id),
    onSuccess: () => {
      toast.success('Đã xác nhận kết quả')
      qc.invalidateQueries({ queryKey: ['lab-orders'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleSubmitResult = () => {
    if (!resultModal) return
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(resultData || '{}')
    } catch {
      toast.error('Dữ liệu kết quả phải là JSON hợp lệ')
      return
    }
    submitMut.mutate({ id: resultModal.id, payload: { resultData: parsed, resultNotes: resultNotes || undefined } })
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15"><FlaskConical className="h-5 w-5 text-purple-400" /></div>
          <div>
            <h1 className="text-xl font-semibold text-clinic-text">Danh sách xét nghiệm</h1>
            <p className="text-xs text-clinic-muted">Tự động làm mới mỗi 60 giây</p>
          </div>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['lab-orders'] })}
          className="flex items-center gap-2 rounded-lg border border-clinic-border px-3 py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      <div className="mb-4 flex gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LabStatus | '')}
          className="rounded-xl border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text"
        >
          <option value="">Tất cả trạng thái</option>
          {(Object.keys(STATUS_LABELS) as LabStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-clinic-border bg-clinic-surface shadow-clinic">
        <table className="w-full text-sm">
          <thead className="border-b border-clinic-border bg-clinic-bg">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Bệnh nhân</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Dịch vụ</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Thời gian</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-clinic-muted">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-white/5" />
                  </td>
                </tr>
              ))
            ) : !orders?.length ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-clinic-muted">
                  Không có xét nghiệm nào
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-clinic-border last:border-0 hover:bg-clinic-primary/5">
                  <td className="px-4 py-3 font-medium text-clinic-text">
                    {order.visit?.patient?.fullName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-clinic-muted">
                    {order.serviceOrder?.service?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-clinic-muted">
                    {order.sampleCollectedAt && (
                      <div>Lấy mẫu: {formatDateTime(order.sampleCollectedAt)}</div>
                    )}
                    {order.resultEnteredAt && (
                      <div>Kết quả: {formatDateTime(order.resultEnteredAt)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      {order.status === 'PENDING' && canCollect && (
                        <button
                          onClick={() => collectMut.mutate(order.id)}
                          disabled={collectMut.isPending}
                          className="rounded-lg bg-blue-500/15 px-2 py-1 text-xs font-medium text-blue-400 hover:bg-blue-500/25 disabled:opacity-50"
                        >
                          Lấy mẫu
                        </button>
                      )}
                      {order.status === 'SAMPLE_COLLECTED' && canEnterResult && (
                        <button
                          onClick={() => { setResultModal(order); setResultData('{}'); setResultNotes('') }}
                          className="rounded-lg bg-purple-500/15 px-2 py-1 text-xs font-medium text-purple-400 hover:bg-purple-500/25"
                        >
                          Nhập KQ
                        </button>
                      )}
                      {order.status === 'RESULT_ENTERED' && canVerify && (
                        <button
                          onClick={() => verifyMut.mutate(order.id)}
                          disabled={verifyMut.isPending}
                          className="rounded-lg bg-green-500/15 px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-500/25 disabled:opacity-50"
                        >
                          Xác nhận
                        </button>
                      )}
                      {order.resultData && (
                        <button
                          onClick={() => { setResultModal(order); setResultData(JSON.stringify(order.resultData, null, 2)); setResultNotes(order.resultNotes ?? '') }}
                          className="rounded-lg bg-white/5 px-2 py-1 text-xs text-clinic-muted hover:bg-white/10"
                        >
                          Xem KQ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Result entry modal */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-clinic-surface border border-clinic-border p-6 shadow-clinic">
            <h2 className="mb-4 font-semibold text-clinic-text">
              {resultModal.status === 'RESULT_ENTERED' || resultModal.status === 'VERIFIED'
                ? 'Kết quả xét nghiệm'
                : 'Nhập kết quả xét nghiệm'}
            </h2>
            <p className="mb-3 text-sm text-clinic-muted">
              Bệnh nhân: <strong>{resultModal.visit?.patient?.fullName}</strong>
              {' · '}{resultModal.serviceOrder?.service?.name}
            </p>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-clinic-text">Dữ liệu kết quả (JSON)</label>
              <textarea
                rows={6}
                value={resultData}
                onChange={(e) => setResultData(e.target.value)}
                readOnly={resultModal.status !== 'SAMPLE_COLLECTED'}
                className="w-full rounded-lg border border-clinic-border bg-clinic-bg px-3 py-2 font-mono text-xs text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
                placeholder='{"glucose": 5.1, "hba1c": 6.2}'
              />
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-clinic-text">Ghi chú</label>
              <input
                type="text"
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
                readOnly={resultModal.status !== 'SAMPLE_COLLECTED'}
                className="w-full rounded-lg border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setResultModal(null)}
                className="flex-1 rounded-xl border border-clinic-border py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
              >
                Đóng
              </button>
              {resultModal.status === 'SAMPLE_COLLECTED' && canEnterResult && (
                <button
                  onClick={handleSubmitResult}
                  disabled={submitMut.isPending}
                  className="flex-1 rounded-xl bg-clinic-primary py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover disabled:opacity-60"
                >
                  {submitMut.isPending ? 'Đang lưu...' : 'Lưu kết quả'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
