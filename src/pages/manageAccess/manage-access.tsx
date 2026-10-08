import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { EditAccessDrawer } from "../../components/EditAccessDrawer";
import Sidebar from "../../components/Sidebar/SidebarComponent";
import { AccessPanel } from "../../components/Table/AccessTable";
import { useUserAccesses } from "../../hooks/useUserAccesses";
import { useUserStatusMutation } from "../../hooks/useUserManagement";
import type { UserAccess } from "../../types";

export function ManageAccess() {
  const { page: routePage } = useParams<{ page?: string }>();
  const navigate = useNavigate();
  const validRoutePage = routePage === undefined || (/^[1-9]\d*$/.test(routePage) && Number.isSafeInteger(Number(routePage)));
  const parsedRoutePage = validRoutePage && routePage !== undefined ? Number(routePage) - 1 : 0;
  const [userToEdit, setUserToEdit] = useState<UserAccess | null>(null);
  const { updateStatus } = useUserStatusMutation();
  const { accesses, loading, error, page, totalPages, totalElements, first, last, setPage, reload } = useUserAccesses(parsedRoutePage);

  useEffect(() => {
    if (!validRoutePage) {
      navigate("/gestao-acessos", { replace: true });
      return;
    }
    const targetPage = routePage === undefined ? 0 : parsedRoutePage;
    if (page !== targetPage) setPage(targetPage);
  }, [navigate, page, parsedRoutePage, routePage, setPage, validRoutePage]);

  function handlePageChange(nextPage: number) {
    setPage(nextPage);
    navigate(nextPage === 0 ? "/gestao-acessos" : `/gestao-acessos/pagina/${nextPage + 1}`);
  }

  async function handleToggleStatus(user: UserAccess, active: boolean) {
    await updateStatus(user.userId, { active });
    reload();
  }

  return (
    <div className="flex h-screen bg-brand-cream">
      <Sidebar />
      <AccessPanel accesses={accesses} loading={loading} error={error} page={page} totalPages={totalPages} totalElements={totalElements} first={first} last={last} onPageChange={handlePageChange} onRetry={reload} onEdit={setUserToEdit} onToggleStatus={handleToggleStatus} />
      <EditAccessDrawer user={userToEdit} open={userToEdit !== null} onClose={() => setUserToEdit(null)} onUpdated={() => { setUserToEdit(null); reload(); }} />
    </div>
  );
}
