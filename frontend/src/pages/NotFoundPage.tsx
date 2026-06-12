import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-clinic-bg text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-clinic-sidebar-muted">
        <FileQuestion className="h-10 w-10 text-clinic-primary" />
      </div>
      <h1 className="mb-2 text-4xl font-bold text-clinic-text">404</h1>
      <p className="mb-1 text-lg font-medium text-clinic-text">Không tìm thấy trang</p>
      <p className="mb-8 max-w-sm text-sm text-clinic-muted">
        Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.
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
