import { useQuery } from '@tanstack/react-query'
import { Stethoscope } from 'lucide-react'

import { organizationApi } from './api'
import type { DoctorProfile } from './types'
import { useAuthStore } from '@/features/auth/store'

function DoctorCard({ doctor }: { doctor: DoctorProfile }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-clinic-border bg-clinic-surface p-4 shadow-clinic">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-clinic-primary/15">
        <Stethoscope className="h-5 w-5 text-clinic-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-clinic-text">
          {doctor.title ? `${doctor.title} ` : ''}{doctor.user?.fullName ?? '—'}
        </p>
        <p className="text-sm text-clinic-muted">{doctor.user?.email ?? '—'}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {doctor.department && (
            <span className="rounded-full bg-clinic-primary/15 px-2.5 py-0.5 text-xs text-clinic-primary">
              {doctor.department.name}
            </span>
          )}
          {doctor.specialty && (
            <span className="rounded-full bg-clinic-secondary/20 px-2.5 py-0.5 text-xs text-teal-400">
              {doctor.specialty}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            doctor.isActive
              ? 'bg-green-500/15 text-green-400'
              : 'bg-red-500/15 text-red-400'
          }`}>
            {doctor.isActive ? 'Đang làm việc' : 'Nghỉ'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function DoctorProfilePage() {
  const { hasRole } = useAuthStore()
  const isAdmin = hasRole(['ADMIN'])

  const { data: doctors, isLoading, isError } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => organizationApi.listDoctors(),
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-clinic-danger/10 p-4 text-clinic-danger">
          Không thể tải danh sách bác sĩ.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinic-primary/15">
            <Stethoscope className="h-5 w-5 text-clinic-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-clinic-text">Hồ sơ bác sĩ</h1>
            <p className="text-sm text-clinic-muted">{doctors?.length ?? 0} bác sĩ đang hoạt động</p>
          </div>
        </div>
      </div>

      {!doctors?.length ? (
        <div className="rounded-xl border border-dashed border-clinic-border py-16 text-center">
          <Stethoscope className="mx-auto mb-3 h-10 w-10 text-clinic-border" />
          <p className="text-sm text-clinic-muted">Chưa có hồ sơ bác sĩ nào</p>
          {isAdmin && (
            <p className="mt-1 text-xs text-clinic-muted">
              Tạo hồ sơ trong Admin → Tài khoản → gán role DOCTOR
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  )
}
