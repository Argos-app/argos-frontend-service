import { api } from "../lib";
import type { PageResponse, UpdateUserAccessPayload, UpdateUserStatusPayload, UserAccess, UserOption } from "../types";
import { serviceRequest } from "./serviceRequest";

export async function getUserAccesses(page = 0, size = 10, signal?: AbortSignal): Promise<PageResponse<UserAccess>> {
  return serviceRequest(async () => {
    const { data } = await api.get<PageResponse<UserAccess>>("/users/accesses", { params: { page, size }, signal });
    return data;
  }, "Não foi possível carregar os acessos.");
}

export async function getPermissionOptions(signal?: AbortSignal): Promise<UserOption[]> {
  return serviceRequest(async () => {
    const { data } = await api.get<UserOption[]>("/users/permissions", { signal });
    return data;
  }, "Não foi possível carregar as permissões.");
}

export async function updateUserAccess(userId: string, payload: UpdateUserAccessPayload): Promise<void> {
  return serviceRequest(
    () => api.patch(`/users/${encodeURIComponent(userId)}/access`, payload).then(() => undefined),
    "Não foi possível atualizar o acesso.",
  );
}

export async function updateUserStatus(userId: string, payload: UpdateUserStatusPayload): Promise<void> {
  return serviceRequest(
    () => api.patch(`/users/${encodeURIComponent(userId)}/status`, payload).then(() => undefined),
    "Não foi possível atualizar o status do usuário.",
  );
}
