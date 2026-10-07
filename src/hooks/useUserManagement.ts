import { useCallback, useEffect, useState } from "react";
import {
  createUser as createUserRequest,
  deleteUser as deleteUserRequest,
  getUserCreationOptions,
  updateUser as updateUserRequest,
} from "../services";
import type { CreateUserPayload, UpdateUserPayload, UserCreationOptions } from "../types";

const EMPTY_OPTIONS: UserCreationOptions = { properties: [], permissions: [] };

export function useUserCreationOptions(open: boolean) {
  const [state, setState] = useState({
    options: EMPTY_OPTIONS,
    attempt: 0,
    completedAttempt: -1,
    errorAttempt: -1,
  });

  useEffect(() => {
    if (!open || state.completedAttempt === state.attempt) return;
    const controller = new AbortController();
    const attempt = state.attempt;
    getUserCreationOptions(controller.signal)
      .then((options) => setState((current) => ({ ...current, options, completedAttempt: attempt, errorAttempt: -1 })))
      .catch(() => {
        if (!controller.signal.aborted) {
          setState((current) => ({ ...current, completedAttempt: attempt, errorAttempt: attempt }));
        }
      });
    return () => controller.abort();
  }, [open, state.attempt, state.completedAttempt]);

  const retry = useCallback(() => setState((current) => ({ ...current, attempt: current.attempt + 1 })), []);
  return {
    options: state.options,
    loading: open && state.completedAttempt !== state.attempt,
    error: state.errorAttempt === state.attempt,
    retry,
  };
}

export function useUserMutations() {
  const [pending, setPending] = useState(false);

  const run = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setPending(true);
    try {
      return await operation();
    } finally {
      setPending(false);
    }
  }, []);

  const create = useCallback((payload: CreateUserPayload) => run(() => createUserRequest(payload)), [run]);
  const update = useCallback((userId: string, payload: UpdateUserPayload) => run(() => updateUserRequest(userId, payload)), [run]);
  const remove = useCallback((userId: string) => deleteUserRequest(userId), []);
  return { pending, create, update, remove };
}
