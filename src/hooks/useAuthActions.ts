import { useState } from "react";
import { useNavigate } from "react-router";
import { signInWithEmail } from "../services";
import { browserLocalPersistence, browserSessionPersistence, setPersistence } from "firebase/auth";
import { auth } from "../lib";
import axios from "axios";

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  async function handleSignIn(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const persistLogin = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistLogin);

      const data = await signInWithEmail(email, password);
      localStorage.setItem("bearerToken", data.bearerToken);
      localStorage.setItem("user", JSON.stringify({
        userName: data.userName,
        farmName: data.farmName,
      }));

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

  return { handleSignIn, loading, error, rememberMe, setRememberMe };
}

function mapFirebaseError(code: string): string {
  const errors: Record<string, string> = {
    "auth/invalid-credential": "Email ou senha incorretos",
    "auth/user-disabled": "Conta desativada",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde",
  };
  return errors[code] ?? "Erro ao realizar login";
}
