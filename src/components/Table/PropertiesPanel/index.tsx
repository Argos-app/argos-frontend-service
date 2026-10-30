import { Plus } from "lucide-react";
import { useState } from "react";
import Pagination from "antd/es/pagination";
import type { Property } from "@/types";
import { ButtonComponent } from "@/components/Button";
import { SearchComponent } from "@/components/Search/SearchComponent";
import { PropertiesTable } from "@/components/Table/PropertiesTable";

interface PropertiesPanelProps {
  properties: Property[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  totalElements: number;
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
    <main id="main-content" tabIndex={-1} aria-labelledby="properties-page-title" className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border border-brand-sand bg-brand-cream shadow-sm">
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

      <div className="flex shrink-0 flex-col gap-3 border-t border-brand-sand p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-normal text-brand-forest" aria-live="polite">
          Página {page + 1} de {Math.max(totalPages, 1)} ({totalElements} propriedades)
        </span>
        <nav aria-label="Paginação de propriedades">
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
