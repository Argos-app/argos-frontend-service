import { createContext, useContext, useState, type ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { api } from '@/lib/httpClient';
import { logout as logoutRequest, signInWithEmail } from '@/services/authService';
import type { AuthContextType } from '@/context/types/auth-context.type';
import type { SignInResponse } from '@/types/sign-in-response.type';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [profile, setProfile] = useState<SignInResponse | null>(null);

  async function signIn(email: string, password: string) {
    const data = await signInWithEmail(email, password);
    api.defaults.headers.common.Authorization = `Bearer ${data.bearerToken}`;
    setProfile(data);
  }

  async function logout() {
    await logoutRequest();
    delete api.defaults.headers.common.Authorization;
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user: profile ? auth.currentUser : null, profile, isAuthenticated: Boolean(profile?.bearerToken), signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  return useContext(AuthContext)!;
}
