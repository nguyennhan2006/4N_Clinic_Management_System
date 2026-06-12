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
    revenueByType?: {
      CONSULTATION?: number
      SERVICE?: number
      DRUG?: number
    }
  }
}

export interface RevenueBreakdown {
  month: string
  byType: {
    CONSULTATION: number
    SERVICE: number
    DRUG: number
  }
  total: number
}
