export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function mapHttpError(status: number, serverMessage?: string): string {
  switch (status) {
    case 400:
      return serverMessage ?? 'Dữ liệu không hợp lệ.'
    case 401:
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    case 403:
      return 'Bạn không có quyền thực hiện thao tác này.'
    case 404:
      return serverMessage ?? 'Không tìm thấy dữ liệu.'
    case 409:
      return serverMessage ?? 'Xung đột dữ liệu. Vui lòng kiểm tra lại.'
    case 422:
      return serverMessage ?? 'Dữ liệu không hợp lệ.'
    case 500:
    default:
      return 'Lỗi máy chủ. Vui lòng thử lại sau.'
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
