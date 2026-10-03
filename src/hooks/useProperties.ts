import { useCallback, useEffect, useState } from "react";
import { getProperties } from "../services";
import type { PageResponse, Property } from "../services";

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [meta, setMeta] = useState<PageResponse<Property> | null>(null);
  const [completedKey, setCompletedKey] = useState<string | null>(null);

  const currentKey = `${page}:${attempt}`;

  useEffect(() => {
    let cancelled = false;

    async function fetchProperties() {
      try {
        const data = await getProperties(page);
        if (cancelled) return;
        setProperties(data.data);
        setMeta(data);
        setError(null);
      } catch {
        if (cancelled) return;
        setProperties([]);
        setMeta(null);
        setError("Não foi possível carregar as propriedades.");
      } finally {
        if (!cancelled) setCompletedKey(currentKey);
      }
    }

    fetchProperties();
    return () => {
      cancelled = true;
    };
  }, [page, attempt, currentKey]);

  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  return {
    properties,
    loading: completedKey !== currentKey,
    error,
    page,
    setPage,
    reload,
    totalElements: meta?.totalElements ?? 0,
    totalPages: meta?.totalPages ?? 0,
    first: meta?.first ?? true,
    last: meta?.last ?? true,
  };
}
