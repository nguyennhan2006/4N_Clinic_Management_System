export type DispenseStatus = 'DISPENSED' | 'CANCELLED'

export interface DispenseItem {
  id: string
  dispenseId: string
  prescriptionItemId: string
  stockLotId: string
  drugId: string
  quantity: number
  unitPriceSnapshot: number
  lineTotal: number
  stockLot?: { lotNumber: string; expiryDate: string }
  drug?: { name: string; unit: string }
}

export interface Dispense {
  id: string
  visitId: string
  prescriptionId: string
  dispensedById: string
  status: DispenseStatus
  totalAmount: number
  notes: string | null
  dispensedAt: string
  createdAt: string
  items?: DispenseItem[]
  visit?: {
    patient?: { fullName: string }
    queueNumber?: number
  }
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
