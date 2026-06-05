import { apiClient } from '@/lib/api-client'
import type { AuditLog, AuditLogResponse, QueryAuditParams } from './types'

export const auditApi = {
  list: (params?: QueryAuditParams) =>
    apiClient.get<AuditLogResponse>('/audit-logs', params as Record<string, string>),

  listFlat: (params?: QueryAuditParams) =>
    apiClient.get<AuditLog[]>('/audit-logs', params as Record<string, string>),
}
