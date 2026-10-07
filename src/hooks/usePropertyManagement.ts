import { useCallback, useEffect, useState } from "react";
import { createProperty, deactivateProperty, getAdministrators, updateProperty } from "../services";
import type { AdminUserOption, Property, PropertyPayload } from "../types";

export function usePropertyAdministrators(open: boolean) {
  const [state, setState] = useState({
    administrators: [] as AdminUserOption[],
    attempt: 0,
    completedAttempt: -1,
    errorAttempt: -1,
  });

  useEffect(() => {
    if (!open || state.completedAttempt === state.attempt) return;
    const controller = new AbortController();
    const attempt = state.attempt;

    async function loadAllAdministrators() {
      const administrators: AdminUserOption[] = [];
      let page = 0;
      let last = false;
      while (!last && !controller.signal.aborted) {
        const result = await getAdministrators(page, 100, controller.signal);
        administrators.push(...result.data);
        last = result.last || page + 1 >= result.totalPages;
        page += 1;
      }
      return administrators;
    }

    loadAllAdministrators()
      .then((administrators) => {
        if (!controller.signal.aborted) {
          setState((current) => ({ ...current, administrators, completedAttempt: attempt, errorAttempt: -1 }));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState((current) => ({ ...current, completedAttempt: attempt, errorAttempt: attempt }));
        }
      });

    return () => controller.abort();
  }, [open, state.attempt, state.completedAttempt]);

  const retry = useCallback(() => setState((current) => ({ ...current, attempt: current.attempt + 1 })), []);
  return {
    administrators: state.administrators,
    loading: open && state.completedAttempt !== state.attempt,
    error: state.errorAttempt === state.attempt,
    retry,
  };
}

export function usePropertyMutations() {
  const [pending, setPending] = useState(false);
  const save = useCallback(async (property: Property | null, payload: PropertyPayload) => {
    setPending(true);
    try {
      if (property) await updateProperty(property.id, payload);
      else await createProperty(payload);
    } finally {
      setPending(false);
    }
  }, []);
  const deactivate = useCallback((propertyId: string) => deactivateProperty(propertyId), []);
  return { pending, save, deactivate };
}
