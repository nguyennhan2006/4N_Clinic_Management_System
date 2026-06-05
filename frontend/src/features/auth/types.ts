export type Role = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'CASHIER' | 'MANAGER' | 'NURSE' | 'LAB_TECH' | 'PHARMACIST'

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED'

export interface AuthUser {
  id: string
  username: string
  fullName: string
  status: UserStatus
  roles: Role[]
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

// GET /auth/me response — includes permissions
export interface MeResponse {
  id: string
  username: string
  fullName: string
  email: string | null
  phone: string | null
  status: UserStatus
  roles: Role[]
  permissions: string[]
}
