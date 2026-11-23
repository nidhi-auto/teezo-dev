# Teezo design notes

- **uiStack:** `web` (Vite + React + TypeScript + Tailwind)
- **frontendVerifyCommand:** `npm run build`
- **uiRoot:** `.`

## Tokens

Defined in `src/index.css` as CSS variables → Tailwind `@theme inline`.

- Surfaces: `background`, `surface`, `surface-elevated`, `muted`
- Brand: `primary` / `primary-hover` / `primary-foreground` (course teal)
- Accent: navy for secondary authority actions
- Semantic: `success`, `warning`, `destructive`
- Shell: `sidebar`, `sidebar-active`
- Radius: `--radius` 12px · shape language soft-bordered, not pill-default

Components use token classes only — no new hex in TSX.

## Type

- **Sora** (`font-display`) — headings, hero, page titles
- **Figtree** (`font-sans`) — UI, body, tables
- Loaded via Google Fonts in `index.html`

## Components

UI primitives live in `src/components/ui/`: Button, Input, Textarea, Select, Badge, EmptyState, Skeleton/TableSkeleton, Dialog, Toast, DataTable, FilterBar, PageHeader.

Domain signature: `FairwayBoard` — live hole-strip pulse for tournament detail.

Shell: `AppShell` (role nav) + `RequireAuth`.

## Patterns

- Lists: `useSimulatedLoad` skeleton → FilterBar → DataTable or EmptyState
- Forms: explicit Save / Submit; toast on success
- Mock store: `src/data/store.ts` (DUMMY) — no real API
