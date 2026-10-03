import type { Property } from "../../services";
import { PropertyFormDrawer } from "./PropertyFormDrawerComponent";

interface EditPropertyDrawerProps {
  property: Property | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditPropertyDrawer({ property, open, onClose, onUpdated }: EditPropertyDrawerProps) {
  return <PropertyFormDrawer property={property} open={open} onClose={onClose} onSaved={onUpdated} />;
}
