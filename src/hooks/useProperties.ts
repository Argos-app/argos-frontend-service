import { useCallback } from "react";
import { getProperties } from "@/services/propertyService";
import type { Property } from "@/types";
import { usePropertyMutations } from "@/hooks/usePropertyManagement";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";

export function useProperties() {
  const loadPage = useCallback((page: number, size: number, signal: AbortSignal) => getProperties(page, size, signal), []);
  const resource = usePaginatedResource<Property>(loadPage, "Não foi possível carregar as propriedades.");
  const { deactivate: deactivateRequest } = usePropertyMutations();
  const { page, setPage, reload } = resource;
  const deactivate = useCallback(async (property: Property) => {
    await deactivateRequest(property.id);
    if (resource.data.length === 1 && page > 0) setPage(page - 1);
    else reload();
  }, [deactivateRequest, resource.data.length, page, setPage, reload]);
  return { ...resource, properties: resource.data, deactivate };
}
