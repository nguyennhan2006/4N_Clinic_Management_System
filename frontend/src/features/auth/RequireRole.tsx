import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from './types'
import { useAuthStore } from './store'

interface RequireRoleProps {
  roles: Role[]
}

export function RequireRole({ roles }: RequireRoleProps) {
  const hasRole = useAuthStore((s) => s.hasRole)

  if (!hasRole(roles)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
