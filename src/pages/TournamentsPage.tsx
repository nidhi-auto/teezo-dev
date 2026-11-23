import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterBar } from '@/components/ui/FilterBar'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'
import { useSimulatedLoad } from '@/hooks/useSimulatedLoad'
import { useStore } from '@/hooks/useStore'
import {
  closeTournament,
  createTournament,
  publishTournamentLive,
  updateTournament,
} from '@/data/store'
import { formatDate, statusTone } from '@/lib/format'
import type { ScoringFormat, Tournament } from '@/data/types'

const SCORING: { value: ScoringFormat; label: string }[] = [
  { value: 'stroke', label: 'Stroke' },
  { value: 'stableford', label: 'Stableford' },
  { value: 'match_play', label: 'Match play' },
  { value: 'scramble', label: 'Scramble' },
]

type TournamentRow = Tournament & { clubName: string }

const emptyForm = {
  name: '',
  description: '',
  startDate: '',
  endDate: '',
  entryLimit: '72',
  scoringFormat: 'stroke' as ScoringFormat,
}

export function TournamentsPage() {
  const { user, role } = useAuth()
  const state = useStore()
  const { loading } = useSimulatedLoad()
  const { push } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Tournament | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)

  const clubId = role === 'club_admin' ? user?.clubId : undefined

  const rows: TournamentRow[] = useMemo(() => {
    const list =
      role === 'club_admin' && clubId
        ? state.tournaments.filter((t) => t.clubId === clubId)
        : state.tournaments
    return list
      .map((t) => ({
        ...t,
        clubName: state.clubs.find((c) => c.id === t.clubId)?.name ?? '—',
      }))
      .filter((t) => (statusFilter === 'all' ? true : t.status === statusFilter))
      .filter((t) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return (
          t.name.toLowerCase().includes(q) ||
          t.clubName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
        )
      })
  }, [state.tournaments, state.clubs, role, clubId, search, statusFilter])

  if (role === 'player') {
    return <Navigate to="/app/browse" replace />
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setOpen(true)
  }

  function openEdit(t: Tournament) {
    setEditing(t)
    setForm({
      name: t.name,
      description: t.description,
      startDate: t.startDate,
      endDate: t.endDate,
      entryLimit: String(t.entryLimit),
      scoringFormat: t.scoringFormat,
    })
    setFormError(null)
    setOpen(true)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    const entryLimit = Number.parseInt(form.entryLimit, 10)
    if (!Number.isFinite(entryLimit) || entryLimit < 1) {
      setFormError('Entry limit must be a positive number')
      return
    }

    if (editing) {
      const result = await updateTournament(editing.id, {
        name: form.name,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        entryLimit,
        scoringFormat: form.scoringFormat,
      })
      if (!result.ok) {
        setFormError(result.error)
        return
      }
      push('Tournament updated')
    } else {
      if (!clubId || !user) {
        setFormError('Club context required')
        return
      }
      const result = await createTournament({
        clubId,
        name: form.name,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate,
        entryLimit,
        scoringFormat: form.scoringFormat,
        createdByUserId: user.id,
      })
      if (!result.ok) {
        setFormError(result.error)
        return
      }
      push('Tournament draft created')
    }
    setOpen(false)
  }

  async function onPublish(id: string) {
    const result = await publishTournamentLive(id)
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push('Tournament is live')
  }

  async function onClose(id: string) {
    const result = await closeTournament(id)
    if (!result.ok) {
      push(result.error, 'error')
      return
    }
    push('Tournament closed')
  }

  const columns: Column<TournamentRow>[] = [
    {
      key: 'name',
      header: 'Tournament',
      render: (r) => (
        <Link to={`/app/tournaments/${r.id}`} className="font-medium hover:underline">
          {r.name}
        </Link>
      ),
    },
    ...(role === 'super_admin'
      ? [
          {
            key: 'club',
            header: 'Club',
            render: (r: TournamentRow) => r.clubName,
          } satisfies Column<TournamentRow>,
        ]
      : []),
    {
      key: 'dates',
      header: 'Dates',
      render: (r) => (
        <span className="tabular">
          {formatDate(r.startDate)}
          {r.endDate !== r.startDate ? ` – ${formatDate(r.endDate)}` : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
    },
    {
      key: 'format',
      header: 'Format',
      render: (r) => r.scoringFormat.replace('_', ' '),
    },
    ...(role === 'club_admin'
      ? [
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (r: TournamentRow) => (
              <div className="flex flex-wrap justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                {r.status !== 'closed' ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                ) : null}
                {r.status === 'draft' ? (
                  <Button type="button" size="sm" onClick={() => onPublish(r.id)}>
                    Publish Live
                  </Button>
                ) : null}
                {r.status === 'live' ? (
                  <Button type="button" variant="accent" size="sm" onClick={() => onClose(r.id)}>
                    Close
                  </Button>
                ) : null}
              </div>
            ),
          } satisfies Column<TournamentRow>,
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={role === 'super_admin' ? 'All tournaments' : 'Tournaments'}
        description={
          role === 'super_admin'
            ? 'Network-wide tournament board — open a row for detail.'
            : 'Draft, publish live, and close events for your club.'
        }
        actions={
          role === 'club_admin' ? (
            <Button type="button" onClick={openCreate}>
              New tournament
            </Button>
          ) : undefined
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tournaments…"
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All' },
              { value: 'draft', label: 'Draft' },
              { value: 'live', label: 'Live' },
              { value: 'closed', label: 'Closed' },
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
              title="No tournaments"
              description={
                role === 'club_admin'
                  ? 'Create a draft, then Publish Live when the field is ready.'
                  : 'No tournaments match this filter.'
              }
              actionLabel={role === 'club_admin' ? 'New tournament' : undefined}
              onAction={role === 'club_admin' ? openCreate : undefined}
            />
          }
        />
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit tournament' : 'New tournament'}
        description="Save creates or updates a tournament draft."
        className="w-[min(100%,32rem)]"
      >
        <form onSubmit={onSave} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              required
            />
            <Input
              label="End date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Entry limit"
            type="number"
            min={1}
            value={form.entryLimit}
            onChange={(e) => setForm((f) => ({ ...f, entryLimit: e.target.value }))}
            required
          />
          <Select
            label="Scoring format"
            value={form.scoringFormat}
            onChange={(e) =>
              setForm((f) => ({ ...f, scoringFormat: e.target.value as ScoringFormat }))
            }
            options={SCORING}
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
