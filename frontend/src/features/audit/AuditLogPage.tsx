import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react'
import { formatDateTime } from '@/lib/date'
import { auditApi } from './api'
import type { AuditLog } from './types'
import { useAuthStore } from '@/features/auth/store'

export function AuditLogPage() {
  const { hasRole } = useAuthStore()
  const isAdmin = hasRole(['ADMIN'])

  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const LIMIT = 20

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { entityType, action, fromDate, toDate, page }],
    queryFn: () =>
      auditApi.listFlat({
        ...(entityType ? { entityType } : {}),
        ...(action ? { action } : {}),
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
        page,
        limit: LIMIT,
      }),
    enabled: isAdmin,
  })

  const logs: AuditLog[] = Array.isArray(data) ? data : []

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-clinic-muted">
        Chỉ Admin có quyền xem nhật ký hệ thống
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-clinic-sidebar" />
        <h1 className="text-xl font-semibold text-clinic-text">Nhật ký hệ thống (Audit Log)</h1>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Loại entity (User, Visit...)"
          value={entityType}
          onChange={(e) => { setEntityType(e.target.value); setPage(1) }}
          className="rounded-xl border border-clinic-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-primary"
        />
        <input
          type="text"
          placeholder="Hành động (CREATE, UPDATE...)"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
          className="rounded-xl border border-clinic-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-clinic-primary"
        />
        <div className="flex items-center gap-1">
          <label className="text-xs text-clinic-muted">Từ:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
            className="rounded-xl border border-clinic-border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-clinic-muted">Đến:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1) }}
            className="rounded-xl border border-clinic-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-clinic-border bg-white shadow-clinic">
        <table className="w-full text-sm">
          <thead className="border-b border-clinic-border bg-clinic-bg">
            <tr>
              <th className="w-8 px-2 py-3" />
              <th className="px-4 py-3 text-left font-semibold text-clinic-text">Thời gian</th>
              <th className="px-4 py-3 text-left font-semibold text-clinic-text">Người dùng</th>
              <th className="px-4 py-3 text-left font-semibold text-clinic-text">Hành động</th>
              <th className="px-4 py-3 text-left font-semibold text-clinic-text">Entity</th>
              <th className="px-4 py-3 text-left font-semibold text-clinic-text">IP</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))
            ) : !logs.length ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-clinic-muted">
                  Không có nhật ký nào
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="cursor-pointer border-b border-clinic-border last:border-0 hover:bg-clinic-bg/50"
                  >
                    <td className="px-2 py-3 text-center text-clinic-muted">
                      {expandedId === log.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3 text-xs text-clinic-muted">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-clinic-text">
                      {log.user?.fullName ?? log.userId ?? 'System'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.action.includes('DELETE') || log.action.includes('CANCEL')
                          ? 'bg-red-50 text-red-600'
                          : log.action.includes('CREATE')
                          ? 'bg-green-50 text-green-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-clinic-muted">
                      {log.entityType}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-clinic-muted">{log.ipAddress ?? '—'}</td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-expand`} className="bg-clinic-bg">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {log.oldValues && (
                            <div>
                              <p className="mb-1 font-semibold text-red-600">Giá trị cũ</p>
                              <pre className="overflow-auto rounded bg-white p-2 text-clinic-text">
                                {JSON.stringify(log.oldValues, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.newValues && (
                            <div>
                              <p className="mb-1 font-semibold text-green-600">Giá trị mới</p>
                              <pre className="overflow-auto rounded bg-white p-2 text-clinic-text">
                                {JSON.stringify(log.newValues, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded-lg border border-clinic-border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Trước
        </button>
        <span className="px-3 py-1.5 text-sm text-clinic-muted">Trang {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={(logs?.length ?? 0) < LIMIT}
          className="rounded-lg border border-clinic-border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
  )
}
