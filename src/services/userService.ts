import { api } from "../lib";
import type { PageResponse, User } from "../types";
import { serviceRequest } from "./serviceRequest";

export interface UserOption {
  id: string;
  name: string;
}

export interface UserCreationOptions {
  properties: UserOption[];
  permissions: UserOption[];
}

export interface CreateUserPayload {
  name: string;
  email: string;
  cpf: string;
  password: string;
  permissionId: string;
  propertyId: string;
}

export interface CreatedUser {
  userId: string;
  name: string;
  email: string;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  cpf: string;
  permissionId: string;
  currentPropertyId: string;
  propertyId: string;
}

export async function getUsers(page = 0, size = 10, signal?: AbortSignal): Promise<PageResponse<User>> {
  return serviceRequest(async () => {
    const { data } = await api.get<PageResponse<User>>("/users", { params: { page, size }, signal });
    return data;
  }, "Não foi possível consultar os usuários.");
}

export async function deleteUser(userId: string): Promise<void> {
  return serviceRequest(() => api.delete(`/users/${encodeURIComponent(userId)}`).then(() => undefined), "Não foi possível remover o usuário.");
}

export async function getUserCreationOptions(): Promise<UserCreationOptions> {
  return serviceRequest(async () => {
    const { data } = await api.get<UserCreationOptions>("/users/options");
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
