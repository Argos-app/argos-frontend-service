import { useCallback } from "react";
import { getUsers } from "../services";
import type { User } from "../services";
import { usePaginatedResource } from "./usePaginatedResource";

export function useUsers(initialPage = 0) {
  const loadPage = useCallback((page: number, size: number, signal: AbortSignal) => getUsers(page, size, signal), []);
  const resource = usePaginatedResource<User>(loadPage, "Não foi possível carregar os usuários.", initialPage);
  return { ...resource, users: resource.data };
}
