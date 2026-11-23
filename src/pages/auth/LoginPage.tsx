import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import logoMark from '@/assets/logos/teezo-mark.svg'
import authPanel from '@/assets/illustrations/auth-panel.svg'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth'

export function LoginPage() {
  const { user, booting, signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (booting) {
    return null
  }

  if (user) {
    return <Navigate to="/app" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const result = await signIn(email.trim(), password)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate('/app', { replace: true })
  }

  async function onGoogleSuccess(credential: string) {
    setError(null)
    setSubmitting(true)
    const result = await signInWithGoogle({ idToken: credential })
    setSubmitting(false)
    if (!result.ok && result.error !== 'Redirecting to Google…') {
      setError(result.error)
      return
    }
    if (result.ok) {
      navigate('/app', { replace: true })
    }
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 md:px-12">
        <Link to="/" className="mb-10 flex items-center gap-2.5">
          <img src={logoMark} alt="Teezo" className="h-9 w-9" />
          <span className="font-display text-lg font-semibold">Teezo</span>
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your clubhouse account or continue with Google.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" loading={submitting}>
            Sign in
          </Button>
        </form>

        <div className="mt-4 flex w-full justify-center">
          {googleClientId ? (
            <GoogleLogin
              onSuccess={(res) => {
                if (res.credential) void onGoogleSuccess(res.credential)
              }}
              onError={() => setError('Google sign-in failed. Try again.')}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="100%"
            />
          ) : (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled
            >
              Google sign-in not configured
            </Button>
          )}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/forgot-password" className="font-medium text-foreground hover:underline">
            Forgot password
          </Link>
          {' · '}
          <Link to="/register" className="font-medium text-foreground hover:underline">
            Create an account
          </Link>
        </p>
      </div>
      <div className="relative hidden overflow-hidden bg-primary-foreground lg:block">
        <img
          src={authPanel}
          alt="Golden-hour first tee on a quiet fairway"
          className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary-foreground/40 via-transparent to-accent/10"
          aria-hidden
        />
      </div>
    </div>
  )
}