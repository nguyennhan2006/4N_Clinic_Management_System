export interface MonthlyReportResponse {
  month: string
  visits: {
    total: number
    byStatus: Record<string, number>
  }
  completedVisits: number
  revenue: {
    totalBilled: number
    totalCollected: number
    paidCount: number
    partialCount: number
  }
}
