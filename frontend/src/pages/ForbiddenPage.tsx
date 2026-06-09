import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-clinic-bg text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
        <ShieldOff className="h-10 w-10 text-clinic-danger" />
      </div>
      <h1 className="mb-2 text-4xl font-bold text-clinic-text">403</h1>
      <p className="mb-1 text-lg font-medium text-clinic-text">Không có quyền truy cập</p>
      <p className="mb-8 max-w-sm text-sm text-clinic-muted">
        Bạn không có quyền xem trang này. Vui lòng liên hệ quản trị viên nếu cần hỗ trợ.
      </p>
      <Link
        to="/app/dashboard"
        className="rounded-xl bg-clinic-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
      >
        Về trang chủ
      </Link>
    </div>
  )
}
