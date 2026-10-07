import { Plus } from "lucide-react";
import { useState } from "react";
import type { Property } from "../../../types";
import { ButtonComponent } from "../../Button";
import { SearchComponent } from "../../Search/SearchComponent";
import { PropertiesTable } from "./PropertiesTableComponent";

interface PropertiesPanelProps {
  properties: Property[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onAdd: () => void;
  onEdit: (property: Property) => void;
  onDeactivate: (property: Property) => Promise<void> | void;
}

export function PropertiesPanel({
  properties,
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
  onDeactivate,
}: PropertiesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredProperties = properties.filter((property) =>
    [property.name, property.cnpj, property.address, property.city, property.state, property.responsibleAdminName]
      .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)),
  );

  return (
    <main aria-labelledby="properties-page-title" className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-brand-sand bg-brand-cream shadow-sm">
      <div className="shrink-0 p-4">
        <header className="mb-8">
          <h1 id="properties-page-title" className="text-3xl font-semibold text-brand-ink">Lista de propriedades</h1>
          <p className="mt-1 text-sm text-brand-forest">Gerencie as fazendas cadastradas no sistema</p>
        </header>

        <div className="flex flex-col items-center gap-2 md:flex-row">
          <SearchComponent
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder={normalizedQuery ? "Pesquisar nesta página" : "Pesquisar propriedade"}
            aria-label="Pesquisar propriedades nesta página"
            className="md:w-72"
          />
          <div className="flex w-full flex-col items-center gap-2 md:w-auto md:flex-row">
            <ButtonComponent
              type="button"
              className="rounded-xl md:w-auto"
              onClick={onAdd}
              aria-label="Adicionar propriedade"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span className="md:hidden">Adicionar propriedade</span>
            </ButtonComponent>
          </div>
        </div>
      </div>

      <PropertiesTable
        properties={filteredProperties}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onEdit={onEdit}
        onDeactivate={onDeactivate}
      />

      <div className="flex shrink-0 items-center justify-between border-t border-brand-sand p-4">
        <span className="text-sm font-normal text-brand-forest">
          Página {page + 1} de {Math.max(totalPages, 1)} ({totalElements} propriedades)
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
    </main>
  );
}
