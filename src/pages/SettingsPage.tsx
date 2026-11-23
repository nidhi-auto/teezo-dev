import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'
import { apiRequest } from '@/lib/api'
import { updateUserProfile } from '@/data/store'

type Prefs = {
  emailNotifications: boolean
  tournamentAlerts: boolean
}

export function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { push } = useToast()
  const [name, setName] = useState(user?.name ?? '')
  const [prefs, setPrefs] = useState<Prefs>({
    emailNotifications: true,
    tournamentAlerts: true,
  })
  const [profileError, setProfileError] = useState<string | null>(null)
  const [prefsError, setPrefsError] = useState<string | null>(null)
  const [prefsLoading, setPrefsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const userId = user.id
    setName(user.name)
    let cancelled = false
    async function load() {
      setPrefsLoading(true)
      try {
        const raw = await apiRequest<{ settings: Prefs } | Prefs>(
          `/api/v1/users/${userId}/settings`,
        )
        const data =
          raw && typeof raw === 'object' && 'settings' in raw && raw.settings
            ? raw.settings
            : (raw as Prefs)
        if (!cancelled) setPrefs(data)
      } catch {
        if (!cancelled) {
          setPrefs({ emailNotifications: true, tournamentAlerts: true })
        }
      } finally {
        if (!cancelled) setPrefsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [user])

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault()
    setProfileError(null)
    if (!user) return
    const result = await updateUserProfile(user.id, { name })
    if (!result.ok) {
      setProfileError(result.error)
      return
    }
    refreshUser(result.user)
    push('Profile saved')
  }

  async function onSavePrefs(e: FormEvent) {
    e.preventDefault()
    setPrefsError(null)
    if (!user) return
    try {
      await apiRequest<Prefs>(`/api/v1/users/${user.id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(prefs),
      })
      push('Preferences saved')
    } catch (err) {
      setPrefsError(err instanceof Error ? err.message : 'Could not save preferences.')
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-10">
      <PageHeader
        title="Settings"
        description="Profile and notification preferences for your Teezo account."
      />

      <form onSubmit={onSaveProfile} className="space-y-4">
        <h2 className="font-display text-base font-semibold">Profile</h2>
        <Input label="Email" value={user?.email ?? ''} disabled hint="Email cannot be changed here" />
        <Input
          label="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {profileError ? (
          <p className="text-sm text-destructive" role="alert">
            {profileError}
          </p>
        ) : null}
        <Button type="submit">Save profile</Button>
      </form>

      <form onSubmit={onSavePrefs} className="space-y-4 border-t border-border pt-8">
        <h2 className="font-display text-base font-semibold">Notifications</h2>
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>
            <span className="font-medium">Email notifications</span>
            <span className="block text-muted-foreground">Invites and join request updates</span>
          </span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--primary)]"
            checked={prefs.emailNotifications}
            disabled={prefsLoading}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, emailNotifications: e.target.checked }))
            }
          />
        </label>
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>
            <span className="font-medium">Tournament alerts</span>
            <span className="block text-muted-foreground">Live publish and close notices</span>
          </span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--primary)]"
            checked={prefs.tournamentAlerts}
            disabled={prefsLoading}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, tournamentAlerts: e.target.checked }))
            }
          />
        </label>
        {prefsError ? (
          <p className="text-sm text-destructive" role="alert">
            {prefsError}
          </p>
        ) : null}
        <Button type="submit" disabled={prefsLoading}>
          Save preferences
        </Button>
      </form>
    </div>
  )
}