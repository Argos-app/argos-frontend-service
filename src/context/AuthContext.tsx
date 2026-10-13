import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { sessionStorage } from '@/lib/sessionStorage';
import type { AuthContextType } from '@/context/types/auth-context.type';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  refreshSession: () => undefined,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<{ user: User | null; loading: boolean; hasBackendSession: boolean }>(() => ({
    user: null,
    loading: true,
    hasBackendSession: Boolean(sessionStorage.getToken()),
  }));

  const refreshSession = useCallback(() => {
    setState((current) => ({ ...current, hasBackendSession: Boolean(sessionStorage.getToken()) }));
  }, []);

  useEffect(() => {
    window.addEventListener('argos:session-updated', refreshSession);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setState({ user: currentUser, loading: false, hasBackendSession: Boolean(sessionStorage.getToken()) });
    });

    return () => {
      unsubscribe();
      window.removeEventListener('argos:session-updated', refreshSession);
    };
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ user: state.user, loading: state.loading, isAuthenticated: state.hasBackendSession, refreshSession }}>
      {state.loading ? <main role="status" aria-live="polite">Verificando sessão...</main> : children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
