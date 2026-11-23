import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/lib/auth'
import { useStore } from '@/hooks/useStore'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { formatDate, statusTone } from '@/lib/format'
import emptyRoster from '@/assets/illustrations/empty-roster.svg'
import emptyInvites from '@/assets/illustrations/empty-invites.svg'

export function HomePage() {
  const { user, role } = useAuth()
  const state = useStore()
  const { loading } = useSimulatedLoad()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (role === 'super_admin') {
    const admins = state.users.filter((u) => u.role === 'club_admin' && u.active)
    const live = state.tournaments.filter((t) => t.status === 'live')
    return (
      <div>
        <PageHeader
          title={`Welcome, ${user?.name.split(' ')[0]}`}
          description="Provision club admins and keep an eye on every live field."
          actions={
            <Link to="/app/club-admins">
              <Button type="button">New club admin</Button>
            </Link>
          }
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-5">
            <h2 className="mb-2 font-display text-base font-semibold">Live across the network</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {live.length} live · {state.clubs.length} clubs · {admins.length} active club admins
            </p>
            {live.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tournaments are live right now.</p>
            ) : (
              <ul className="space-y-3">
                {live.slice(0, 5).map((t) => {
                  const club = state.clubs.find((c) => c.id === t.clubId)
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                      <div>
                        <Link
                          to={`/app/tournaments/${t.id}`}
                          className="font-medium hover:underline"
                        >
                          {t.name}
                        </Link>
                        <span className="text-muted-foreground"> · {club?.name}</span>
                      </div>
                      <Badge tone="live">live</Badge>
                    </li>
                  )
                })}
              </ul>
            )}
            <Link
              to="/app/tournaments"
              className="mt-4 inline-block text-sm font-medium hover:underline"
            >
              All tournaments
            </Link>
          </section>
          <section className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-5">
            <h2 className="mb-2 font-display text-base font-semibold">Club admins</h2>
            <ul className="space-y-3">
              {admins.slice(0, 5).map((a) => {
                const club = state.clubs.find((c) => c.id === a.clubId)
                return (
                  <li key={a.id} className="text-sm">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-muted-foreground"> · {club?.name ?? 'Unassigned'}</span>
                  </li>
                )
              })}
            </ul>
            <Link
              to="/app/club-admins"
              className="mt-4 inline-block text-sm font-medium hover:underline"
            >
              Manage club admins
            </Link>
          </section>
        </div>
      </div>
    )
  }

  if (role === 'club_admin' && user?.clubId) {
    const club = state.clubs.find((c) => c.id === user.clubId)
    const pending = state.joinRequests.filter(
      (r) => r.clubId === user.clubId && r.status === 'pending',
    )
    const live = state.tournaments.filter(
      (t) => t.clubId === user.clubId && t.status === 'live',
    )
    return (
      <div>
        <PageHeader
          title={club?.name ?? 'Club home'}
          description="Pending requests, live events, and invites for your roster."
          actions={
            <Link to="/app/invitations">
              <Button type="button">Invite a player</Button>
            </Link>
          }
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Join requests</h2>
              <Badge tone="warning">{pending.length} pending</Badge>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending requests right now.</p>
            ) : (
              <ul className="space-y-3">
                {pending.slice(0, 4).map((r) => {
                  const player = state.users.find((u) => u.id === r.playerUserId)
                  return (
                    <li key={r.id} className="text-sm">
                      <span className="font-medium">{player?.name ?? 'Player'}</span>
                      <span className="text-muted-foreground"> · {formatDate(r.createdAt)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
            <Link
              to="/app/join-requests"
              className="mt-4 inline-block text-sm font-medium text-foreground hover:underline"
            >
              Review all requests
            </Link>
          </section>
          <section className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-5">
            <h2 className="mb-3 font-display text-base font-semibold">Live tournaments</h2>
            {live.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing live — publish a draft when ready.</p>
            ) : (
              <ul className="space-y-3">
                {live.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link to={`/app/tournaments/${t.id}`} className="font-medium hover:underline">
                      {t.name}
                    </Link>
                    <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/app/tournaments"
              className="mt-4 inline-block text-sm font-medium text-foreground hover:underline"
            >
              Manage tournaments
            </Link>
          </section>
        </div>
      </div>
    )
  }

  // Player home
  const myMemberships = state.memberships.filter((m) => m.userId === user?.id && m.active)
  const myClubs = state.clubs.filter((c) => myMemberships.some((m) => m.clubId === c.id))
  const openInvites = state.invitations.filter(
    (i) =>
      i.status === 'pending' &&
      user?.email &&
      i.email.toLowerCase() === user.email.toLowerCase(),
  )
  const memberClubIds = new Set(myMemberships.map((m) => m.clubId))
  const joinableLive = state.tournaments.filter(
    (t) => t.status === 'live' && memberClubIds.has(t.clubId),
  )

  return (
    <div>
      <PageHeader
        title={`Hi, ${user?.name.split(' ')[0]}`}
        description="Your clubs, open invites, and live fields you can join."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-5 lg:col-span-1">
          <h2 className="mb-3 font-display text-base font-semibold">My clubs</h2>
          {myClubs.length === 0 ? (
            <EmptyState
              title="No clubs yet"
              description="Browse clubs with live tournaments or accept an invite."
              illustrationSrc={emptyRoster}
              actionLabel="Browse clubs"
              onAction={() => navigate('/app/browse')}
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {myClubs.map((c) => (
                <li key={c.id} className="font-medium">
                  {c.name}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {c.city}, {c.state}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/app/my-clubs" className="mt-4 inline-block text-sm font-medium hover:underline">
            View my clubs
          </Link>
        </section>
        <section className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-5">
          <h2 className="mb-3 font-display text-base font-semibold">Open invites</h2>
          {openInvites.length === 0 ? (
            <EmptyState
              title="Inbox clear"
              description="When a club invites you, it shows up here."
              illustrationSrc={emptyInvites}
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {openInvites.map((i) => {
                const club = state.clubs.find((c) => c.id === i.clubId)
                return (
                  <li key={i.id}>
                    <span className="font-medium">{club?.name}</span>
                    <Badge tone="warning" className="ml-2">
                      pending
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
          <Link
            to="/app/my-invites"
            className="mt-4 inline-block text-sm font-medium hover:underline"
          >
            Manage invites
          </Link>
        </section>
        <section className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-5">
          <h2 className="mb-3 font-display text-base font-semibold">Live to join</h2>
          {joinableLive.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No live tournaments at your clubs right now.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {joinableLive.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/app/tournaments/${t.id}`}
                    className="font-medium hover:underline"
                  >
                    {t.name}
                  </Link>
                  <Badge tone="live" className="ml-2">
                    live
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
