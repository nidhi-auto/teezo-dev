import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterBar } from '@/components/ui/FilterBar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/lib/auth'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useStore } from '@/hooks/useStore'
import { formatDate, statusTone } from '@/lib/format'
import emptyRoster from '@/assets/illustrations/empty-roster.svg'

export function MyRequestsPage() {
  const { user } = useAuth()
  const state = useStore()
  const { loading } = useSimulatedLoad()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const requests = state.joinRequests
    .filter((r) => r.playerUserId === user?.id)
    .filter((r) => (statusFilter === 'all' ? true : r.status === statusFilter))
    .filter((r) => {
      const club = state.clubs.find((c) => c.id === r.clubId)
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        (club?.name.toLowerCase().includes(q) ?? false) ||
        r.message.toLowerCase().includes(q)
      )
    })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My join requests"
        description="Track pending, approved, and rejected club requests."
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search club or message…"
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ],
          },
        ]}
      />
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="Browse clubs with live tournaments and submit a join request."
          illustrationSrc={emptyRoster}
        />
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const club = state.clubs.find((c) => c.id === r.clubId)
            return (
              <li
                key={r.id}
                className="rounded-[var(--radius-md)] border border-border bg-surface-elevated px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{club?.name ?? 'Club'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.message || 'No message'}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Submitted {formatDate(r.createdAt)}
                      {r.reviewedAt ? ` · Reviewed ${formatDate(r.reviewedAt)}` : ''}
                    </p>
                  </div>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
