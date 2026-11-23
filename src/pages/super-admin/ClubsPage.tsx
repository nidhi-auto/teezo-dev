import type { FormEvent } from 'react'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterBar } from '@/components/ui/FilterBar'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { usePageLoad } from '@/hooks/useSimulatedLoad'
import { useStore } from '@/hooks/useStore'
import { createClub } from '@/data/store'
import { formatDate } from '@/lib/format'
import emptyRoster from '@/assets/illustrations/empty-roster.svg'

type ClubRow = {
  id: string
  name: string
  city: string
  state: string
  adminName: string
  active: boolean
  holes: number
  createdAt: string
}

const emptyForm = {
  name: '',
  city: '',
  state: '',
  holes: '18',
  description: '',
}

export function ClubsPage() {
  const state = useStore()
  const { loading } = usePageLoad()
  const { push } = useToast()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const rows: ClubRow[] = state.clubs
    .map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      state: c.state,
      holes: c.holes,
      active: c.active,
      createdAt: c.createdAt,
      adminName:
        state.users.find((u) => u.id === c.adminUserId)?.name ?? 'Unassigned',
    }))
    .filter((c) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.adminName.toLowerCase().includes(q)
      )
    })

  const columns: Column<ClubRow>[] = [
    { key: 'name', header: 'Club', render: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: 'location',
      header: 'Location',
      render: (r) => `${r.city}, ${r.state}`,
    },
    { key: 'admin', header: 'Admin', render: (r) => r.adminName },
    { key: 'holes', header: 'Holes', render: (r) => <span className="tabular">{r.holes}</span> },
    {
      key: 'active',
      header: 'Status',
      render: (r) => (
        <Badge tone={r.active ? 'success' : 'danger'}>{r.active ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      key: 'created',
      header: 'Added',
      render: (r) => formatDate(r.createdAt),
    },
  ]

  function openCreate() {
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(true)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const holes = Number.parseInt(form.holes, 10)
    if (!Number.isFinite(holes) || holes < 1) {
      setFormError('Holes must be a positive number.')
      return
    }
    setSaving(true)
    const result = await createClub({
      name: form.name.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      holes,
      description: form.description.trim(),
    })
    setSaving(false)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    push('Club created')
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clubs"
        description="Courses in the Teezo network. Create a club before assigning a club admin."
        actions={
          <Button type="button" onClick={openCreate}>
            New club
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search club, city, admin…"
      />
      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          empty={
            <EmptyState
              title="No clubs found"
              description="Create a club to get started."
              illustrationSrc={emptyRoster}
              actionLabel="New club"
              onAction={openCreate}
            />
          }
        />
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="New club"
        description="Add a course to the network."
      >
        <form onSubmit={onSave} className="space-y-4">
          <Input
            label="Club name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              required
            />
            <Input
              label="State"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Holes"
            type="number"
            min={1}
            value={form.holes}
            onChange={(e) => setForm((f) => ({ ...f, holes: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
            <Button type="submit" loading={saving}>
              Create club
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}