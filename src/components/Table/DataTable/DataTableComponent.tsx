import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  width?: string | number;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  loadingMessage?: string;
  onRetry?: () => void;
  rowKey: keyof T | ((row: T) => string);
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = "Nenhum registro encontrado.",
  loadingMessage = "Carregando...",
  onRetry,
  rowKey,
  striped = true,
  hoverable = true,
  className,
}: DataTableProps<T>) {
  const getRowKey = (row: T) => {
    if (typeof rowKey === "function") return rowKey(row);
    const value = row[rowKey];
    if (value == null || value === "") throw new Error(`A propriedade ${String(rowKey)} deve conter uma chave estável.`);
    return String(value);
  };

  const renderBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={columns.length} role="status" aria-live="polite" className="p-4 text-center text-sm text-brand-forest">
            {loadingMessage}
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={columns.length} className="p-4 text-center">
            <span role="alert" className="text-sm text-brand-ink">{error}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="ml-3 rounded-md border border-brand-sand px-3 py-1 text-sm text-brand-forest hover:bg-brand-sand/40"
              >
                Tentar novamente
              </button>
            )}
          </td>
        </tr>
      );
    }

    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length} className="p-4 text-center text-sm text-brand-forest">
            {emptyMessage}
          </td>
        </tr>
      );
    }

    return data.map((row, index) => {
      const isLast = index === data.length - 1;
      const baseClasses = "p-4";
      const rowClasses = cn(
        baseClasses,
        striped && !isLast && "border-b border-brand-sand/60",
        hoverable && "hover:bg-brand-sand/20"
      );

      return (
        <tr key={getRowKey(row)} className={hoverable ? "transition-colors" : undefined}>
          {columns.map((col) => (
            <td key={col.key} className={cn(rowClasses, col.className)} style={{ width: col.width }}>
              {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? "")}
            </td>
          ))}
        </tr>
      );
    });
  };

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table aria-busy={loading} className="w-full min-w-max table-auto text-left">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="border-y border-brand-sand bg-brand-sand/30 p-4"
                style={{ width: col.width }}
              >
                <span className="text-xs font-normal leading-none text-brand-forest">{col.header}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{renderBody()}</tbody>
      </table>
    </div>
  );
}
