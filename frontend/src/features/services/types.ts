export type ServiceOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type ServiceType = 'CONSULTATION' | 'LAB_TEST' | 'IMAGING' | 'PROCEDURE' | 'OTHER'

export interface ServiceCatalog {
  id: string
  name: string
  type: ServiceType
  price: number
  description: string | null
  isActive: boolean
  createdAt: string
}

export interface ServiceOrder {
  id: string
  visitId: string
  serviceId: string
  status: ServiceOrderStatus
  isRequired: boolean
  priceSnapshot: number
  notes: string | null
  billingStatus: string
  orderedById: string
  createdAt: string
  service?: ServiceCatalog
  orderedBy?: { fullName: string }
}

export interface CreateServiceOrderPayload {
  visitId: string
  serviceId: string
  isRequired?: boolean
  notes?: string
}

export interface CreateServiceCatalogPayload {
  name: string
  type: ServiceType
  price: number
  description?: string
}

export interface UpdateServiceCatalogPayload {
  name?: string
  price?: number
  description?: string
  isActive?: boolean
}
