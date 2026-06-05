import { apiClient } from '@/lib/api-client'
import type {
  Department,
  Room,
  DoctorProfile,
  StaffSchedule,
  CreateDepartmentPayload,
  CreateRoomPayload,
  CreateDoctorProfilePayload,
  CreateStaffSchedulePayload,
  QueryScheduleParams,
} from './types'

export const organizationApi = {
  listDepartments: (activeOnly?: boolean) =>
    apiClient.get<Department[]>(
      '/organization/departments',
      activeOnly !== undefined ? { activeOnly } : {},
    ),
  createDepartment: (data: CreateDepartmentPayload) =>
    apiClient.post<Department>('/organization/departments', data),
  updateDepartment: (
    id: string,
    data: Partial<CreateDepartmentPayload> & { isActive?: boolean },
  ) => apiClient.patch<Department>(`/organization/departments/${id}`, data),

  listRooms: (departmentId?: string) =>
    apiClient.get<Room[]>(
      '/organization/rooms',
      departmentId ? { departmentId } : {},
    ),
  createRoom: (data: CreateRoomPayload) =>
    apiClient.post<Room>('/organization/rooms', data),
  updateRoom: (id: string, data: { name?: string; isActive?: boolean }) =>
    apiClient.patch<Room>(`/organization/rooms/${id}`, data),

  listDoctors: () =>
    apiClient.get<DoctorProfile[]>('/organization/doctors'),
  createDoctorProfile: (data: CreateDoctorProfilePayload) =>
    apiClient.post<DoctorProfile>('/organization/doctors', data),
  updateDoctorProfile: (
    id: string,
    data: Partial<Omit<CreateDoctorProfilePayload, 'userId'>> & { isActive?: boolean },
  ) => apiClient.patch<DoctorProfile>(`/organization/doctors/${id}`, data),

  listSchedules: (params: QueryScheduleParams) =>
    apiClient.get<StaffSchedule[]>('/organization/schedules', params as Record<string, string | undefined>),
  createSchedule: (data: CreateStaffSchedulePayload) =>
    apiClient.post<StaffSchedule>('/organization/schedules', data),
  deleteSchedule: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/organization/schedules/${id}`),
}
