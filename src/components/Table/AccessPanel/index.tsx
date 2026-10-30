import { useState } from "react";
import Pagination from "antd/es/pagination";
import type { UserAccess } from "@/types";
import { SearchComponent } from "@/components/Search/SearchComponent";
import { AccessTable } from "@/components/Table/AccessTable";

interface AccessPanelProps {
  accesses: UserAccess[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onEdit: (user: UserAccess) => void;
  onToggleStatus: (user: UserAccess, active: boolean) => Promise<void>;
}

export function AccessPanel({ accesses, loading, error, page, totalPages, totalElements, onPageChange, onRetry, onEdit, onToggleStatus }: AccessPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const query = searchQuery.trim().toLocaleLowerCase();
  const filtered = accesses.filter((user) => user.name.toLocaleLowerCase().includes(query) || user.email.toLocaleLowerCase().includes(query) || user.permissionName.toLocaleLowerCase().includes(query));
  return (
    <main id="main-content" tabIndex={-1} aria-labelledby="access-page-title" className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-brand-sand bg-brand-cream shadow-sm">
      <div className="shrink-0 p-4">
        <header className="mb-8"><h1 id="access-page-title" className="text-3xl font-semibold text-brand-ink">Gerenciar acessos</h1><p className="mt-1 text-sm text-brand-forest">Consulte e edite a permissão de cada usuário.</p></header>
        <SearchComponent searchQuery={searchQuery} setSearchQuery={setSearchQuery} placeholder="Pesquisar nesta página" aria-label="Pesquisar nesta página" className="md:w-72" />
      </div>
      <AccessTable accesses={filtered} loading={loading} error={error} onRetry={onRetry} onEdit={onEdit} onToggleStatus={onToggleStatus} />
      <div className="flex shrink-0 flex-col gap-3 border-t border-brand-sand p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-brand-forest" aria-live="polite">Página {page + 1} de {Math.max(totalPages, 1)} ({totalElements} usuários)</span>
        <nav aria-label="Paginação de acessos">
          <Pagination
            current={page + 1}
            pageSize={10}
            total={totalElements}
            showSizeChanger={false}
            disabled={loading}
            onChange={(nextPage) => onPageChange(nextPage - 1)}
          />
        </nav>
      </div>
    </main>
  );
}
