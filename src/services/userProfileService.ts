import { api } from "@/lib/api";
import { serviceRequest } from "@/services/serviceRequest";
import type { UserProfile } from "@/types/user-profile.type";

export async function getMyProfile(signal?: AbortSignal): Promise<UserProfile> {
  return serviceRequest(async () => {
    const { data } = await api.get<UserProfile>("/users/me", { signal });
    return data;
  }, "Não foi possível consultar seu perfil.");
}
