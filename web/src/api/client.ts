type FieldErrors = Record<string, string[]>

interface ErrorBody {
  error?: string
  errors?: FieldErrors
}

export class ApiError extends Error {
  status: number
  fieldErrors: FieldErrors

  constructor(status: number, body: ErrorBody) {
    super(body.error ?? `Request failed with status ${status}`)
    this.status = status
    this.fieldErrors = body.errors ?? {}
  }
}

type QueryValue = string | number | null | undefined

export function toQueryString(params: Record<string, QueryValue>) {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => [key, String(value)])

  return new URLSearchParams(entries).toString()
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(new URL(`/api/v1${path}`, window.location.origin), {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
  })

  if (!response.ok) {
    throw new ApiError(response.status, await response.json().catch(() => ({})))
  }

  return response.status === 204 ? (undefined as T) : response.json()
}
