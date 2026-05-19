import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAuthStore } from '@/features/auth/store'
import { isApiError } from '@/lib/errors'
import {
  useCreateDiseaseMutation,
  useDiseasesQuery,
  useUpdateDiseaseMutation,
} from '@/features/examinations/hooks'

const inputCls = 'w-full rounded-xl border border-clinic-border bg-clinic-bg px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20'

export function DiseaseCatalogPage() {
  const hasRole = useAuthStore((s) => s.hasRole)
  const isAdmin = hasRole(['ADMIN'])

  const { data: diseases, isLoading, error, refetch } = useDiseasesQuery()
  const createMutation = useCreateDiseaseMutation()
  const updateMutation = useUpdateDiseaseMutation()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const filtered = (diseases ?? []).filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCreate = async () => {
    setFormError(null)
    if (!code.trim() || code.length > 20) {
      setFormError('Mã bệnh không được để trống và tối đa 20 ký tự.')
      return
    }
    if (!name.trim()) {
      setFormError('Tên bệnh không được để trống.')
      return
    }
    try {
      await createMutation.mutateAsync({ code: code.trim(), name: name.trim() })
      setCode('')
      setName('')
      setShowForm(false)
    } catch (err) {
      setFormError(isApiError(err) ? err.message : 'Tạo thất bại.')
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, data: { isActive: !current } })
    } catch {
      // silent — table will refetch
    }
  }

  const handleEditSave = async (id: string) => {
    setEditError(null)
    if (!editName.trim()) { setEditError('Tên không được để trống.'); return }
    try {
      await updateMutation.mutateAsync({ id, data: { name: editName.trim() } })
      setEditingId(null)
    } catch (err) {
      setEditError(isApiError(err) ? err.message : 'Cập nhật thất bại.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh mục bệnh"
        description="Quản lý danh sách bệnh trong hệ thống"
        action={
          isAdmin ? (
            <button
              onClick={() => setShowForm((p) => !p)}
              className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
            >
              <Plus className="h-4 w-4" />
              Thêm bệnh
            </button>
          ) : undefined
        }
      />

      {/* Create form */}
      {showForm && isAdmin && (
        <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-clinic-muted">Thêm bệnh mới</h2>
          {formError && (
            <div role="alert" className="mb-4 rounded-xl bg-[#FEE2E2] px-4 py-3 text-sm text-clinic-danger">{formError}</div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-clinic-text">Mã bệnh (tối đa 20 ký tự)</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} placeholder="VD: COVID19" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-clinic-text">Tên bệnh</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: COVID-19" className={inputCls} />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => void handleCreate()}
              disabled={createMutation.isPending}
              className="rounded-xl bg-clinic-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
            >
              {createMutation.isPending ? 'Đang thêm...' : 'Thêm bệnh'}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(null) }}
              className="rounded-xl border border-clinic-border px-6 py-2.5 text-sm text-clinic-muted transition hover:bg-clinic-bg"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm theo tên hoặc mã bệnh..."
        className="w-full rounded-xl border border-clinic-border bg-clinic-surface py-2.5 px-4 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
      />

      {/* Table */}
      <div className="rounded-2xl bg-clinic-surface shadow-clinic">
        {isLoading ? (
          <div className="p-6"><LoadingState rows={6} /></div>
        ) : error ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : !filtered.length ? (
          <EmptyState title="Không có bệnh nào" description={search ? `Không tìm thấy bệnh "${search}".` : 'Chưa có bệnh nào trong hệ thống.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-clinic-border bg-clinic-bg">
                <tr>
                  {['Mã bệnh', 'Tên bệnh', 'Trạng thái', isAdmin ? 'Thao tác' : ''].filter(Boolean).map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-clinic-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-clinic-border">
                {filtered.map((d) => (
                  <tr key={d.id} className="transition hover:bg-clinic-bg/60">
                    <td className="px-5 py-3 font-mono text-xs text-clinic-muted">{d.code}</td>
                    <td className="px-5 py-3">
                      {editingId === d.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="rounded-lg border border-clinic-border bg-clinic-bg px-2.5 py-1.5 text-sm outline-none focus:border-clinic-primary"
                          />
                          {editError && <span className="text-xs text-clinic-danger">{editError}</span>}
                        </div>
                      ) : (
                        <span className="font-medium text-clinic-text">{d.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={d.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {editingId === d.id ? (
                            <>
                              <button
                                onClick={() => void handleEditSave(d.id)}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-clinic-primary transition hover:bg-clinic-sidebar-muted"
                              >
                                Lưu
                              </button>
                              <button
                                onClick={() => { setEditingId(null); setEditError(null) }}
                                className="rounded-lg px-3 py-1.5 text-xs text-clinic-muted transition hover:bg-clinic-bg"
                              >
                                Hủy
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setEditingId(d.id); setEditName(d.name) }}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-clinic-primary transition hover:bg-clinic-sidebar-muted"
                              >
                                Sửa tên
                              </button>
                              <button
                                onClick={() => void handleToggleActive(d.id, d.isActive)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                  d.isActive
                                    ? 'text-clinic-danger hover:bg-[#FECACA]'
                                    : 'text-[#065F46] hover:bg-[#D1FAE5]'
                                }`}
                              >
                                {d.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-clinic-border px-5 py-3 text-xs text-clinic-muted">
              {filtered.length} bệnh{search ? ` cho "${search}"` : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
