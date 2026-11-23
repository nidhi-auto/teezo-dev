import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  apiRequest,
  clearStoredTokens,
  getStoredTokens,
  persistAuthResponse,
  type AuthTokenResponse,
} from '@/lib/api'
import { invalidateHydrate, resetHydrate, syncSessionUser } from '@/data/store'
import type { Role, User } from '@/data/types'

type AuthResult = Promise<{ ok: true; user: User } | { ok: false; error: string }>

export type GoogleSignInInput =
  | { idToken: string }
  | { code: string; redirectUri?: string }

interface AuthContextValue {
  user: User | null
  role: Role | null
  booting: boolean
  signIn: (email: string, password: string) => AuthResult
  signInWithGoogle: (input: GoogleSignInInput | string) => AuthResult
  exchangeGoogle: (input: GoogleSignInInput) => AuthResult
  signOut: () => Promise<void>
  register: (input: {
    name: string
    email: string
    password: string
    role?: Role
  }) => AuthResult
  refreshUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function exchangeGoogleTokens(input: GoogleSignInInput): Promise<AuthTokenResponse> {
  const body =
    'idToken' in input
      ? { idToken: input.idToken }
      : {
          code: input.code,
          redirectUri:
            input.redirectUri ??
            import.meta.env.VITE_OAUTH_REDIRECT_URI ??
            `${window.location.origin}/auth/callback`,
        }
  return apiRequest<AuthTokenResponse>('/api/v1/auth/google', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function restore() {
      const tokens = getStoredTokens()
      if (!tokens?.accessToken) {
        if (!cancelled) {
          setUser(null)
          setBooting(false)
        }
        return
      }
      try {
        const raw = await apiRequest<{ user: User } | User>('/api/v1/auth/me')
        const me =
          raw && typeof raw === 'object' && 'user' in raw && raw.user
            ? raw.user
            : (raw as User)
        if (!cancelled) {
          setUser(me)
          syncSessionUser(me)
        }
      } catch {
        clearStoredTokens()
        resetHydrate()
        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) setBooting(false)
      }
    }
    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  const refreshUser = useCallback((next: User) => {
    setUser(next)
    syncSessionUser(next)
    const tokens = getStoredTokens()
    if (tokens) {
      persistAuthResponse({ ...tokens, user: next })
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const data = await apiRequest<AuthTokenResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const signedIn = persistAuthResponse(data)
      setUser(signedIn)
      syncSessionUser(signedIn)
      invalidateHydrate()
      return { ok: true as const, user: signedIn }
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : 'Sign-in failed.',
      }
    }
  }, [])

  const exchangeGoogle = useCallback(async (input: GoogleSignInInput) => {
    try {
      const data = await exchangeGoogleTokens(input)
      const signedIn = persistAuthResponse(data)
      setUser(signedIn)
      syncSessionUser(signedIn)
      invalidateHydrate()
      return { ok: true as const, user: signedIn }
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : 'Google sign-in failed.',
      }
    }
  }, [])

  const signInWithGoogle = useCallback(
    async (input: GoogleSignInInput | string) => {
      if (typeof input === 'string') {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
        const redirectUri =
          import.meta.env.VITE_OAUTH_REDIRECT_URI ??
          `${window.location.origin}/auth/callback`
        if (!clientId) {
          return { ok: false as const, error: 'Google sign-in is not configured.' }
        }
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'select_account',
        })
        window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
        return { ok: false as const, error: 'Redirecting to Google…' }
      }
      return exchangeGoogle(input)
    },
    [exchangeGoogle],
  )

  const signOut = useCallback(async () => {
    try {
      await apiRequest<void>('/api/v1/auth/logout', { method: 'POST' })
    } catch {
      /* best-effort */
    }
    clearStoredTokens()
    resetHydrate()
    setUser(null)
  }, [])

  const register = useCallback(
    async (input: { name: string; email: string; password: string; role?: Role }) => {
      try {
        const data = await apiRequest<AuthTokenResponse>('/api/v1/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name: input.name,
            email: input.email,
            password: input.password,
            role: input.role ?? 'player',
          }),
        })
        if (data?.accessToken && data.user) {
          const signedIn = persistAuthResponse(data)
          setUser(signedIn)
          syncSessionUser(signedIn)
          invalidateHydrate()
          return { ok: true as const, user: signedIn }
        }
        return signIn(input.email, input.password)
      } catch (e) {
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : 'Registration failed.',
        }
      }
    },
    [signIn],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      booting,
      signIn,
      signInWithGoogle,
      exchangeGoogle,
      signOut,
      register,
      refreshUser,
    }),
    [user, booting, signIn, signInWithGoogle, exchangeGoogle, signOut, register, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}