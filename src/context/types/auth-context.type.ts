
import { type User } from 'firebase/auth';
import type { SignInResponse } from '@/types/sign-in-response.type';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  profile: SignInResponse | null;
  initializationError: string | null;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
}
