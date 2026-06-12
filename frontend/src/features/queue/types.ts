export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'DONE' | 'SKIPPED' | 'CANCELLED'

export interface QueueTicket {
  id: string
  visitId: string
  departmentId: string
  queueDate: string
  queueNumber: number
  priority: number
  status: QueueStatus
  calledAt: string | null
  completedAt: string | null
  createdAt: string
  visit?: {
    id: string
    patient?: { id: string; fullName: string; phone: string | null }
    examination?: { id: string; status: string } | null
  }
  department?: { id: string; name: string }
}

export interface QueryQueueParams {
  departmentId?: string
  roomId?: string
  date?: string
  status?: QueueStatus
}
