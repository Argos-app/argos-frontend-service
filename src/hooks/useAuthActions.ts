import { useState } from "react";
import { validatePasswordReset, validateSignIn } from "@/utils/validation";
import type { SignInCredentials } from "@/types/auth.type";
import { useNavigate } from "react-router";
import { logout as logoutRequest, resetPassword, signInWithEmail } from "@/services/authService";
import axios from "axios";
import { sessionStorage } from "@/lib/sessionStorage";
import { useAuth } from "@/context/AuthContext";

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
  const { refreshSession } = useAuth();

  async function handleSignIn(email: string, password: string) {
    const validation = validateSignIn({ email, password });
    if (!validation.success) {
      setState({ status: "error", error: null, fieldErrors: validation.errors });
      return;
    }
    setState({ status: "loading", error: null, fieldErrors: {} });
    try {
      const data = await signInWithEmail(validation.data.email, validation.data.password, rememberMe);
      sessionStorage.setSession(data.bearerToken, {
        userName: data.userName,
        farmName: data.farmName,
      });
      refreshSession();

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
      refreshSession();
      setState({ status: "success", error: null, fieldErrors: {} });
      navigate("/login", { replace: true });
    } catch {
      setState({ status: "error", error: "Não foi possível encerrar a sessão. Tente novamente.", fieldErrors: {} });
    }
  }

  async function handlePasswordReset(email: string) {
    const validation = validatePasswordReset({ email });
    if (!validation.success) return validation;
    await resetPassword(validation.data.email);
    return validation;
  }

  return { handleSignIn, handleLogout, handlePasswordReset, loading: state.status === "loading", error: state.error, fieldErrors: state.fieldErrors, status: state.status, rememberMe, setRememberMe };
}

function mapFirebaseError(code: string): string {
  const errors: Record<string, string> = {
    "auth/invalid-credential": "Email ou senha incorretos",
    "auth/user-disabled": "Conta desativada",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde",
  };
  return errors[code] ?? "Erro ao realizar login";
}

type PasswordResetState =
  | { status: "idle" | "loading" | "success"; error: null; emailError: null }
  | { status: "error"; error: string; emailError: null }
  | { status: "error"; error: null; emailError: string };

export function usePasswordReset() {
  const [state, setState] = useState<PasswordResetState>({ status: "idle", error: null, emailError: null });

  async function submit(email: string) {
    const validation = validatePasswordReset({ email });
    if (!validation.success) {
      setState({ status: "error", error: null, emailError: validation.errors.email ?? "Informe um e-mail válido." });
      return;
    }
    setState({ status: "loading", error: null, emailError: null });
    try {
      await resetPassword(validation.data.email);
      setState({ status: "success", error: null, emailError: null });
    } catch {
      setState({ status: "error", error: "Erro ao enviar link. Verifique o e-mail informado.", emailError: null });
    }
  }

  return { submit, loading: state.status === "loading", sent: state.status === "success", error: state.error, emailError: state.emailError };
}
