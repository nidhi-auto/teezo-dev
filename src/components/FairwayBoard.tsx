import { cn } from '@/lib/cn';

/** Signature moment: live hole-strip pulse for tournaments in play. */
export function FairwayBoard({
  holes = 18,
  activeHole = 7,
  status,
}: {
  holes?: number;
  activeHole?: number;
  status: 'draft' | 'live' | 'closed';
}) {
  return (
    <section
      aria-label="Live Fairway Board"
      className="rounded-[var(--radius-lg)] border border-border bg-surface p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-foreground">Live Fairway Board</p>
          <p className="text-xs text-muted-foreground">
            {status === 'live'
              ? `Field moving through hole ${activeHole}`
              : status === 'draft'
                ? 'Publishes when the tournament goes live'
                : 'Final round complete'}
          </p>
        </div>
        <span
          className={cn(
            'rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium',
            status === 'live' && 'bg-[var(--badge-live-bg)] text-[var(--badge-live-fg)]',
            status === 'draft' && 'bg-muted text-muted-foreground',
            status === 'closed' && 'bg-[color-mix(in_oklch,var(--accent)_12%,white)] text-accent',
          )}
        >
          {status}
        </span>
      </div>
      <div className="flex h-16 items-end gap-1">
        {Array.from({ length: holes }).map((_, i) => {
          const hole = i + 1;
          const isActive = status === 'live' && hole === activeHole;
          const isPast = status === 'live' ? hole < activeHole : status === 'closed';
          return (
            <div key={hole} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  'w-full rounded-t-[4px] bg-primary/25',
                  isPast && 'bg-primary/55',
                  isActive && 'bg-primary animate-fairway-pulse',
                  status === 'draft' && 'bg-border',
                )}
                style={{ height: `${28 + ((hole * 7) % 28)}px` }}
                title={`Hole ${hole}`}
              />
              <span className="text-[10px] tabular text-muted-foreground">{hole}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
