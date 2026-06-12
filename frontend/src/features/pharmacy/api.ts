import { apiClient } from '@/lib/api-client'
import type { CreateDispensePayload, Dispense, Prescription, QueryDispenseParams } from './types'

export const pharmacyApi = {
  // Pending prescriptions chưa phát — dùng cho worklist
  worklist: (date?: string) =>
    apiClient.get<Prescription[]>('/pharmacy/worklist', date ? { date } : undefined),

  // Lịch sử phát thuốc (đã DISPENSED / CANCELLED)
  list: (params?: QueryDispenseParams) =>
    apiClient.get<Dispense[]>('/pharmacy/dispense', params as Record<string, string>),

  get: (id: string) =>
    apiClient.get<Dispense>(`/pharmacy/dispense/${id}`),

  create: (data: CreateDispensePayload) =>
    apiClient.post<Dispense>('/pharmacy/dispense', data),

  cancel: (id: string) =>
    apiClient.patch<Dispense>(`/pharmacy/dispense/${id}/cancel`, {}),
}
