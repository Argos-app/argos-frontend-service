import { Pencil, Trash } from "lucide-react";
import { cn, formatDate } from "../../../lib";
import type { User } from "../../../services";
import { AvatarComponent } from "../../Avatar";
import { formatCNPJ, formatCPF } from "cnpj-cpf-validator";

const TABLE_HEAD = ["Funcionário", "CPF", "Fazenda", "Status", "Vinculado em", "Ações"];

interface MembersTableProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export function MembersTable({ users, loading, error, onRetry, onEdit, onDelete }: MembersTableProps) {
  const renderBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={TABLE_HEAD.length} className="p-4 text-center text-sm text-brand-forest/70">
            Carregando usuários...
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={TABLE_HEAD.length} className="p-4 text-center">
            <span className="text-sm text-brand-brown">{error}</span>
            <button
              type="button"
              onClick={onRetry}
              className="ml-3 rounded-md border border-brand-sand px-3 py-1 text-sm text-brand-forest hover:bg-brand-sand/40"
            >
              Tentar novamente
            </button>
          </td>
        </tr>
      );
    }

    if (users.length === 0) {
      return (
        <tr>
          <td colSpan={TABLE_HEAD.length} className="p-4 text-center text-sm text-brand-forest/70">
            Nenhum usuário encontrado.
          </td>
        </tr>
      );
    }

    return users.map((user, index) => {
      const isLast = index === users.length - 1;
      const classes = isLast ? "p-4" : "p-4 border-b border-brand-sand/60";

      return (
        <tr key={user.userId}>
          <td className={classes}>
            <div className="flex items-center gap-3">
              <AvatarComponent name={user.name} photoUrl={user.photoUrl} />
              <div className="flex flex-col">
                <span className="text-sm font-normal text-brand-ink">{user.name}</span>
                <span className="text-sm font-normal text-brand-forest/70">{user.email}</span>
              </div>
            </div>
          </td>

          <td className={classes}>
            <div className="flex flex-col">
              <span className="text-sm font-normal text-brand-ink">
                {user.cpf ? formatCPF(user.cpf) || "CPF não informado" : "CPF não informado"}
              </span>
            </div>
          </td>

          <td className={classes}>
            <div className="flex flex-col">
              <span className="text-sm font-normal text-brand-ink">{user.farmName}</span>
              <span className="text-sm font-normal text-brand-forest/70">
                {user.cnpj ? formatCNPJ(user.cnpj) || "CNPJ não informado" : "CNPJ não informado"}
              </span>
            </div>
          </td>

          <td className={classes}>
            <div className="w-max">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-3 py-1 text-xs font-medium",
                  user.active ? "bg-brand-leaf/20 text-brand-forest" : "bg-brand-sand/50 text-brand-brown",
                )}
              >
                {user.active ? "Ativo" : "Inativo"}
              </span>
            </div>
          </td>

          <td className={classes}>
            <span className="text-sm font-normal text-brand-ink">{formatDate(user.linkDate)}</span>
          </td>

          <td className={classes}>
            <button
              type="button"
              title="Editar usuário"
              onClick={() => onEdit?.(user)}
              className="rounded-md p-2 text-brand-forest/70 hover:bg-brand-sand/40 hover:text-brand-ink"
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              title="Excluir usuário"
              onClick={() => onDelete?.(user)}
              className="rounded-md p-2 text-brand-brown hover:bg-brand-sand/40 hover:text-brand-ink"
            >
              <Trash className="h-4 w-4" strokeWidth={2} />
            </button>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="min-h-0 flex-1 overflow-auto px-0">
      <table className="w-full min-w-max table-auto text-left">
        <thead>
          <tr>
            {TABLE_HEAD.map((head, index) => (
              <th key={`${head}-${index}`} className="border-y border-brand-sand bg-brand-sand/30 p-4">
                <span className="text-xs font-normal leading-none text-brand-forest/70">{head}</span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{renderBody()}</tbody>
      </table>
    </div>
  );
}
