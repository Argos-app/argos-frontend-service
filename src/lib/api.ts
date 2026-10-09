import { api } from "@/lib/httpClient";
import { refreshBackendToken } from "@/services/authService";

import { auth } from "@/lib/firebase";
import { sessionStorage } from "@/lib/sessionStorage";

export { api };

declare module "axios" {
  interface InternalAxiosRequestConfig {
    backendAuthRetry?: boolean;
  }
}

api.interceptors.request.use((config) => {
  const token = sessionStorage.getToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const request = error.config;
      const isSignInRequest = request?.url?.includes("/auth/signin");

      if (request && !request.backendAuthRetry && !isSignInRequest && auth.currentUser) {
        request.backendAuthRetry = true;
        try {
          const token = await refreshBackendToken();
          request.headers.Authorization = `Bearer ${token}`;
          return api.request(request);
        } catch {
          // Fall through to clear the expired backend session and return to login.
        }
      }

      sessionStorage.clear();
      window.dispatchEvent(new Event("argos:session-expired"));
    }
    return Promise.reject(error);
  }
);
