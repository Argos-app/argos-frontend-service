import { useCallback, useEffect, useState } from "react";
import { getAiUsage, InvalidAiUsageResponseError } from "@/services/aiUsageService";
import type { AiUsageUser } from "@/types/ai-usage.type";

const REFRESH_INTERVAL_MS = 30_000;

export function useAiUsage() {
  const [users, setUsers] = useState<AiUsageUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      setLoading(true);
      try {
        const result = await getAiUsage(controller.signal);
        if (!controller.signal.aborted) {
          setUsers(result);
          setUpdatedAt(new Date());
          setError(null);
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof InvalidAiUsageResponseError ? cause.message : "Não foi possível atualizar o uso de IA. Tente novamente.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          timer = setTimeout(load, REFRESH_INTERVAL_MS);
        }
      }
    }

    void load();
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [attempt]);

  return { users, loading, error, updatedAt, reload };
}
