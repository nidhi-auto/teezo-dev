import { Button } from './Button';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  illustrationSrc,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustrationSrc?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center animate-fade-up">
      {illustrationSrc ? (
        <img src={illustrationSrc} alt="" className="h-36 w-auto max-w-[280px]" />
      ) : null}
      <div className="max-w-md space-y-2">
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
