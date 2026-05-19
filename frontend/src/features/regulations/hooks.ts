import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { regulationApi } from './api'
import type { CreateRegulationRequest } from './types'

export const REGULATION_KEYS = {
  all: ['regulations'] as const,
  current: ['regulations', 'current'] as const,
}

export function useCurrentRegulationQuery() {
  return useQuery({
    queryKey: REGULATION_KEYS.current,
    queryFn: () => regulationApi.getCurrent(),
  })
}

export function useCreateRegulationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRegulationRequest) => regulationApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REGULATION_KEYS.all })
    },
  })
}

export function useActivateRegulationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => regulationApi.activate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REGULATION_KEYS.all })
    },
  })
}
