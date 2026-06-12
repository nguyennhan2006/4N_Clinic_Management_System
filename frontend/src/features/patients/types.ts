export interface Patient {
  id: string
  patientCode: string
  fullName: string
  dob: string | null
  gender: string | null
  phone: string | null
  citizenId: string | null
  address: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePatientRequest {
  fullName: string
  dob?: string
  gender?: string
  phone?: string
  citizenId?: string
  address?: string
}

export interface MedicalHistoryEntry {
  id: string
  visitDate: string
  queueNumber: number
  reason: string | null
  status: string
  examination: {
    id: string
    status: string
    symptoms: string | null
    clinicalNotes: string | null
    conclusion: string | null
    completedAt: string | null
    doctor?: { id: string; fullName: string } | null
    diagnoses: Array<{
      id: string
      name: string
      isPrimary: boolean
      disease?: { id: string; code: string; name: string } | null
    }>
    prescription: {
      id: string
      note: string | null
      items: Array<{
        id: string
        quantity: number
        dosage: string
        unitPrice: string | number
        lineTotal: string | number
        drug?: { id: string; name: string; unit: string } | null
      }>
    } | null
  } | null
  invoice: {
    id: string
    totalAmount: string | number
    paidAmount: string | number
    status: string
  } | null
}

export interface MedicalHistoryResponse {
  patient: Patient
  total: number
  histories: MedicalHistoryEntry[]
}
