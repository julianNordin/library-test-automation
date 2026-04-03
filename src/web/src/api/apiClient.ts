const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number
  title: string
  detail?: string

  constructor(status: number, title: string, detail?: string) {
    super(detail ? `${title}: ${detail}` : title)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.detail = detail
  }
}

interface ProblemBody {
  title?: string
  detail?: string
}

async function readProblemBody(response: Response): Promise<ProblemBody | null> {
  try {
    const body: unknown = await response.json()
    return typeof body === 'object' && body !== null ? (body as ProblemBody) : null
  } catch {
    return null
  }
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') ?? ''

  // P1 builds RFC 7807 bodies but writes them with WriteAsJsonAsync, which labels them
  // `application/json` rather than `application/problem+json` — so match any JSON type.
  // A body-less error (P1's bare NotFound()) leaves the title as the status text.
  if (contentType.includes('json')) {
    const problem = await readProblemBody(response)
    if (problem) {
      return new ApiError(response.status, problem.title ?? response.statusText, problem.detail)
    }
  }

  return new ApiError(response.status, response.statusText)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw await parseErrorResponse(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
}
