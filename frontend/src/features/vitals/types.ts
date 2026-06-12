export interface VitalSign {
  id: string
  visitId: string
  measuredById: string
  pulse: number | null
  systolicBp: number | null
  diastolicBp: number | null
  temperature: number | null
  spo2: number | null
  heightCm: number | null
  weightKg: number | null
  bmi: number | null
  note: string | null
  measuredAt: string
  createdAt: string
  measuredBy?: { fullName: string }
}

export interface CreateVitalSignPayload {
  visitId: string
  pulse?: number
  systolicBp?: number
  diastolicBp?: number
  temperature?: number
  spo2?: number
  heightCm?: number
  weightKg?: number
  note?: string
}
