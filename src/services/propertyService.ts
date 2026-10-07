import { api } from "../lib";
import type { AdminUserOption, PageResponse, Property, PropertyPayload } from "../types";
import { serviceRequest } from "./serviceRequest";

export async function getProperties(page = 0, size = 10, signal?: AbortSignal): Promise<PageResponse<Property>> {
  return serviceRequest(async () => {
    const { data } = await api.get<PageResponse<Property>>("/properties", { params: { page, size }, signal });
    return data;
  }, "Não foi possível consultar as propriedades.");
}

export async function getAdministrators(page = 0, size = 100, signal?: AbortSignal): Promise<PageResponse<AdminUserOption>> {
  return serviceRequest(async () => {
    const { data } = await api.get<PageResponse<AdminUserOption>>("/users/admins", { params: { page, size }, signal });
    return data;
  }, "Não foi possível consultar os administradores.");
}

export async function createProperty(payload: PropertyPayload): Promise<Property> {
  return serviceRequest(async () => {
    const { data } = await api.post<Property>("/properties", payload);
    return data;
  }, "Não foi possível cadastrar a propriedade.");
}

export async function updateProperty(propertyId: string, payload: PropertyPayload): Promise<void> {
  return serviceRequest(() => api.put(`/properties/${encodeURIComponent(propertyId)}`, payload).then(() => undefined), "Não foi possível atualizar a propriedade.");
}

export async function deactivateProperty(propertyId: string): Promise<void> {
  return serviceRequest(() => api.delete(`/properties/${encodeURIComponent(propertyId)}`).then(() => undefined), "Não foi possível desativar a propriedade.");
}
