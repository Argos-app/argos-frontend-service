import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { sessionStorage } from '@/lib/sessionStorage';
import type { AuthContextType } from '@/context/types/auth-context.type';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
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

  useEffect(() => {
    const refreshSession = () => {
      const hasBackendSession = Boolean(sessionStorage.getToken());
      setState((current) => current.hasBackendSession === hasBackendSession
        ? current
        : { ...current, hasBackendSession });
    };
    let previousUid: string | null | undefined;
    window.addEventListener('argos:session-updated', refreshSession);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const uid = currentUser?.uid ?? null;
      if (uid === null || (previousUid !== undefined && previousUid !== uid)) sessionStorage.clear();
      previousUid = uid;
      setState({ user: currentUser, loading: false, hasBackendSession: Boolean(sessionStorage.getToken()) });
    });

    return () => {
      unsubscribe();
      window.removeEventListener('argos:session-updated', refreshSession);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user: state.user, loading: state.loading, isAuthenticated: state.hasBackendSession && state.user !== null }}>
      {state.loading ? <main role="status" aria-live="polite">Verificando sessão...</main> : children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
