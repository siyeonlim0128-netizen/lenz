const BASE_URL = 'https://be-production-8c4c.up.railway.app'

function getToken(): string | null {
  return localStorage.getItem('lenz_token')
}

interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  error?: string
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const json = await res.json()
      msg = json.error || json.message || msg
    } catch {}
    throw new Error(msg)
  }

  const json: ApiResponse<T> = await res.json()
  if (json.success === false) throw new Error(json.error || '요청 실패')
  return json.data ?? (json as unknown as T)
}
