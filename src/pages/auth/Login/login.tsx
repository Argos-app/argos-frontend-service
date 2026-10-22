import { useState } from "react";
import { ButtonComponent } from "@/components/Button";
import { InputComponent } from "@/components/Input";
import Logo from "@/assets/logo_main.svg";
import { KeyRound, Mail } from "lucide-react";
import { Link } from "react-router";
import { useAuthActions } from "@/hooks/useAuthActions";

export const Login = () => {
	const [credentials, setCredentials] = useState({ email: "", password: "" });
	const [rememberMe, setRememberMe] = useState(false);
	const { handleSignIn, loading, error } = useAuthActions();

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		void handleSignIn(credentials.email, credentials.password, rememberMe);
	}

	return (
		<main id="main-content" tabIndex={-1} className="flex h-screen w-full bg-brand-cream">
			<div className="w-1/2 h-full hidden md:block shrink-0">
				<img
					className="w-full h-full object-cover object-left"
					src="https://portaldbo.com.br/wp-content/uploads/2026/06/pecuarista_gado_seca_celular-na-mao-e1781625578676.jpg"
					alt="Pecuarista de gado com celular na mão"
				/>
			</div>

			<div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-brand-cream">
				<form
					aria-busy={loading}
					onSubmit={onSubmit}
					className="md:w-96 w-96 flex flex-col items-center justify-center"
				>
					<img className="w-100 h-42" src={Logo} alt="Argos" />

					<header>
						<h1 className="text-4xl text-brand-ink font-medium">Área administrativa</h1>
					</header>
					<div className="flex items-center gap-4 w-full my-5">
						<div className="w-full h-px bg-brand-sand"></div>
						<p className="w-full text-nowrap text-sm text-brand-forest">
							O aplicativo que gere, cuida e organiza para você.
						</p>
						<div className="w-full h-px bg-brand-sand"></div>
					</div>

					{error && (
						<p role="alert" className="w-full text-sm text-brand-ink text-center">
							{error}
						</p>
					)}

					<InputComponent
						id="login-email"
						label="E-mail"
						name="email"
						autoComplete="email"
						spellCheck={false}
						type="email"
						placeholder="exemplo@email.com"
						required
						value={credentials.email}
						onChange={(e) =>
							setCredentials((current) => ({ ...current, email: e.target.value }))
						}
					>
						<Mail color="gray" size={18} />
					</InputComponent>
					<InputComponent
						id="login-password"
						label="Senha"
						name="password"
						autoComplete="current-password"
						type="password"
						placeholder="Senha"
						required
						value={credentials.password}
						onChange={(e) =>
							setCredentials((current) => ({ ...current, password: e.target.value }))
						}
					>
						<KeyRound color="gray" size={18} />
					</InputComponent>

					<div className="w-full flex items-center justify-between mt-8 text-brand-forest">
						<label className="flex items-center gap-2 text-sm" htmlFor="remember-access">
							<input
								id="remember-access"
								type="checkbox"
								checked={rememberMe}
								onChange={(e) => setRememberMe(e.target.checked)}
							/>
							Lembrar acesso
						</label>
						<Link className="text-sm underline link-redirect" to="/forget-password">
							Esqueceu a senha?
						</Link>
					</div>

					<ButtonComponent type="submit" className="mt-10" disabled={loading}>
						{loading ? "Entrando..." : "Entrar"}
					</ButtonComponent>
					{loading && (
						<p role="status" aria-live="polite" className="sr-only">
							Autenticando...
						</p>
					)}
				</form>
			</div>
		</main>
	);
};
