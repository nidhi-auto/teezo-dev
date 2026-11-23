import { Input } from './Input';
import { Select } from './Select';
import { cn } from '@/lib/cn';

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  className,
  children,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
  }[];
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      <div className="min-w-[14rem] flex-1">
        <Input
          label="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      {filters?.map((f) => (
        <div key={f.label} className="min-w-[10rem]">
          <Select
            label={f.label}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            options={f.options}
          />
        </div>
      ))}
      {children}
    </div>
  );
}
