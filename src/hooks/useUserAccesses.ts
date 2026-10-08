import { useCallback } from "react";
import { getUserAccesses } from "../services";
import type { UserAccess } from "../types";
import { usePaginatedResource } from "./usePaginatedResource";

export function useUserAccesses(initialPage = 0) {
  const loadPage = useCallback((page: number, size: number, signal: AbortSignal) => getUserAccesses(page, size, signal), []);
  const resource = usePaginatedResource<UserAccess>(loadPage, "Não foi possível carregar os acessos.", initialPage);
  return { ...resource, accesses: resource.data };
}
