import { cn } from '@/lib/cn';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ className, label, error, hint, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label ? <span className="font-medium text-foreground">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          'h-10 rounded-[var(--radius-md)] border border-border bg-[var(--input-bg)] px-3 text-foreground shadow-sm transition-colors',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          error && 'border-destructive',
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
