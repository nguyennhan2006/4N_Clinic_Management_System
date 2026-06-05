import { apiClient } from '@/lib/api-client'
import type { CreateVitalSignPayload, VitalSign } from './types'

export const vitalsApi = {
  getByVisit: (visitId: string) =>
    apiClient.get<VitalSign | null>(`/vitals/visit/${visitId}`),

  create: (data: CreateVitalSignPayload) =>
    apiClient.post<VitalSign>('/vitals', data),
}
