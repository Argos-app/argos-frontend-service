import { useState } from "react";
import { useNavigate } from "react-router";
import { logout as logoutRequest, resetPassword, signInWithEmail } from "../services";
import { browserLocalPersistence, browserSessionPersistence, setPersistence } from "firebase/auth";
import { auth } from "../lib";
import axios from "axios";
import { sessionStorage } from "../lib";
import { useAuth } from "../context/AuthContext";

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  async function handleSignIn(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const persistLogin = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistLogin);

      const data = await signInWithEmail(email, password);
      sessionStorage.setSession(data.bearerToken, {
        userName: data.userName,
        farmName: data.farmName,
      });
      refreshSession();

      navigate("/home");
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err && typeof err.code === "string"
          ? err.code
          : "";
      const backendMessage = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setError(backendMessage ?? mapFirebaseError(code));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logoutRequest();
    refreshSession();
    navigate("/login", { replace: true });
  }

  async function handlePasswordReset(email: string) {
    await resetPassword(email);
  }

  return { handleSignIn, handleLogout, handlePasswordReset, loading, error, rememberMe, setRememberMe };
}

function mapFirebaseError(code: string): string {
  const errors: Record<string, string> = {
    "auth/invalid-credential": "Email ou senha incorretos",
    "auth/user-disabled": "Conta desativada",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde",
  };
  return errors[code] ?? "Erro ao realizar login";
}
