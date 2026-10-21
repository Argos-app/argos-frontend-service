import { api } from "@/lib/httpClient";
import { refreshBackendToken } from "@/services/authService";

import { auth } from "@/lib/firebase";
import { sessionStorage } from "@/lib/sessionStorage";

export { api };

declare module "axios" {
  interface InternalAxiosRequestConfig {
    backendAuthRetry?: boolean;
    backendAuthUid?: string | null;
  }
}

api.interceptors.request.use((config) => {
  if (config.backendAuthUid === undefined) config.backendAuthUid = auth.currentUser?.uid ?? null;
  const token = sessionStorage.getToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status !== 401) return Promise.reject(error);
    const request = error.config;
    const belongsToCurrentSession = () => request && !request.signal?.aborted
      && request.backendAuthUid === (auth.currentUser?.uid ?? null);
    if (!belongsToCurrentSession()) return Promise.reject(error);

    if (!request.backendAuthRetry && !request.url?.includes("/auth/signin") && auth.currentUser) {
      request.backendAuthRetry = true;
      const token = await refreshBackendToken().catch(() => null);
      if (!belongsToCurrentSession()) return Promise.reject(error);
      if (token) {
        request.headers.Authorization = `Bearer ${token}`;
        return api.request(request);
      }
    }

    sessionStorage.clear();
    window.dispatchEvent(new Event("argos:session-expired"));
    return Promise.reject(error);
  }
);
