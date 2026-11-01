import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { getSignInErrorMessage } from "@/utils/authError";

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, logout, initializationError } = useAuth();
  const navigate = useNavigate();

  async function handleSignIn(email: string, password: string, rememberMe: boolean) {
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password, rememberMe);
      navigate("/home");
    } catch (err: unknown) {
      setError(getSignInErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setError(null);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setError("Não foi possível encerrar a sessão.");
    } finally {
      setLoading(false);
    }
  }

  return { handleSignIn, handleLogout, loading, error: error ?? initializationError };
}
