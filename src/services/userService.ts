import { api } from "../lib";
import type { PageResponse } from "./types/page-response.type";
import type { User } from "./types/user.type";

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
  const { data } = await api.get<PageResponse<User>>("/users", { params: { page, size }, signal });
  return data;
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/users/${encodeURIComponent(userId)}`);
}

export async function getUserCreationOptions(): Promise<UserCreationOptions> {
  const { data } = await api.get<UserCreationOptions>("/users/options");
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<CreatedUser> {
  const { data } = await api.post<CreatedUser>("/users", payload);
  return data;
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<void> {
  await api.put(`/users/${encodeURIComponent(userId)}`, payload);
}
