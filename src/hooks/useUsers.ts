import { useCallback, useEffect, useState } from "react";
import { getUsers } from "../services";
import type { PageResponse, User } from "../services";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [attempt, setAttempt] = useState(0);
  const [meta, setMeta] = useState<PageResponse<User> | null>(null);
  const [completedKey, setCompletedKey] = useState<string | null>(null);

  const currentKey = `${page}:${attempt}`;

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      try {
        const data = await getUsers(page, size);
        if (cancelled) return;
        setUsers(data.data);
        setMeta(data);
        setError(null);
      } catch {
        if (cancelled) return;
        setUsers([]);
        setMeta(null);
        setError("Não foi possível carregar os usuários.");
      } finally {
        if (!cancelled) setCompletedKey(`${page}:${attempt}`);
      }
    }

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [page, attempt, size]);

  const reload = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return {
    users,
    loading: completedKey !== currentKey,
    error,
    page,
    setPage,
    size,
    setSize,
    reload,
    totalElements: meta?.totalElements ?? 0,
    totalPages: meta?.totalPages ?? 0,
    first: meta?.first ?? true,
    last: meta?.last ?? true,
  };
}
