import Sidebar from "../../components/Sidebar/SidebarComponent";
import { UsersPanel } from "../../components/Table/UsersTable";
import { useUsers } from "../../hooks/useUsers";
import { deleteUser } from "../../services";
import { useState } from "react";
import { CreateUserDrawer } from "../../components/CreateUserDrawer";
import { EditUserDrawer } from "../../components/EditUserDrawer";
import type { User } from "../../services";

export function ManageUsers() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const { users, loading, error, page, totalPages, totalElements, first, last, setPage, reload } =
    useUsers();

  async function handleDelete(user: (typeof users)[number]) {
    await deleteUser(user.userId);
    if (users.length === 1 && page > 0) {
      setPage(page - 1);
    } else {
      reload();
    }
  }

  function handleCreated() {
    setCreateDrawerOpen(false);
    reload();
  }

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
        onAdd={() => setCreateDrawerOpen(true)}
        onEdit={setUserToEdit}
        onDelete={handleDelete}
      />
      <CreateUserDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onCreated={handleCreated}
      />
      <EditUserDrawer
        user={userToEdit}
        open={userToEdit !== null}
        onClose={() => setUserToEdit(null)}
        onUpdated={() => {
          setUserToEdit(null);
          reload();
        }}
      />
    </div>
  );
}
