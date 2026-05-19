const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function parseDate(value: string | Date): Date | null {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = parseDate(value)
  return d ? dateFormatter.format(d) : '—'
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = parseDate(value)
  return d ? dateTimeFormatter.format(d) : '—'
}

export function formatMonth(value: string | null | undefined): string {
  if (!value) return '—'
  // value is "YYYY-MM"
  const [year, month] = value.split('-')
  if (!year || !month) return '—'
  return `${month}/${year}`
}

export function toApiDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function toApiMonth(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function currentMonth(): string {
  return toApiMonth(new Date())
}
