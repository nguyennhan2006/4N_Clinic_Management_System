import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ListOrdered, RefreshCw, PhoneCall, CheckCircle, SkipForward, XCircle } from 'lucide-react'
import { formatTime, today as getTodayStr } from '@/lib/date'
import { toast } from 'sonner'
import { queueApi } from './api'
import type { QueueStatus, QueueTicket } from './types'
import { useAuthStore } from '@/features/auth/store'
import { apiClient } from '@/lib/api-client'

const STATUS_LABELS: Record<QueueStatus, string> = {
  WAITING: 'Chờ',
  CALLED: 'Đã gọi',
  IN_SERVICE: 'Đang khám',
  DONE: 'Hoàn thành',
  SKIPPED: 'Bỏ qua',
  CANCELLED: 'Đã hủy',
}
const STATUS_COLORS: Record<QueueStatus, string> = {
  WAITING: 'bg-clinic-warning/20 text-yellow-700',
  CALLED: 'bg-clinic-secondary/20 text-teal-700',
  IN_SERVICE: 'bg-clinic-primary/20 text-indigo-700',
  DONE: 'bg-clinic-success/20 text-green-700',
  SKIPPED: 'bg-gray-100 text-gray-400',
  CANCELLED: 'bg-clinic-danger/10 text-red-500',
}

interface Department {
  id: string
  name: string
}

export function QueueDashboardPage() {
  const { hasRole } = useAuthStore()
  const isNurse = hasRole(['NURSE', 'ADMIN'])
  const isDoctor = hasRole(['DOCTOR', 'ADMIN'])

  const [date, setDate] = useState(getTodayStr())
  const [departmentId, setDepartmentId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<QueueStatus | ''>('WAITING')

  const qc = useQueryClient()

  const { data: departments } = useQuery({
    queryKey: ['departments-queue'],
    queryFn: () => apiClient.get<Department[]>('/organization/departments'),
  })

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['queue', { date, departmentId, status: statusFilter }],
    queryFn: () =>
      queueApi.list({
        date,
        ...(departmentId ? { departmentId } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
    refetchInterval: 30_000, // auto-refresh every 30s
  })

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QueueStatus }) =>
      queueApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công')
      qc.invalidateQueries({ queryKey: ['queue'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const getActions = (ticket: QueueTicket) => {
    const acts: { label: string; icon: React.ReactNode; newStatus: QueueStatus; color: string; visible: boolean }[] = [
      {
        label: 'Gọi',
        icon: <PhoneCall className="h-3 w-3" />,
        newStatus: 'CALLED',
        color: 'bg-clinic-secondary/20 text-teal-700 hover:bg-clinic-secondary/40',
        visible: ticket.status === 'WAITING' && isNurse,
      },
      {
        label: 'Bỏ qua',
        icon: <SkipForward className="h-3 w-3" />,
        newStatus: 'SKIPPED',
        color: 'bg-gray-100 text-gray-500 hover:bg-gray-200',
        visible: ticket.status === 'WAITING' && isNurse,
      },
      {
        label: 'Bắt đầu khám',
        icon: <PhoneCall className="h-3 w-3" />,
        newStatus: 'IN_SERVICE',
        color: 'bg-clinic-primary/20 text-indigo-700 hover:bg-clinic-primary/30',
        visible: ticket.status === 'CALLED' && isDoctor,
      },
      {
        label: 'Hoàn thành',
        icon: <CheckCircle className="h-3 w-3" />,
        newStatus: 'DONE',
        color: 'bg-clinic-success/20 text-green-700 hover:bg-clinic-success/40',
        visible: ticket.status === 'IN_SERVICE' && isDoctor,
      },
      {
        label: 'Hủy',
        icon: <XCircle className="h-3 w-3" />,
        newStatus: 'CANCELLED',
        color: 'bg-clinic-danger/10 text-red-600 hover:bg-clinic-danger/20',
        visible: ['WAITING', 'CALLED'].includes(ticket.status) && (isNurse || isDoctor),
      },
    ]
    return acts.filter((a) => a.visible)
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListOrdered className="h-6 w-6 text-clinic-sidebar" />
          <div>
            <h1 className="text-xl font-semibold text-clinic-text">Hàng đợi khám bệnh</h1>
            <p className="text-xs text-clinic-muted">Tự động làm mới mỗi 30 giây</p>
          </div>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['queue'] })}
          className="flex items-center gap-2 rounded-lg border border-clinic-border px-3 py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-clinic-border px-3 py-2 text-sm"
        />
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="rounded-lg border border-clinic-border px-3 py-2 text-sm"
        >
          <option value="">Tất cả khoa</option>
          {departments?.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as QueueStatus | '')}
          className="rounded-lg border border-clinic-border px-3 py-2 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          {(['WAITING', 'CALLED', 'IN_SERVICE', 'DONE', 'SKIPPED', 'CANCELLED'] as QueueStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Summary badges */}
      {tickets && (
        <div className="mb-4 flex gap-3 flex-wrap">
          {(['WAITING', 'CALLED', 'IN_SERVICE', 'DONE'] as QueueStatus[]).map((s) => {
            const count = tickets.filter((t) => t.status === s).length
            return (
              <div key={s} className={`rounded-xl px-4 py-2 text-sm font-medium ${STATUS_COLORS[s]}`}>
                {STATUS_LABELS[s]}: {count}
              </div>
            )
          })}
        </div>
      )}

      {/* Ticket list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : !tickets?.length ? (
          <div className="rounded-xl border border-dashed border-clinic-border py-16 text-center">
            <ListOrdered className="mx-auto mb-3 h-10 w-10 text-clinic-border" />
            <p className="text-sm text-clinic-muted">Không có bệnh nhân trong hàng đợi</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center gap-4 rounded-xl border border-clinic-border bg-white px-4 py-3 shadow-sm"
            >
              {/* Queue number */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clinic-sidebarMuted text-lg font-bold text-clinic-sidebar">
                {ticket.queueNumber}
              </div>

              {/* Patient info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-clinic-text">
                  {ticket.visit?.patient?.fullName ?? '—'}
                </p>
                <p className="text-xs text-clinic-muted">
                  {ticket.department?.name ?? ''}
                  {ticket.calledAt && ` · Gọi lúc ${formatTime(ticket.calledAt)}`}
                </p>
              </div>

              {/* Status */}
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                {STATUS_LABELS[ticket.status]}
              </span>

              {/* Actions */}
              <div className="flex shrink-0 gap-1">
                {getActions(ticket).map((act) => (
                  <button
                    key={act.newStatus}
                    onClick={() => updateMut.mutate({ id: ticket.id, status: act.newStatus })}
                    disabled={updateMut.isPending}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${act.color} disabled:opacity-50`}
                  >
                    {act.icon}
                    {act.label}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
