import { useNavigate, useParams } from "react-router";
import { useCallback, useEffect } from "react";
import { getUserAccesses } from "@/services/userAccessService";
import { useUserStatusMutation } from "@/hooks/useUserManagement";
import type { UserAccess } from "@/types";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";

export function useUserAccesses() {
  const { page: routePage } = useParams<{ page?: string }>();
  const navigate = useNavigate();
  const validRoutePage = routePage === undefined || (/^[1-9]\d*$/.test(routePage) && Number.isSafeInteger(Number(routePage)));
  const parsedRoutePage = validRoutePage && routePage !== undefined ? Number(routePage) - 1 : 0;

  const loadPage = useCallback((page: number, size: number, signal: AbortSignal) => getUserAccesses(page, size, signal), []);
  const resource = usePaginatedResource<UserAccess>(loadPage, "Não foi possível carregar os acessos.", parsedRoutePage);
  const { setPage: setResourcePage, reload } = resource;
  useEffect(() => {
    if (!validRoutePage) {
      navigate("/gestao-acessos", { replace: true });
      return;
    }
    setResourcePage(parsedRoutePage);
  }, [navigate, parsedRoutePage, setResourcePage, validRoutePage]);

  const setPage = useCallback((nextPage: number) => {
    setResourcePage(nextPage);
    navigate(nextPage === 0 ? "/gestao-acessos" : `/gestao-acessos/pagina/${nextPage + 1}`);
  }, [navigate, setResourcePage]);

  const { updateStatus } = useUserStatusMutation();
  const toggleStatus = useCallback(async (user: UserAccess, active: boolean) => {
    await updateStatus(user.userId, { active });
    reload();
  }, [updateStatus, reload]);

  return { ...resource, accesses: resource.data, setPage, toggleStatus };
}
