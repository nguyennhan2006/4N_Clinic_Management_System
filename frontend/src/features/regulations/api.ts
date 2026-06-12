import { apiClient } from '@/lib/api-client'
import type { CreateRegulationRequest, RegulationVersion } from './types'

export const regulationApi = {
  getCurrent: () =>
    apiClient.get<RegulationVersion>('/regulations/current'),

  create: (data: CreateRegulationRequest) =>
    apiClient.post<RegulationVersion>('/regulations', data),

  activate: (id: string) =>
    apiClient.patch<RegulationVersion>(`/regulations/${id}/activate`),
}
