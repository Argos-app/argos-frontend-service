import { sessionStorage } from "@/lib/sessionStorage";

export function useUser() {
  return sessionStorage.getUser() ?? { userName: "", farmName: null };
}
