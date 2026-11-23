import { cn } from '@/lib/cn';
import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ className, label, error, id, ...props }: TextareaProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label ? <span className="font-medium text-foreground">{label}</span> : null}
      <textarea
        id={inputId}
        className={cn(
          'min-h-24 rounded-[var(--radius-md)] border border-border bg-[var(--input-bg)] px-3 py-2 text-foreground shadow-sm',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          error && 'border-destructive',
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}
