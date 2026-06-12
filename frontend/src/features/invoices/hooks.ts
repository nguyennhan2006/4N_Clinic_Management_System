import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoiceApi } from './api'
import type { CreatePaymentRequest, QueryInvoicesParams } from './types'

export const INVOICE_KEYS = {
  all: ['invoices'] as const,
  list: (params?: QueryInvoicesParams) => ['invoices', 'list', params ?? {}] as const,
  detail: (id: string) => ['invoices', 'detail', id] as const,
}

export function useInvoicesQuery(params?: QueryInvoicesParams) {
  return useQuery({
    queryKey: INVOICE_KEYS.list(params),
    queryFn: () => invoiceApi.list(params),
  })
}

export function useInvoiceQuery(id: string) {
  return useQuery({
    queryKey: INVOICE_KEYS.detail(id),
    queryFn: () => invoiceApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateInvoiceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (visitId: string) => invoiceApi.createFromVisit(visitId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all })
    },
  })
}

export function useCreatePaymentMutation(invoiceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePaymentRequest) => invoiceApi.createPayment(invoiceId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.detail(invoiceId) })
      void queryClient.invalidateQueries({ queryKey: INVOICE_KEYS.all })
    },
  })
}
