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
  SCHEDULED: 'bg-clinic-warning/20 text-yellow-700',
  CHECKED_IN: 'bg-clinic-success/20 text-green-700',
  CANCELLED: 'bg-clinic-danger/20 text-red-600',
  NO_SHOW: 'bg-gray-100 text-gray-500',
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
          <CalendarCheck className="h-6 w-6 text-clinic-sidebar" />
          <h1 className="text-xl font-semibold text-clinic-text">Lịch hẹn</h1>
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
          className="rounded-lg border border-clinic-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-primary"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AppointmentStatus | '')}
          className="rounded-lg border border-clinic-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-primary"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="SCHEDULED">Chờ khám</option>
          <option value="CHECKED_IN">Đã vào khám</option>
          <option value="CANCELLED">Đã hủy</option>
          <option value="NO_SHOW">Vắng</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-clinic-border bg-white shadow-clinic">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
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
            <thead className="border-b border-clinic-border bg-clinic-sidebarMuted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-clinic-muted">Giờ hẹn</th>
                <th className="px-4 py-3 text-left font-medium text-clinic-muted">Bệnh nhân</th>
                <th className="px-4 py-3 text-left font-medium text-clinic-muted">Bác sĩ</th>
                <th className="px-4 py-3 text-left font-medium text-clinic-muted">Khoa</th>
                <th className="px-4 py-3 text-left font-medium text-clinic-muted">Lý do</th>
                <th className="px-4 py-3 text-left font-medium text-clinic-muted">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium text-clinic-muted">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-border">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-clinic-bg/50">
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
                          className="flex items-center gap-1 rounded-lg bg-clinic-success/20 px-2 py-1 text-xs font-medium text-green-700 hover:bg-clinic-success/40"
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
                          className="flex items-center gap-1 rounded-lg bg-clinic-danger/10 px-2 py-1 text-xs font-medium text-red-600 hover:bg-clinic-danger/20"
                        >
                          <XCircle className="h-3 w-3" />
                          Hủy
                        </button>
                      )}
                      {apt.status === 'CHECKED_IN' && apt.visit && (
                        <Link
                          to={`/app/examinations/${apt.visit.id}`}
                          className="rounded-lg bg-clinic-sidebarMuted px-2 py-1 text-xs font-medium text-clinic-sidebar hover:bg-clinic-primary/20"
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
