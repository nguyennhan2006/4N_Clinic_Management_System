import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, Pencil, ChevronDown, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { organizationApi } from './api'
import type { Department, CreateDepartmentPayload } from './types'
import { useAuthStore } from '@/features/auth/store'

// ─── Schema ──────────────────────────────────────────────────────────────────

const deptSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})
type DeptForm = z.infer<typeof deptSchema>

// ─── DepartmentForm ───────────────────────────────────────────────────────────

function DepartmentFormDialog({
  defaultValues,
  onSubmit,
  onClose,
  isLoading,
}: {
  defaultValues?: Partial<DeptForm>
  onSubmit: (data: DeptForm) => void
  onClose: () => void
  isLoading: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<DeptForm>({
    resolver: zodResolver(deptSchema),
    defaultValues,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-clinic-surface border border-clinic-border p-6 shadow-clinic">
        <h2 className="mb-4 text-lg font-semibold text-clinic-text">
          {defaultValues?.code ? 'Cập nhật khoa' : 'Thêm khoa mới'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-clinic-text">
              Mã khoa <span className="text-clinic-danger">*</span>
            </label>
            <input
              {...register('code')}
              disabled={!!defaultValues?.code}
              placeholder="VD: GENERAL"
              className="w-full rounded-xl border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40 disabled:opacity-50"
            />
            {errors.code && <p className="mt-1 text-xs text-clinic-danger">{errors.code.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-clinic-text">
              Tên khoa <span className="text-clinic-danger">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="VD: Nội khoa tổng quát"
              className="w-full rounded-xl border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
            />
            {errors.name && <p className="mt-1 text-xs text-clinic-danger">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-clinic-text">Mô tả</label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Mô tả ngắn về khoa..."
              className="w-full rounded-xl border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-clinic-border bg-clinic-bg py-2 text-sm text-clinic-muted hover:bg-white/5"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-clinic-primary py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover disabled:opacity-60"
            >
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── DepartmentRow ────────────────────────────────────────────────────────────

function DepartmentRow({
  dept,
  isAdmin,
  onEdit,
  onToggle,
}: {
  dept: Department
  isAdmin: boolean
  onEdit: (dept: Department) => void
  onToggle: (dept: Department) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const rooms = dept.rooms ?? []

  return (
    <>
      <tr className="border-b border-clinic-border hover:bg-clinic-primary/5">
        <td className="px-4 py-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-left"
          >
            {rooms.length > 0
              ? expanded ? <ChevronDown className="h-4 w-4 text-clinic-muted" /> : <ChevronRight className="h-4 w-4 text-clinic-muted" />
              : <span className="w-4" />
            }
            <span className="font-mono text-xs text-clinic-muted">{dept.code}</span>
          </button>
        </td>
        <td className="px-4 py-3 font-medium text-clinic-text">{dept.name}</td>
        <td className="px-4 py-3 text-sm text-clinic-muted">{dept.description ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-clinic-muted">
          {rooms.length} phòng · {dept._count?.doctorProfiles ?? 0} bác sĩ
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            dept.isActive
              ? 'bg-green-500/15 text-green-400'
              : 'bg-red-500/15 text-red-400'
          }`}>
            {dept.isActive ? 'Đang hoạt động' : 'Ngừng'}
          </span>
        </td>
        {isAdmin && (
          <td className="px-4 py-3">
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(dept)}
                className="rounded-lg p-1.5 text-clinic-muted hover:bg-clinic-primary/10 hover:text-clinic-primary"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onToggle(dept)}
                className="rounded-lg px-2 py-1 text-xs text-clinic-muted hover:bg-clinic-primary/10"
              >
                {dept.isActive ? 'Tắt' : 'Bật'}
              </button>
            </div>
          </td>
        )}
      </tr>
      {expanded && rooms.map((room) => (
        <tr key={room.id} className="border-b border-clinic-border/50 bg-clinic-bg/30">
          <td className="px-4 py-2 pl-10">
            <span className="font-mono text-xs text-clinic-muted">{room.code}</span>
          </td>
          <td className="px-4 py-2 text-sm text-clinic-text">{room.name}</td>
          <td className="px-4 py-2 text-xs text-clinic-muted">{room.roomType}</td>
          <td colSpan={isAdmin ? 3 : 2} />
        </tr>
      ))}
    </>
  )
}

// ─── DepartmentListPage ───────────────────────────────────────────────────────

export function DepartmentListPage() {
  const { hasRole } = useAuthStore()
  const isAdmin = hasRole(['ADMIN'])
  const queryClient = useQueryClient()

  const [dialog, setDialog] = useState<'create' | Department | null>(null)

  const { data: departments, isLoading, isError } = useQuery({
    queryKey: ['departments'],
    queryFn: () => organizationApi.listDepartments(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateDepartmentPayload) => organizationApi.createDepartment(data),
    onSuccess: () => {
      toast.success('Tạo khoa thành công')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setDialog(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateDepartmentPayload> & { isActive?: boolean } }) =>
      organizationApi.updateDepartment(id, data),
    onSuccess: () => {
      toast.success('Cập nhật thành công')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setDialog(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleFormSubmit = (data: DeptForm) => {
    if (dialog === 'create') {
      createMutation.mutate(data)
    } else if (dialog && typeof dialog === 'object') {
      updateMutation.mutate({ id: dialog.id, data: { name: data.name, description: data.description } })
    }
  }

  const handleToggle = (dept: Department) => {
    updateMutation.mutate({ id: dept.id, data: { isActive: !dept.isActive } })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-clinic-danger/10 p-4 text-clinic-danger">
          Không thể tải danh sách khoa. Vui lòng thử lại.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinic-primary/15">
            <Building2 className="h-5 w-5 text-clinic-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-clinic-text">Khoa & Phòng</h1>
            <p className="text-sm text-clinic-muted">{departments?.length ?? 0} khoa</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setDialog('create')}
            className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover"
          >
            <Plus className="h-4 w-4" />
            Thêm khoa
          </button>
        )}
      </div>

      {/* Table */}
      {!departments?.length ? (
        <div className="rounded-xl border border-dashed border-clinic-border py-16 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-clinic-border" />
          <p className="text-sm text-clinic-muted">Chưa có khoa nào</p>
          {isAdmin && (
            <button
              onClick={() => setDialog('create')}
              className="mt-3 text-sm text-clinic-primary underline"
            >
              Thêm khoa đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-clinic-border bg-clinic-surface shadow-clinic">
          <table className="w-full text-left">
            <thead className="border-b border-clinic-border bg-clinic-bg text-xs font-medium uppercase tracking-wide text-clinic-muted">
              <tr>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tên khoa</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3">Thống kê</th>
                <th className="px-4 py-3">Trạng thái</th>
                {isAdmin && <th className="px-4 py-3">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <DepartmentRow
                  key={dept.id}
                  dept={dept}
                  isAdmin={isAdmin}
                  onEdit={(d) => setDialog(d)}
                  onToggle={handleToggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      {dialog !== null && (
        <DepartmentFormDialog
          defaultValues={dialog === 'create' ? undefined : {
            code: dialog.code,
            name: dialog.name,
            description: dialog.description ?? undefined,
          }}
          onSubmit={handleFormSubmit}
          onClose={() => setDialog(null)}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}
