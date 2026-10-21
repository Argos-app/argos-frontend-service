import Sidebar from "@/components/Sidebar/SidebarComponent";
import { UsersPanel } from "@/components/Table/UsersPanel";
import { useUsers } from "@/hooks/useUsers";
import { useState } from "react";
import { CreateUserDrawer } from "@/components/CreateUserDrawer";
import { EditUserDrawer } from "@/components/EditUserDrawer";
import type { User } from "@/types";

export function ManageUsers() {
  const [drawer, setDrawer] = useState<{ type: "closed" } | { type: "create" } | { type: "edit"; user: User }>({ type: "closed" });
  const { users, loading, error, page, totalPages, totalElements, first, last, setPage, reload, remove } = useUsers();

  function handleCreated() {
    setDrawer({ type: "closed" });
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
        onAdd={() => setDrawer({ type: "create" })}
        onEdit={(user) => setDrawer({ type: "edit", user })}
        onDelete={remove}
      />
      <CreateUserDrawer
        open={drawer.type === "create"}
        onClose={() => setDrawer({ type: "closed" })}
        onCreated={handleCreated}
      />
      <EditUserDrawer
        user={drawer.type === "edit" ? drawer.user : null}
        open={drawer.type === "edit"}
        onClose={() => setDrawer({ type: "closed" })}
        onUpdated={() => {
          setDrawer({ type: "closed" });
          reload();
        }}
      />
    </div>
  );
}
