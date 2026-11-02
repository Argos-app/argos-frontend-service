import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/httpClient";
import {
	logout as logoutRequest,
	signInWithBackend,
	signInWithEmail,
} from "@/services/authService";
import type { AuthContextType } from "@/context/types/auth-context.type";
import type { SignInResponse } from "@/types/sign-in-response.type";
import { useLifetime } from "@/hooks/useLifetime";

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [state, setState] = useState({
		profile: null as SignInResponse | null,
		initializing: true,
		initializationError: null as string | null,
	});
	const { profile, initializing, initializationError } = state;
	const lifetime = useLifetime();
	const sessionRequest = useRef(0);

	useEffect(() => {
		let active = true;
		const requestId = sessionRequest.current;

		async function restoreAccess() {
			try {
				await auth.authStateReady();
				if (!active) return;
				const data = auth.currentUser ? await signInWithBackend(auth.currentUser) : null;
				if (!active || sessionRequest.current !== requestId) return;
				if (data) api.defaults.headers.common.Authorization = `Bearer ${data.bearerToken}`;
				else delete api.defaults.headers.common.Authorization;
				setState({ profile: data, initializing: false, initializationError: null });
			} catch {
				if (!active || sessionRequest.current !== requestId) return;
				delete api.defaults.headers.common.Authorization;
				setState({ profile: null, initializing: false, initializationError: "Não foi possível recuperar seu acesso. Faça login novamente." });
			}
		}

		void restoreAccess();
		return () => {
			active = false;
		};
	}, []);

	async function signIn(email: string, password: string, rememberMe: boolean) {
		const owner = lifetime.current;
		if (!owner) return;
		const requestId = ++sessionRequest.current;
		setState((current) => ({ ...current, initializationError: null }));
		const data = await signInWithEmail(email, password, rememberMe);
		if (lifetime.current !== owner || sessionRequest.current !== requestId) return;
		api.defaults.headers.common.Authorization = `Bearer ${data.bearerToken}`;
		setState({ profile: data, initializing: false, initializationError: null });
	}

	async function logout() {
		const owner = lifetime.current;
		if (!owner) return;
		const requestId = ++sessionRequest.current;
		await logoutRequest();
		if (lifetime.current !== owner || sessionRequest.current !== requestId) return;
		delete api.defaults.headers.common.Authorization;
		setState({ profile: null, initializing: false, initializationError: null });
	}

	return (
		<AuthContext.Provider
			value={{
				user: profile ? auth.currentUser : null,
				profile,
				isAuthenticated: Boolean(profile?.bearerToken),
				initializationError,
				signIn,
				logout,
			}}
		>
			{initializing ? (
				<main role="status" aria-live="polite">
					Verificando acesso...
				</main>
			) : (
				children
			)}
		</AuthContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
	return useContext(AuthContext)!;
}
