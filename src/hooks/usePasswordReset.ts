import { useRef, useState } from "react";
import { resetPassword } from "@/services/authService";
import { useLifetime } from "@/hooks/useLifetime";
import { validatePasswordReset } from "@/utils/validation";

type ResetState = { status: "idle" | "loading" | "sent" | "error"; error: string | null; fieldErrors: { email?: string } };

export function usePasswordReset() {
	const [state, setState] = useState<ResetState>({ status: "idle", error: null, fieldErrors: {} });
	const lifetime = useLifetime();
	const pending = useRef(false);

	async function submit(email: string) {
		const owner = lifetime.current;
		if (!owner || pending.current) return;
		const result = validatePasswordReset({ email });
		if (!result.success) {
			setState({ status: "error", error: null, fieldErrors: result.errors });
			return result;
		}
		pending.current = true;
		setState({ status: "loading", error: null, fieldErrors: {} });
		try {
			await resetPassword(result.data.email);
			if (lifetime.current === owner) setState({ status: "sent", error: null, fieldErrors: {} });
		} catch {
			if (lifetime.current === owner) setState({ status: "error", error: "Não foi possível enviar o link. Tente novamente mais tarde.", fieldErrors: {} });
		} finally {
			pending.current = false;
		}
	}

	return { submit, loading: state.status === "loading", sent: state.status === "sent", error: state.error, fieldErrors: state.fieldErrors };
}
