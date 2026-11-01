import { useCallback, useEffect, useRef, useState } from "react";
import {
  createUser as createUserRequest,
  deleteUser as deleteUserRequest,
  getUserCreationOptions,
  updateUser as updateUserRequest,
} from "@/services/userService";
import { getPermissionOptions, updateUserAccess as updateUserAccessRequest, updateUserStatus as updateUserStatusRequest } from "@/services/userAccessService";
import type { CreateUserPayload, UpdateUserAccessPayload, UpdateUserPayload, UpdateUserStatusPayload, UserCreationOptions, UserOption } from "@/types";
import { validateUpdateUser, validateUpdateUserAccess, validateUpdateUserStatus } from "@/utils/validation";

const EMPTY_OPTIONS: UserCreationOptions = { properties: [], permissions: [] };
const INITIAL_OPTIONS_STATE = { options: EMPTY_OPTIONS, loading: true, error: false };

export function useUserCreationOptions(open: boolean) {
  const [state, setState] = useState(INITIAL_OPTIONS_STATE);
  const controller = useRef<AbortController | null>(null);

  if (!open && state !== INITIAL_OPTIONS_STATE) setState(INITIAL_OPTIONS_STATE);

  const loadOptions = useCallback(() => {
    if (!open) return;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    getUserCreationOptions(request.signal)
      .then((options) => {
        if (!request.signal.aborted) {
          setState({ options, loading: false, error: false });
        }
      })
      .catch(() => {
        if (!request.signal.aborted) {
          setState({ options: EMPTY_OPTIONS, loading: false, error: true });
        }
      });
  }, [open]);

  useEffect(() => {
    loadOptions();
    return () => controller.current?.abort();
  }, [loadOptions]);

  function retry() {
    setState(INITIAL_OPTIONS_STATE);
    loadOptions();
  }

  return { options: state.options, loading: open && state.loading, error: state.error, retry };
}

export function useUserMutations() {
  const [pending, setPending] = useState(false);

  const create = useCallback(async (payload: CreateUserPayload) => {
    setPending(true);
    try {
      return await createUserRequest(payload);
    } finally {
      setPending(false);
    }
  }, []);

  const update = useCallback(async (userId: string, payload: UpdateUserPayload) => {
    const validation = validateUpdateUser(payload);
    if (!validation.success) return validation;
    setPending(true);
    try {
      await updateUserRequest(userId, validation.data);
      return validation;
    } finally {
      setPending(false);
    }
  }, []);
  const remove = useCallback((userId: string) => deleteUserRequest(userId), []);
  return { pending, create, update, remove };
}

export function usePermissionOptions(open: boolean) {
  const [state, setState] = useState({ options: [] as UserOption[], attempt: 0, completedAttempt: -1, errorAttempt: -1 });
  useEffect(() => {
    if (!open || state.completedAttempt === state.attempt) return;
    const controller = new AbortController();
    const attempt = state.attempt;
    getPermissionOptions(controller.signal)
      .then((options) => {
        if (!controller.signal.aborted) {
          setState((current) => ({ ...current, options, completedAttempt: attempt, errorAttempt: -1 }));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setState((current) => ({ ...current, completedAttempt: attempt, errorAttempt: attempt }));
      });
    return () => controller.abort();
  }, [open, state.attempt, state.completedAttempt]);
  const retry = useCallback(() => setState((current) => ({ ...current, attempt: current.attempt + 1 })), []);
  return { options: state.options, loading: open && state.completedAttempt !== state.attempt, error: state.errorAttempt === state.attempt, retry };
}

export function useUserAccessMutation() {
  const [pending, setPending] = useState(false);
  const updateAccess = useCallback(async (userId: string, payload: UpdateUserAccessPayload) => {
    const validation = validateUpdateUserAccess(payload);
    if (!validation.success) return validation;
    setPending(true);
    try {
      await updateUserAccessRequest(userId, validation.data);
      return validation;
    } finally {
      setPending(false);
    }
  }, []);
  return { pending, updateAccess };
}

export function useUserStatusMutation() {
  const updateStatus = useCallback(async (userId: string, payload: UpdateUserStatusPayload) => {
    const validation = validateUpdateUserStatus(payload);
    if (!validation.success) throw new Error(validation.errors.active);
    await updateUserStatusRequest(userId, validation.data);
  }, []);
  return { updateStatus };
}
