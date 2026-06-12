import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Lock, Unlock, UserCheck } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { RoleBadge } from '@/components/common/RoleBadge'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { usersApi, rbacApi } from './api'
import type { User, CreateUserRequest, AssignRolesRequest } from './types'
import type { UserStatus } from '@/features/auth/types'

// ─── Create User Dialog ──────────────────────────────────────────────────────

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState<CreateUserRequest>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    roleIds: [],
  })
  const [error, setError] = useState<string | null>(null)

  const { data: roles } = useQuery({
    queryKey: ['rbac-roles'],
    queryFn: rbacApi.listRoles,
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      onCreated()
      onClose()
      setForm({ username: '', password: '', fullName: '', email: '', phone: '', roleIds: [] })
      setError(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username || !form.password || !form.fullName) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc.')
      return
    }
    mutation.mutate(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-clinic-surface p-6 shadow-clinic">
        <h2 className="mb-4 text-base font-semibold text-clinic-text">Thêm tài khoản mới</h2>

        {error && (
          <p className="mb-3 rounded-xl bg-red-500/10 px-4 py-2 text-sm text-clinic-danger">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { label: 'Tên đăng nhập *', key: 'username', type: 'text' },
            { label: 'Mật khẩu *', key: 'password', type: 'password' },
            { label: 'Họ và tên *', key: 'fullName', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Số điện thoại', key: 'phone', type: 'text' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-clinic-text">{label}</label>
              <input
                type={type}
                value={(form as unknown as Record<string, string>)[key] ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-xl border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text outline-none focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
              />
            </div>
          ))}

          {roles && (
            <div>
              <label className="mb-1 block text-xs font-medium text-clinic-text">Vai trò</label>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => {
                  const selected = form.roleIds?.includes(r.id) ?? false
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          roleIds: selected
                            ? (f.roleIds ?? []).filter((id) => id !== r.id)
                            : [...(f.roleIds ?? []), r.id],
                        }))
                      }
                      className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                        selected
                          ? 'border-clinic-primary bg-clinic-primary text-white'
                          : 'border-clinic-border text-clinic-muted hover:border-clinic-primary'
                      }`}
                    >
                      {r.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-clinic-border px-4 py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover disabled:opacity-60"
            >
              {mutation.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Assign Roles Dialog ─────────────────────────────────────────────────────

function AssignRolesDialog({
  user,
  onClose,
  onUpdated,
}: {
  user: User
  onClose: () => void
  onUpdated: () => void
}) {
  const currentRoleIds = user.userRoles.map((ur) => ur.role.id)
  const [selectedIds, setSelectedIds] = useState<string[]>(currentRoleIds)
  const [error, setError] = useState<string | null>(null)

  const { data: roles } = useQuery({
    queryKey: ['rbac-roles'],
    queryFn: rbacApi.listRoles,
  })

  const mutation = useMutation({
    mutationFn: (dto: AssignRolesRequest) => usersApi.assignRoles(user.id, dto),
    onSuccess: () => { onUpdated(); onClose() },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-clinic-surface p-6 shadow-clinic">
        <h2 className="mb-1 text-base font-semibold text-clinic-text">Gán vai trò</h2>
        <p className="mb-4 text-xs text-clinic-muted">{user.fullName} ({user.username})</p>

        {error && (
          <p className="mb-3 rounded-xl bg-red-500/10 px-4 py-2 text-sm text-clinic-danger">{error}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {roles?.map((r) => {
            const selected = selectedIds.includes(r.id)
            return (
              <button
                key={r.id}
                type="button"
                onClick={() =>
                  setSelectedIds((ids) =>
                    selected ? ids.filter((id) => id !== r.id) : [...ids, r.id],
                  )
                }
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  selected
                    ? 'border-clinic-primary bg-clinic-primary text-white'
                    : 'border-clinic-border text-clinic-muted hover:border-clinic-primary'
                }`}
              >
                {r.name}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-clinic-border px-4 py-2 text-sm text-clinic-muted hover:bg-clinic-bg"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ roleIds: selectedIds })}
            className="rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover disabled:opacity-60"
          >
            {mutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function UserManagementPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [assignTarget, setAssignTarget] = useState<User | null>(null)
  const [lockTarget, setLockTarget] = useState<{ user: User; lock: boolean } | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users', keyword, statusFilter, page],
    queryFn: () =>
      usersApi.list({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        page,
        limit: 20,
      }),
  })

  const lockMutation = useMutation({
    mutationFn: ({ id, locked }: { id: string; locked: boolean }) =>
      usersApi.lock(id, { locked }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setLockTarget(null)
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý tài khoản"
        description="Tạo và quản lý tài khoản nhân viên"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white hover:bg-clinic-primaryHover"
          >
            <Plus className="h-4 w-4" />
            Thêm tài khoản
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-clinic-muted" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc username..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
            className="w-full rounded-xl border border-clinic-border bg-clinic-bg py-2 pl-9 pr-3 text-sm text-clinic-text outline-none focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as UserStatus | ''); setPage(1) }}
          className="rounded-xl border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text outline-none focus:border-clinic-primary"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Không hoạt động</option>
          <option value="LOCKED">Đã khóa</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-clinic-surface shadow-clinic">
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState error={new Error('Không tải được danh sách tài khoản.')} onRetry={() => void refetch()} />
        ) : !data?.data.length ? (
          <EmptyState title="Không có tài khoản nào." description="Thêm tài khoản mới để bắt đầu." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-clinic-bg">
                  <tr>
                    {['Họ tên / Username', 'Email', 'Vai trò', 'Trạng thái', 'Thao tác'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-clinic-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-clinic-border">
                  {data.data.map((u) => (
                    <tr key={u.id} className="transition hover:bg-clinic-primary/5">
                      <td className="px-4 py-3">
                        <p className="font-medium text-clinic-text">{u.fullName}</p>
                        <p className="text-xs text-clinic-muted">@{u.username}</p>
                      </td>
                      <td className="px-4 py-3 text-clinic-muted">{u.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.userRoles.length > 0
                            ? u.userRoles.map((ur) => (
                                <RoleBadge key={ur.role.id} role={ur.role.code as never} />
                              ))
                            : <span className="text-xs text-clinic-muted">Chưa có vai trò</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            title="Gán vai trò"
                            onClick={() => setAssignTarget(u)}
                            className="rounded-lg p-1.5 text-clinic-muted hover:bg-clinic-bg hover:text-clinic-primary"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          {u.status !== 'LOCKED' ? (
                            <button
                              title="Khóa tài khoản"
                              onClick={() => setLockTarget({ user: u, lock: true })}
                              className="rounded-lg p-1.5 text-clinic-muted hover:bg-clinic-bg hover:text-clinic-danger"
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              title="Mở khóa tài khoản"
                              onClick={() => setLockTarget({ user: u, lock: false })}
                              className="rounded-lg p-1.5 text-clinic-muted hover:bg-clinic-bg hover:text-clinic-success"
                            >
                              <Unlock className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.total > data.limit && (
              <div className="flex items-center justify-between border-t border-clinic-border px-4 py-3">
                <p className="text-xs text-clinic-muted">
                  {data.total} tài khoản · Trang {data.page}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg border border-clinic-border px-3 py-1 text-xs text-clinic-muted hover:bg-clinic-bg disabled:opacity-40"
                  >
                    ← Trước
                  </button>
                  <button
                    disabled={page * data.limit >= data.total}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-clinic-border px-3 py-1 text-xs text-clinic-muted hover:bg-clinic-bg disabled:opacity-40"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <CreateUserDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={invalidate}
      />

      {assignTarget && (
        <AssignRolesDialog
          user={assignTarget}
          onClose={() => setAssignTarget(null)}
          onUpdated={invalidate}
        />
      )}

      {lockTarget && (
        <ConfirmDialog
          open={true}
          title={lockTarget.lock ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          description={
            lockTarget.lock
              ? `Khóa tài khoản "${lockTarget.user.fullName}"? Người dùng sẽ không thể đăng nhập.`
              : `Mở khóa tài khoản "${lockTarget.user.fullName}"?`
          }
          confirmLabel={lockTarget.lock ? 'Khóa' : 'Mở khóa'}
          variant={lockTarget.lock ? 'danger' : 'default'}
          isLoading={lockMutation.isPending}
          onConfirm={() => lockMutation.mutate({ id: lockTarget.user.id, locked: lockTarget.lock })}
          onCancel={() => setLockTarget(null)}
        />
      )}
    </div>
  )
}
