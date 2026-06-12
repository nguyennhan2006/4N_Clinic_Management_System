import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { patientApi } from './api'
import type { CreatePatientRequest } from './types'


export const PATIENT_KEYS = {
  all: ['patients'] as const,
  list: (keyword?: string) => ['patients', 'list', keyword ?? ''] as const,
  detail: (id: string) => ['patients', 'detail', id] as const,
  history: (id: string) => ['patients', 'history', id] as const,
}

export function usePatientsQuery(keyword?: string) {
  return useQuery({
    queryKey: PATIENT_KEYS.list(keyword),
    queryFn: () => patientApi.list(keyword),
  })
}

export function usePatientQuery(id: string) {
  return useQuery({
    queryKey: PATIENT_KEYS.detail(id),
    queryFn: () => patientApi.getById(id),
    enabled: !!id,
  })
}

export function useMedicalHistoryQuery(patientId: string) {
  return useQuery({
    queryKey: PATIENT_KEYS.history(patientId),
    queryFn: () => patientApi.getMedicalHistory(patientId),
    enabled: !!patientId,
  })
}

export function useCreatePatientMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePatientRequest) => patientApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.all })
    },
  })
}
