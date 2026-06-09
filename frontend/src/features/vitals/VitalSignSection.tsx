import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import { toast } from 'sonner'
import { vitalsApi } from './api'
import { useAuthStore } from '@/features/auth/store'

interface Props {
  visitId: string
  visitStatus: string
}

export function VitalSignSection({ visitId, visitStatus }: Props) {
  const { hasRole } = useAuthStore()
  const canEdit = hasRole(['ADMIN', 'NURSE', 'DOCTOR']) && visitStatus !== 'COMPLETED'
  const qc = useQueryClient()

  const { data: vitals, isLoading } = useQuery({
    queryKey: ['vitals', visitId],
    queryFn: () => vitalsApi.getByVisit(visitId),
  })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    pulse: '',
    systolicBp: '',
    diastolicBp: '',
    temperature: '',
    spo2: '',
    heightCm: '',
    weightKg: '',
    note: '',
  })

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = { visitId }
      if (form.pulse) payload.pulse = Number(form.pulse)
      if (form.systolicBp) payload.systolicBp = Number(form.systolicBp)
      if (form.diastolicBp) payload.diastolicBp = Number(form.diastolicBp)
      if (form.temperature) payload.temperature = Number(form.temperature)
      if (form.spo2) payload.spo2 = Number(form.spo2)
      if (form.heightCm) payload.heightCm = Number(form.heightCm)
      if (form.weightKg) payload.weightKg = Number(form.weightKg)
      if (form.note) payload.note = form.note

      if (Object.keys(payload).length <= 1) {
        throw new Error('Cần nhập ít nhất một chỉ số')
      }
      return vitalsApi.create(payload as never)
    },
    onSuccess: () => {
      toast.success('Lưu chỉ số sinh tồn thành công')
      setShowForm(false)
      qc.invalidateQueries({ queryKey: ['vitals', visitId] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const fields = [
    { key: 'pulse', label: 'Mạch', unit: 'bpm', min: 0, max: 300 },
    { key: 'systolicBp', label: 'HA tâm thu', unit: 'mmHg', min: 0, max: 300 },
    { key: 'diastolicBp', label: 'HA tâm trương', unit: 'mmHg', min: 0, max: 200 },
    { key: 'temperature', label: 'Nhiệt độ', unit: '°C', min: 30, max: 45 },
    { key: 'spo2', label: 'SpO₂', unit: '%', min: 0, max: 100 },
    { key: 'heightCm', label: 'Chiều cao', unit: 'cm', min: 0, max: 300 },
    { key: 'weightKg', label: 'Cân nặng', unit: 'kg', min: 0, max: 500 },
  ] as const

  return (
    <div className="rounded-xl border border-clinic-border bg-clinic-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-clinic-primary" />
          <h3 className="font-semibold text-clinic-text">Chỉ số sinh tồn</h3>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-clinic-primary/15 px-3 py-1 text-xs font-medium text-clinic-primary hover:bg-clinic-primary/25"
          >
            {showForm ? 'Hủy' : vitals ? 'Cập nhật' : 'Ghi chỉ số'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="h-10 animate-pulse rounded-lg bg-white/5" />
      ) : vitals ? (
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {vitals.pulse && (
            <div className="rounded-lg bg-clinic-bg p-2">
              <p className="text-xs text-clinic-muted">Mạch</p>
              <p className="font-semibold text-clinic-text">{vitals.pulse} <span className="text-xs font-normal text-clinic-muted">bpm</span></p>
            </div>
          )}
          {vitals.systolicBp && vitals.diastolicBp && (
            <div className="rounded-lg bg-clinic-bg p-2">
              <p className="text-xs text-clinic-muted">Huyết áp</p>
              <p className="font-semibold text-clinic-text">{vitals.systolicBp}/{vitals.diastolicBp} <span className="text-xs font-normal text-clinic-muted">mmHg</span></p>
            </div>
          )}
          {vitals.temperature && (
            <div className="rounded-lg bg-clinic-bg p-2">
              <p className="text-xs text-clinic-muted">Nhiệt độ</p>
              <p className="font-semibold text-clinic-text">{Number(vitals.temperature).toFixed(1)} <span className="text-xs font-normal text-clinic-muted">°C</span></p>
            </div>
          )}
          {vitals.spo2 && (
            <div className="rounded-lg bg-clinic-bg p-2">
              <p className="text-xs text-clinic-muted">SpO₂</p>
              <p className="font-semibold text-clinic-text">{vitals.spo2} <span className="text-xs font-normal text-clinic-muted">%</span></p>
            </div>
          )}
          {vitals.heightCm && (
            <div className="rounded-lg bg-clinic-bg p-2">
              <p className="text-xs text-clinic-muted">Chiều cao</p>
              <p className="font-semibold text-clinic-text">{Number(vitals.heightCm)} <span className="text-xs font-normal text-clinic-muted">cm</span></p>
            </div>
          )}
          {vitals.weightKg && (
            <div className="rounded-lg bg-clinic-bg p-2">
              <p className="text-xs text-clinic-muted">Cân nặng</p>
              <p className="font-semibold text-clinic-text">{Number(vitals.weightKg)} <span className="text-xs font-normal text-clinic-muted">kg</span></p>
            </div>
          )}
          {vitals.bmi && (
            <div className="rounded-lg bg-clinic-bg p-2">
              <p className="text-xs text-clinic-muted">BMI</p>
              <p className="font-semibold text-clinic-text">{Number(vitals.bmi).toFixed(1)}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-clinic-muted">Chưa ghi chỉ số sinh tồn</p>
      )}

      {showForm && (
        <div className="mt-4 border-t border-clinic-border pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fields.map(({ key, label, unit, min, max }) => (
              <div key={key}>
                <label className="mb-1 block text-xs text-clinic-muted">{label} ({unit})</label>
                <input
                  type="number"
                  min={min}
                  max={max}
                  step="0.1"
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={`${min}–${max}`}
                  className="w-full rounded-lg border border-clinic-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-primary"
                />
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs text-clinic-muted">Ghi chú</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full rounded-lg border border-clinic-border px-2 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="mt-3 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover disabled:opacity-60"
          >
            {saveMut.isPending ? 'Đang lưu...' : 'Lưu chỉ số'}
          </button>
        </div>
      )}
    </div>
  )
}
