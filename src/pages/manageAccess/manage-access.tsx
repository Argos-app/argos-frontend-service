import { useState } from "react";
import { EditAccessDrawer } from "@/components/EditAccessDrawer";
import Sidebar from "@/components/Sidebar/SidebarComponent";
import { AccessPanel } from "@/components/Table/AccessPanel";
import { useUserAccesses } from "@/hooks/useUserAccesses";
import type { UserAccess } from "@/types";

export function ManageAccess() {
  const [userToEdit, setUserToEdit] = useState<UserAccess | null>(null);
  const { accesses, loading, error, page, totalPages, totalElements, first, last, setPage, reload, toggleStatus } = useUserAccesses();

  return (
    <div className="flex h-screen bg-brand-cream">
      <Sidebar />
      <AccessPanel accesses={accesses} loading={loading} error={error} page={page} totalPages={totalPages} totalElements={totalElements} first={first} last={last} onPageChange={setPage} onRetry={reload} onEdit={setUserToEdit} onToggleStatus={toggleStatus} />
      <EditAccessDrawer user={userToEdit} open={userToEdit !== null} onClose={() => setUserToEdit(null)} onUpdated={() => { setUserToEdit(null); reload(); }} />
    </div>
  );
}
