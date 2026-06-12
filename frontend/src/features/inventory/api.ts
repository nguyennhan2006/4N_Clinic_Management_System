import { apiClient } from '@/lib/api-client'
import type { CreateStockLotPayload, QueryStockParams, StockLot, StockSummaryItem } from './types'

export const inventoryApi = {
  listLots: (params?: QueryStockParams) =>
    apiClient.get<StockLot[]>('/inventory/lots', params as Record<string, string>),

  getSummary: (params?: QueryStockParams) =>
    apiClient.get<StockSummaryItem[]>('/inventory/stock', params as Record<string, string>),

  createLot: (data: CreateStockLotPayload) =>
    apiClient.post<StockLot>('/inventory/lots', data),
}
