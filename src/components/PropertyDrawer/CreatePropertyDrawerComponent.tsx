import { PropertyFormDrawer } from "./PropertyFormDrawerComponent";

interface CreatePropertyDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePropertyDrawer({ open, onClose, onCreated }: CreatePropertyDrawerProps) {
  return <PropertyFormDrawer property={null} open={open} onClose={onClose} onSaved={onCreated} />;
}
