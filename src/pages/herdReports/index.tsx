import { useState } from "react";
import Alert from "antd/es/alert";
import Pagination from "antd/es/pagination";
import Select from "antd/es/select";
import { ButtonComponent } from "@/components/Button/ButtonComponent";
import Sidebar from "@/components/Sidebar/SidebarComponent";
import { HerdReportsTable } from "@/components/Table/HerdReportsTable";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useHerdReportDownload, useHerdReportProperties, useHerdReports } from "@/hooks/useHerdReports";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { HerdReportItem } from "@/types/herd-report.type";

function SignInAgain() {
  const { handleLogout, loading, error } = useAuthActions();
  return (
    <div className="space-y-2">
      <ButtonComponent className="w-auto rounded-xl" onClick={() => void handleLogout()} disabled={loading}>
        {loading ? "Encerrando sessão..." : "Entrar novamente"}
      </ButtonComponent>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}

function HerdReportsResults({ propertyId, downloadingReportId, onDownload }: {
  propertyId?: string;
  downloadingReportId: string | null;
  onDownload: (report: HerdReportItem) => void;
}) {
  const { data, loading, error, unauthorized, page, size, totalPages, totalElements, setPage, reload } = useHerdReports(propertyId);
  return (
    <>
      {unauthorized ? <div className="px-4 pb-4"><SignInAgain /></div> : null}
      <HerdReportsTable reports={data} loading={loading} error={error} onRetry={reload} downloadingReportId={downloadingReportId} onDownload={onDownload} />
      <footer className="flex shrink-0 flex-col gap-3 border-t border-brand-sand p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-brand-forest" aria-live="polite">
          Página {page + 1} de {Math.max(totalPages, 1)} ({totalElements} relatórios)
        </span>
        <nav aria-label="Paginação dos relatórios de rebanho">
          <Pagination current={page + 1} pageSize={size} total={totalElements} showSizeChanger={false} responsive showLessItems disabled={loading || Boolean(error)} onChange={(nextPage) => setPage(nextPage - 1)} />
        </nav>
      </footer>
    </>
  );
}

function HerdReportsContent() {
  const [propertyId, setPropertyId] = useState<string>();
  const { properties, loading, error, reload } = useHerdReportProperties();
  const { downloadingReportId, error: downloadError, download } = useHerdReportDownload();

  return (
    <>
      <section className="shrink-0 space-y-3 px-4 pb-4 md:px-6" aria-label="Filtro e exportação de relatórios">
        <div className="flex w-full flex-col gap-1 sm:max-w-sm">
          <label htmlFor="herd-reports-property" className="text-sm text-brand-forest">Fazenda</label>
          <Select
            id="herd-reports-property"
            value={propertyId ?? ""}
            onChange={(value) => setPropertyId(value || undefined)}
            loading={loading}
            disabled={loading || Boolean(error)}
            options={[{ value: "", label: "Todas as fazendas" }, ...properties.map(({ id, name }) => ({ value: id, label: name }))]}
            className="w-full"
          />
        </div>
        {loading ? <p role="status" className="text-sm text-brand-forest">Carregando fazendas...</p> : null}
        {error ? <Alert type="error" showIcon message={error.message} action={<ButtonComponent className="w-auto rounded-xl" onClick={reload}>Tentar novamente</ButtonComponent>} /> : null}
        {error?.status === 401 || downloadError?.status === 401 ? <SignInAgain /> : null}
        {downloadError ? <p role="alert" className="text-sm text-brand-forest">{downloadError.message}</p> : null}
        <p role="status" aria-live="polite" className="text-sm text-brand-forest">{downloadingReportId ? "Baixando relatório de rebanho..." : ""}</p>
      </section>
      <HerdReportsResults key={propertyId ?? "all"} propertyId={propertyId} downloadingReportId={downloadingReportId} onDownload={(report) => void download(report)} />
    </>
  );
}

export function HerdReports() {
  const { profile, loading, error, reload } = useUserProfile();
  return (
    <div className="flex h-screen min-h-0 bg-brand-cream">
      <Sidebar />
      <main id="main-content" tabIndex={-1} aria-labelledby="herd-reports-title" className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-brand-sand bg-brand-cream shadow-sm">
        <header className="shrink-0 p-4 md:p-6">
          <h1 id="herd-reports-title" className="text-3xl font-semibold text-brand-ink">Relatórios de rebanho</h1>
          <p className="mt-1 text-sm text-brand-forest">Consulte o histórico das suas fazendas e baixe os relatórios em XLSX, do mais recente para o mais antigo.</p>
        </header>
        {loading ? <p role="status" aria-live="polite" className="p-4 text-brand-forest">Verificando acesso...</p> : null}
        {error ? (
          <div className="space-y-3 p-4">
            <Alert type="error" showIcon message={error} action={<ButtonComponent className="w-auto rounded-xl" onClick={reload}>Tentar novamente</ButtonComponent>} />
            <SignInAgain />
          </div>
        ) : null}
        {profile?.permissionCode === "ADMIN" ? <HerdReportsContent /> : null}
        {profile && profile.permissionCode !== "ADMIN" ? <div className="p-4"><Alert type="warning" showIcon message="Acesso restrito a administradores." /></div> : null}
      </main>
    </div>
  );
}
