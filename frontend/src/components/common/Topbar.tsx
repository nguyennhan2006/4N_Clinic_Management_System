import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, LogOut, Moon, Sun, User } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store'
import { authApi } from '@/features/auth/api'
import { useTheme } from '@/hooks/useTheme'
import { RoleBadge } from './RoleBadge'

export function Topbar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const logout = useAuthStore((s) => s.logout)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { theme, toggle } = useTheme()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleLogout = () => {
    setMenuOpen(false)
    authApi.logout(refreshToken ?? undefined).catch(() => {
      // best-effort: revoke server-side refresh token; local logout proceeds regardless
    })
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-clinic-border bg-clinic-surface/80 backdrop-blur-sm px-6">
      {/* Left: breadcrumb slot (empty for now) */}
      <div className="flex-1" />

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Notifications bell */}
        <button
          aria-label="Thông báo"
          className="rounded-lg p-1.5 text-clinic-muted transition hover:bg-clinic-bg hover:text-clinic-text"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          className="rounded-lg p-1.5 text-clinic-muted transition hover:bg-clinic-bg hover:text-clinic-text"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition hover:bg-clinic-bg"
          >
            {/* Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clinic-primary/20 text-sm font-semibold text-clinic-primary">
              {user?.fullName?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />}
            </div>

            {/* Name + role — hidden on very small screens */}
            <div className="hidden text-left sm:block">
              <p className="max-w-35 truncate text-sm font-medium leading-tight text-clinic-text">
                {user?.fullName ?? ''}
              </p>
              {user?.roles?.[0] && (
                <p className="text-[10px] leading-tight text-clinic-muted">{user.roles[0]}</p>
              )}
            </div>

            <ChevronDown
              className={`h-4 w-4 text-clinic-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-clinic-border bg-clinic-surface p-2 shadow-clinic"
            >
              {/* User info header */}
              {user && (
                <div className="mb-1 px-3 py-2">
                  <p className="truncate text-sm font-medium text-clinic-text">{user.fullName}</p>
                  <p className="truncate text-xs text-clinic-muted">{user.username}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {user.roles.map((r) => (
                      <RoleBadge key={r} role={r} />
                    ))}
                  </div>
                </div>
              )}

              <div className="my-1 border-t border-clinic-border" />

              {/* Logout */}
              <button
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-clinic-muted transition hover:bg-red-500/10 hover:text-clinic-danger"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
