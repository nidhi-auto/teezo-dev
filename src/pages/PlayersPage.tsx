import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
import {
  createPlayerForClub,
  getPlayersForClub,
  removePlayerFromClub,
  updatePlayer,
} from '@/data/store'
import type { User } from '@/data/types'
import emptyRoster from '@/assets/illustrations/empty-roster.svg'

type PlayerRow = User & { clubNames: string }

export function PlayersPage() {
  const { user, role } = useAuth()
  const state = useStore()
  const { loading } = useSimulatedLoad()
  const { push } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    handicap: '',
  })

  const clubId = role === 'club_admin' ? user?.clubId : undefined

  const basePlayers: User[] = useMemo(() => {
    if (role === 'club_admin' && clubId) {
      return getPlayersForClub(clubId)
    }
    return state.users.filter((u) => u.role === 'player')
  }, [state, role, clubId])

  const rows: PlayerRow[] = useMemo(
    () =>
      basePlayers
        .map((p) => {
          const clubNames = state.memberships
            .filter((m) => m.userId === p.id && m.active)
            .map((m) => state.clubs.find((c) => c.id === m.clubId)?.name)
            .filter(Boolean)
            .join(', ')
          return { ...p, clubNames: clubNames || '—' }
        })
        .filter((p) => {
          const q = search.trim().toLowerCase()
          if (!q) return true
          return (
            p.name.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.clubNames.toLowerCase().includes(q)
          )
        }),
    [basePlayers, state.memberships, state.clubs, search],
  )

  if (role === 'player') {
    return <Navigate to="/app/my-clubs" replace />
  }

  function openCreate() {
    setEditing(null)
    setForm({ name: '', email: '', password: '', handicap: '' })
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(player: User) {
    setEditing(player)
    setForm({
      name: player.name,
      email: player.email,
      password: '',
      handicap: player.handicap != null ? String(player.handicap) : '',
    })
    setFormError(null)
    setDialogOpen(true)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const handicap =
      form.handicap.trim() === '' ? undefined : Number.parseFloat(form.handicap)

    if (editing) {
      const result = await updatePlayer(editing.id, {
        name: form.name,
        email: form.email,
        handicap: Number.isFinite(handicap) ? handicap : undefined,
      })
      if (!result.ok) {
        setFormError(result.error)
        return
      }
      push('Player updated')
    } else {
      if (!clubId) {
        setFormError('Club context required')
        return
      }
      const result = await createPlayerForClub({
        clubId,
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        handicap: Number.isFinite(handicap) ? handicap : undefined,
      })
      if (!result.ok) {
        setFormError(result.error)
        return
      }
      push('Player added to roster')
    }
    setDialogOpen(false)
  }

  async function onDeactivate(player: User) {
    const result = await updatePlayer(player.id, { active: false })
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push(`${player.name} deactivated`)
  }

  async function onRemove(player: User) {
    if (!clubId) return
    const result = await removePlayerFromClub(clubId, player.id)
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push(`${player.name} removed from club`)
  }

  const columns: Column<PlayerRow>[] = [
    { key: 'name', header: 'Name', render: (r) => r.name },
    { key: 'email', header: 'Email', render: (r) => r.email },
    {
      key: 'handicap',
      header: 'HCP',
      render: (r) => (
        <span className="tabular">{r.handicap != null ? r.handicap.toFixed(1) : '—'}</span>
      ),
    },
    ...(role === 'super_admin'
      ? [
          {
            key: 'clubs',
            header: 'Clubs',
            render: (r: PlayerRow) => r.clubNames,
          } satisfies Column<PlayerRow>,
        ]
      : []),
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={r.active ? 'success' : 'danger'}>{r.active ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    ...(role === 'club_admin'
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (r: PlayerRow) => (
              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(r)}>
                  Edit
                </Button>
                {r.active ? (
                  <Button type="button" variant="secondary" size="sm" onClick={() => onDeactivate(r)}>
                    Deactivate
                  </Button>
                ) : null}
                <Button type="button" variant="danger" size="sm" onClick={() => onRemove(r)}>
                  Remove
                </Button>
              </div>
            ),
          } satisfies Column<PlayerRow>,
        ]
      : [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (r: PlayerRow) => (
              <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(r)}>
                  Edit
                </Button>
                {r.active ? (
                  <Button type="button" variant="danger" size="sm" onClick={() => onDeactivate(r)}>
                    Deactivate
                  </Button>
                ) : null}
              </div>
            ),
          } satisfies Column<PlayerRow>,
        ]),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={role === 'super_admin' ? 'All players' : 'Players'}
        description={
          role === 'super_admin'
            ? 'Every player account across the network.'
            : 'Roster for your club — add, edit, or remove members.'
        }
        actions={
          role === 'club_admin' ? (
            <Button type="button" onClick={openCreate}>
              Add player
            </Button>
          ) : undefined
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search players…"
      />
      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty={
            <EmptyState
              title="No players yet"
              description={
                role === 'club_admin'
                  ? 'Add a player or invite them from Invitations.'
                  : 'No players match this search.'
              }
              illustrationSrc={emptyRoster}
              actionLabel={role === 'club_admin' ? 'Add player' : undefined}
              onAction={role === 'club_admin' ? openCreate : undefined}
            />
          }
        />
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? 'Edit player' : 'Add player'}
        description="Save creates or updates a player on the roster."
      >
        <form onSubmit={onSave} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          {!editing && role === 'club_admin' ? (
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              hint="Optional temporary password for the new account"
            />
          ) : null}
          <Input
            label="Handicap"
            type="number"
            step="0.1"
            value={form.handicap}
            onChange={(e) => setForm((f) => ({ ...f, handicap: e.target.value }))}
          />
          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
