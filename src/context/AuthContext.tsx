import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, sessionStorage } from '../lib';
import type { AuthContextType } from './types/auth-context.type';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasBackendSession, setHasBackendSession] = useState(() => Boolean(sessionStorage.getToken()));

  const refreshSession = useCallback(() => {
    setHasBackendSession(Boolean(sessionStorage.getToken()));
  }, []);

  useEffect(() => {
    window.addEventListener('argos:session-updated', refreshSession);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      refreshSession();
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('argos:session-updated', refreshSession);
    };
  }, [refreshSession]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: hasBackendSession, refreshSession }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
