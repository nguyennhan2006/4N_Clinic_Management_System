import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingSpinner } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useAuthStore } from '@/features/auth/store'
import { formatDate, formatDateTime } from '@/lib/date'
import { formatVND } from '@/lib/money'
import { isApiError } from '@/lib/errors'
import type { Disease, Drug } from './types'
import {
  useCompleteExaminationMutation,
  useDiseasesQuery,
  useDrugsQuery,
  useExaminationQuery,
  useUpdateExaminationMutation,
  useUpsertPrescriptionMutation,
} from './hooks'

const inputCls = 'w-full rounded-xl border border-clinic-border bg-clinic-bg px-3.5 py-2.5 text-sm text-clinic-text outline-none transition focus:border-clinic-primary focus:ring-2 focus:ring-clinic-primary/20'

// ─── Diagnosis Section ───────────────────────────────────────────────────────

interface DiagnosisRow {
  diseaseId: string
  disease: Disease | null
  isPrimary: boolean
}

function DiagnosisSection({
  diagnoses,
  diseases,
  isReadOnly,
  onChange,
}: {
  diagnoses: DiagnosisRow[]
  diseases: Disease[]
  isReadOnly: boolean
  onChange: (rows: DiagnosisRow[]) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = diseases.filter(
    (d) =>
      d.isActive &&
      !diagnoses.some((r) => r.diseaseId === d.id) &&
      (d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.code.toLowerCase().includes(query.toLowerCase())),
  )

  const addDisease = (d: Disease) => {
    onChange([...diagnoses, { diseaseId: d.id, disease: d, isPrimary: diagnoses.length === 0 }])
    setQuery('')
  }

  const removeRow = (idx: number) => {
    const next = diagnoses.filter((_, i) => i !== idx)
    // ensure one primary if any remain
    if (next.length > 0 && !next.some((r) => r.isPrimary)) {
      next[0].isPrimary = true
    }
    onChange(next)
  }

  const setPrimary = (idx: number) => {
    onChange(diagnoses.map((r, i) => ({ ...r, isPrimary: i === idx })))
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-clinic-muted">Chẩn đoán</h3>

      {diagnoses.length > 0 && (
        <div className="space-y-2">
          {diagnoses.map((row, idx) => (
            <div
              key={row.diseaseId}
              className="flex items-center gap-3 rounded-xl border border-clinic-border bg-clinic-bg px-4 py-2.5"
            >
              <div className="flex-1">
                <span className="text-sm font-medium text-clinic-text">{row.disease?.name ?? row.diseaseId}</span>
                <span className="ml-2 text-xs text-clinic-muted">{row.disease?.code}</span>
              </div>
              {row.isPrimary ? (
                <span className="rounded-full bg-clinic-primary/10 px-2 py-0.5 text-xs font-medium text-clinic-primary">
                  Chính
                </span>
              ) : (
                !isReadOnly && (
                  <button
                    type="button"
                    onClick={() => setPrimary(idx)}
                    className="text-xs text-clinic-muted transition hover:text-clinic-primary"
                  >
                    Đặt chính
                  </button>
                )
              )}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="text-clinic-muted transition hover:text-clinic-danger"
                  aria-label="Xóa chẩn đoán"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!isReadOnly && (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm bệnh theo tên hoặc mã..."
            className={inputCls}
          />
          {query && filtered.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-clinic-border bg-clinic-surface shadow-clinic">
              {filtered.slice(0, 8).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => addDisease(d)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-clinic-bg border-b border-clinic-border last:border-0"
                >
                  <span className="font-mono text-xs text-clinic-muted w-16 shrink-0">{d.code}</span>
                  <span className="text-sm text-clinic-text">{d.name}</span>
                </button>
              ))}
            </div>
          )}
          {query && filtered.length === 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-clinic-border bg-clinic-surface px-4 py-3 text-sm text-clinic-muted shadow-clinic">
              Không tìm thấy bệnh phù hợp.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Prescription Section ─────────────────────────────────────────────────────

interface PrescriptionRow {
  drugId: string
  drug: Drug | null
  quantity: number
  dosage: string
}

function PrescriptionSection({
  items,
  drugs,
  note,
  isReadOnly,
  onItemsChange,
  onNoteChange,
}: {
  items: PrescriptionRow[]
  drugs: Drug[]
  note: string
  isReadOnly: boolean
  onItemsChange: (rows: PrescriptionRow[]) => void
  onNoteChange: (note: string) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = drugs.filter(
    (d) =>
      d.isActive &&
      !items.some((r) => r.drugId === d.id) &&
      d.name.toLowerCase().includes(query.toLowerCase()),
  )

  const addDrug = (d: Drug) => {
    onItemsChange([...items, { drugId: d.id, drug: d, quantity: 1, dosage: '' }])
    setQuery('')
  }

  const removeRow = (idx: number) => onItemsChange(items.filter((_, i) => i !== idx))

  const updateRow = (idx: number, patch: Partial<PrescriptionRow>) =>
    onItemsChange(items.map((r, i) => (i === idx ? { ...r, ...patch } : r)))

  const total = items.reduce(
    (sum, r) => sum + Number(r.drug?.price ?? 0) * r.quantity,
    0,
  )

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-clinic-muted">Đơn thuốc</h3>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((row, idx) => (
            <div key={row.drugId} className="rounded-xl border border-clinic-border bg-clinic-bg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-clinic-text">
                    {row.drug?.name ?? row.drugId}
                    <span className="ml-2 text-xs text-clinic-muted">{row.drug?.unit}</span>
                  </div>
                  <div className="text-xs text-clinic-muted">
                    {formatVND(Number(row.drug?.price ?? 0))} / đơn vị
                  </div>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-clinic-muted transition hover:text-clinic-danger"
                    aria-label="Xóa thuốc"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-clinic-muted">Số lượng</label>
                  {isReadOnly ? (
                    <span className="text-sm text-clinic-text">{row.quantity}</span>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) => updateRow(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className={inputCls}
                    />
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-clinic-muted">Cách dùng</label>
                  {isReadOnly ? (
                    <span className="text-sm text-clinic-text">{row.dosage || '—'}</span>
                  ) : (
                    <input
                      type="text"
                      value={row.dosage}
                      onChange={(e) => updateRow(idx, { dosage: e.target.value })}
                      placeholder="VD: 2 viên/ngày sau ăn"
                      className={inputCls}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end rounded-xl bg-clinic-primary/5 px-4 py-2.5">
            <span className="text-sm font-semibold text-clinic-text">
              Tổng tiền thuốc: {formatVND(total)}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-clinic-muted">Chưa có thuốc trong đơn.</p>
      )}

      {!isReadOnly && (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm thuốc theo tên..."
            className={inputCls}
          />
          {query && filtered.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-clinic-border bg-clinic-surface shadow-clinic">
              {filtered.slice(0, 8).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => addDrug(d)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-clinic-bg border-b border-clinic-border last:border-0"
                >
                  <span className="text-sm text-clinic-text">{d.name}</span>
                  <span className="text-xs text-clinic-muted">{d.unit} · {formatVND(Number(d.price))}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-clinic-muted">Ghi chú đơn thuốc</label>
        {isReadOnly ? (
          <p className="text-sm text-clinic-text">{note || '—'}</p>
        ) : (
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={2}
            placeholder="Hướng dẫn dùng thuốc chung..."
            className={`${inputCls} resize-none`}
          />
        )}
      </div>
    </div>
  )
}

// ─── Main ExaminationPage ─────────────────────────────────────────────────────

export function ExaminationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const hasRole = useAuthStore((s) => s.hasRole)
  const canEdit = hasRole(['ADMIN', 'DOCTOR'])

  const { data: exam, isLoading, error, refetch } = useExaminationQuery(id ?? '')
  const { data: diseases = [] } = useDiseasesQuery()
  const { data: drugs = [] } = useDrugsQuery()

  const updateMutation = useUpdateExaminationMutation(id ?? '')
  const upsertPrescriptionMutation = useUpsertPrescriptionMutation(id ?? '')
  const completeMutation = useCompleteExaminationMutation(id ?? '')

  // Form state
  const [symptoms, setSymptoms] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [conclusion, setConclusion] = useState('')
  const [diagnosisRows, setDiagnosisRows] = useState<{ diseaseId: string; disease: { id: string; code: string; name: string; isActive: boolean } | null; isPrimary: boolean }[]>([])
  const [prescriptionItems, setPrescriptionItems] = useState<{ drugId: string; drug: { id: string; name: string; unit: string; price: number | string; isActive: boolean } | null; quantity: number; dosage: string }[]>([])
  const [prescriptionNote, setPrescriptionNote] = useState('')
  const [formInitialized, setFormInitialized] = useState(false)

  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)

  // Init form from loaded exam
  if (exam && !formInitialized) {
    setSymptoms(exam.symptoms ?? '')
    setClinicalNotes(exam.clinicalNotes ?? '')
    setConclusion(exam.conclusion ?? '')
    setDiagnosisRows(
      exam.diagnoses.map((d) => ({
        diseaseId: d.diseaseId,
        disease: d.disease,
        isPrimary: d.isPrimary,
      })),
    )
    if (exam.prescription) {
      setPrescriptionItems(
        exam.prescription.items.map((item) => ({
          drugId: item.drugId,
          drug: item.drug,
          quantity: item.quantity,
          dosage: item.dosage,
        })),
      )
      setPrescriptionNote(exam.prescription.note ?? '')
    }
    setFormInitialized(true)
  }

  const isReadOnly = !canEdit || exam?.status === 'COMPLETED' || exam?.status === 'CANCELLED'

  const handleSave = async () => {
    setSaveError(null)
    setSaveMsg(null)
    try {
      await updateMutation.mutateAsync({
        symptoms: symptoms || undefined,
        clinicalNotes: clinicalNotes || undefined,
        conclusion: conclusion || undefined,
        diagnoses: diagnosisRows.map((r) => ({ diseaseId: r.diseaseId, isPrimary: r.isPrimary })),
      })

      if (prescriptionItems.length > 0) {
        await upsertPrescriptionMutation.mutateAsync({
          note: prescriptionNote || undefined,
          items: prescriptionItems.map((r) => ({
            drugId: r.drugId,
            quantity: r.quantity,
            dosage: r.dosage,
          })),
        })
      }

      setSaveMsg('Đã lưu phiếu khám.')
      setTimeout(() => setSaveMsg(null), 3000)
    } catch (err) {
      const msg = isApiError(err) ? err.message : 'Lưu phiếu khám thất bại.'
      setSaveError(msg)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    setCompleteError(null)
    try {
      await completeMutation.mutateAsync()
      setShowCompleteConfirm(false)
      navigate('/app/visits')
    } catch (err) {
      const msg = isApiError(err)
        ? err.status === 400
          ? err.message
          : err.message
        : 'Hoàn tất phiếu khám thất bại.'
      setCompleteError(msg)
    } finally {
      setCompleting(false)
      setShowCompleteConfirm(false)
    }
  }

  if (isLoading) return <LoadingSpinner className="mt-20" />
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phiếu khám bệnh"
        description={`Bệnh nhân: ${exam?.visit.patient.fullName ?? '—'} · Số thứ tự: ${exam?.visit.queueNumber ?? '—'}`}
        action={
          canEdit && exam?.status === 'OPEN' ? (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending || upsertPrescriptionMutation.isPending}
                className="rounded-xl border border-clinic-border px-4 py-2 text-sm font-medium text-clinic-text transition hover:bg-clinic-bg disabled:opacity-60"
              >
                {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                onClick={() => setShowCompleteConfirm(true)}
                className="flex items-center gap-2 rounded-xl bg-clinic-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-clinic-primary-hover"
              >
                <CheckCircle className="h-4 w-4" />
                Hoàn tất khám
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Complete confirmation dialog */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-clinic-surface p-6 shadow-clinic">
            <h2 className="text-lg font-semibold text-clinic-text">Xác nhận hoàn tất khám</h2>
            <p className="mt-2 text-sm text-clinic-muted">
              Sau khi hoàn tất, phiếu khám sẽ không thể chỉnh sửa. Chắc chắn hoàn tất?
            </p>
            <p className="mt-1 text-xs text-clinic-muted">
              Yêu cầu: có triệu chứng, kết luận và ít nhất 1 chẩn đoán chính.
            </p>
            {completeError && (
              <p className="mt-3 rounded-xl bg-[#FEE2E2] px-4 py-2 text-sm text-clinic-danger">{completeError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setShowCompleteConfirm(false); setCompleteError(null) }}
                className="rounded-xl border border-clinic-border px-4 py-2 text-sm text-clinic-muted transition hover:bg-clinic-bg"
              >
                Hủy
              </button>
              <button
                onClick={() => void handleComplete()}
                disabled={completing}
                className="rounded-xl bg-clinic-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
              >
                {completing ? 'Đang hoàn tất...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {saveMsg && (
        <div className="rounded-xl bg-[#D1FAE5] px-4 py-3 text-sm text-[#065F46]">{saveMsg}</div>
      )}
      {saveError && (
        <div role="alert" className="rounded-xl bg-[#FEE2E2] px-4 py-3 text-sm text-clinic-danger">{saveError}</div>
      )}

      {/* Context cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-clinic-surface p-5 shadow-clinic">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-clinic-muted">Thông tin bệnh nhân</h2>
          <div className="space-y-1.5">
            <div className="text-sm font-medium text-clinic-text">{exam?.visit.patient.fullName}</div>
            <div className="text-xs text-clinic-muted">{exam?.visit.patient.patientCode}</div>
            {exam?.visit.patient.dob && (
              <div className="text-xs text-clinic-muted">Ngày sinh: {formatDate(exam.visit.patient.dob)}</div>
            )}
            {exam?.visit.patient.phone && (
              <div className="text-xs text-clinic-muted">SĐT: {exam.visit.patient.phone}</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-clinic-surface p-5 shadow-clinic">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-clinic-muted">Thông tin lượt khám</h2>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-clinic-muted">Trạng thái:</span>
              {exam?.status && <StatusBadge status={exam.status} />}
            </div>
            <div className="text-xs text-clinic-muted">
              Ngày khám: {formatDate(exam?.visit.visitDate)}
            </div>
            {exam?.visit.reason && (
              <div className="text-xs text-clinic-muted">Lý do: {exam.visit.reason}</div>
            )}
            {exam?.completedAt && (
              <div className="text-xs text-clinic-muted">Hoàn tất: {formatDateTime(exam.completedAt)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Examination form */}
      <div className="rounded-2xl bg-clinic-surface p-6 shadow-clinic space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-clinic-muted">Nội dung khám</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-clinic-text">
              Triệu chứng {!isReadOnly && <span className="text-clinic-danger">*</span>}
            </label>
            {isReadOnly ? (
              <p className="text-sm text-clinic-text">{exam?.symptoms || '—'}</p>
            ) : (
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={2}
                placeholder="Mô tả triệu chứng bệnh nhân..."
                className={`${inputCls} resize-none`}
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-clinic-text">Ghi chú lâm sàng</label>
            {isReadOnly ? (
              <p className="text-sm text-clinic-text">{exam?.clinicalNotes || '—'}</p>
            ) : (
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                rows={2}
                placeholder="Kết quả khám lâm sàng..."
                className={`${inputCls} resize-none`}
              />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-clinic-text">
              Kết luận {!isReadOnly && <span className="text-clinic-danger">*</span>}
            </label>
            {isReadOnly ? (
              <p className="text-sm text-clinic-text">{exam?.conclusion || '—'}</p>
            ) : (
              <textarea
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                rows={2}
                placeholder="Kết luận sau khám..."
                className={`${inputCls} resize-none`}
              />
            )}
          </div>
        </div>

        <hr className="border-clinic-border" />

        <DiagnosisSection
          diagnoses={diagnosisRows}
          diseases={diseases}
          isReadOnly={isReadOnly}
          onChange={setDiagnosisRows}
        />

        <hr className="border-clinic-border" />

        <PrescriptionSection
          items={prescriptionItems}
          drugs={drugs}
          note={prescriptionNote}
          isReadOnly={isReadOnly}
          onItemsChange={setPrescriptionItems}
          onNoteChange={setPrescriptionNote}
        />
      </div>

      {/* Save button at bottom for convenience */}
      {!isReadOnly && (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || upsertPrescriptionMutation.isPending}
            className="rounded-xl bg-clinic-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-clinic-primary-hover disabled:opacity-60"
          >
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu phiếu khám'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/visits')}
            className="rounded-xl border border-clinic-border px-6 py-2.5 text-sm text-clinic-muted transition hover:bg-clinic-bg"
          >
            Quay lại
          </button>
        </div>
      )}

      {isReadOnly && exam?.status === 'COMPLETED' && (
        <div className="flex items-center gap-2 rounded-xl bg-[#D1FAE5] px-4 py-3 text-sm text-[#065F46]">
          <CheckCircle className="h-4 w-4" />
          Phiếu khám đã hoàn tất vào {formatDateTime(exam.completedAt)}
        </div>
      )}
    </div>
  )
}
