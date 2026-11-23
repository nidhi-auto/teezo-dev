import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import logoMark from '@/assets/logos/teezo-mark.svg'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/hooks/useStore'
import {
  acceptInvitation,
  declineInvitation,
  submitJoinRequest,
} from '@/data/store'
import { formatDate, statusTone } from '@/lib/format'
import { cn } from '@/lib/cn'
import emptyInvites from '@/assets/illustrations/empty-invites.svg'
import emptyRoster from '@/assets/illustrations/empty-roster.svg'

type Tab = 'home' | 'browse' | 'invites' | 'clubs'

export function MobilePlayerApp() {
  const { user, role, signOut } = useAuth()
  const state = useStore()
  const { push } = useToast()
  const [tab, setTab] = useState<Tab>('home')
  const [joinClubId, setJoinClubId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  if (role !== 'player') {
    return <Navigate to="/app" replace />
  }

  const memberships = state.memberships.filter((m) => m.userId === user?.id && m.active)
  const myClubs = state.clubs.filter((c) => memberships.some((m) => m.clubId === c.id))
  const invites = state.invitations.filter(
    (i) =>
      i.status === 'pending' &&
      user?.email &&
      i.email.toLowerCase() === user.email.toLowerCase(),
  )
  const liveClubIds = new Set(
    state.tournaments.filter((t) => t.status === 'live').map((t) => t.clubId),
  )
  const browseClubs = state.clubs.filter((c) => liveClubIds.has(c.id) && c.active)
  const memberClubIds = new Set(memberships.map((m) => m.clubId))
  const liveJoinable = state.tournaments.filter(
    (t) => t.status === 'live' && memberClubIds.has(t.clubId),
  )

  async function onAccept(id: string) {
    if (!user) return
    const result = await acceptInvitation(id, user.id)
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push('Invitation accepted')
  }

  async function onDecline(id: string) {
    const result = await declineInvitation(id)
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push('Invitation declined')
  }

  async function onJoinSubmit() {
    if (!user || !joinClubId) return
    const result = await submitJoinRequest({
      clubId: joinClubId,
      playerUserId: user.id,
      message,
    })
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push('Join request submitted')
    setJoinClubId(null)
    setMessage('')
  }

  return (
    <div className="min-h-dvh bg-muted/60 py-4">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-[26rem] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-background shadow-md">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={logoMark} alt="Teezo" className="h-8 w-8" />
            <div>
              <p className="font-display text-sm font-semibold">Teezo</p>
              <p className="text-[10px] text-muted-foreground">Mobile · {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/app" className="text-xs font-medium text-muted-foreground hover:underline">
              Desktop
            </Link>
            <Button type="button" variant="ghost" size="sm" onClick={() => void signOut()}>
              Out
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {tab === 'home' ? (
            <div className="space-y-4">
              <h1 className="font-display text-xl font-semibold">Home</h1>
              <section>
                <h2 className="text-xs font-semibold uppercase text-muted-foreground">Live fields</h2>
                {liveJoinable.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No live tournaments at your clubs.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {liveJoinable.map((t) => (
                      <li key={t.id}>
                        <Link
                          to={`/app/tournaments/${t.id}`}
                          className="block rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium"
                        >
                          {t.name}
                          <Badge tone="live" className="ml-2">
                            live
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <h2 className="text-xs font-semibold uppercase text-muted-foreground">
                  Open invites
                </h2>
                <p className="mt-1 text-sm tabular text-foreground">{invites.length} pending</p>
              </section>
            </div>
          ) : null}

          {tab === 'browse' ? (
            <div className="space-y-4">
              <h1 className="font-display text-xl font-semibold">Browse</h1>
              {browseClubs.length === 0 ? (
                <EmptyState
                  title="No live clubs"
                  description="Check back when tournaments go live."
                  illustrationSrc={emptyRoster}
                />
              ) : (
                <ul className="space-y-3">
                  {browseClubs.map((club) => {
                    const isMember = memberships.some((m) => m.clubId === club.id)
                    const pending = state.joinRequests.some(
                      (r) =>
                        r.clubId === club.id &&
                        r.playerUserId === user?.id &&
                        r.status === 'pending',
                    )
                    return (
                      <li
                        key={club.id}
                        className="rounded-[var(--radius-md)] border border-border p-3"
                      >
                        <p className="font-medium">{club.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {club.city}, {club.state}
                        </p>
                        {isMember ? (
                          <Badge tone="success" className="mt-2">
                            Member
                          </Badge>
                        ) : pending ? (
                          <Badge tone="warning" className="mt-2">
                            Pending
                          </Badge>
                        ) : joinClubId === club.id ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              className="min-h-16 w-full rounded-[var(--radius-md)] border border-border bg-[var(--input-bg)] px-2 py-1.5 text-sm"
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Short message…"
                            />
                            <div className="flex gap-2">
                              <Button type="button" size="sm" onClick={onJoinSubmit}>
                                Submit
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setJoinClubId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setJoinClubId(club.id)
                              setMessage('')
                            }}
                          >
                            Request to join
                          </Button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : null}

          {tab === 'invites' ? (
            <div className="space-y-4">
              <h1 className="font-display text-xl font-semibold">Invites</h1>
              {invites.length === 0 ? (
                <EmptyState
                  title="Inbox clear"
                  description="Club invites to your email show up here."
                  illustrationSrc={emptyInvites}
                />
              ) : (
                <ul className="space-y-3">
                  {invites.map((inv) => {
                    const club = state.clubs.find((c) => c.id === inv.clubId)
                    return (
                      <li
                        key={inv.id}
                        className="rounded-[var(--radius-md)] border border-border p-3"
                      >
                        <p className="font-medium">{club?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Expires {formatDate(inv.expiresAt)}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button type="button" size="sm" onClick={() => onAccept(inv.id)}>
                            Accept
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => onDecline(inv.id)}
                          >
                            Decline
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : null}

          {tab === 'clubs' ? (
            <div className="space-y-4">
              <h1 className="font-display text-xl font-semibold">Clubs</h1>
              {myClubs.length === 0 ? (
                <EmptyState
                  title="No clubs yet"
                  description="Accept an invite or browse live clubs."
                  illustrationSrc={emptyRoster}
                />
              ) : (
                <ul className="space-y-3">
                  {myClubs.map((club) => {
                    const tournaments = state.tournaments.filter((t) => t.clubId === club.id)
                    return (
                      <li
                        key={club.id}
                        className="rounded-[var(--radius-md)] border border-border p-3"
                      >
                        <p className="font-medium">{club.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {club.city}, {club.state}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {tournaments.slice(0, 3).map((t) => (
                            <li key={t.id} className="flex items-center justify-between text-xs">
                              <Link to={`/app/tournaments/${t.id}`} className="hover:underline">
                                {t.name}
                              </Link>
                              <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                            </li>
                          ))}
                        </ul>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <nav className="grid grid-cols-4 border-t border-border bg-surface">
          {(
            [
              ['home', 'Home'],
              ['browse', 'Browse'],
              ['invites', 'Invites'],
              ['clubs', 'Clubs'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'py-3 text-xs font-medium transition-colors',
                tab === id ? 'bg-sidebar-active text-foreground' : 'text-muted-foreground',
              )}
            >
              {label}
              {id === 'invites' && invites.length > 0 ? (
                <span className="ml-1 tabular text-[10px] text-[color-mix(in_oklch,var(--primary)_70%,black)]">
                  {invites.length}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
