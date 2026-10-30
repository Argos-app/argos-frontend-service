import { Download, LoaderCircle } from "lucide-react";
import { DataTable, type Column } from "@/components/Table/DataTable/DataTableComponent";
import { formatDate } from "@/lib/format";
import type { HerdReportItem } from "@/types/herd-report.type";

interface HerdReportsTableProps {
  reports: HerdReportItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  downloadingReportId: string | null;
  onDownload: (report: HerdReportItem) => void;
}

export function HerdReportsTable({ reports, loading, error, onRetry, downloadingReportId, onDownload }: HerdReportsTableProps) {
  const columns: Column<HerdReportItem>[] = [
    { key: "propertyName", header: "Fazenda", width: 220, render: (report) => report.propertyName || "Não informado" },
    { key: "herdName", header: "Rebanho", width: 200, render: (report) => report.herdName || "Não informado" },
    { key: "reportType", header: "Tipo do relatório", width: 180, render: (report) => report.reportType || "Não informado" },
    {
      key: "reportCreatedAt",
      header: "Data de criação",
      width: 160,
      render: (report) => report.reportCreatedAt
        ? <time dateTime={report.reportCreatedAt}>{formatDate(report.reportCreatedAt.split("T")[0])}</time>
        : "Não informado",
    },
    {
      key: "download",
      header: "Download",
      width: 100,
      render: (report) => {
        const downloading = downloadingReportId === report.id;
        return (
          <button
            type="button"
            className="rounded-md p-2 text-brand-forest hover:bg-brand-sand/40 hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={downloadingReportId !== null}
            aria-busy={downloading}
            aria-label={`${downloading ? "Baixando" : "Baixar XLSX do"} relatório de ${report.propertyName || "fazenda não informada"}, ${report.herdName || "rebanho não informado"}`}
            onClick={() => onDownload(report)}
          >
            {downloading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Download aria-hidden="true" className="h-4 w-4" strokeWidth={2} />}
          </button>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={reports}
      rowKey="id"
      loading={loading}
      error={error}
      onRetry={onRetry}
      loadingMessage="Carregando relatórios de rebanho..."
      emptyMessage="Nenhum relatório de rebanho encontrado."
      className="min-h-0 flex-1 overflow-auto"
      scrollAreaTabIndex={0}
      scrollAreaLabel="Relatórios de rebanho. Use as setas para navegar horizontalmente."
    />
  );
}
