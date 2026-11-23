import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterBar } from '@/components/ui/FilterBar'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useStore } from '@/hooks/useStore'
import { acceptInvitation, declineInvitation } from '@/data/store'
import { formatDate, statusTone } from '@/lib/format'
import emptyInvites from '@/assets/illustrations/empty-invites.svg'

export function MyInvitesPage() {
  const { user } = useAuth()
  const state = useStore()
  const { loading } = useSimulatedLoad()
  const { push } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')

  const invites = state.invitations
    .filter(
      (i) =>
        user?.email && i.email.toLowerCase() === user.email.toLowerCase(),
    )
    .filter((i) => (statusFilter === 'all' ? true : i.status === statusFilter))
    .filter((i) => {
      const club = state.clubs.find((c) => c.id === i.clubId)
      const q = search.trim().toLowerCase()
      if (!q) return true
      return club?.name.toLowerCase().includes(q) ?? false
    })

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="My invitations"
        description="Accept or decline club invites sent to your email."
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search club…"
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'all', label: 'All' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'declined', label: 'Declined' },
              { value: 'expired', label: 'Expired' },
            ],
          },
        ]}
      />
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : invites.length === 0 ? (
        <EmptyState
          title="No invitations"
          description="When a club admin invites your email, it lands here."
          illustrationSrc={emptyInvites}
        />
      ) : (
        <ul className="space-y-3">
          {invites.map((inv) => {
            const club = state.clubs.find((c) => c.id === inv.clubId)
            return (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface-elevated px-4 py-4"
              >
                <div>
                  <p className="font-medium">{club?.name ?? 'Club'}</p>
                  <p className="text-xs text-muted-foreground">
                    Sent {formatDate(inv.createdAt)} · Expires {formatDate(inv.expiresAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone(inv.status)}>{inv.status}</Badge>
                  {inv.status === 'pending' ? (
                    <>
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
                    </>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
