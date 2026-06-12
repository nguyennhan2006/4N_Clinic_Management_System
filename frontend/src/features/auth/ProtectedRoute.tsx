import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from './store'
import { authApi } from './api'
import { LoadingSpinner } from '@/components/common/LoadingState'

export function ProtectedRoute() {
  const { isAuthenticated, token, setUser, logout } = useAuthStore()
  const location = useLocation()
  const [bootstrapping, setBootstrapping] = useState(false)
  const [ready, setReady] = useState(!token || isAuthenticated)

  // On mount: if we have a token persisted but user may be stale,
  // verify via GET /auth/me to refresh user info.
  useEffect(() => {
    if (!token || !isAuthenticated) {
      setReady(true)
      return
    }

    // User already in store from persist — verify it's still valid via /me
    setBootstrapping(true)
    authApi
      .me()
      .then((me) => {
        setUser({ id: me.id, username: me.username, fullName: me.fullName, status: me.status, roles: me.roles })
      })
      .catch(() => {
        // Token invalid or expired → clear session
        logout()
      })
      .finally(() => {
        setBootstrapping(false)
        setReady(true)
      })
    // Run only once on mount — intentional empty dep after initial check
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (bootstrapping || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clinic-bg">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
