import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'live' | 'success' | 'warning' | 'danger' | 'accent';

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  live: 'bg-[var(--badge-live-bg)] text-[var(--badge-live-fg)]',
  success: 'bg-[color-mix(in_oklch,var(--success)_18%,white)] text-[color-mix(in_oklch,var(--success)_70%,black)]',
  warning: 'bg-[color-mix(in_oklch,var(--warning)_22%,white)] text-[color-mix(in_oklch,var(--warning)_55%,black)]',
  danger: 'bg-[color-mix(in_oklch,var(--destructive)_16%,white)] text-destructive',
  accent: 'bg-[color-mix(in_oklch,var(--accent)_14%,white)] text-accent',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
