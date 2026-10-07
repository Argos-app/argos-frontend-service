import axios from "axios";
import { auth } from "./firebase";
import { sessionStorage } from "./sessionStorage";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    backendAuthRetry?: boolean;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

let backendTokenRefresh: Promise<string> | null = null;

function refreshBackendToken(): Promise<string> {
  if (!backendTokenRefresh) {
    backendTokenRefresh = (async () => {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error("No authenticated Firebase user");

      const firebaseToken = await firebaseUser.getIdToken(true);
      const { data } = await api.post<{ bearerToken: string }>("/auth/signin", null, {
        headers: { Authorization: `Bearer ${firebaseToken}` },
      });
      sessionStorage.setToken(data.bearerToken);
      return data.bearerToken;
    })().finally(() => {
      backendTokenRefresh = null;
    });
  }

  return backendTokenRefresh;
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
