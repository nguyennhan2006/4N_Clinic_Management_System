import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAuthStore } from '@/features/auth/store'
import { formatVND } from '@/lib/money'
import { isApiError } from '@/lib/errors'
import {
  useCreateDrugMutation,
  useDrugsQuery,
  useUpdateDrugMutation,
} from '@/features/examinations/hooks'

const inputCls = 'w-full rounded-xl border border-clinic-border bg-clinic-bg px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20'

export function MedicineCatalogPage() {
  const hasRole = useAuthStore((s) => s.hasRole)
  const isAdmin = hasRole(['ADMIN'])

  const { data: drugs, isLoading, error, refetch } = useDrugsQuery()
  const createMutation = useCreateDrugMutation()
  const updateMutation = useUpdateDrugMutation()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const filtered = (drugs ?? []).filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCreate = async () => {
    setFormError(null)
    if (!newName.trim()) { setFormError('Tên thuốc không được để trống.'); return }
    if (!newUnit.trim()) { setFormError('Đơn vị không được để trống.'); return }
    const price = parseFloat(newPrice)
    if (!price || price <= 0) { setFormError('Giá phải lớn hơn 0.'); return }
    try {
      await createMutation.mutateAsync({ name: newName.trim(), unit: newUnit.trim(), price })
      setNewName(''); setNewUnit(''); setNewPrice('')
      setShowForm(false)
    } catch (err) {
      setFormError(isApiError(err) ? err.message : 'Tạo thất bại.')
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, data: { isActive: !current } })
    } catch {
      // silent
    }
  }

  const startEdit = (d: { id: string; name: string; unit: string; price: number | string }) => {
    setEditingId(d.id)
    setEditName(d.name)
    setEditUnit(d.unit)
    setEditPrice(String(d.price))
    setEditError(null)
  }

  const handleEditSave = async (id: string) => {
    setEditError(null)
    if (!editName.trim()) { setEditError('Tên không được để trống.'); return }
    if (!editUnit.trim()) { setEditError('Đơn vị không được để trống.'); return }
    const price = parseFloat(editPrice)
    if (!price || price <= 0) { setEditError('Giá phải lớn hơn 0.'); return }
    try {
      await updateMutation.mutateAsync({ id, data: { name: editName.trim(), unit: editUnit.trim(), price } })
      setEditingId(null)
    } catch (err) {
      setEditError(isApiError(err) ? err.message : 'Cập nhật thất bại.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh mục thuốc"
        description="Quản lý danh sách thuốc và giá"
        action={
          isAdmin ? (
            <button
              onClick={() => setShowForm((p) => !p)}
              className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
            >
              <Plus className="h-4 w-4" />
              Thêm thuốc
            </button>
          ) : undefined
        }
      />

      {/* Create form */}
      {showForm && isAdmin && (
        <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-clinic-muted">Thêm thuốc mới</h2>
          {formError && (
            <div role="alert" className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-clinic-danger">{formError}</div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-clinic-text">Tên thuốc</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="VD: Paracetamol" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-clinic-text">Đơn vị</label>
              <input type="text" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="VD: viên, ml, gói" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-clinic-text">Giá (VND / đơn vị)</label>
              <input type="number" min={1} value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="VD: 5000" className={inputCls} />
              {newPrice && <p className="mt-1 text-xs text-clinic-muted">{formatVND(Number(newPrice))}</p>}
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => void handleCreate()}
              disabled={createMutation.isPending}
              className="rounded-xl bg-clinic-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
            >
              {createMutation.isPending ? 'Đang thêm...' : 'Thêm thuốc'}
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
        placeholder="Tìm theo tên thuốc..."
        className="w-full rounded-xl border border-clinic-border bg-clinic-surface py-2.5 px-4 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
      />

      {/* Table */}
      <div className="rounded-2xl bg-clinic-surface shadow-clinic">
        {isLoading ? (
          <div className="p-6"><LoadingState rows={6} /></div>
        ) : error ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : !filtered.length ? (
          <EmptyState title="Không có thuốc nào" description={search ? `Không tìm thấy thuốc "${search}".` : 'Chưa có thuốc nào trong hệ thống.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-clinic-border bg-clinic-bg">
                <tr>
                  {['Tên thuốc', 'Đơn vị', 'Giá / đơn vị', 'Trạng thái', isAdmin ? 'Thao tác' : ''].filter(Boolean).map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-clinic-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-clinic-border">
                {filtered.map((d) => (
                  <tr key={d.id} className="transition hover:bg-clinic-bg/60">
                    <td className="px-5 py-3">
                      {editingId === d.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="rounded-lg border border-clinic-border bg-clinic-bg px-2.5 py-1.5 text-sm outline-none focus:border-clinic-primary"
                        />
                      ) : (
                        <span className="font-medium text-clinic-text">{d.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editingId === d.id ? (
                        <input
                          type="text"
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          className="w-20 rounded-lg border border-clinic-border bg-clinic-bg px-2.5 py-1.5 text-sm outline-none focus:border-clinic-primary"
                        />
                      ) : (
                        <span className="text-clinic-muted">{d.unit}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editingId === d.id ? (
                        <div>
                          <input
                            type="number"
                            min={1}
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-28 rounded-lg border border-clinic-border bg-clinic-bg px-2.5 py-1.5 text-sm outline-none focus:border-clinic-primary"
                          />
                          {editError && <div className="mt-1 text-xs text-clinic-danger">{editError}</div>}
                        </div>
                      ) : (
                        <span className="font-medium text-clinic-primary">{formatVND(Number(d.price))}</span>
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
                                onClick={() => startEdit(d)}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-clinic-primary transition hover:bg-clinic-sidebar-muted"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => void handleToggleActive(d.id, d.isActive)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                                  d.isActive
                                    ? 'text-clinic-danger hover:bg-red-500/20'
                                    : 'text-green-400 hover:bg-green-500/10'
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
              {filtered.length} thuốc{search ? ` cho "${search}"` : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
