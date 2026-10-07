import { useCallback } from "react";
import { getProperties } from "../services";
import type { Property } from "../services";
import { usePaginatedResource } from "./usePaginatedResource";

export function useProperties() {
  const loadPage = useCallback((page: number, size: number, signal: AbortSignal) => getProperties(page, size, signal), []);
  const resource = usePaginatedResource<Property>(loadPage, "Não foi possível carregar as propriedades.");
  return { ...resource, properties: resource.data };
}
