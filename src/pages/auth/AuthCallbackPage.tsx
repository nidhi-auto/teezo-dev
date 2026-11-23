import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import logoMark from '@/assets/logos/teezo-mark.svg'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/auth'

export function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { exchangeGoogle } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function finish() {
      const code = params.get('code')
      const idToken = params.get('id_token')
      if (!code && !idToken) {
        if (!cancelled) setError('Missing Google sign-in response.')
        return
      }
      const result = idToken
        ? await exchangeGoogle({ idToken })
        : await exchangeGoogle({ code: code! })
      if (cancelled) return
      if (!result.ok) {
        setError(result.error)
        return
      }
      navigate('/app', { replace: true })
    }
    void finish()
    return () => {
      cancelled = true
    }
  }, [params, exchangeGoogle, navigate])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <Link to="/" className="mb-10 flex items-center gap-2.5">
        <img src={logoMark} alt="Teezo" className="h-9 w-9" />
        <span className="font-display text-lg font-semibold">Teezo</span>
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Signing you in</h1>
      {error ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <Link to="/login">
            <Button type="button" variant="secondary">
              Back to sign in
            </Button>
          </Link>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Completing Google sign-in…</p>
      )}
    </div>
  )
}