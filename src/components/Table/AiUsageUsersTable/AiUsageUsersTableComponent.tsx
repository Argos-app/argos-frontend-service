import { AlertTriangle } from "lucide-react";
import { AvatarComponent } from "@/components/Avatar";
import { ButtonComponent } from "@/components/Button";
import { DataTable, type Column } from "@/components/Table/DataTable";
import type { AiUsageUser } from "@/types";
import { formatNumber, formatCost, displayName } from "@/lib/aiUsageFormat";

interface AiUsageUsersTableProps {
  users: AiUsageUser[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelect: (user: AiUsageUser) => void;
  isSearching: boolean;
}

export function AiUsageUsersTable({ users, loading, error, onRetry, onSelect, isSearching }: AiUsageUsersTableProps) {
	const columns: Column<AiUsageUser>[] = [
		{
			key: "user",
			header: "Usuário",
			render: (user) => (
				<div className="flex items-center gap-3">
					<AvatarComponent name={displayName(user)} photoUrl={user.photoUrl} />
					<div className="flex flex-col">
						<ButtonComponent
							type="button"
							onClick={() => onSelect(user)}
							className="h-auto w-auto justify-start rounded-none bg-transparent p-0 text-left text-sm text-brand-ink underline decoration-brand-forest/40 underline-offset-4 hover:bg-transparent hover:text-brand-forest"
						>
							{displayName(user)}
						</ButtonComponent>
						<span className="text-sm text-brand-forest">
							{user.email || user.userId}
						</span>
					</div>
					{(user.unknownTokenCalls > 0 || user.unknownCostCalls > 0) && (
						<ButtonComponent
							type="button"
							onClick={() => onSelect(user)}
							aria-label={`Ver dados incompletos de ${displayName(user)}`}
							title="Dados incompletos: ver detalhes"
							className="h-9 w-9 rounded-md bg-transparent p-2 text-amber-700 hover:bg-brand-sand/50 hover:text-amber-700"
						>
							<AlertTriangle size={18} />
						</ButtonComponent>
					)}
				</div>
			),
		},
		{ key: "calls", header: "Requisições", render: (user) => formatNumber(user.calls) },
		{
			key: "modelCalls",
			header: "Chamadas ao modelo",
			render: (user) => formatNumber(user.modelCalls),
		},
		{
			key: "tokens",
			header: "Tokens conhecidos",
			render: (user) => <span className="font-medium">{formatNumber(user.tokens)}</span>,
		},
		{
			key: "cost",
			header: "Custo conhecido (USD)",
			render: (user) => (user.knownCostCalls ? formatCost(Number(user.costUsd)) : "—"),
		},
	];

  return (
    <DataTable
      columns={columns}
      data={users}
      rowKey="userId"
      loading={loading}
      error={error}
      onRetry={onRetry}
      loadingMessage="Carregando uso de IA..."
      emptyMessage={isSearching ? "Nenhum usuário encontrado para a pesquisa." : "Nenhuma atividade de IA disponível."}
      className="px-0 text-sm"
      scrollAreaLabel="Atividade de IA por usuário"
      scrollAreaTabIndex={0}
    />
  );
}
