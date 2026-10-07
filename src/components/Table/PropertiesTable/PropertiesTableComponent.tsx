import { formatCNPJ } from "cnpj-cpf-validator";
import { Pencil, Trash } from "lucide-react";
import type { Property } from "../../../types";
import { DeleteButton } from "../../DeleteButton";
import { DataTable, type Column } from "../DataTable/DataTableComponent";

interface PropertiesTableProps {
  properties: Property[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (property: Property) => void;
  onDeactivate: (property: Property) => Promise<void> | void;
}

const areaFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function PropertiesTable({
  properties,
  loading,
  error,
  onRetry,
  onEdit,
  onDeactivate,
}: PropertiesTableProps) {
  const columns: Column<Property>[] = [
    {
      key: "name",
      header: "Fazenda",
      render: (property) => <span className="font-medium text-brand-ink">{property.name}</span>,
    },
    {
      key: "cnpj",
      header: "CNPJ",
      render: (property) => (
        <span className="text-sm text-brand-forest">
          {property.cnpj ? formatCNPJ(property.cnpj) || property.cnpj : "Não informado"}
        </span>
      ),
    },
    {
      key: "address",
      header: "Endereço",
      render: (property) => <span className="text-sm text-brand-ink">{property.address}</span>,
    },
    {
      key: "cityState",
      header: "Cidade/UF",
      render: (property) => (
        <span className="text-sm text-brand-ink">
          {property.city}/{property.state}
        </span>
      ),
    },
    {
      key: "areaHectares",
      header: "Área (ha)",
      render: (property) => (
        <span className="text-sm text-brand-ink">
          {property.areaHectares == null ? "Não informada" : areaFormatter.format(property.areaHectares)}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Telefone",
      render: (property) => <span className="text-sm text-brand-ink">{property.phone || "Não informado"}</span>,
    },
    {
      key: "responsible",
      header: "Responsável",
      render: (property) => (
        <span className="text-sm text-brand-ink">{property.responsibleAdminName}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (property) => (
        <span className="inline-flex w-max items-center rounded-md bg-brand-leaf/20 px-3 py-1 text-xs font-medium text-brand-forest">
          {property.active ? "Ativa" : "Inativa"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      render: (property) => (
        <div className="flex items-center">
          <button
            type="button"
            title="Editar propriedade"
            aria-label={`Editar propriedade ${property.name}`}
            onClick={() => onEdit(property)}
            className="rounded-md p-2 text-brand-forest hover:bg-brand-sand/40 hover:text-brand-ink"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </button>
          <DeleteButton
            title="Desativar propriedade?"
            description={`A fazenda ${property.name} e todos os vínculos ativos dos usuários serão desativados.`}
            confirmText="Desativar"
            cancelText="Cancelar"
            errorMessage="Não foi possível desativar a propriedade. Tente novamente."
            onConfirm={() => onDeactivate(property)}
          >
            <button
              type="button"
              title="Desativar propriedade"
              aria-label={`Desativar propriedade ${property.name}`}
              className="rounded-md p-2 text-brand-forest hover:bg-brand-sand/40 hover:text-brand-ink"
            >
              <Trash className="h-4 w-4" strokeWidth={2} />
            </button>
          </DeleteButton>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={properties}
      rowKey="id"
      loading={loading}
      error={error}
      onRetry={onRetry}
      loadingMessage="Carregando propriedades..."
      emptyMessage="Nenhuma propriedade ativa encontrada."
      className="min-h-0 flex-1 overflow-auto px-0"
    />
  );
}
