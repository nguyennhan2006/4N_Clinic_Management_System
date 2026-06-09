import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/components/common/PageHeader'
import { isApiError } from '@/lib/errors'
import { useCreatePatientMutation } from './hooks'

const schema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  dob: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  citizenId: z.string().optional(),
  address: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function Field({
  label, id, error, children,
}: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-clinic-text">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-clinic-danger">{error}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-xl border border-clinic-border bg-clinic-bg px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20'

export function PatientCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreatePatientMutation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      const patient = await mutation.mutateAsync({
        fullName: values.fullName,
        dob: values.dob || undefined,
        gender: values.gender || undefined,
        phone: values.phone || undefined,
        citizenId: values.citizenId || undefined,
        address: values.address || undefined,
      })
      navigate(`/app/patients/${patient.id}`)
    } catch (err) {
      const message = isApiError(err)
        ? err.status === 409
          ? 'CCCD đã tồn tại trong hệ thống.'
          : err.message
        : 'Tạo hồ sơ thất bại. Vui lòng thử lại.'
      setError('root', { message })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tạo hồ sơ bệnh nhân" description="Điền đầy đủ thông tin để tạo hồ sơ mới" />

      <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
        {errors.root?.message && (
          <div role="alert" className="mb-5 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-clinic-danger">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Họ và tên *" id="fullName" error={errors.fullName?.message}>
              <input id="fullName" {...register('fullName')} className={inputCls} placeholder="Nguyễn Văn A" />
            </Field>
            <Field label="Ngày sinh" id="dob" error={errors.dob?.message}>
              <input id="dob" type="date" {...register('dob')} className={inputCls} />
            </Field>
            <Field label="Giới tính" id="gender" error={errors.gender?.message}>
              <select id="gender" {...register('gender')} className={inputCls}>
                <option value="">-- Chọn --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </Field>
            <Field label="Số điện thoại" id="phone" error={errors.phone?.message}>
              <input id="phone" {...register('phone')} className={inputCls} placeholder="0901234567" />
            </Field>
            <Field label="Số CCCD/CMND" id="citizenId" error={errors.citizenId?.message}>
              <input id="citizenId" {...register('citizenId')} className={inputCls} placeholder="012345678901" />
            </Field>
          </div>

          <Field label="Địa chỉ" id="address" error={errors.address?.message}>
            <textarea
              id="address"
              {...register('address')}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-clinic-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
            >
              {isSubmitting ? 'Đang lưu...' : 'Tạo hồ sơ'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/patients')}
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
