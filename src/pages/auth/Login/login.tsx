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
	const { handleSignIn, loading, error, fieldErrors } = useAuthActions();

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		const result = await handleSignIn(credentials.email, credentials.password, rememberMe);
		if (result && !result.success) document.getElementById(result.errors.email ? "login-email" : "login-password")?.focus();
	}

	return (
		<main id="main-content" tabIndex={-1} className="flex min-h-screen w-full bg-brand-cream">
			<div className="relative w-1/2 hidden md:block shrink-0">
				<img
					className="absolute inset-0 w-full h-full object-cover object-left"
					src="https://portaldbo.com.br/wp-content/uploads/2026/06/pecuarista_gado_seca_celular-na-mao-e1781625578676.jpg"
					alt="Pecuarista de gado com celular na mão"
				/>
			</div>

			<div className="min-w-0 w-full md:w-1/2 flex flex-col items-center justify-center bg-brand-cream px-4 py-8">
				<form
					noValidate
					aria-busy={loading}
					aria-describedby={error ? "login-error" : undefined}
					onSubmit={onSubmit}
					className="w-full max-w-sm flex flex-col items-center justify-center"
				>
					<img className="w-100 max-w-full h-42" src={Logo} alt="Argos" />

					<header>
						<h1 className="text-3xl sm:text-4xl text-center text-brand-ink font-medium">Área administrativa</h1>
					</header>
					<div className="flex items-center gap-4 w-full my-5">
						<div aria-hidden="true" className="flex-1 h-px bg-brand-sand"></div>
						<p className="min-w-0 text-center text-sm text-brand-forest">
							O aplicativo que gere, cuida e organiza para você.
						</p>
						<div aria-hidden="true" className="flex-1 h-px bg-brand-sand"></div>
					</div>

					{error && (
						<p id="login-error" role="alert" className="w-full text-sm text-brand-ink text-center">
							{error}
						</p>
					)}

					<InputComponent
						id="login-email"
						aria-invalid={Boolean(fieldErrors.email)}
						aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
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
						<Mail aria-hidden="true" className="shrink-0" color="gray" size={18} />
					</InputComponent>
					{fieldErrors.email && <p id="login-email-error" role="alert" className="mt-2 w-full text-sm text-brand-forest">{fieldErrors.email}</p>}
					<InputComponent
						id="login-password"
						aria-invalid={Boolean(fieldErrors.password)}
						aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
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
						<KeyRound aria-hidden="true" className="shrink-0" color="gray" size={18} />
					</InputComponent>
					{fieldErrors.password && <p id="login-password-error" role="alert" className="mt-2 w-full text-sm text-brand-forest">{fieldErrors.password}</p>}

					<div className="w-full flex flex-wrap gap-3 items-center justify-between mt-8 text-brand-forest">
						<label
							className="flex items-center gap-2 text-sm"
							htmlFor="remember-access"
						>
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
