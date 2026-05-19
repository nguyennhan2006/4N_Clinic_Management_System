import { apiClient } from '@/lib/api-client'
import type { MonthlyReportResponse } from './types'

export const reportApi = {
  getMonthly: (month: string) =>
    apiClient.get<MonthlyReportResponse>('/reports/monthly', { month }),
}
