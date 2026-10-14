import { useState } from "react";
import Modal from "antd/es/modal";
import type { Column } from "@/components/Table/DataTable";
import { DataTable } from "@/components/Table/DataTable";
import { formatDate } from "@/lib/format";
import type { ApplicationHistoryItem } from "@/types/application-history.type";

const MAX_NOTES_PREVIEW_LENGTH = 160;
const doseFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

const routeLabels: Record<string, string> = {
  INTRAMUSCULAR: "Intramuscular",
  SUBCUTANEA: "Subcutânea",
  ORAL: "Oral",
  TOPICA: "Tópica",
  INTRAVENOSA: "Intravenosa",
};

interface ApplicationHistoryTableProps {
  applications: ApplicationHistoryItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ApplicationHistoryTable({ applications, loading, error, onRetry }: ApplicationHistoryTableProps) {
  const [selectedObservation, setSelectedObservation] = useState<Pick<
    ApplicationHistoryItem,
    "lotCode" | "applicationDate" | "notes"
  > | null>(null);

  const columns: Column<ApplicationHistoryItem>[] = [
    {
      key: "lot",
      header: "Lote",
      width: 130,
      render: (application) => (
        <div className="flex flex-col gap-1 break-words">
          <span className="font-medium text-brand-ink">{application.lotCode}</span>
          <span className="text-xs text-brand-forest">{application.lotCategory}</span>
        </div>
      ),
    },
    {
      key: "propertyName",
      header: "Fazenda",
      width: 160,
      className: "whitespace-normal break-words",
    },
    {
      key: "appliedByName",
      header: "Aplicador",
      width: 160,
      className: "whitespace-normal break-words",
    },
    {
      key: "applicationDateTime",
      header: "Data e horário",
      width: 140,
      render: (application) => (
        <div className="flex flex-col gap-1 whitespace-nowrap text-sm text-brand-ink">
          <time dateTime={application.applicationDate}>{formatDate(application.applicationDate)}</time>
          <span>{application.applicationTime ? application.applicationTime.slice(0, 5) : "Horário não informado"}</span>
        </div>
      ),
    },
    {
      key: "dose",
      header: "Dose",
      width: 90,
      render: (application) => (
        <span className="whitespace-nowrap text-sm text-brand-ink">
          {doseFormatter.format(application.dose)} {application.unit}
        </span>
      ),
    },
    {
      key: "medicineName",
      header: "Medicamento",
      width: 190,
      className: "whitespace-normal break-words",
    },
    {
      key: "medicineBatchNumber",
      header: "Lote de fabricação",
      width: 150,
      className: "whitespace-normal break-words",
    },
    {
      key: "route",
      header: "Via de aplicação",
      width: 150,
      render: (application) => routeLabels[application.route] ?? application.route,
    },
    {
      key: "meatWithdrawalEnd",
      header: "Fim da carência",
      width: 140,
      render: (application) => (
        <span className="whitespace-nowrap text-sm text-brand-ink">
          {application.meatWithdrawalEnd ? formatDate(application.meatWithdrawalEnd) : "Não informado"}
        </span>
      ),
    },
    {
      key: "goal",
      header: "Motivo",
      width: 220,
      render: (application) => (
        <span className="whitespace-normal break-words text-sm text-brand-ink">
          {application.goal?.trim() || "Não informado"}
        </span>
      ),
    },
    {
      key: "notes",
      header: "Observações",
      width: 190,
      render: (application) => {
        const notes = application.notes;
        const normalizedNotes = notes?.trim();
        if (!notes || !normalizedNotes) return <span className="text-sm text-brand-forest">Sem observações</span>;

        const needsModal = normalizedNotes.length > MAX_NOTES_PREVIEW_LENGTH || normalizedNotes.includes("\n");
        if (!needsModal) {
          return <span className="whitespace-normal break-words text-sm text-brand-ink">{notes}</span>;
        }

        return (
          <div className="flex max-w-48 flex-col items-start gap-1">
            <span className="line-clamp-2 whitespace-pre-wrap break-words text-sm text-brand-ink">
              {normalizedNotes.slice(0, MAX_NOTES_PREVIEW_LENGTH)}
              {normalizedNotes.length > MAX_NOTES_PREVIEW_LENGTH ? "…" : ""}
            </span>
            <button
              type="button"
              className="rounded text-sm font-medium text-brand-forest underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest"
              aria-label={`Ver observações da aplicação no lote ${application.lotCode}`}
              onClick={() => setSelectedObservation({
                notes,
                lotCode: application.lotCode,
                applicationDate: application.applicationDate,
              })}
            >
              Ver observação
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={applications}
        rowKey="id"
        loading={loading}
        error={error}
        onRetry={onRetry}
        loadingMessage="Carregando histórico de aplicações..."
        emptyMessage="Nenhuma aplicação encontrada."
        className="min-h-0 flex-1 overflow-auto px-0"
        scrollAreaTabIndex={0}
        scrollAreaLabel="Tabela do histórico de aplicações. Use as setas para navegar horizontalmente."
      />
      <Modal
        title={`Observação — lote ${selectedObservation?.lotCode ?? ""} — ${selectedObservation ? formatDate(selectedObservation.applicationDate) : ""}`}
        open={selectedObservation !== null}
        footer={null}
        destroyOnHidden
        onCancel={() => setSelectedObservation(null)}
        className="max-w-[calc(100vw-2rem)]"
        styles={{ body: { maxHeight: "65vh", overflowY: "auto" } }}
      >
        <p className="m-0 whitespace-pre-wrap break-words text-brand-ink">{selectedObservation?.notes}</p>
      </Modal>
    </>
  );
}
