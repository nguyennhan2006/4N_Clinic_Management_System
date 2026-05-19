import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './errors'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
          return false
        }
        return failureCount < 2
      },
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
})
