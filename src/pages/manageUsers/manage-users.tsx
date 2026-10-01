import Sidebar from "../../components/Sidebar/SidebarComponent";
import { UsersPanel } from "../../components/Table/UsersTable";
import { useUsers } from "../../hooks/useUsers";

export function ManageUsers() {
  const { users, loading, error, page, totalPages, totalElements, first, last, setPage, reload } =
    useUsers();

  return (
    <div className="flex h-screen bg-brand-cream">
      <Sidebar />
      <UsersPanel
        users={users}
        loading={loading}
        error={error}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        first={first}
        last={last}
        onPageChange={setPage}
        onRetry={reload}
      />
    </div>
  );
}
