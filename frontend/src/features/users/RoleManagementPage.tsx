import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { rbacApi } from './api'
import type { RoleItem, PermissionItem } from './types'

export function RoleManagementPage() {
  const queryClient = useQueryClient()
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null)

  const {
    data: roles,
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery<RoleItem[]>({
    queryKey: ['rbac-roles'],
    queryFn: rbacApi.listRoles,
  })

  const {
    data: permissions,
    isLoading: permsLoading,
    error: permsError,
  } = useQuery<PermissionItem[]>({
    queryKey: ['rbac-permissions'],
    queryFn: rbacApi.listPermissions,
  })

  const updateMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      rbacApi.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rbac-roles'] })
      toast.success('Đã cập nhật quyền hạn')
    },
    onError: () => {
      toast.error('Cập nhật quyền hạn thất bại')
    },
    onSettled: () => {
      setSavingRoleId(null)
    },
  })

  const handleToggle = (role: RoleItem, permission: PermissionItem, checked: boolean) => {
    const currentIds = role.rolePermissions.map((rp) => rp.permission.id)
    const newIds = checked
      ? [...currentIds, permission.id]
      : currentIds.filter((id) => id !== permission.id)

    setSavingRoleId(role.id)
    updateMutation.mutate({ roleId: role.id, permissionIds: newIds })
  }

  const isLoading = rolesLoading || permsLoading
  const error = rolesError || permsError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Phân quyền" description="Quản lý quyền hạn theo vai trò" />
        <div className="rounded-2xl bg-clinic-surface p-8 shadow-clinic">
          <LoadingState rows={5} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Phân quyền" description="Quản lý quyền hạn theo vai trò" />
        <ErrorState error={error} onRetry={() => void refetchRoles()} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân quyền"
        description="Tick/bỏ tick để thêm hoặc xóa quyền hạn cho vai trò"
      />

      {/* Role cards summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {roles?.map((role) => (
          <div key={role.id} className="rounded-2xl bg-clinic-surface p-4 shadow-clinic">
            <p className="text-sm font-semibold text-clinic-text">{role.name}</p>
            <p className="mt-0.5 font-mono text-xs text-clinic-muted">{role.code}</p>
            <p className="mt-2 text-xs text-clinic-primary">
              {role.rolePermissions.length} quyền
            </p>
          </div>
        ))}
      </div>

      {/* Permission matrix */}
      <div className="rounded-2xl bg-clinic-surface shadow-clinic">
        <div className="border-b border-clinic-border px-6 py-4">
          <h2 className="text-base font-semibold text-clinic-text">Ma trận quyền hạn</h2>
          <p className="mt-0.5 text-xs text-clinic-muted">
            Hàng = Vai trò · Cột = Quyền hạn · Tick để cấp, bỏ tick để thu hồi
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-clinic-bg">
              <tr>
                <th className="w-40 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-clinic-muted">
                  Vai trò
                </th>
                {permissions?.map((perm) => (
                  <th
                    key={perm.id}
                    className="min-w-30 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-clinic-muted"
                    title={perm.code}
                  >
                    <span className="block truncate max-w-25">{perm.name}</span>
                    <span className="block font-mono text-[10px] text-clinic-muted/60">{perm.code}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-clinic-border">
              {roles?.map((role) => {
                const grantedIds = new Set(role.rolePermissions.map((rp) => rp.permission.id))
                const isSaving = savingRoleId === role.id

                return (
                  <tr key={role.id} className={`transition ${isSaving ? 'opacity-60' : 'hover:bg-clinic-bg/40'}`}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-clinic-text">{role.name}</p>
                      <p className="font-mono text-[10px] text-clinic-muted">{role.code}</p>
                    </td>
                    {permissions?.map((perm) => {
                      const checked = grantedIds.has(perm.id)
                      return (
                        <td key={perm.id} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isSaving}
                            onChange={(e) => handleToggle(role, perm, e.target.checked)}
                            aria-label={`${role.name} — ${perm.name}`}
                            className="h-4 w-4 cursor-pointer rounded accent-clinic-primary disabled:cursor-not-allowed"
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {roles?.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-clinic-muted">
            Không có vai trò nào.
          </div>
        )}
      </div>

      <p className="text-xs text-clinic-muted">
        * Phân quyền backend được thực thi độc lập tại mỗi endpoint — đây là cấu hình RBAC dynamic
        dành riêng cho các permission code. Tuy nhiên guard-level (DOCTOR, CASHIER...) vẫn được
        hardcode tại controller.
      </p>
    </div>
  )
}
