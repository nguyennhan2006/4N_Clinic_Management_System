import { apiClient } from '@/lib/api-client'
import type {
  CreatePaymentRequest,
  InvoiceDetail,
  InvoiceListItem,
  QueryInvoicesParams,
} from './types'

export const invoiceApi = {
  list: (params?: QueryInvoicesParams) =>
    apiClient.get<InvoiceListItem[]>('/invoices', params as Record<string, string | undefined>),

  getById: (id: string) =>
    apiClient.get<InvoiceDetail>(`/invoices/${id}`),

  createFromVisit: (visitId: string) =>
    apiClient.post<InvoiceDetail>(`/visits/${visitId}/invoice`),

  createPayment: (invoiceId: string, data: CreatePaymentRequest) =>
    apiClient.post<InvoiceDetail>(`/invoices/${invoiceId}/payments`, data),
}
