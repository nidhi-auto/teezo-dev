import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterBar } from '@/components/ui/FilterBar'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useStore } from '@/hooks/useStore'
import { approveJoinRequest, rejectJoinRequest } from '@/data/store'
import { formatDate, statusTone } from '@/lib/format'
import emptyRoster from '@/assets/illustrations/empty-roster.svg'

type RequestRow = {
  id: string
  playerName: string
  playerEmail: string
  message: string
  status: string
  createdAt: string
}

export function JoinRequestsPage() {
  const { user } = useAuth()
  const state = useStore()
  const { loading } = useSimulatedLoad()
  const { push } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')

  const clubId = user?.clubId

  const rows: RequestRow[] = state.joinRequests
    .filter((r) => r.clubId === clubId)
    .filter((r) => (statusFilter === 'all' ? true : r.status === statusFilter))
    .map((r) => {
      const player = state.users.find((u) => u.id === r.playerUserId)
      return {
        id: r.id,
        playerName: player?.name ?? 'Unknown',
        playerEmail: player?.email ?? '',
        message: r.message,
        status: r.status,
        createdAt: r.createdAt,
      }
    })
    .filter((r) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        r.playerName.toLowerCase().includes(q) ||
        r.playerEmail.toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q)
      )
    })

  async function onApprove(id: string) {
    if (!user) return
    const result = await approveJoinRequest(id, user.id)
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push('Join request approved')
  }

  async function onReject(id: string) {
    if (!user) return
    const result = await rejectJoinRequest(id, user.id)
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push('Join request rejected')
  }

  const columns: Column<RequestRow>[] = [
    { key: 'player', header: 'Player', render: (r) => (
      <div>
        <div className="font-medium">{r.playerName}</div>
        <div className="text-xs text-muted-foreground">{r.playerEmail}</div>
      </div>
    )},
    {
      key: 'message',
      header: 'Message',
      render: (r) => <span className="line-clamp-2 text-muted-foreground">{r.message || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
    },
    { key: 'date', header: 'Submitted', render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button type="button" size="sm" onClick={() => onApprove(r.id)}>
              Approve
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={() => onReject(r.id)}>
              Reject
            </Button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Join requests"
        description="Approve or reject players asking to join your club."
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search player or message…"
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'all', label: 'All' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ],
          },
        ]}
      />
      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty={
            <EmptyState
              title="No requests"
              description="When players request to join, they appear here for Approve or Reject."
              illustrationSrc={emptyRoster}
            />
          }
        />
      )}
    </div>
  )
}
