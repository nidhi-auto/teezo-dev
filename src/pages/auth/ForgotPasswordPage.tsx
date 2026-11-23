import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import logoMark from '@/assets/logos/teezo-mark.svg'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiRequest } from '@/lib/api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await apiRequest<void>('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset link.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <Link to="/" className="mb-10 flex items-center gap-2.5">
        <img src={logoMark} alt="Teezo" className="h-9 w-9" />
        <span className="font-display text-lg font-semibold">Teezo</span>
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Reset password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the email on your Teezo account and we will send reset instructions.
      </p>

      {sent ? (
        <div
          className="mt-8 rounded-[var(--radius-md)] border border-border bg-surface p-4 text-sm"
          role="status"
        >
          <p className="font-medium text-foreground">Check your inbox</p>
          <p className="mt-1 text-muted-foreground">
            If an account exists for {email.trim() || 'that address'}, you will receive a reset link
            shortly.
          </p>
          <Link to="/login" className="mt-4 inline-block font-medium text-foreground hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
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
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" loading={submitting}>
            Send reset link
          </Button>
        </form>
      )}

      {!sent ? (
        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-foreground hover:underline">
            Back to sign in
          </Link>
        </p>
      ) : null}
    </div>
  )
}