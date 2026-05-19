import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from './store'
import { authApi } from './api'
import { isApiError } from '@/lib/errors'

const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function InputField({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  registration,
  error,
  describedById,
}: {
  id: string
  label: string
  type: string
  autoComplete: string
  placeholder: string
  registration: ReturnType<ReturnType<typeof useForm<LoginFormValues>>['register']>
  error?: string
  describedById: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-clinic-text">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-describedby={error ? describedById : undefined}
        aria-invalid={!!error}
        {...registration}
        className={`w-full rounded-xl border bg-clinic-bg px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:ring-2 ${
          error
            ? 'border-clinic-danger focus:border-clinic-danger focus:ring-clinic-danger/20'
            : 'border-clinic-border focus:border-clinic-primary focus:ring-clinic-primary/20'
        }`}
      />
      {error && (
        <p id={describedById} role="alert" className="mt-1 text-xs text-clinic-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const data = await authApi.login(values)
      setAuth(data.accessToken, data.refreshToken, data.user)
      navigate('/app/dashboard', { replace: true })
    } catch (err) {
      const message = isApiError(err)
        ? err.status === 401
          ? 'Email hoặc mật khẩu không đúng.'
          : err.message
        : 'Đăng nhập thất bại. Vui lòng thử lại.'
      setError('root', { message })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-clinic-bg px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-clinic-sidebar shadow-[0_4px_16px_rgba(109,91,208,0.30)]">
            <span className="text-xl font-bold text-white">4N</span>
          </div>
          <h1 className="text-2xl font-bold text-clinic-text">4N Clinic</h1>
          <p className="mt-1 text-sm text-clinic-muted">Hệ thống quản lý phòng mạch tư nhân</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-clinic-surface p-8 shadow-clinic">
          <h2 className="mb-6 text-lg font-semibold text-clinic-text">Đăng nhập</h2>

          {/* Root / server error */}
          {errors.root?.message && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-xl bg-[#FEE2E2] px-4 py-3 text-sm text-clinic-danger"
            >
              <svg
                className="mt-0.5 h-4 w-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{errors.root.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <InputField
              id="username"
              label="Tên đăng nhập"
              type="text"
              autoComplete="username"
              placeholder="admin"
              registration={register('username')}
              error={errors.username?.message}
              describedById="username-error"
            />

            <InputField
              id="password"
              label="Mật khẩu"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              registration={register('password')}
              error={errors.password?.message}
              describedById="password-error"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-clinic-primary py-2.5 text-sm font-semibold text-white transition hover:bg-clinic-primary-hover focus:outline-none focus:ring-2 focus:ring-clinic-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-clinic-muted">
          4N Clinic Management System — Phase 1
        </p>
      </div>
    </div>
  )
}
