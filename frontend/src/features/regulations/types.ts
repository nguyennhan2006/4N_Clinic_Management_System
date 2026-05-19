export type RegulationKey = 'MAX_PATIENTS_PER_DAY' | 'CONSULTATION_FEE'

export interface RegulationItem {
  id: string
  key: RegulationKey
  value: string
}

export interface RegulationVersion {
  id: string
  isActive: boolean
  note?: string | null
  activatedAt?: string | null
  createdAt: string
  items: RegulationItem[]
}

export interface CreateRegulationRequest {
  note?: string
  items: { key: RegulationKey; value: string }[]
}
