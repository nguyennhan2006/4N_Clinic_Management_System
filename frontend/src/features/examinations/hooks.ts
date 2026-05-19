import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { diseaseApi, drugApi, examinationApi } from './api'
import type { CreatePrescriptionRequest, UpdateExaminationRequest } from './types'

export const EXAMINATION_KEYS = {
  all: ['examinations'] as const,
  detail: (id: string) => ['examinations', 'detail', id] as const,
}

export const DISEASE_KEYS = {
  all: ['diseases'] as const,
  list: (activeOnly?: boolean) => ['diseases', 'list', activeOnly] as const,
}

export const DRUG_KEYS = {
  all: ['drugs'] as const,
  list: (activeOnly?: boolean) => ['drugs', 'list', activeOnly] as const,
}

export function useExaminationQuery(id: string) {
  return useQuery({
    queryKey: EXAMINATION_KEYS.detail(id),
    queryFn: () => examinationApi.getById(id),
    enabled: !!id,
  })
}

export function useUpdateExaminationMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateExaminationRequest) => examinationApi.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EXAMINATION_KEYS.detail(id) })
    },
  })
}

export function useUpsertPrescriptionMutation(examinationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePrescriptionRequest) =>
      examinationApi.upsertPrescription(examinationId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EXAMINATION_KEYS.detail(examinationId) })
    },
  })
}

export function useCompleteExaminationMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => examinationApi.complete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EXAMINATION_KEYS.detail(id) })
    },
  })
}

export function useDiseasesQuery(activeOnly?: boolean) {
  return useQuery({
    queryKey: DISEASE_KEYS.list(activeOnly),
    queryFn: () => diseaseApi.list(activeOnly),
  })
}

export function useCreateDiseaseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { code: string; name: string }) => diseaseApi.create(data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: DISEASE_KEYS.all }) },
  })
}

export function useUpdateDiseaseMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; isActive?: boolean } }) =>
      diseaseApi.update(id, data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: DISEASE_KEYS.all }) },
  })
}

export function useDrugsQuery(activeOnly?: boolean) {
  return useQuery({
    queryKey: DRUG_KEYS.list(activeOnly),
    queryFn: () => drugApi.list(activeOnly),
  })
}

export function useCreateDrugMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; unit: string; price: number }) => drugApi.create(data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: DRUG_KEYS.all }) },
  })
}

export function useUpdateDrugMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; unit?: string; price?: number; isActive?: boolean } }) =>
      drugApi.update(id, data),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: DRUG_KEYS.all }) },
  })
}
