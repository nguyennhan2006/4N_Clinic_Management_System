import { apiClient } from '@/lib/api-client'
import type { LabOrder, SubmitResultPayload } from './types'

export const labApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<LabOrder[]>('/lab', params),

  get: (id: string) =>
    apiClient.get<LabOrder>(`/lab/${id}`),

  collectSample: (id: string) =>
    apiClient.patch<LabOrder>(`/lab/${id}/collect-sample`, {}),

  submitResult: (id: string, data: SubmitResultPayload) =>
    apiClient.patch<LabOrder>(`/lab/${id}/result`, data),

  verify: (id: string) =>
    apiClient.patch<LabOrder>(`/lab/${id}/verify`, {}),
}
