import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, Stethoscope, Receipt,
  BarChart3, BookOpen, Pill, Settings, UserCog, LogOut, Building2,
  CalendarCheck, ListOrdered, FlaskConical, Package, LayoutList, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/features/auth/store'
import { navigationConfig } from '@/config/navigation'
import type { NavItem } from '@/config/navigation'
import { RoleBadge } from './RoleBadge'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Receipt,
  BarChart3,
  BookOpen,
  Pill,
  Settings,
  UserCog,
  Building2,
  CalendarCheck,
  ListOrdered,
  FlaskConical,
  Package,
  LayoutList,
  ShieldCheck,
}

function NavItemLink({ item }: { item: NavItem }) {
  const Icon = ICON_MAP[item.icon]
  return (
    <NavLink
      to={item.path}
      end={item.path === '/app/dashboard'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-clinic-surface text-clinic-sidebar shadow-[0_2px_8px_rgba(109,91,208,0.15)]'
            : 'text-white/80 hover:bg-white/10 hover:text-white',
        )
      }
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="truncate">{item.label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { user, logout, hasRole } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-clinic-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <span className="text-base font-bold text-white">4N</span>
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">4N Clinic</p>
          <p className="text-[10px] leading-tight text-white/60">Management System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main navigation">
        {navigationConfig.map((section, sectionIndex) => {
          const visibleItems = section.items.filter((item) => hasRole(item.roles))
          if (visibleItems.length === 0) return null

          return (
            <div key={sectionIndex} className="mb-2">
              {section.title && (
                <p className="mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavItemLink key={item.path} item={item} />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-white/10 px-4 py-4">
        {user && (
          <div className="mb-3">
            <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
            <p className="mb-1.5 truncate text-xs text-white/60">@{user.username}</p>
            {user.roles[0] && <RoleBadge role={user.roles[0]} />}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
