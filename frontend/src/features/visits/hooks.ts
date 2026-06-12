import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { visitApi } from './api'
import type { CreateVisitRequest, QueryVisitsParams } from './types'

export const VISIT_KEYS = {
  all: ['visits'] as const,
  list: (params?: QueryVisitsParams) => ['visits', 'list', params ?? {}] as const,
}

export function useVisitsQuery(params?: QueryVisitsParams) {
  return useQuery({
    queryKey: VISIT_KEYS.list(params),
    queryFn: () => visitApi.list(params),
  })
}

export function useCreateVisitMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVisitRequest) => visitApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VISIT_KEYS.all })
    },
  })
}

export function useOpenExaminationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (visitId: string) => visitApi.openExamination(visitId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VISIT_KEYS.all })
    },
  })
}
