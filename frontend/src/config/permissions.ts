import type { Role } from '@/features/auth/types'

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  RECEPTIONIST: 'Lễ tân',
  DOCTOR: 'Bác sĩ',
  CASHIER: 'Thu ngân',
  MANAGER: 'Quản lý',
  NURSE: 'Điều dưỡng',
  LAB_TECH: 'Kỹ thuật viên',
  PHARMACIST: 'Dược sĩ',
}

export const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-[#EEEAFB] text-[#6D5BD0] border-[#6D5BD0]',
  RECEPTIONIST: 'bg-[#D9F2F4] text-[#2E7D84] border-[#A7D8DE]',
  DOCTOR: 'bg-[#D6EFE0] text-[#2A7A4B] border-[#A8D5BA]',
  CASHIER: 'bg-[#FDF0E6] text-[#9A5B2C] border-[#F5C6AA]',
  MANAGER: 'bg-[#FDFAE8] text-[#8A6D00] border-[#F6D58E]',
  NURSE: 'bg-pink-50 text-pink-700 border-pink-200',
  LAB_TECH: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PHARMACIST: 'bg-teal-50 text-teal-700 border-teal-200',
}

export const ALL_ROLES: Role[] = ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'CASHIER', 'MANAGER', 'NURSE', 'LAB_TECH', 'PHARMACIST']
