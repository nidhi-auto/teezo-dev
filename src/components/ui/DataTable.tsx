import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface-elevated">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead className="bg-surface text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn('px-4 py-3 font-medium', col.className)}>
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => onSort(col.key)}
                  >
                    {col.header}
                    {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : null}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'border-t border-border transition-colors duration-150',
                onRowClick && 'cursor-pointer hover:bg-[var(--table-row-hover-bg)]',
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 align-middle', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
