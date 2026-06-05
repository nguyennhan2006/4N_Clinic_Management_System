import { apiClient } from '@/lib/api-client'
import type { CreateDispensePayload, Dispense, QueryDispenseParams } from './types'

export const pharmacyApi = {
  list: (params?: QueryDispenseParams) =>
    apiClient.get<Dispense[]>('/pharmacy/dispenses', params as Record<string, string>),

  get: (id: string) =>
    apiClient.get<Dispense>(`/pharmacy/dispenses/${id}`),

  create: (data: CreateDispensePayload) =>
    apiClient.post<Dispense>('/pharmacy/dispenses', data),

  cancel: (id: string) =>
    apiClient.patch<Dispense>(`/pharmacy/dispenses/${id}/cancel`, {}),
}
