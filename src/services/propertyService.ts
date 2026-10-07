import { api } from "../lib";
import type { AdminUserOption, PageResponse, Property, PropertyPayload } from "../types";

export async function getProperties(page = 0, size = 10, signal?: AbortSignal): Promise<PageResponse<Property>> {
  const { data } = await api.get<PageResponse<Property>>("/properties", { params: { page, size }, signal });
  return data;
}

export async function getAdministrators(page = 0, size = 100): Promise<PageResponse<AdminUserOption>> {
  const { data } = await api.get<PageResponse<AdminUserOption>>("/users/admins", { params: { page, size } });
  return data;
}

export async function createProperty(payload: PropertyPayload): Promise<Property> {
  const { data } = await api.post<Property>("/properties", payload);
  return data;
}

export async function updateProperty(propertyId: string, payload: PropertyPayload): Promise<void> {
  await api.put(`/properties/${encodeURIComponent(propertyId)}`, payload);
}

export async function deactivateProperty(propertyId: string): Promise<void> {
  await api.delete(`/properties/${encodeURIComponent(propertyId)}`);
}
