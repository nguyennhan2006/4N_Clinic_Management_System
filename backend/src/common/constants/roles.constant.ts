// Role names — phải khớp Role.code trong seed.ts
export const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  RECEPTIONIST: 'RECEPTIONIST',
  CASHIER: 'CASHIER',
  MANAGER: 'MANAGER',
  NURSE: 'NURSE',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  PHARMACIST: 'PHARMACIST',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
