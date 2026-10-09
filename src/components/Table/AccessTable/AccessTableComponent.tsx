import { Pencil } from "lucide-react";
import type { UserAccess } from "@/types";
import { AvatarComponent } from "@/components/Avatar";
import { DataTable, type Column } from "@/components/Table/DataTable";
import { ToggleUserStatusButton } from "@/components/Table/ToggleUserStatusButton";

interface AccessTableProps {
  accesses: UserAccess[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (user: UserAccess) => void;
  onToggleStatus: (user: UserAccess, active: boolean) => Promise<void>;
}

export function AccessTable({ accesses, loading, error, onRetry, onEdit, onToggleStatus }: AccessTableProps) {
  const columns: Column<UserAccess>[] = [
    { key: "name", header: "Usuário", render: (user) => <div className="flex items-center gap-3"><AvatarComponent name={user.name} photoUrl={user.photoUrl} /><div className="flex flex-col"><span className="text-sm text-brand-ink">{user.name}</span><span className="text-sm text-brand-forest">{user.email}</span></div></div> },
    { key: "password", header: "Senha", render: () => <span className="text-sm text-brand-forest">Protegida</span> },
    { key: "permissionName", header: "Acesso", render: (user) => <span className="text-sm text-brand-ink">{user.permissionName}</span> },
    { key: "active", header: "Status", render: (user) => <ToggleUserStatusButton user={user} onToggle={onToggleStatus} /> },
    { key: "actions", header: "Ações", render: (user) => <button type="button" aria-label={`Editar acesso de ${user.name}`} onClick={() => onEdit(user)} className="rounded-md p-2 text-brand-forest hover:bg-brand-sand/40 hover:text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2"><Pencil className="h-4 w-4" strokeWidth={2} /></button> },
  ];
  return <DataTable columns={columns} data={accesses} rowKey="userId" loading={loading} error={error} onRetry={onRetry} loadingMessage="Carregando acessos..." emptyMessage="Nenhum usuário encontrado." className="min-h-0 flex-1 overflow-auto px-0" />;
}
