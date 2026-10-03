import { useState } from "react";
import { CreatePropertyDrawer, EditPropertyDrawer } from "../../components/PropertyDrawer";
import { PropertiesPanel } from "../../components/Table/PropertiesTable";
import Sidebar from "../../components/Sidebar/SidebarComponent";
import { useProperties } from "../../hooks/useProperties";
import { deactivateProperty } from "../../services";
import type { Property } from "../../services";

export function ManageProperties() {
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<Property | null>(null);
  const { properties, loading, error, page, totalPages, totalElements, first, last, setPage, reload } = useProperties();

  async function handleDeactivate(property: Property) {
    await deactivateProperty(property.id);
    if (properties.length === 1 && page > 0) {
      setPage(page - 1);
    } else {
      reload();
    }
  }

  function handleCreated() {
    setCreateDrawerOpen(false);
    if (page !== 0) setPage(0);
    reload();
  }

  function handleUpdated() {
    setPropertyToEdit(null);
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
        onAdd={() => setCreateDrawerOpen(true)}
        onEdit={setPropertyToEdit}
        onDeactivate={handleDeactivate}
      />
      <CreatePropertyDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onCreated={handleCreated}
      />
      <EditPropertyDrawer
        property={propertyToEdit}
        open={propertyToEdit !== null}
        onClose={() => setPropertyToEdit(null)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
