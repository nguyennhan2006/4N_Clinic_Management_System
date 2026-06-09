import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'
import { appointmentApi } from './api'
import { apiClient } from '@/lib/api-client'
import type { Patient } from '@/features/patients/types'

interface DoctorProfile {
  id: string
  title: string | null
  specialty: string | null
  departmentId: string
  user?: { fullName: string }
  department?: { id: string; name: string }
}

export function AppointmentCreatePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [patientId, setPatientId] = useState('')
  const [doctorProfileId, setDoctorProfileId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: patients } = useQuery({
    queryKey: ['patients-for-apt'],
    queryFn: () => apiClient.get<Patient[]>('/patients', { limit: '200' }),
  })

  const { data: doctors } = useQuery({
    queryKey: ['doctors-for-apt'],
    queryFn: () => apiClient.get<DoctorProfile[]>('/organization/doctors'),
  })

  const createMut = useMutation({
    mutationFn: () =>
      appointmentApi.create({
        patientId,
        doctorProfileId,
        departmentId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      toast.success('Đặt lịch hẹn thành công')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      navigate('/app/appointments')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleDoctorChange = (id: string) => {
    setDoctorProfileId(id)
    const doc = doctors?.find((d) => d.id === id)
    if (doc) setDepartmentId(doc.departmentId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!patientId) errs.patientId = 'Chọn bệnh nhân'
    if (!doctorProfileId) errs.doctorProfileId = 'Chọn bác sĩ'
    if (!scheduledAt) errs.scheduledAt = 'Chọn thời gian'
    if (scheduledAt && new Date(scheduledAt) <= new Date()) errs.scheduledAt = 'Thời gian hẹn phải trong tương lai'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    createMut.mutate()
  }

  const minDateTime = new Date()
  minDateTime.setMinutes(minDateTime.getMinutes() + 5)

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <CalendarCheck className="h-6 w-6 text-clinic-primary" />
        <h1 className="text-xl font-semibold text-clinic-text">Đặt lịch hẹn mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-clinic-border bg-white p-6 shadow-clinic">
        {/* Patient */}
        <div>
          <label className="mb-1 block text-sm font-medium text-clinic-text">Bệnh nhân *</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-primary"
          >
            <option value="">-- Chọn bệnh nhân --</option>
            {patients?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} {p.phone ? `(${p.phone})` : ''}
              </option>
            ))}
          </select>
          {errors.patientId && <p className="mt-1 text-xs text-red-500">{errors.patientId}</p>}
        </div>

        {/* Doctor */}
        <div>
          <label className="mb-1 block text-sm font-medium text-clinic-text">Bác sĩ *</label>
          <select
            value={doctorProfileId}
            onChange={(e) => handleDoctorChange(e.target.value)}
            className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-primary"
          >
            <option value="">-- Chọn bác sĩ --</option>
            {doctors?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title ? `${d.title} ` : ''}{d.user?.fullName} — {d.department?.name}
              </option>
            ))}
          </select>
          {errors.doctorProfileId && <p className="mt-1 text-xs text-red-500">{errors.doctorProfileId}</p>}
        </div>

        {/* Scheduled time */}
        <div>
          <label className="mb-1 block text-sm font-medium text-clinic-text">Thời gian hẹn *</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={minDateTime.toISOString().slice(0, 16)}
            className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-primary"
          />
          {errors.scheduledAt && <p className="mt-1 text-xs text-red-500">{errors.scheduledAt}</p>}
        </div>

        {/* Duration */}
        <div>
          <label className="mb-1 block text-sm font-medium text-clinic-text">Thời lượng (phút)</label>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-primary"
          >
            {[15, 30, 45, 60].map((m) => (
              <option key={m} value={m}>{m} phút</option>
            ))}
          </select>
        </div>

        {/* Reason */}
        <div>
          <label className="mb-1 block text-sm font-medium text-clinic-text">Lý do khám</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Mô tả lý do khám..."
            className="w-full rounded-lg border border-clinic-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-primary"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/app/appointments')}
            className="flex-1 rounded-xl border border-clinic-border py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={createMut.isPending}
            className="flex-1 rounded-xl bg-clinic-primary py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover disabled:opacity-60"
          >
            {createMut.isPending ? 'Đang đặt...' : 'Đặt lịch'}
          </button>
        </div>
      </form>
    </div>
  )
}
