import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { FairwayBoard } from '@/components/FairwayBoard'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useStore } from '@/hooks/useStore'
import {
  closeTournament,
  publishTournamentLive,
  registerForTournament,
} from '@/data/store'
import { formatDate, statusTone } from '@/lib/format'

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, role } = useAuth()
  const state = useStore()
  const { loading } = useSimulatedLoad()
  const { push } = useToast()

  const tournament = state.tournaments.find((t) => t.id === id)
  const club = tournament ? state.clubs.find((c) => c.id === tournament.clubId) : undefined
  const registrations = state.registrations.filter((r) => r.tournamentId === id)
  const isMember = Boolean(
    user &&
      tournament &&
      state.memberships.some(
        (m) => m.clubId === tournament.clubId && m.userId === user.id && m.active,
      ),
  )
  const alreadyRegistered = Boolean(
    user && registrations.some((r) => r.userId === user.id),
  )
  const ownsClub =
    role === 'club_admin' && user?.clubId && tournament?.clubId === user.clubId

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!tournament || !club) {
    return (
      <div className="space-y-4">
        <PageHeader title="Tournament not found" />
        <Link to="/app/tournaments" className="text-sm font-medium hover:underline">
          Back to tournaments
        </Link>
      </div>
    )
  }

  async function onRegister() {
    if (!user || !tournament) return
    const result = await registerForTournament({
      tournamentId: tournament.id,
      userId: user.id,
    })
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push('Registered for tournament')
  }

  async function onPublish() {
    if (!tournament) return
    const result = await publishTournamentLive(tournament.id)
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push('Tournament is live')
  }

  async function onClose() {
    if (!tournament) return
    const result = await closeTournament(tournament.id)
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push('Tournament closed')
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={tournament.name}
        description={`${club.name} · ${formatDate(tournament.startDate)}${
          tournament.endDate !== tournament.startDate
            ? ` – ${formatDate(tournament.endDate)}`
            : ''
        }`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone={statusTone(tournament.status)}>{tournament.status}</Badge>
            {ownsClub && tournament.status === 'draft' ? (
              <Button type="button" onClick={onPublish}>
                Publish Live
              </Button>
            ) : null}
            {ownsClub && tournament.status === 'live' ? (
              <Button type="button" variant="accent" onClick={onClose}>
                Close tournament
              </Button>
            ) : null}
            {role === 'player' &&
            tournament.status === 'live' &&
            isMember &&
            !alreadyRegistered ? (
              <Button type="button" onClick={onRegister}>
                Register
              </Button>
            ) : null}
            {alreadyRegistered ? (
              <Badge tone="success">Registered</Badge>
            ) : null}
          </div>
        }
      />

      <p className="max-w-2xl text-sm text-muted-foreground">{tournament.description}</p>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Scoring</dt>
          <dd className="font-medium capitalize">
            {tournament.scoringFormat.replace('_', ' ')}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Entry limit</dt>
          <dd className="font-medium tabular">
            {registrations.length} / {tournament.entryLimit}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Club</dt>
          <dd className="font-medium">
            {club.name}
            <span className="block text-xs font-normal text-muted-foreground">
              {club.city}, {club.state}
            </span>
          </dd>
        </div>
      </dl>

      <FairwayBoard holes={club.holes} status={tournament.status} activeHole={7} />

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Registrations</h2>
        {registrations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No registrations yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-[var(--radius-md)] border border-border bg-surface-elevated">
            {registrations.map((r) => {
              const player = state.users.find((u) => u.id === r.userId)
              return (
                <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{player?.name ?? 'Player'}</span>
                  <span className="text-muted-foreground">{formatDate(r.registeredAt)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Link to="/app/tournaments" className="inline-block text-sm font-medium hover:underline">
        ← Back to tournaments
      </Link>
    </div>
  )
}
