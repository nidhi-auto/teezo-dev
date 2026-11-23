import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import logoMark from '@/assets/logos/teezo-mark.svg'
import authPanel from '@/assets/illustrations/auth-panel.svg'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'

export function RegisterPage() {
  const { user, booting, register } = useAuth()
  const navigate = useNavigate()
  const { push } = useToast()
  const [name, setName] = useState('')
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
    const result = await register({ name, email, password, role: 'player' })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    push('Account created — welcome to Teezo')
    navigate('/app', { replace: true })
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 md:px-12">
        <Link to="/" className="mb-10 flex items-center gap-2.5">
          <img src={logoMark} alt="Teezo" className="h-9 w-9" />
          <span className="font-display text-lg font-semibold">Teezo</span>
        </Link>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Register as a player to browse clubs and join live fields.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Input
            label="Full name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="At least 8 characters"
            required
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" loading={submitting}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Sign in
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