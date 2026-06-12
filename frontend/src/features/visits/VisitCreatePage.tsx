import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { isApiError } from '@/lib/errors'
import { patientApi } from '@/features/patients/api'
import type { Patient } from '@/features/patients/types'
import { useCreateVisitMutation } from './hooks'

const schema = z.object({
  patientId: z.string().min(1, 'Vui lòng chọn bệnh nhân'),
  visitDate: z.string().optional(),
  reason: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const inputCls = 'w-full rounded-xl border border-clinic-border bg-clinic-bg px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20'

function todayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function VisitCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefilledPatientId = searchParams.get('patientId') ?? ''

  const mutation = useCreateVisitMutation()

  const [patientKeyword, setPatientKeyword] = useState('')
  const [patientResults, setPatientResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [searching, setSearching] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: prefilledPatientId,
      visitDate: todayString(),
    },
  })

  // Auto-load prefilled patient from URL
  useEffect(() => {
    if (!prefilledPatientId) return
    void patientApi.getById(prefilledPatientId).then((p) => {
      setSelectedPatient(p)
    }).catch(() => undefined)
  }, [prefilledPatientId])

  const handlePatientSearch = async () => {
    if (!patientKeyword.trim()) return
    setSearching(true)
    try {
      const results = await patientApi.list(patientKeyword)
      setPatientResults(results)
    } catch {
      setPatientResults([])
    } finally {
      setSearching(false)
    }
  }

  const handlePatientSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void handlePatientSearch()
    }
  }

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p)
    setValue('patientId', p.id, { shouldValidate: true })
    setPatientResults([])
    setPatientKeyword('')
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const visit = await mutation.mutateAsync({
        patientId: values.patientId,
        visitDate: values.visitDate || undefined,
        reason: values.reason || undefined,
      })
      navigate(`/app/visits?date=${visit.visitDate ?? todayString()}`)
    } catch (err) {
      const message = isApiError(err)
        ? err.status === 409
          ? err.message.includes('limit')
            ? 'Đã đạt giới hạn bệnh nhân trong ngày. Vui lòng chọn ngày khác.'
            : 'Bệnh nhân này đã có lượt khám vào ngày được chọn.'
          : err.message
        : 'Tạo lượt khám thất bại. Vui lòng thử lại.'
      setError('root', { message })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tạo lượt khám" description="Tiếp nhận bệnh nhân vào hàng chờ" />

      <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
        {errors.root?.message && (
          <div role="alert" className="mb-5 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-clinic-danger">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* Hidden patientId field */}
          <input type="hidden" {...register('patientId')} />

          {/* Patient selection */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-clinic-text">
              Bệnh nhân <span className="text-clinic-danger">*</span>
            </label>

            {selectedPatient ? (
              <div className="flex items-center justify-between rounded-xl border border-clinic-primary bg-clinic-primary/5 px-4 py-3">
                <div>
                  <div className="font-medium text-clinic-text">{selectedPatient.fullName}</div>
                  <div className="text-xs text-clinic-muted">
                    {selectedPatient.patientCode}
                    {selectedPatient.phone ? ` · ${selectedPatient.phone}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null)
                    setValue('patientId', '', { shouldValidate: false })
                  }}
                  className="text-xs text-clinic-muted transition hover:text-clinic-text"
                >
                  Thay đổi
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-clinic-muted" />
                    <input
                      type="text"
                      value={patientKeyword}
                      onChange={(e) => setPatientKeyword(e.target.value)}
                      onKeyDown={handlePatientSearchKeyDown}
                      placeholder="Tìm theo tên, số điện thoại, CCCD..."
                      className="w-full rounded-xl border border-clinic-border bg-clinic-bg py-2.5 pl-10 pr-4 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handlePatientSearch()}
                    disabled={searching}
                    className="rounded-xl bg-clinic-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
                  >
                    {searching ? 'Đang tìm...' : 'Tìm'}
                  </button>
                </div>

                {patientResults.length > 0 && (
                  <div className="rounded-xl border border-clinic-border bg-clinic-surface shadow-clinic">
                    {patientResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPatient(p)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-clinic-bg border-b border-clinic-border last:border-0"
                      >
                        <div>
                          <div className="text-sm font-medium text-clinic-text">{p.fullName}</div>
                          <div className="text-xs text-clinic-muted">{p.patientCode}{p.phone ? ` · ${p.phone}` : ''}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {patientResults.length === 0 && patientKeyword && !searching && (
                  <p className="text-xs text-clinic-muted">Không tìm thấy bệnh nhân. <a href="/app/patients/new" className="text-clinic-primary underline">Tạo hồ sơ mới</a></p>
                )}
              </div>
            )}
            {errors.patientId && (
              <p className="mt-1 text-xs text-clinic-danger">{errors.patientId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="visitDate" className="mb-1.5 block text-sm font-medium text-clinic-text">
                Ngày khám
              </label>
              <input
                id="visitDate"
                type="date"
                {...register('visitDate')}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-clinic-text">
              Lý do khám
            </label>
            <textarea
              id="reason"
              {...register('reason')}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Mô tả triệu chứng hoặc lý do đến khám..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-clinic-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo lượt khám'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/visits')}
              className="rounded-xl border border-clinic-border px-6 py-2.5 text-sm text-clinic-muted transition hover:bg-clinic-bg"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
