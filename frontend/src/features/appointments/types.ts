export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'CANCELLED' | 'NO_SHOW'

export interface Appointment {
  id: string
  patientId: string
  doctorProfileId: string
  departmentId: string
  roomId: string | null
  scheduleId: string | null
  scheduledAt: string
  durationMinutes: number
  status: AppointmentStatus
  reason: string | null
  createdById: string
  createdAt: string
  updatedAt: string
  patient?: { id: string; fullName: string; phone: string | null }
  doctorProfile?: {
    id: string
    title: string | null
    specialty: string | null
    user?: { fullName: string }
    department?: { name: string }
  }
  visit?: { id: string; status: string; queueNumber: number } | null
}

export interface CreateAppointmentPayload {
  patientId: string
  doctorProfileId: string
  departmentId: string
  roomId?: string
  scheduleId?: string
  scheduledAt: string
  durationMinutes?: number
  reason?: string
}

export interface UpdateAppointmentPayload {
  scheduledAt?: string
  durationMinutes?: number
  reason?: string
  roomId?: string
}

export interface QueryAppointmentParams {
  date?: string
  doctorProfileId?: string
  patientId?: string
  status?: AppointmentStatus
  departmentId?: string
}
