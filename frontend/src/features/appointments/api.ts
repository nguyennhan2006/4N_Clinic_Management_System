import { apiClient } from '@/lib/api-client'
import type {
  Appointment,
  CreateAppointmentPayload,
  QueryAppointmentParams,
  UpdateAppointmentPayload,
} from './types'

export const appointmentApi = {
  list: (params?: QueryAppointmentParams) =>
    apiClient.get<Appointment[]>('/appointments', params as Record<string, string | undefined>),

  get: (id: string) =>
    apiClient.get<Appointment>(`/appointments/${id}`),

  create: (data: CreateAppointmentPayload) =>
    apiClient.post<Appointment>('/appointments', data),

  update: (id: string, data: UpdateAppointmentPayload) =>
    apiClient.patch<Appointment>(`/appointments/${id}`, data),

  cancel: (id: string) =>
    apiClient.patch<Appointment>(`/appointments/${id}/cancel`, {}),

  checkin: (id: string, roomId?: string) =>
    apiClient.post<{ visit: { id: string; queueNumber: number }; ticket: { id: string; queueNumber: number } }>(
      `/appointments/${id}/checkin`,
      { roomId },
    ),
}
