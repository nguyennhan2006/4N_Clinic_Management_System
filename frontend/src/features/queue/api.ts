import { apiClient } from '@/lib/api-client'
import type { QueueStatus, QueueTicket, QueryQueueParams } from './types'

export const queueApi = {
  list: (params?: QueryQueueParams) =>
    apiClient.get<QueueTicket[]>('/queue', params as Record<string, string | undefined>),

  get: (id: string) =>
    apiClient.get<QueueTicket>(`/queue/${id}`),

  updateStatus: (id: string, status: QueueStatus) =>
    apiClient.patch<QueueTicket>(`/queue/${id}/status`, { status }),

  getNext: (departmentId?: string) =>
    apiClient.get<QueueTicket | null>('/queue/next', departmentId ? { departmentId } : undefined),
}
