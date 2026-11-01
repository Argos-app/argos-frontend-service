import { api } from "@/lib/api";
import type { CreateUserPayload, CreatedUser, PageResponse, UpdateUserPayload, User, UserCreationOptions } from "@/types";
import { serviceRequest } from "@/services/serviceRequest";

export async function getUsers(page = 0, size = 10, signal?: AbortSignal): Promise<PageResponse<User>> {
  const { data } = await api.get<PageResponse<User>>("/users", { params: { page, size }, signal });
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  return serviceRequest(() => api.delete(`/users/${encodeURIComponent(userId)}`).then(() => undefined), "Não foi possível remover o usuário.");
}

export async function getUserCreationOptions(signal?: AbortSignal): Promise<UserCreationOptions> {
  const { data } = await api.get<UserCreationOptions>("/users/options", { signal });
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<CreatedUser> {
  const { data } = await api.post<CreatedUser>("/users", payload);
  return data;
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<void> {
  return serviceRequest(() => api.put(`/users/${encodeURIComponent(userId)}`, payload).then(() => undefined), "Não foi possível atualizar o usuário.");
}
