import Pagination from "antd/es/pagination";
import Sidebar from "@/components/Sidebar";
import { ApplicationHistoryTable } from "@/components/Table/ApplicationHistoryTable";
import { useApplicationHistory } from "@/hooks/useApplicationHistory";

export function ApplicationHistory() {
  const {
    data: applications,
    loading,
    error,
    page,
    totalElements,
    totalPages,
    setPage,
    reload,
  } = useApplicationHistory();

  return (
    <div className="flex h-screen min-h-0 bg-brand-cream">
      <Sidebar />
      <main
        id="main-content"
        tabIndex={-1}
        aria-labelledby="application-history-title"
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-brand-sand bg-brand-cream shadow-sm"
      >
        <header className="shrink-0 p-4 md:p-6">
          <h1 id="application-history-title" className="text-3xl font-semibold text-brand-ink">
            Histórico de aplicações
          </h1>
          <p className="mt-1 text-sm text-brand-forest">
            Consulte as aplicações registradas, da mais recente para a mais antiga.
          </p>
        </header>

        <ApplicationHistoryTable
          applications={applications}
          loading={loading}
          error={error}
          onRetry={reload}
        />

        <footer className="flex shrink-0 flex-col gap-3 border-t border-brand-sand p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-brand-forest" aria-live="polite">
            Página {page + 1} de {Math.max(totalPages, 1)} ({totalElements} aplicações)
          </span>
          <nav aria-label="Paginação do histórico de aplicações">
            <Pagination
              current={page + 1}
              pageSize={10}
              total={totalElements}
              showSizeChanger={false}
              disabled={loading}
              onChange={(nextPage) => setPage(nextPage - 1)}
            />
          </nav>
        </footer>
      </main>
    </div>
  );
}
