export type DispenseStatus = 'DISPENSED' | 'CANCELLED'

export interface DispenseItem {
  id: string
  dispenseId: string
  prescriptionItemId: string
  lotId: string              // schema field name (not stockLotId)
  drugId: string
  quantity: number
  unitPriceSnapshot: number
  drug?: { name: string; unit: string }
  lot?: { lotNumber: string; expiryDate: string }
}

export interface Dispense {
  id: string
  visitId: string
  prescriptionId: string
  dispensedById: string
  status: DispenseStatus
  totalAmount: number        // computed: sum(unitPriceSnapshot * quantity)
  note: string | null
  dispensedAt: string | null
  createdAt: string
  updatedAt: string
  items?: DispenseItem[]
  visit?: {
    id: string
    queueNumber?: number
    patient?: { id: string; fullName: string; phone?: string }
  }
  dispensedBy?: { fullName: string }
}

export interface PrescriptionItem {
  id: string
  drugId: string
  quantity: number
  dosageInstruction: string | null
  drug?: { id: string; name: string; unit: string; pricePerUnit: number }
}

export interface Prescription {
  id: string
  examinationId: string
  items?: PrescriptionItem[]
  examination?: {
    visit?: {
      id: string
      queueNumber?: number
      patient?: { id: string; fullName: string; phone?: string }
    }
    doctor?: { fullName: string }
  }
}

export interface CreateDispensePayload {
  visitId: string
  prescriptionId: string
  notes?: string
  items: {
    prescriptionItemId: string
    stockLotId: string
    quantity: number
  }[]
}

export interface QueryDispenseParams {
  visitId?: string
  status?: DispenseStatus
  date?: string
}
