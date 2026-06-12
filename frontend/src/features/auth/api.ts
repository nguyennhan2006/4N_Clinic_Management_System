import { apiClient } from '@/lib/api-client'
import type { LoginRequest, LoginResponse, MeResponse } from './types'

export const authApi = {
  login: (payload: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', payload),

  me: () =>
    apiClient.get<MeResponse>('/auth/me'),

  refresh: (refreshToken: string) =>
    apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),

  logout: (refreshToken?: string) =>
    apiClient.post<{ message: string }>('/auth/logout', refreshToken ? { refreshToken } : {}),
}
