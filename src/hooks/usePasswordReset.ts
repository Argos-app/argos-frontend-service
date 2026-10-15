import { useRef, useState } from "react";
import { resetPassword } from "@/services/authService";
import { validatePasswordReset } from "@/utils/validation";

type ResetState =
  | { status: "idle" | "loading" | "success"; error: null; emailError: null }
  | { status: "error"; error: string; emailError: null }
  | { status: "error"; error: null; emailError: string };

const initialState: ResetState = { status: "idle", error: null, emailError: null };

export function usePasswordReset() {
  const [state, setState] = useState<ResetState>(initialState);
  const pending = useRef(false);

  async function submit(email: string) {
    if (pending.current) return;

    const validation = validatePasswordReset({ email });
    if (!validation.success) {
      setState({ status: "error", error: null, emailError: validation.errors.email ?? "Informe um e-mail válido." });
      return;
    }

    pending.current = true;
    setState({ status: "loading", error: null, emailError: null });
    try {
      await resetPassword(validation.data.email);
      setState({ status: "success", error: null, emailError: null });
    } catch {
      setState({ status: "error", error: "Não foi possível enviar o link. Tente novamente mais tarde.", emailError: null });
    } finally {
      pending.current = false;
    }
  }

  return {
    submit,
    loading: state.status === "loading",
    sent: state.status === "success",
    error: state.error,
    emailError: state.emailError,
  };
}
