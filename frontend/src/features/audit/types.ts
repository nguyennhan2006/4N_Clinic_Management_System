export interface AuditLog {
  id: string
  actorId: string | null
  action: string
  entityType: string
  entityId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  createdAt: string
}

export interface QueryAuditParams {
  entityType?: string
  actorId?: string
  page?: number
  limit?: number
}

export interface AuditLogResponse {
  data: AuditLog[]
  total: number
  page: number
  limit: number
}
