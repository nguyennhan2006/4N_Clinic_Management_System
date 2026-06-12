import { apiClient } from '@/lib/api-client'
import type { CreateVisitRequest, QueryVisitsParams, Visit, VisitExamination } from './types'

export const visitApi = {
  list: (params?: QueryVisitsParams) =>
    apiClient.get<Visit[]>('/visits', params as Record<string, string | boolean | undefined>),

  create: (data: CreateVisitRequest) =>
    apiClient.post<Visit>('/visits', data),

  openExamination: (visitId: string) =>
    apiClient.post<VisitExamination>(`/visits/${visitId}/open-examination`),
}
