export type LabStatus = 'PENDING' | 'SAMPLE_COLLECTED' | 'RESULT_ENTERED' | 'VERIFIED' | 'CANCELLED'

export interface LabOrder {
  id: string
  serviceOrderId: string
  visitId: string
  status: LabStatus
  sampleCollectedAt: string | null
  resultEnteredAt: string | null
  verifiedAt: string | null
  resultData: Record<string, unknown> | null
  resultNotes: string | null
  collectedById: string | null
  resultEnteredById: string | null
  verifiedById: string | null
  createdAt: string
  serviceOrder?: {
    id: string
    service?: { name: string }
  }
  visit?: {
    patient?: { fullName: string }
  }
}

export interface SubmitResultPayload {
  resultData: Record<string, unknown>
  resultNotes?: string
}
