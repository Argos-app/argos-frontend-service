import { useNavigate, useParams } from "react-router";
import { useCallback, useEffect } from "react";
import { getUsers } from "@/services/userService";
import type { User } from "@/types";
import { useUserMutations } from "@/hooks/useUserManagement";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";

export function useUsers() {
  const { page: routePage } = useParams<{ page?: string }>();
  const navigate = useNavigate();
  const validRoutePage = routePage === undefined || (/^[1-9]\d*$/.test(routePage) && Number.isSafeInteger(Number(routePage)));
  const parsedRoutePage = validRoutePage && routePage !== undefined ? Number(routePage) - 1 : 0;

  const loadPage = useCallback((page: number, size: number, signal: AbortSignal) => getUsers(page, size, signal), []);
  const resource = usePaginatedResource<User>(loadPage, "Não foi possível carregar os usuários.", parsedRoutePage);
  const { page, setPage: setResourcePage, reload } = resource;
  useEffect(() => {
    if (!validRoutePage) {
      navigate("/gestao-usuarios", { replace: true });
      return;
    }
    setResourcePage(parsedRoutePage);
  }, [navigate, parsedRoutePage, setResourcePage, validRoutePage]);

  const setPage = useCallback((nextPage: number) => {
    setResourcePage(nextPage);
    navigate(nextPage === 0 ? "/gestao-usuarios" : `/gestao-usuarios/pagina/${nextPage + 1}`);
  }, [navigate, setResourcePage]);

  const { remove: removeRequest } = useUserMutations();
  const remove = useCallback(async (user: User) => {
    await removeRequest(user.userId);
    if (resource.data.length === 1 && page > 0) setPage(page - 1);
    else reload();
  }, [removeRequest, resource.data.length, page, setPage, reload]);

  return { ...resource, users: resource.data, setPage, remove };
}
