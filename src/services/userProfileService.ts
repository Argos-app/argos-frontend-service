import { api } from "@/lib/api";
import type { UserProfile } from "@/types/user-profile.type";
import { serviceRequest } from "@/services/serviceRequest";

export async function getMyProfile(signal?: AbortSignal): Promise<UserProfile> {
	return serviceRequest(async () => {
		const { data } = await api.get<UserProfile>("/users/me", { signal });
		return data;
	}, "Não foi possível carregar seu perfil.");
}
