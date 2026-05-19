export type ExaminationStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED'

export interface Disease {
  id: string
  code: string
  name: string
  isActive: boolean
}

export interface Diagnosis {
  id: string
  examinationId: string
  diseaseId: string
  name: string
  isPrimary: boolean
  disease: Disease
}

export interface Drug {
  id: string
  name: string
  unit: string
  price: number | string
  isActive: boolean
}

export interface PrescriptionItem {
  id: string
  drugId: string
  quantity: number
  dosage: string
  unitPrice: number | string
  lineTotal: number | string
  drug: Drug
}

export interface Prescription {
  id: string
  examinationId: string
  note?: string | null
  items: PrescriptionItem[]
}

export interface ExaminationVisitPatient {
  id: string
  patientCode: string
  fullName: string
  phone?: string | null
  dob?: string | null
  gender?: string | null
}

export interface ExaminationVisit {
  id: string
  visitDate: string
  queueNumber: number
  status: string
  reason?: string | null
  patient: ExaminationVisitPatient
}

export interface Examination {
  id: string
  visitId: string
  doctorUserId: string
  status: ExaminationStatus
  symptoms?: string | null
  clinicalNotes?: string | null
  conclusion?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  visit: ExaminationVisit
  diagnoses: Diagnosis[]
  prescription?: Prescription | null
}

export interface UpdateExaminationRequest {
  symptoms?: string
  clinicalNotes?: string
  conclusion?: string
  diagnoses?: { diseaseId: string; isPrimary?: boolean }[]
}

export interface CreatePrescriptionRequest {
  note?: string
  items: { drugId: string; quantity: number; dosage: string }[]
}
