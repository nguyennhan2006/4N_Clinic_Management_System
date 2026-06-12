import { ApiError, mapHttpError } from './errors'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string ?? 'http://localhost:3000/api/v1').replace(/\/$/, '')

function getToken(): string | null {
  return localStorage.getItem('access_token')
}

type RequestOptions = {
  method?: string
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options

  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = buildUrl(path, params)

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
    throw new ApiError(401, mapHttpError(401))
  }

  if (!res.ok) {
    let serverMessage: string | undefined
    let details: unknown
    try {
      const json = await res.json() as { message?: string; error?: string }
      serverMessage = json.message ?? json.error
      details = json
    } catch {
      // response body not JSON — ignore
    }
    throw new ApiError(res.status, mapHttpError(res.status, serverMessage), details)
  }

  // 204 No Content
  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
