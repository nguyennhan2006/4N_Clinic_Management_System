import { describe, it, expect } from 'vitest'
import { ApiError, mapHttpError, isApiError } from './errors'

// Unit test cho lớp lỗi API và ánh xạ HTTP status -> thông điệp tiếng Việt.
describe('mapHttpError', () => {
  it('401 -> phiên hết hạn', () => {
    expect(mapHttpError(401)).toMatch(/Phiên đăng nhập đã hết hạn/)
  })

  it('403 -> không có quyền', () => {
    expect(mapHttpError(403)).toMatch(/không có quyền/)
  })

  it('409 dùng message từ server nếu có', () => {
    expect(mapHttpError(409, 'Trùng citizenId')).toBe('Trùng citizenId')
  })

  it('409 fallback khi không có message server', () => {
    expect(mapHttpError(409)).toMatch(/Xung đột dữ liệu/)
  })

  it('500 và status lạ -> lỗi máy chủ', () => {
    expect(mapHttpError(500)).toMatch(/Lỗi máy chủ/)
    expect(mapHttpError(418)).toMatch(/Lỗi máy chủ/)
  })
})

describe('ApiError / isApiError', () => {
  it('giữ status và name', () => {
    const err = new ApiError(404, 'Not found')
    expect(err.status).toBe(404)
    expect(err.name).toBe('ApiError')
  })

  it('isApiError nhận diện đúng', () => {
    expect(isApiError(new ApiError(400, 'x'))).toBe(true)
    expect(isApiError(new Error('x'))).toBe(false)
    expect(isApiError(null)).toBe(false)
  })
})
