import type { User } from '@/data/types'

export const TOKEN_STORAGE_KEY = 'teezo_tokens'

export interface StoredTokens {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
  user: User
}

export function getStoredTokens(): StoredTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredTokens
  } catch {
    return null
  }
}

export function setStoredTokens(tokens: StoredTokens): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens))
}

export function clearStoredTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
}

function buildUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const base = apiBase()
  return base ? `${base}${normalized}` : normalized
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as Record<string, unknown>
    const err = body.error
    if (err && typeof err === 'object' && err !== null && 'message' in err) {
      const msg = (err as { message: unknown }).message
      if (typeof msg === 'string') return msg
    }
    if (typeof err === 'string') return err
    if (typeof body.message === 'string') return body.message
  } catch {
    /* ignore */
  }
  return res.statusText || 'Request failed'
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const tokens = getStoredTokens()
  if (tokens?.accessToken) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`)
  }
  const res = await fetch(buildUrl(path), { ...init, headers })
  if (!res.ok) {
    throw new Error(await errorMessage(res))
  }
  if (res.status === 204) {
    return undefined as T
  }
  const text = await res.text()
  if (!text) {
    return undefined as T
  }
  return JSON.parse(text) as T
}

/** Pull a named entity out of `{ user }`, `{ club }`, etc. envelopes. */
export function unwrapEntity<T>(data: unknown, keys: string[]): T {
  if (data == null || typeof data !== 'object') {
    throw new Error('Unexpected empty response.')
  }
  const obj = data as Record<string, unknown>
  for (const key of keys) {
    if (obj[key] != null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      return obj[key] as T
    }
  }
  // Bare entity (auth token payload already has user + tokens at top level)
  if (keys.every((k) => !(k in obj))) {
    return data as T
  }
  throw new Error('Unexpected response shape.')
}

export async function apiRequestEntity<T>(
  path: string,
  keys: string[],
  init?: RequestInit,
): Promise<T> {
  const data = await apiRequest<unknown>(path, init)
  return unwrapEntity<T>(data, keys)
}

export async function apiGetList<T>(path: string): Promise<T[]> {
  const data = await apiRequest<unknown>(path)
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) return value as T[]
    }
  }
  return []
}

export async function apiGetListOptional<T>(path: string): Promise<T[]> {
  try {
    return await apiGetList<T>(path)
  } catch {
    return []
  }
}

export interface AuthTokenResponse {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
  user: User
}

export function persistAuthResponse(data: AuthTokenResponse): User {
  setStoredTokens({
    accessToken: data.accessToken,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
    user: data.user,
  })
  return data.user
}