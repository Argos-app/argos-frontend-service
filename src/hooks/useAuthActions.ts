import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { getSignInErrorMessage } from "@/utils/authError";
import { useLifetime } from "@/hooks/useLifetime";
import { validateLogin } from "@/utils/validation";
import type { LoginValues } from "@/types/auth.type";

type AuthActionState = {
	status: "idle" | "loading" | "error";
	error: string | null;
	fieldErrors: Partial<Record<keyof LoginValues, string>>;
};

export function useAuthActions() {
	const [state, setState] = useState<AuthActionState>({ status: "idle", error: null, fieldErrors: {} });
	const lifetime = useLifetime();
	const pending = useRef(false);
	const { signIn, logout, initializationError } = useAuth();
	const navigate = useNavigate();

	async function handleSignIn(email: string, password: string, rememberMe: boolean) {
		const owner = lifetime.current;
		if (!owner || pending.current) return;
		const result = validateLogin({ email, password });
		if (!result.success) {
			setState({ status: "error", error: null, fieldErrors: result.errors });
			return result;
		}
		pending.current = true;
		setState({ status: "loading", error: null, fieldErrors: {} });
		try {
			await signIn(result.data.email, result.data.password, rememberMe);
			if (lifetime.current !== owner) return;
			setState({ status: "idle", error: null, fieldErrors: {} });
			navigate("/home");
		} catch (err: unknown) {
			if (lifetime.current !== owner) return;
			setState({ status: "error", fieldErrors: {}, error: getSignInErrorMessage(err) });
		} finally {
			pending.current = false;
		}
	}

	async function handleLogout() {
		const owner = lifetime.current;
		if (!owner || pending.current) return;
		pending.current = true;
		setState({ status: "loading", error: null, fieldErrors: {} });
		try {
			await logout();
			if (lifetime.current !== owner) return;
			setState({ status: "idle", error: null, fieldErrors: {} });
			navigate("/login", { replace: true });
		} catch {
			if (lifetime.current === owner) setState({ status: "error", error: "Não foi possível encerrar a sessão.", fieldErrors: {} });
		} finally {
			pending.current = false;
		}
	}

	return { handleSignIn, handleLogout, loading: state.status === "loading", fieldErrors: state.fieldErrors,
		error: state.status === "idle" ? initializationError : state.error };
}
