import { UserPlus } from "lucide-react";
import { useState } from "react";
import type { User } from "../../../services";
import { ButtonComponent } from "../../Button";
import { SearchComponent } from "../../Search/SearchComponent";
import { UsersTable } from "./UsersTableComponent";

interface UsersPanelProps {
  users: User[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onAdd?: () => void;
  onEdit?: (user: User) => void;
  onDelete: (user: User) => Promise<void> | void;
}

export function UsersPanel({
  users = [],
  loading,
  error,
  page,
  totalPages,
  totalElements,
  first,
  last,
  onPageChange,
  onRetry,
  onAdd,
  onEdit,
  onDelete,
}: UsersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredRows = users.filter(
    (row) =>
      (row.name ?? "").toLowerCase().includes(normalizedQuery) ||
      (row.email ?? "").toLowerCase().includes(normalizedQuery) ||
      (row.farmName ?? "").toLowerCase().includes(normalizedQuery),
  );

  const isSearching = normalizedQuery.length > 0;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-brand-sand bg-brand-cream shadow-sm">
      <div className="shrink-0 rounded-none p-4">
        <div className="mb-8 flex items-center justify-between gap-8">
          <div>
            <h5 className="text-3xl font-semibold text-brand-ink">Lista de usuários</h5>
            <p className="mt-1 text-sm text-brand-forest/70">Visualize as informações sobre todos os usuários</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 md:flex-row">
          <SearchComponent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder={isSearching ? "Pesquisar nesta página" : "Pesquisar usuário"}
            className="md:w-72"
          />
          <div className="flex w-full flex-col items-center gap-2 md:w-auto md:flex-row">
            <ButtonComponent type="button" className="rounded-xl md:w-auto" onClick={onAdd} aria-label="Adicionar usuário">
              <UserPlus strokeWidth={2} className="h-4 w-4" />
              <span className="md:hidden">Adicionar usuário</span>
            </ButtonComponent>
          </div>
        </div>
      </div>

      <UsersTable
        users={filteredRows}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <div className="flex shrink-0 items-center justify-between border-t border-brand-sand p-4">
        <span className="text-sm font-normal text-brand-forest/70">
          Página {page + 1} de {Math.max(totalPages, 1)} ({totalElements} usuários)
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={first || loading}
            onClick={() => onPageChange(page - 1)}
            className="rounded-md border border-brand-sand px-4 py-2 text-sm text-brand-forest hover:bg-brand-sand/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={last || loading}
            onClick={() => onPageChange(page + 1)}
            className="rounded-md border border-brand-sand px-4 py-2 text-sm text-brand-forest hover:bg-brand-sand/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
