import type { FormEvent } from 'react'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterBar } from '@/components/ui/FilterBar'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useStore } from '@/hooks/useStore'
import { sendInvitation } from '@/data/store'
import { formatDate, statusTone } from '@/lib/format'
import type { Invitation } from '@/data/types'
import emptyInvites from '@/assets/illustrations/empty-invites.svg'

export function InvitationsPage() {
  const { user } = useAuth()
  const state = useStore()
  const { loading } = useSimulatedLoad()
  const { push } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const clubId = user?.clubId

  const rows = state.invitations
    .filter((i) => i.clubId === clubId)
    .filter((i) => (statusFilter === 'all' ? true : i.status === statusFilter))
    .filter((i) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return i.email.toLowerCase().includes(q)
    })

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!clubId || !user) {
      setFormError('Club context missing')
      return
    }
    const result = await sendInvitation({
      clubId,
      email,
      invitedByUserId: user.id,
    })
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    push('Invitation sent')
    setOpen(false)
    setEmail('')
  }

  const columns: Column<Invitation>[] = [
    { key: 'email', header: 'Email', render: (r) => r.email },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
    },
    { key: 'sent', header: 'Sent', render: (r) => formatDate(r.createdAt) },
    { key: 'expires', header: 'Expires', render: (r) => formatDate(r.expiresAt) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitations"
        description="Invite golfers to join your club by email."
        actions={
          <Button type="button" onClick={() => { setFormError(null); setOpen(true) }}>
            Send invitation
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search email…"
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'declined', label: 'Declined' },
              { value: 'expired', label: 'Expired' },
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
              title="No invitations yet"
              description="Send an email invite to grow the roster."
              illustrationSrc={emptyInvites}
              actionLabel="Send invitation"
              onAction={() => setOpen(true)}
            />
          }
        />
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Send invitation"
        description="Player must sign up with this email to accept."
      >
        <form onSubmit={onSave} className="space-y-4">
          <Input
            label="Player email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
