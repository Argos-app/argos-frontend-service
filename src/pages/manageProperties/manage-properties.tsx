import { useState } from "react";
import { CreatePropertyDrawer, EditPropertyDrawer } from "@/components/PropertyDrawer";
import { PropertiesPanel } from "@/components/Table/PropertiesPanel";
import Sidebar from "@/components/Sidebar/SidebarComponent";
import { useProperties } from "@/hooks/useProperties";
import type { Property } from "@/types";

export function ManageProperties() {
  const [drawer, setDrawer] = useState<{ type: "closed" } | { type: "create" } | { type: "edit"; property: Property }>({ type: "closed" });
  const { properties, loading, error, page, totalPages, totalElements, first, last, setPage, reload, deactivate } = useProperties();

  function handleCreated() {
    setDrawer({ type: "closed" });
    if (page !== 0) setPage(0);
    reload();
  }

  function handleUpdated() {
    setDrawer({ type: "closed" });
    reload();
  }

  return (
    <div className="flex h-screen min-h-0 bg-brand-cream">
      <Sidebar />
      <PropertiesPanel
        properties={properties}
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
        onEdit={(property) => setDrawer({ type: "edit", property })}
        onDeactivate={deactivate}
      />
      <CreatePropertyDrawer
        open={drawer.type === "create"}
        onClose={() => setDrawer({ type: "closed" })}
        onCreated={handleCreated}
      />
      <EditPropertyDrawer
        property={drawer.type === "edit" ? drawer.property : null}
        open={drawer.type === "edit"}
        onClose={() => setDrawer({ type: "closed" })}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
