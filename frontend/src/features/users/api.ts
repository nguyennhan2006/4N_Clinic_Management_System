import { apiClient } from '@/lib/api-client'
import type {
  User,
  UsersListResponse,
  QueryUsersParams,
  CreateUserRequest,
  UpdateUserRequest,
  LockUserRequest,
  AssignRolesRequest,
  RoleItem,
  PermissionItem,
} from './types'

export const usersApi = {
  list: (params?: QueryUsersParams) =>
    apiClient.get<UsersListResponse>('/users', params as Record<string, string | number | boolean | undefined>),

  findOne: (id: string) =>
    apiClient.get<User>(`/users/${id}`),

  create: (dto: CreateUserRequest) =>
    apiClient.post<User>('/users', dto),

  update: (id: string, dto: UpdateUserRequest) =>
    apiClient.patch<User>(`/users/${id}`, dto),

  lock: (id: string, dto: LockUserRequest) =>
    apiClient.patch<User>(`/users/${id}/lock`, dto),

  assignRoles: (id: string, dto: AssignRolesRequest) =>
    apiClient.patch<User>(`/users/${id}/roles`, dto),
}

export const rbacApi = {
  listRoles: () =>
    apiClient.get<RoleItem[]>('/rbac/roles'),

  listPermissions: () =>
    apiClient.get<PermissionItem[]>('/rbac/permissions'),

  updateRolePermissions: (roleId: string, permissionIds: string[]) =>
    apiClient.patch<RoleItem>(`/rbac/roles/${roleId}/permissions`, { permissionIds }),
}
