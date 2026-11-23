import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/lib/auth'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useStore } from '@/hooks/useStore'
import { formatDate, statusTone } from '@/lib/format'
import emptyRoster from '@/assets/illustrations/empty-roster.svg'

export function MyClubsPage() {
  const { user } = useAuth()
  const state = useStore()
  const { loading } = useSimulatedLoad()

  const memberships = state.memberships.filter((m) => m.userId === user?.id && m.active)
  const clubs = memberships
    .map((m) => {
      const club = state.clubs.find((c) => c.id === m.clubId)
      if (!club) return null
      const tournaments = state.tournaments.filter((t) => t.clubId === club.id)
      return { membership: m, club, tournaments }
    })
    .filter(Boolean) as {
    membership: (typeof memberships)[0]
    club: (typeof state.clubs)[0]
    tournaments: typeof state.tournaments
  }[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My clubs"
        description="Memberships and tournaments at clubs you belong to."
      />
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : clubs.length === 0 ? (
        <EmptyState
          title="No memberships yet"
          description="Accept an invite or request to join a club with a live tournament."
          illustrationSrc={emptyRoster}
        />
      ) : (
        <ul className="space-y-6">
          {clubs.map(({ club, membership, tournaments }) => (
            <li
              key={club.id}
              className="rounded-[var(--radius-md)] border border-border bg-surface-elevated p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">{club.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {club.city}, {club.state} · Joined {formatDate(membership.joinedAt)}
                  </p>
                </div>
                <Badge tone="success">Member</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-muted-foreground">
                  Tournaments
                </h3>
                {tournaments.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No tournaments yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {tournaments.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                        <Link
                          to={`/app/tournaments/${t.id}`}
                          className="font-medium hover:underline"
                        >
                          {t.name}
                        </Link>
                        <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
