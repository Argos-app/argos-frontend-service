import { api } from "@/lib/api";
import type { CreateUserPayload, CreatedUser, PageResponse, UpdateUserPayload, User, UserCreationOptions } from "@/types";
import { serviceRequest } from "@/services/serviceRequest";

export async function getUsers(page = 0, size = 10, signal?: AbortSignal): Promise<PageResponse<User>> {
  return serviceRequest(async () => {
    const { data } = await api.get<PageResponse<User>>("/users", { params: { page, size }, signal });
    return data;
  }, "Não foi possível consultar os usuários.");
}

export async function deleteUser(userId: string): Promise<void> {
  return serviceRequest(() => api.delete(`/users/${encodeURIComponent(userId)}`).then(() => undefined), "Não foi possível remover o usuário.");
}

export async function getUserCreationOptions(signal?: AbortSignal): Promise<UserCreationOptions> {
  return serviceRequest(async () => {
    const { data } = await api.get<UserCreationOptions>("/users/options", { signal });
    return data;
  }, "Não foi possível carregar as opções de cadastro.");
}

export async function createUser(payload: CreateUserPayload): Promise<CreatedUser> {
  return serviceRequest(async () => {
    const { data } = await api.post<CreatedUser>("/users", payload);
    return data;
  }, "Não foi possível criar o usuário.");
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<void> {
  return serviceRequest(() => api.put(`/users/${encodeURIComponent(userId)}`, payload).then(() => undefined), "Não foi possível atualizar o usuário.");
}
