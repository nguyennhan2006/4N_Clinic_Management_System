import { apiClient } from '@/lib/api-client'
import type {
  CreateServiceCatalogPayload,
  CreateServiceOrderPayload,
  ServiceCatalog,
  ServiceOrder,
  UpdateServiceCatalogPayload,
} from './types'

export const serviceCatalogApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<ServiceCatalog[]>('/service-catalog', params),

  create: (data: CreateServiceCatalogPayload) =>
    apiClient.post<ServiceCatalog>('/service-catalog', data),

  update: (id: string, data: UpdateServiceCatalogPayload) =>
    apiClient.patch<ServiceCatalog>(`/service-catalog/${id}`, data),
}

export const serviceOrderApi = {
  listByVisit: (visitId: string) =>
    apiClient.get<ServiceOrder[]>('/service-orders', { visitId }),

  create: (data: CreateServiceOrderPayload) =>
    apiClient.post<ServiceOrder>('/service-orders', data),

  updateStatus: (id: string, status: string) =>
    apiClient.patch<ServiceOrder>(`/service-orders/${id}/status`, { status }),

  cancel: (id: string) =>
    apiClient.patch<ServiceOrder>(`/service-orders/${id}/status`, { status: 'CANCELLED' }),
}
