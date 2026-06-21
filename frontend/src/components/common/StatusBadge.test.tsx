import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

// Component test: StatusBadge phải hiển thị nhãn tiếng Việt đúng theo status
// và không phụ thuộc duy nhất vào màu (accessibility: có text rõ ràng).
describe('StatusBadge', () => {
  it('hiển thị nhãn tiếng Việt cho trạng thái hóa đơn PAID', () => {
    render(<StatusBadge status="PAID" />)
    expect(screen.getByText('Đã thanh toán')).toBeInTheDocument()
  })

  it('hiển thị nhãn cho trạng thái visit IN_EXAMINATION', () => {
    render(<StatusBadge status="IN_EXAMINATION" />)
    expect(screen.getByText('Đang khám')).toBeInTheDocument()
  })

  it('fallback hiển thị chính status khi không nằm trong cấu hình', () => {
    // @ts-expect-error: test nhánh fallback với giá trị ngoài union
    render(<StatusBadge status="UNKNOWN_STATUS" />)
    expect(screen.getByText('UNKNOWN_STATUS')).toBeInTheDocument()
  })
})
