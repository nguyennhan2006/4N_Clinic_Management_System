import { apiClient } from '@/lib/api-client'
import type { MonthlyReportResponse, RevenueBreakdown } from './types'

export const reportApi = {
  getMonthly: (month: string) =>
    apiClient.get<MonthlyReportResponse>('/reports/monthly', { month }),

  getRevenueBreakdown: (month: string) =>
    apiClient.get<RevenueBreakdown>('/reports/revenue-breakdown', { month }),
}
