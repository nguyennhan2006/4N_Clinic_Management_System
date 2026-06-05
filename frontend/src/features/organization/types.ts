export interface Department {
  id: string
  code: string
  name: string
  description: string | null
  isActive: boolean
  rooms?: Room[]
  _count?: { doctorProfiles: number }
  createdAt: string
  updatedAt: string
}

export interface Room {
  id: string
  departmentId: string
  code: string
  name: string
  roomType: 'CONSULTATION' | 'LAB' | 'PHARMACY' | 'PROCEDURE'
  isActive: boolean
  department?: { id: string; code: string; name: string }
}

export interface DoctorProfile {
  id: string
  userId: string
  departmentId: string
  title: string | null
  specialty: string | null
  isActive: boolean
  user?: { id: string; fullName: string; email: string | null }
  department?: { id: string; code: string; name: string }
  createdAt: string
}

export interface StaffSchedule {
  id: string
  userId: string
  departmentId: string
  roomId: string | null
  workDate: string
  startTime: string
  endTime: string
  slotDurationMinutes: number
  maxAppointments: number
  status: string
  user?: { id: string; fullName: string }
  department?: { id: string; name: string }
  room?: { id: string; name: string; code: string } | null
}

export interface CreateDepartmentPayload {
  code: string
  name: string
  description?: string
}

export interface CreateRoomPayload {
  departmentId: string
  code: string
  name: string
  roomType: string
}

export interface CreateDoctorProfilePayload {
  userId: string
  departmentId: string
  title?: string
  specialty?: string
}

export interface CreateStaffSchedulePayload {
  userId: string
  departmentId: string
  roomId?: string
  workDate: string
  startTime: string
  endTime: string
  slotDurationMinutes?: number
  maxAppointments?: number
}

export interface QueryScheduleParams {
  from?: string
  to?: string
  userId?: string
  departmentId?: string
}
