import { sessionStorage } from "../lib";

export function useUser() {
  return sessionStorage.getUser() ?? { userName: "", farmName: null };
}
