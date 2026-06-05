import { apiClient } from '@/lib/api-client'
import type {
  CreatePrescriptionRequest,
  Drug,
  Examination,
  Prescription,
  UpdateExaminationRequest,
} from './types'
import type { Disease } from './types'

export const examinationApi = {
  getById: (id: string) =>
    apiClient.get<Examination>(`/examinations/${id}`),

  update: (id: string, data: UpdateExaminationRequest) =>
    apiClient.patch<Examination>(`/examinations/${id}`, data),

  upsertPrescription: (id: string, data: CreatePrescriptionRequest) =>
    apiClient.put<Prescription>(`/examinations/${id}/prescription`, data),

  deletePrescription: (id: string) =>
    apiClient.delete<void>(`/examinations/${id}/prescription`),

  complete: (id: string) =>
    apiClient.post<Examination>(`/examinations/${id}/complete`),
}

export const diseaseApi = {
  list: (activeOnly?: boolean) =>
    apiClient.get<Disease[]>('/diseases', activeOnly !== undefined ? { activeOnly: String(activeOnly) } : undefined),

  create: (data: { code: string; name: string }) =>
    apiClient.post<Disease>('/diseases', data),

  update: (id: string, data: { name?: string; isActive?: boolean }) =>
    apiClient.patch<Disease>(`/diseases/${id}`, data),
}

export const drugApi = {
  list: (activeOnly?: boolean) =>
    apiClient.get<Drug[]>('/drugs', activeOnly !== undefined ? { activeOnly: String(activeOnly) } : undefined),

  create: (data: { name: string; unit: string; price: number }) =>
    apiClient.post<Drug>('/drugs', data),

  update: (id: string, data: { name?: string; unit?: string; price?: number; isActive?: boolean }) =>
    apiClient.patch<Drug>(`/drugs/${id}`, data),
}
