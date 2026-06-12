import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Eye } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { useAuthStore } from '@/features/auth/store'
import { formatDate } from '@/lib/date'
import { usePatientsQuery } from './hooks'

export function PatientListPage() {
  const navigate = useNavigate()
  const hasRole = useAuthStore((s) => s.hasRole)
  const canCreate = hasRole(['ADMIN', 'RECEPTIONIST'])

  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')

  const { data: patients, isLoading, error, refetch } = usePatientsQuery(search || undefined)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(keyword)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bệnh nhân"
        description="Tra cứu và quản lý hồ sơ bệnh nhân"
        action={
          canCreate ? (
            <Link
              to="/app/patients/new"
              className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
            >
              <Plus className="h-4 w-4" />
              Tạo hồ sơ bệnh nhân
            </Link>
          ) : undefined
        }
      />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-clinic-muted" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên, số điện thoại, CCCD..."
            className="w-full rounded-xl border border-clinic-border bg-clinic-surface py-2.5 pl-10 pr-4 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-clinic-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
        >
          Tìm kiếm
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setKeyword(''); setSearch('') }}
            className="rounded-xl border border-clinic-border px-4 py-2.5 text-sm text-clinic-muted transition hover:bg-clinic-bg"
          >
            Xóa
          </button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-2xl bg-clinic-surface shadow-clinic">
        {isLoading ? (
          <div className="p-6"><LoadingState rows={6} /></div>
        ) : error ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : !patients?.length ? (
          <EmptyState
            title={search ? 'Không tìm thấy bệnh nhân' : 'Chưa có hồ sơ bệnh nhân'}
            description={
              search
                ? `Không có kết quả cho "${search}". Thử từ khóa khác hoặc tạo hồ sơ mới.`
                : 'Nhấn "Tạo hồ sơ bệnh nhân" để thêm bệnh nhân đầu tiên.'
            }
            action={
              canCreate ? (
                <Link
                  to="/app/patients/new"
                  className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primary-hover"
                >
                  <Plus className="h-4 w-4" />
                  Tạo hồ sơ bệnh nhân
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-clinic-border bg-clinic-bg">
                <tr>
                  {['Mã BN', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Điện thoại', 'Địa chỉ', ''].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-clinic-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-clinic-border">
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer transition hover:bg-clinic-bg/60"
                    onClick={() => navigate(`/app/patients/${p.id}`)}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-clinic-muted">
                      {p.patientCode}
                    </td>
                    <td className="px-5 py-3 font-medium text-clinic-text">{p.fullName}</td>
                    <td className="px-5 py-3 text-clinic-muted">{formatDate(p.dob) || '—'}</td>
                    <td className="px-5 py-3 text-clinic-muted">{p.gender || '—'}</td>
                    <td className="px-5 py-3 text-clinic-muted">{p.phone || '—'}</td>
                    <td className="px-5 py-3 text-clinic-muted">
                      <span className="max-w-48 truncate block">{p.address || '—'}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/app/patients/${p.id}`) }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-clinic-primary transition hover:bg-clinic-sidebar-muted"
                        aria-label={`Xem chi tiết ${p.fullName}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-clinic-border px-5 py-3 text-xs text-clinic-muted">
              {patients.length} bệnh nhân{search ? ` cho "${search}"` : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
