import { describe, it, expect } from 'vitest'
import { formatVND, formatVNDCompact } from './money'

// Unit test cho tiện ích định dạng tiền tệ VND.
// Dùng   (non-breaking space) vì Intl.NumberFormat vi-VN chèn ký tự này.
describe('formatVND', () => {
  it('định dạng số nguyên thành tiền VND', () => {
    expect(formatVND(150000)).toBe('150.000 ₫')
  })

  it('chấp nhận chuỗi số', () => {
    expect(formatVND('1000000')).toBe('1.000.000 ₫')
  })

  it('trả về dấu — cho null/undefined/chuỗi rỗng', () => {
    expect(formatVND(null)).toBe('—')
    expect(formatVND(undefined)).toBe('—')
    expect(formatVND('')).toBe('—')
  })

  it('trả về dấu — khi không phải số', () => {
    expect(formatVND('abc')).toBe('—')
  })

  it('định dạng giá trị 0 hợp lệ', () => {
    expect(formatVND(0)).toBe('0 ₫')
  })
})

describe('formatVNDCompact', () => {
  it('rút gọn giá trị từ 1 triệu trở lên', () => {
    expect(formatVNDCompact(2500000)).toBe('2.5tr ₫')
  })

  it('giữ nguyên định dạng đầy đủ cho giá trị nhỏ', () => {
    expect(formatVNDCompact(150000)).toBe('150.000 ₫')
  })
})
