import { apiClient } from '@/lib/api-client'
import type { AuditLogResponse, QueryAuditParams } from './types'

export const auditApi = {
  list: (params?: QueryAuditParams) =>
    apiClient.get<AuditLogResponse>('/audit-logs', params as Record<string, string>),
}
