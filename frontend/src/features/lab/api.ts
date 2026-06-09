import { apiClient } from '@/lib/api-client'
import type { LabOrder, SubmitResultPayload } from './types'

export const labApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<LabOrder[]>('/lab/orders', params),

  get: (id: string) =>
    apiClient.get<LabOrder>(`/lab/orders/${id}`),

  collectSample: (id: string) =>
    apiClient.post<LabOrder>(`/lab/orders/${id}/sample`, {}),

  submitResult: (id: string, data: SubmitResultPayload) =>
    apiClient.post<LabOrder>(`/lab/orders/${id}/result`, data),

  verify: (id: string) =>
    apiClient.post<LabOrder>(`/lab/orders/${id}/verify`, {}),
}
