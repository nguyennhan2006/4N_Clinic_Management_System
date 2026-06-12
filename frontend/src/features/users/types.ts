import type { Role, UserStatus } from '@/features/auth/types'

export interface UserRole {
  role: { id: string; code: string; name: string }
}

export interface User {
  id: string
  username: string
  fullName: string
  email: string | null
  phone: string | null
  status: UserStatus
  createdAt: string
  updatedAt: string
  userRoles: UserRole[]
}

export interface UsersListResponse {
  data: User[]
  total: number
  page: number
  limit: number
}

export interface QueryUsersParams {
  keyword?: string
  status?: UserStatus
  role?: Role
  page?: number
  limit?: number
}

export interface CreateUserRequest {
  username: string
  password: string
  fullName: string
  email?: string
  phone?: string
  roleIds?: string[]
}

export interface UpdateUserRequest {
  fullName?: string
  email?: string
  phone?: string
  status?: UserStatus
}

export interface LockUserRequest {
  locked: boolean
}

export interface AssignRolesRequest {
  roleIds: string[]
}

export interface RoleItem {
  id: string
  code: string
  name: string
  description: string | null
  createdAt: string
  rolePermissions: { permission: { id: string; code: string; name: string } }[]
}

export interface PermissionItem {
  id: string
  code: string
  name: string
  description: string | null
  createdAt: string
}
