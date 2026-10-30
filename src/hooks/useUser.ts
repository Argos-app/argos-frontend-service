import { useAuth } from "@/context/AuthContext";

export function useUser() {
  const { profile } = useAuth();
  return { userName: profile?.userName ?? "", farmName: profile?.farmName ?? null };
}
