import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, Plus, XCircle, LogIn } from 'lucide-react'
import { formatTime, today as getTodayStr } from '@/lib/date'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { appointmentApi } from './api'
import type { AppointmentStatus, QueryAppointmentParams } from './types'
import { useAuthStore } from '@/features/auth/store'

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Chờ khám',
  CHECKED_IN: 'Đã vào khám',
  CANCELLED: 'Đã hủy',
  NO_SHOW: 'Vắng',
}
const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-amber-500/15 text-amber-400',
  CHECKED_IN: 'bg-green-500/15 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
  NO_SHOW: 'bg-white/5 text-clinic-muted',
}

export function AppointmentListPage() {
  const { hasRole } = useAuthStore()
  const canCreate = hasRole(['ADMIN', 'RECEPTIONIST'])
  const canCheckin = hasRole(['ADMIN', 'RECEPTIONIST', 'NURSE'])
  const canCancel = hasRole(['ADMIN', 'RECEPTIONIST'])

  const [date, setDate] = useState(getTodayStr())
  const [status, setStatus] = useState<AppointmentStatus | ''>('')

  const params: QueryAppointmentParams = { date, ...(status ? { status } : {}) }
  const qc = useQueryClient()

  const { data: appointments, isLoading, isError } = useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentApi.list(params),
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => appointmentApi.cancel(id),
    onSuccess: () => {
      toast.success('Đã hủy lịch hẹn')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const checkinMut = useMutation({
    mutationFn: (id: string) => appointmentApi.checkin(id),
    onSuccess: (data) => {
      toast.success(`Check-in thành công — STT khám #${data.ticket.queueNumber}`)
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['queue'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinic-primary/15">
            <CalendarCheck className="h-5 w-5 text-clinic-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-clinic-text">Lịch hẹn</h1>
            <p className="text-xs text-clinic-muted">Quản lý lịch hẹn bệnh nhân</p>
          </div>
        </div>
        {canCreate && (
          <Link
            to="/app/appointments/new"
            className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover"
          >
            <Plus className="h-4 w-4" />
            Đặt lịch mới
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AppointmentStatus | '')}
          className="rounded-lg border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="SCHEDULED">Chờ khám</option>
          <option value="CHECKED_IN">Đã vào khám</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="NO_SHOW">Vắng</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-clinic-border bg-clinic-surface shadow-clinic">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white/5" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-clinic-danger">Không thể tải dữ liệu lịch hẹn.</div>
        ) : !appointments?.length ? (
          <div className="py-16 text-center">
            <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-clinic-border" />
            <p className="text-sm text-clinic-muted">Không có lịch hẹn nào cho ngày này</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-clinic-border bg-clinic-bg">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Giờ hẹn</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Bệnh nhân</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Bác sĩ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Khoa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Lý do</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-border">
              {appointments.map((apt) => (
                <tr key={apt.id} className="transition-colors hover:bg-clinic-primary/5">
                  <td className="px-4 py-3 font-medium text-clinic-text">
                    {formatTime(apt.scheduledAt)}
                    <span className="ml-1 text-xs text-clinic-muted">({apt.durationMinutes}p)</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-clinic-text">{apt.patient?.fullName ?? '—'}</p>
                    <p className="text-xs text-clinic-muted">{apt.patient?.phone ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 text-clinic-text">
                    {apt.doctorProfile?.title ? `${apt.doctorProfile.title} ` : ''}
                    {apt.doctorProfile?.user?.fullName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-clinic-muted">
                    {apt.doctorProfile?.department?.name ?? '—'}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-clinic-muted">
                    {apt.reason ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[apt.status]}`}>
                      {STATUS_LABELS[apt.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {apt.status === 'SCHEDULED' && canCheckin && (
                        <button
                          onClick={() => checkinMut.mutate(apt.id)}
                          disabled={checkinMut.isPending}
                          className="flex items-center gap-1 rounded-lg bg-green-500/15 px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-500/25"
                        >
                          <LogIn className="h-3 w-3" />
                          Check-in
                        </button>
                      )}
                      {apt.status === 'SCHEDULED' && canCancel && (
                        <button
                          onClick={() => {
                            if (confirm('Xác nhận hủy lịch hẹn?')) cancelMut.mutate(apt.id)
                          }}
                          disabled={cancelMut.isPending}
                          className="flex items-center gap-1 rounded-lg bg-red-500/15 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/25"
                        >
                          <XCircle className="h-3 w-3" />
                          Hủy
                        </button>
                      )}
                      {apt.status === 'CHECKED_IN' && apt.visit && (
                        <Link
                          to={`/app/examinations/${apt.visit.id}`}
                          className="rounded-lg bg-clinic-primary/15 px-2 py-1 text-xs font-medium text-clinic-primary hover:bg-clinic-primary/25"
                        >
                          Xem khám
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
