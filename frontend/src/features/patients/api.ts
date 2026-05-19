import { apiClient } from '@/lib/api-client'
import type { CreatePatientRequest, MedicalHistoryResponse, Patient } from './types'

export const patientApi = {
  list: (keyword?: string) =>
    apiClient.get<Patient[]>('/patients', keyword ? { keyword } : undefined),

  getById: (id: string) =>
    apiClient.get<Patient>(`/patients/${id}`),

  create: (data: CreatePatientRequest) =>
    apiClient.post<Patient>('/patients', data),

  getMedicalHistory: (patientId: string) =>
    apiClient.get<MedicalHistoryResponse>(`/patients/${patientId}/medical-history`),
}
