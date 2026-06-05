const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  minimumFractionDigits: 0,
})

export function formatVND(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  return vndFormatter.format(num)
}

export const formatMoney = formatVND

export function formatVNDCompact(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}tr ₫`
  }
  return vndFormatter.format(num)
}
