export interface StockLot {
  id: string
  drugId: string
  lotNumber: string
  quantityOnHand: number
  quantityReceived: number
  unitCost: number
  expiryDate: string
  supplierId: string | null
  notes: string | null
  receivedById: string
  receivedAt: string
  createdAt: string
  drug?: {
    id: string
    name: string
    unit: string
    pricePerUnit: number
  }
}

export interface StockSummaryItem {
  drugId: string
  drugName: string
  unit: string
  totalOnHand: number
  lots: StockLot[]
}

export interface CreateStockLotPayload {
  drugId: string
  lotNumber: string
  quantityReceived: number
  unitCost: number
  expiryDate: string
  supplierId?: string
  notes?: string
}

export interface QueryStockParams {
  drugId?: string
  lowStock?: boolean
  expiringSoon?: boolean
}
