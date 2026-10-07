import { Pencil, Trash } from "lucide-react";
import { formatCNPJ, formatCPF } from "cnpj-cpf-validator";
import { formatDate } from "../../../lib";
import type { User } from "../../../types";
import { AvatarComponent } from "../../Avatar";
import { DeleteButton } from "../../DeleteButton";
import { DataTable, type Column } from "../DataTable";

interface UsersTableProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit?: (user: User) => void;
  onDelete: (user: User) => Promise<void> | void;
}

export function UsersTable({ users, loading, error, onRetry, onEdit, onDelete }: UsersTableProps) {
  const columns: Column<User>[] = [
    {
      key: "employee",
      header: "Funcionário",
      render: (user) => (
        <div className="flex items-center gap-3">
          <AvatarComponent name={user.name} photoUrl={user.photoUrl} />
          <div className="flex flex-col">
            <span className="text-sm font-normal text-brand-ink">{user.name}</span>
            <span className="text-sm font-normal text-brand-forest/70">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "cpf",
      header: "CPF",
      render: (user) => (
        <span className="text-sm font-normal text-brand-ink">
          {user.cpf ? formatCPF(user.cpf) || "CPF não informado" : "CPF não informado"}
        </span>
      ),
    },
    {
      key: "farm",
      header: "Fazenda",
      render: (user) => (
        <div className="flex flex-col">
          <span className="text-sm font-normal text-brand-ink">{user.farmName}</span>
          <span className="text-sm font-normal text-brand-forest/70">
            {user.cnpj ? formatCNPJ(user.cnpj) || "CNPJ não informado" : "CNPJ não informado"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <span
          className={`inline-flex w-max items-center rounded-md px-3 py-1 text-xs font-medium ${
            user.active ? "bg-brand-leaf/20 text-brand-forest" : "bg-brand-sand/50 text-brand-brown"
          }`}
        >
          {user.active ? "Ativo" : "Inativo"}
        </span>
      ),
    },
    {
      key: "linkDate",
      header: "Vinculado em",
      render: (user) => <span className="text-sm font-normal text-brand-ink">{formatDate(user.linkDate)}</span>,
    },
    {
      key: "actions",
      header: "Ações",
      render: (user) => (
        <div className="flex items-center">
          <button
            type="button"
            title="Editar usuário"
            aria-label={`Editar usuário ${user.name}`}
            onClick={() => onEdit?.(user)}
            className="rounded-md p-2 text-brand-forest/70 hover:bg-brand-sand/40 hover:text-brand-ink"
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
          </button>
          <DeleteButton
            title="Remover acesso do usuário?"
            description={`O acesso de ${user.name} será desativado.`}
            confirmText="Remover acesso"
            cancelText="Cancelar"
            errorMessage="Não foi possível remover o acesso. Tente novamente."
            onConfirm={() => onDelete(user)}
          >
            <button
              type="button"
              title="Excluir usuário"
              aria-label={`Remover acesso de ${user.name}`}
              className="rounded-md p-2 text-brand-brown hover:bg-brand-sand/40 hover:text-brand-ink"
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
      data={users}
      rowKey="userId"
      loading={loading}
      error={error}
      onRetry={onRetry}
      loadingMessage="Carregando usuários..."
      emptyMessage="Nenhum usuário encontrado."
      className="min-h-0 flex-1 overflow-auto px-0"
    />
  );
}
