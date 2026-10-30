import { useState } from "react";
import { resetPassword } from "@/services/authService";

export function usePasswordReset() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(email: string) {
    setLoading(true);
    setSent(false);
    setError(null);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError("Não foi possível enviar o link. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading, sent, error };
}
