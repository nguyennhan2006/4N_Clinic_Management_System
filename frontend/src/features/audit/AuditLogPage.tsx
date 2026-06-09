import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ShieldCheck, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/date'
import { auditApi } from './api'
import type { AuditLog } from './types'
import { useAuthStore } from '@/features/auth/store'

const LIMIT = 30

export function AuditLogPage() {
  const { hasRole } = useAuthStore()
  const isAdmin = hasRole(['ADMIN', 'MANAGER'])

  const [entityType, setEntityType] = useState('')
  const [actorId, setActorId] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Debounce filter inputs to avoid spamming requests while typing
  const [debouncedEntityType, setDebouncedEntityType] = useState('')
  const [debouncedActorId, setDebouncedActorId] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedEntityType(entityType), 400)
    return () => clearTimeout(t)
  }, [entityType])
  useEffect(() => {
    const t = setTimeout(() => setDebouncedActorId(actorId), 400)
    return () => clearTimeout(t)
  }, [actorId])

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['audit-logs', { entityType: debouncedEntityType, actorId: debouncedActorId }],
    queryFn: ({ pageParam = 1 }) =>
      auditApi.list({
        ...(debouncedEntityType ? { entityType: debouncedEntityType } : {}),
        ...(debouncedActorId ? { actorId: debouncedActorId } : {}),
        page: pageParam as number,
        limit: LIMIT,
      }),
    getNextPageParam: (lastPage) => {
      const loaded = (lastPage.page - 1) * lastPage.limit + lastPage.data.length
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: isAdmin,
  })

  // Flatten pages into a single list
  const logs: AuditLog[] = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.total ?? 0

  // Sentinel div at the bottom — triggers fetchNextPage when visible
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-clinic-muted">
        Chỉ Admin/Manager có quyền xem nhật ký hệ thống
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clinic-primary/15">
          <ShieldCheck className="h-5 w-5 text-clinic-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-clinic-text">Nhật ký hệ thống (Audit Log)</h1>
          {total > 0 && (
            <p className="text-xs text-clinic-muted">
              Hiển thị {logs.length} / {total} bản ghi
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Loại entity (Patient, Visit, Examination…)"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="rounded-xl border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40"
        />
        <input
          type="text"
          placeholder="Actor ID (UUID người thực hiện)"
          value={actorId}
          onChange={(e) => setActorId(e.target.value)}
          className="rounded-xl border border-clinic-border bg-clinic-bg px-3 py-2 text-sm text-clinic-text focus:outline-none focus:ring-2 focus:ring-clinic-primary/40 font-mono"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-clinic-border bg-clinic-surface shadow-clinic">
        <table className="w-full text-sm">
          <thead className="border-b border-clinic-border bg-clinic-bg">
            <tr>
              <th className="w-8 px-2 py-3" />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Thời gian</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Actor ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Hành động</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-clinic-muted">Entity</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 12 }).map((_, i) => (
                <tr key={i} className="border-b border-clinic-border last:border-0">
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-clinic-border" />
                  </td>
                </tr>
              ))
            ) : !logs.length ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-clinic-muted">
                  Không có nhật ký nào
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="cursor-pointer border-b border-clinic-border last:border-0 hover:bg-clinic-primary/5 transition-colors"
                  >
                    <td className="px-2 py-3 text-center text-clinic-muted">
                      {expandedId === log.id
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3 text-xs text-clinic-muted whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-clinic-muted">
                      {log.actorId
                        ? log.actorId.slice(0, 8) + '…'
                        : <span className="italic">System</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.action.includes('DELETE') || log.action.includes('CANCEL') || log.action.includes('FAIL')
                          ? 'bg-red-500/15 text-red-400'
                          : log.action.includes('CREATE') || log.action.includes('SUCCESS')
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-clinic-muted">
                      {log.entityType}
                      {log.entityId ? (
                        <span className="ml-1 font-mono text-xs opacity-60">
                          #{log.entityId.slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                  </tr>

                  {expandedId === log.id && (
                    <tr key={`${log.id}-expand`} className="bg-clinic-bg">
                      <td colSpan={5} className="px-6 py-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {log.before ? (
                            <div>
                              <p className="mb-1 font-semibold text-red-400">Trạng thái cũ (before)</p>
                              <pre className="overflow-auto rounded-lg bg-black/5 p-2 text-clinic-text">
                                {JSON.stringify(log.before, null, 2)}
                              </pre>
                            </div>
                          ) : null}
                          {log.after ? (
                            <div>
                              <p className="mb-1 font-semibold text-green-400">Trạng thái mới (after)</p>
                              <pre className="overflow-auto rounded-lg bg-black/5 p-2 text-clinic-text">
                                {JSON.stringify(log.after, null, 2)}
                              </pre>
                            </div>
                          ) : null}
                          {!log.before && !log.after && (
                            <p className="col-span-2 italic text-clinic-muted">Không có chi tiết thay đổi</p>
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

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="mt-4 flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-sm text-clinic-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải thêm…
          </div>
        )}
        {!hasNextPage && logs.length > 0 && (
          <p className="text-xs text-clinic-muted">— Đã hiển thị tất cả {total} bản ghi —</p>
        )}
      </div>
    </div>
  )
}
