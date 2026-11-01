import { useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { getUsers } from "@/services/userService";
import type { PageResponse, User } from "@/types";
import { useUserMutations } from "@/hooks/useUserManagement";

interface UsersResult {
  requestedPage: number;
  response: PageResponse<User> | null;
  error: string | null;
}

export function useUsers() {
  const { page: routePage } = useParams<{ page?: string }>();
  const navigate = useNavigate();
  const page = Number(routePage ?? 1) - 1;
  const [result, setResult] = useState<UsersResult | null>(null);
  const controller = useRef<AbortController | null>(null);

  if (result && result.requestedPage !== page) setResult(null);

  const loadPage = useCallback(() => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;

    getUsers(page, 10, request.signal)
      .then((response) => {
        if (!request.signal.aborted) setResult({ requestedPage: page, response, error: null });
      })
      .catch(() => {
        if (!request.signal.aborted) {
          setResult({ requestedPage: page, response: null, error: "Não foi possível carregar os usuários." });
        }
      });
  }, [page]);

  useEffect(() => {
    loadPage();
    return () => controller.current?.abort();
  }, [loadPage]);

  function setPage(nextPage: number) {
    navigate(nextPage === 0 ? "/gestao-usuarios" : `/gestao-usuarios/pagina/${nextPage + 1}`);
  }

  function reload() {
    setResult(null);
    loadPage();
  }

  const currentResult = result?.requestedPage === page ? result : null;
  const users = currentResult?.response?.data ?? [];

  const { remove: removeRequest } = useUserMutations();
  async function remove(user: User) {
    await removeRequest(user.userId);
    if (users.length === 1 && page > 0) setPage(page - 1);
    else reload();
  }

  return {
    users,
    loading: currentResult === null,
    error: currentResult?.error ?? null,
    page,
    totalPages: currentResult?.response?.totalPages ?? 0,
    totalElements: currentResult?.response?.totalElements ?? 0,
    setPage,
    reload,
    remove,
  };
}
