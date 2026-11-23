import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterBar } from '@/components/ui/FilterBar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useStore } from '@/hooks/useStore'
import { submitJoinRequest } from '@/data/store'
import { statusTone } from '@/lib/format'
import type { Club } from '@/data/types'
import emptyRoster from '@/assets/illustrations/empty-roster.svg'

export function BrowseClubsPage() {
  const { user } = useAuth()
  const state = useStore()
  const { loading } = useSimulatedLoad()
  const { push } = useToast()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Club | null>(null)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const liveClubIds = useMemo(() => {
    const ids = new Set(
      state.tournaments.filter((t) => t.status === 'live').map((t) => t.clubId),
    )
    return ids
  }, [state.tournaments])

  const clubs = state.clubs
    .filter((c) => liveClubIds.has(c.id) && c.active)
    .filter((c) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q)
      )
    })

  function requestStatus(clubId: string) {
    if (!user) return null
    if (
      state.memberships.some(
        (m) => m.clubId === clubId && m.userId === user.id && m.active,
      )
    ) {
      return 'member' as const
    }
    const req = state.joinRequests.find(
      (r) => r.clubId === clubId && r.playerUserId === user.id,
    )
    return req?.status ?? null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!user || !selected) return
    const result = await submitJoinRequest({
      clubId: selected.id,
      playerUserId: user.id,
      message,
    })
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    push('Join request submitted')
    setSelected(null)
    setMessage('')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Browse clubs"
        description="Clubs with at least one live tournament — request to join the roster."
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search clubs…"
      />
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : clubs.length === 0 ? (
        <EmptyState
          title="No live clubs"
          description="When a club publishes a live tournament, it appears here."
          illustrationSrc={emptyRoster}
        />
      ) : (
        <ul className="space-y-4">
          {clubs.map((club) => {
            const status = requestStatus(club.id)
            const liveCount = state.tournaments.filter(
              (t) => t.clubId === club.id && t.status === 'live',
            ).length
            return (
              <li
                key={club.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-[var(--radius-md)] border border-border bg-surface-elevated p-5"
              >
                <div className="max-w-xl space-y-1">
                  <h2 className="font-display text-lg font-semibold">{club.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {club.city}, {club.state} · {club.holes} holes
                  </p>
                  <p className="text-sm text-muted-foreground">{club.description}</p>
                  <Badge tone="live" className="mt-2">
                    {liveCount} live
                  </Badge>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {status === 'member' ? (
                    <Badge tone="success">Member</Badge>
                  ) : status === 'pending' ? (
                    <Badge tone={statusTone('pending')}>Request pending</Badge>
                  ) : status === 'approved' ? (
                    <Badge tone="success">Approved</Badge>
                  ) : status === 'rejected' ? (
                    <Badge tone="danger">Rejected</Badge>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => {
                        setSelected(club)
                        setMessage('')
                        setFormError(null)
                      }}
                    >
                      Request to join
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Join ${selected?.name ?? 'club'}`}
        description="Send a short note to the club admin."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Textarea
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Why you want to join…"
          />
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
