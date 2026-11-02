import { ButtonComponent } from "@/components/Button/ButtonComponent";
import { useAuthActions } from "@/hooks/useAuthActions";

export function SignInAgain() {
	const { handleLogout, loading, error } = useAuthActions();
	return (
		<div className="space-y-2">
			<ButtonComponent
				className="w-auto rounded-xl"
				onClick={() => void handleLogout()}
				disabled={loading}
			>
				{loading ? "Encerrando sessão..." : "Entrar novamente"}
			</ButtonComponent>
			{error ? <p role="alert">{error}</p> : null}
		</div>
	);
}
