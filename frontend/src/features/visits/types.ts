export type VisitStatus = 'WAITING' | 'IN_EXAMINATION' | 'COMPLETED' | 'CANCELLED'

export interface VisitPatient {
  id: string
  patientCode: string
  fullName: string
  phone?: string | null
  dob?: string | null
}

export interface VisitExamination {
  id: string
  status: string
}

export interface Visit {
  id: string
  visitDate: string
  queueNumber: number
  status: VisitStatus
  reason?: string | null
  patient: VisitPatient
  createdByUser?: { id: string; fullName: string } | null
  examination?: VisitExamination | null
}

export interface CreateVisitRequest {
  patientId: string
  visitDate?: string
  reason?: string
}

export interface QueryVisitsParams {
  date?: string
  status?: VisitStatus
}
