export function useUser() {
  return JSON.parse(localStorage.getItem("user") || "{}");
}
