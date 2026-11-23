import { cn } from '@/lib/cn';
import type { SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ className, label, error, options, id, ...props }: SelectProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label ? <span className="font-medium text-foreground">{label}</span> : null}
      <select
        id={inputId}
        className={cn(
          'h-10 rounded-[var(--radius-md)] border border-border bg-[var(--input-bg)] px-3 text-foreground shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          error && 'border-destructive',
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
