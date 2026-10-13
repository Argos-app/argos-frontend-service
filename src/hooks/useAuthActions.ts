import { useState } from "react";
import { validateSignIn } from "@/utils/validation";
import type { SignInCredentials } from "@/types/auth.type";
import { useNavigate } from "react-router";
import { logout as logoutRequest, signInWithEmail } from "@/services/authService";
import axios from "axios";

type AuthActionState = {
  fieldErrors: Partial<Record<keyof SignInCredentials, string>>;
} & (
  | { status: "idle" | "loading" | "success"; error: null }
  | { status: "error"; error: string | null }
);

export function useAuthActions() {
  const [state, setState] = useState<AuthActionState>({ status: "idle", error: null, fieldErrors: {} });
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  async function handleSignIn(email: string, password: string) {
    const validation = validateSignIn({ email, password });
    if (!validation.success) {
      setState({ status: "error", error: null, fieldErrors: validation.errors });
      return;
    }
    setState({ status: "loading", error: null, fieldErrors: {} });
    try {
      await signInWithEmail(validation.data.email, validation.data.password, rememberMe);
      setState({ status: "success", error: null, fieldErrors: {} });
      navigate("/home");
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err && typeof err.code === "string"
          ? err.code
          : "";
      const backendMessage = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      setState({ status: "error", error: backendMessage ?? mapFirebaseError(code), fieldErrors: {} });
    }
  }

  async function handleLogout() {
    setState({ status: "loading", error: null, fieldErrors: {} });
    try {
      await logoutRequest();
      setState({ status: "success", error: null, fieldErrors: {} });
      navigate("/login", { replace: true });
    } catch {
      setState({ status: "error", error: "Não foi possível encerrar a sessão. Tente novamente.", fieldErrors: {} });
    }
  }

  return { handleSignIn, handleLogout, loading: state.status === "loading", error: state.error, fieldErrors: state.fieldErrors, status: state.status, rememberMe, setRememberMe };
}

function mapFirebaseError(code: string): string {
  const errors: Record<string, string> = {
    "auth/invalid-credential": "Email ou senha incorretos",
    "auth/user-disabled": "Conta desativada",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde",
  };
  return errors[code] ?? "Erro ao realizar login";
}
