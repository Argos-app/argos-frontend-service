import { api } from "@/lib/api";
import type { UserProfile } from "@/types/user-profile.type";

export async function getMyProfile(signal?: AbortSignal): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/users/me", { signal });
  return data;
}
