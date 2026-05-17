// Role names — phải khớp Role.name trong seed.ts
export const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  RECEPTIONIST: 'RECEPTIONIST',
  CASHIER: 'CASHIER',
  MANAGER: 'MANAGER',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
