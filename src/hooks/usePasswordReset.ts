import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { resetPassword } from "@/services/authService";
import { validatePasswordReset } from "@/utils/validation";

type ResetResult =
  | { status: "idle" | "loading" | "success"; error: null; emailError: null }
  | { status: "error"; error: string; emailError: null }
  | { status: "error"; error: null; emailError: string };
type ResetState = ResetResult & { identity: string };

function initialState(identity: string): ResetState {
  return { identity, status: "idle", error: null, emailError: null };
}

export function usePasswordReset() {
  const { user, isAuthenticated } = useAuth();
  const identity = `${isAuthenticated}:${user?.uid ?? "guest"}`;
  const [state, setState] = useState(() => initialState(identity));
  const pending = useRef<{ identity: string } | null>(null);

  if (state.identity !== identity) setState(initialState(identity));

  useEffect(() => () => {
    if (pending.current?.identity === identity) pending.current = null;
  }, [identity]);

  async function submit(email: string) {
    if (pending.current?.identity === identity) return;
    const validation = validatePasswordReset({ email });
    if (!validation.success) {
      setState({ identity, status: "error", error: null, emailError: validation.errors.email ?? "Informe um e-mail válido." });
      return;
    }
    const request = { identity };
    pending.current = request;
    setState({ identity, status: "loading", error: null, emailError: null });
    let result: ResetResult;
    try {
      await resetPassword(validation.data.email);
      result = { status: "success", error: null, emailError: null };
    } catch {
      result = { status: "error", error: "Não foi possível enviar o link. Tente novamente mais tarde.", emailError: null };
    }
    if (pending.current !== request) return;
    pending.current = null;
    setState((previous) => previous.identity === identity ? { identity, ...result } : previous);
  }

  return { submit, loading: state.status === "loading", sent: state.status === "success", error: state.error, emailError: state.emailError };
}
