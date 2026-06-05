export interface AuditLog {
  id: string
  userId: string | null
  action: string
  entityType: string
  entityId: string | null
  oldValues: Record<string, unknown> | null
  newValues: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user?: { fullName: string; email: string }
}

export interface QueryAuditParams {
  entityType?: string
  entityId?: string
  userId?: string
  action?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

export interface AuditLogResponse {
  data: AuditLog[]
  total: number
  page: number
  limit: number
}
