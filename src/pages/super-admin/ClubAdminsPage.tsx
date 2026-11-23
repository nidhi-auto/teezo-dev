import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterBar } from '@/components/ui/FilterBar'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useStore } from '@/hooks/useStore'
import {
  createClubAdmin,
  deactivateClubAdmin,
  updateClubAdmin,
} from '@/data/store'
import type { User } from '@/data/types'
import emptyRoster from '@/assets/illustrations/empty-roster.svg'

type AdminRow = User & { clubName: string }

export function ClubAdminsPage() {
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
    clubId: '',
  })

  const clubsWithoutAdmin = state.clubs.filter((c) => !c.adminUserId)
  const clubOptions = useMemo(() => {
    const base = editing?.clubId
      ? state.clubs.filter((c) => !c.adminUserId || c.id === editing.clubId)
      : clubsWithoutAdmin
    return [
      { value: '', label: 'Select club' },
      ...base.map((c) => ({ value: c.id, label: c.name })),
    ]
  }, [state.clubs, clubsWithoutAdmin, editing])

  const rows: AdminRow[] = state.users
    .filter((u) => u.role === 'club_admin')
    .map((u) => ({
      ...u,
      clubName: state.clubs.find((c) => c.id === u.clubId)?.name ?? '—',
    }))
    .filter((u) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.clubName.toLowerCase().includes(q)
      )
    })

  function openCreate() {
    setEditing(null)
    setForm({ name: '', email: '', password: '', clubId: '' })
    setFormError(null)
    setDialogOpen(true)
  }

  function openEdit(admin: User) {
    setEditing(admin)
    setForm({
      name: admin.name,
      email: admin.email,
      password: '',
      clubId: admin.clubId ?? '',
    })
    setFormError(null)
    setDialogOpen(true)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (editing) {
      const result = await updateClubAdmin(editing.id, {
        name: form.name,
        email: form.email,
        clubId: form.clubId || undefined,
      })
      if (!result.ok) {
        setFormError(result.error)
        return
      }
      push('Club admin updated')
    } else {
      if (!form.clubId) {
        setFormError('Select a club')
        return
      }
      const result = await createClubAdmin({
        name: form.name,
        email: form.email,
        password: form.password,
        clubId: form.clubId,
      })
      if (!result.ok) {
        setFormError(result.error)
        return
      }
      push('Club admin created')
    }
    setDialogOpen(false)
  }

  async function onDeactivate(admin: User) {
    const result = await deactivateClubAdmin(admin.id)
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push(`${admin.name} deactivated`)
  }

  const columns: Column<AdminRow>[] = [
    { key: 'name', header: 'Name', render: (r) => r.name },
    { key: 'email', header: 'Email', render: (r) => r.email },
    { key: 'club', header: 'Club', render: (r) => r.clubName },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={r.active ? 'success' : 'danger'}>{r.active ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
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
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Club admins"
        description="Provision managers for each course in the network."
        actions={
          <Button type="button" onClick={openCreate} disabled={clubsWithoutAdmin.length === 0}>
            New club admin
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, club…"
      />
      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty={
            <EmptyState
              title="No club admins match"
              description="Create an admin for a club that does not have one yet."
              illustrationSrc={emptyRoster}
              actionLabel="New club admin"
              onAction={openCreate}
            />
          }
        />
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? 'Edit club admin' : 'New club admin'}
        description="Save to create or update a club admin account."
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
          {!editing ? (
            <Input
              label="Temporary password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          ) : null}
          <Select
            label="Club"
            value={form.clubId}
            onChange={(e) => setForm((f) => ({ ...f, clubId: e.target.value }))}
            options={clubOptions}
            required
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
