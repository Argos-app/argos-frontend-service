import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/httpClient';
import { logout as logoutRequest, signInWithBackend, signInWithEmail } from '@/services/authService';
import type { AuthContextType } from '@/context/types/auth-context.type';
import type { SignInResponse } from '@/types/sign-in-response.type';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [profile, setProfile] = useState<SignInResponse | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreAccess() {
      try {
        await auth.authStateReady();
        if (!active || !auth.currentUser) return;
        const data = await signInWithBackend(auth.currentUser);
        if (!active) return;
        api.defaults.headers.common.Authorization = `Bearer ${data.bearerToken}`;
        setProfile(data);
      } catch {
        if (!active) return;
        delete api.defaults.headers.common.Authorization;
        setProfile(null);
        setInitializationError('Não foi possível recuperar seu acesso. Faça login novamente.');
      } finally {
        if (active) setInitializing(false);
      }
    }

    void restoreAccess();
    return () => { active = false; };
  }, []);

  async function signIn(email: string, password: string, rememberMe: boolean) {
    setInitializationError(null);
    const data = await signInWithEmail(email, password, rememberMe);
    api.defaults.headers.common.Authorization = `Bearer ${data.bearerToken}`;
    setProfile(data);
  }

  async function logout() {
    await logoutRequest();
    delete api.defaults.headers.common.Authorization;
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user: profile ? auth.currentUser : null, profile, isAuthenticated: Boolean(profile?.bearerToken), initializationError, signIn, logout }}>
      {initializing ? <main role="status" aria-live="polite">Verificando acesso...</main> : children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  return useContext(AuthContext)!;
}
