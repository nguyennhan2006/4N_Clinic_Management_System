import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stethoscope, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { serviceCatalogApi } from './api'
import type { ServiceCatalog, ServiceType } from './types'
import { useAuthStore } from '@/features/auth/store'
import { formatMoney } from '@/lib/money'

const TYPE_LABELS: Record<ServiceType, string> = {
  CONSULTATION: 'Khám',
  LAB_TEST: 'Xét nghiệm',
  IMAGING: 'Hình ảnh',
  PROCEDURE: 'Thủ thuật',
  OTHER: 'Khác',
}

export function ServiceCatalogPage() {
  const { hasRole } = useAuthStore()
  const canEdit = hasRole(['ADMIN', 'MANAGER'])
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'PROCEDURE' as ServiceType, price: '', description: '' })

  const { data: services, isLoading } = useQuery({
    queryKey: ['service-catalog'],
    queryFn: () => serviceCatalogApi.list(),
  })

  const createMut = useMutation({
    mutationFn: () => {
      if (!form.name || !form.price) throw new Error('Nhập đủ tên và giá')
      return serviceCatalogApi.create({ name: form.name, type: form.type, price: Number(form.price), description: form.description || undefined })
    },
    onSuccess: () => {
      toast.success('Thêm dịch vụ thành công')
      setShowForm(false)
      setForm({ name: '', type: 'PROCEDURE', price: '', description: '' })
      qc.invalidateQueries({ queryKey: ['service-catalog'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const toggleMut = useMutation({
    mutationFn: (svc: ServiceCatalog) =>
      serviceCatalogApi.update(svc.id, { isActive: !svc.isActive }),
    onSuccess: () => {
      toast.success('Cập nhật thành công')
      qc.invalidateQueries({ queryKey: ['service-catalog'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const filtered = services?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinic-primary/15"><Stethoscope className="h-5 w-5 text-clinic-primary" /></div>
          <h1 className="text-xl font-semibold text-clinic-text">Danh mục dịch vụ</h1>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover"
          >
            <Plus className="h-4 w-4" />
            Thêm dịch vụ
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="mb-6 rounded-2xl border border-clinic-border bg-clinic-surface p-5 shadow-clinic">
          <h3 className="mb-4 font-semibold text-clinic-text">Thêm dịch vụ mới</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-clinic-text">Tên dịch vụ *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-clinic-text">Loại</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ServiceType }))}
                className="w-full rounded-lg border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-clinic-text">Giá (VND) *</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full rounded-lg border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-clinic-text">Mô tả</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-clinic-border px-4 py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
            >
              Hủy
            </button>
            <button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
              className="rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover disabled:opacity-60"
            >
              {createMut.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm dịch vụ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-clinic-border bg-clinic-bg px-4 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-clinic-border bg-clinic-surface shadow-clinic">
        <table className="w-full text-sm">
          <thead className="border-b border-clinic-border bg-clinic-bg">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Tên dịch vụ</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Loại</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-clinic-muted">Giá</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-clinic-muted">Trạng thái</th>
              {canEdit && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-clinic-muted">Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-white/5" />
                  </td>
                </tr>
              ))
            ) : !filtered?.length ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-clinic-muted">
                  Không có dịch vụ nào
                </td>
              </tr>
            ) : (
              filtered.map((svc) => (
                <tr key={svc.id} className="border-b border-clinic-border last:border-0 hover:bg-clinic-primary/5">
                  <td className="px-4 py-3 font-medium text-clinic-text">
                    {svc.name}
                    {svc.description && <p className="text-xs text-clinic-muted">{svc.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-clinic-muted">{TYPE_LABELS[svc.type]}</td>
                  <td className="px-4 py-3 text-right font-medium text-clinic-text">{formatMoney(svc.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${svc.isActive ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-clinic-muted'}`}>
                      {svc.isActive ? 'Đang hoạt động' : 'Ngừng'}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleMut.mutate(svc)}
                        disabled={toggleMut.isPending}
                        className={`rounded-lg px-3 py-1 text-xs font-medium ${svc.isActive ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25' : 'bg-green-500/15 text-green-400 hover:bg-green-500/25'} disabled:opacity-50`}
                      >
                        {svc.isActive ? 'Ngừng' : 'Kích hoạt'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
