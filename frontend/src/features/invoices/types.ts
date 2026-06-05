export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD'

export interface InvoiceListItem {
  id: string
  status: InvoiceStatus
  totalAmount: number | string
  paidAmount: number | string
  createdAt: string
  visit: {
    id: string
    visitDate: string
    patient: {
      id: string
      patientCode: string
      fullName: string
      phone?: string | null
    }
  }
}

export type InvoiceItemType = 'CONSULTATION' | 'SERVICE' | 'DRUG' | 'OTHER'

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number | string
  lineTotal: number | string
  itemType?: InvoiceItemType
  referenceType?: string
  referenceId?: string
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number | string
  method: PaymentMethod
  note?: string | null
  createdAt: string
}

export interface InvoiceDetail {
  id: string
  visitId: string
  status: InvoiceStatus
  totalAmount: number | string
  paidAmount: number | string
  createdAt: string
  updatedAt: string
  items: InvoiceItem[]
  payments: Payment[]
  visit: {
    id: string
    visitDate: string
    patient: {
      id: string
      patientCode: string
      fullName: string
      phone?: string | null
      gender?: string | null
    }
  }
}

export interface QueryInvoicesParams {
  keyword?: string
  status?: InvoiceStatus
  date?: string
}

export interface CreatePaymentRequest {
  amount: number
  method: PaymentMethod
  note?: string
}
