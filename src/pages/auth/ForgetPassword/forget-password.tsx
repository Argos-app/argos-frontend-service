import { useEffect, useState } from "react";
import { CircleAlert, Mail, CheckCircle } from "lucide-react";
import { ButtonComponent } from "@/components/Button";
import { InputComponent } from "@/components/Input";
import { Link } from "react-router";
import { usePasswordReset } from "@/hooks/useAuthActions";

export const ForgetPassword = () => {
	const [email, setEmail] = useState("");
	const [submitAttempt, setSubmitAttempt] = useState(0);
	const { submit, loading, error, emailError, sent } = usePasswordReset();

	useEffect(() => {
		if (emailError) document.getElementById("reset-email")?.focus();
	}, [emailError, submitAttempt]);

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitAttempt((attempt) => attempt + 1);
		void submit(email);
	}

	return (
		<main id="main-content" tabIndex={-1} className="flex min-h-screen justify-center items-center w-full bg-brand-cream px-4 py-8">
			<div className="w-full max-w-lg">
				<form noValidate aria-busy={loading} onSubmit={onSubmit} className="flex flex-col items-center w-full">
					<header>
					<h1 className="text-4xl md:text-5xl text-brand-ink font-medium mb-4 text-center">
						Esqueceu sua senha?
					</h1>
					</header>
					<p className="text-brand-forest/80 text-center text-sm sm:text-base mb-2">
						Um link de redefinição de senha será enviado para o e-mail cadastrado abaixo:
					</p>

					{sent ? (
						<div role="status" aria-live="polite" className="flex items-center gap-2 mt-6 text-brand-forest">
							<CheckCircle size={20} />
							<p className="text-sm">Link enviado! Verifique sua caixa de entrada.</p>
						</div>
					) : (
						<>
							{error && (
								<p role="alert" className="w-full text-sm text-brand-ink text-center mt-4">{error}</p>
							)}
							<InputComponent
								id="reset-email"
								disabled={loading}
								maxLength={120}
								aria-invalid={Boolean(emailError)}
								aria-describedby={emailError ? "reset-email-error" : undefined}
								label="E-mail para redefinição de senha"
								name="email"
								autoComplete="email"
								spellCheck={false}
								type="email"
								placeholder="exemplo@email.com"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							>
								<Mail color="gray" size={18} />
							</InputComponent>
							{emailError && <p id="reset-email-error" role="alert" className="w-full text-sm text-brand-ink">{emailError}</p>}
							<ButtonComponent type="submit" disabled={loading} className="font-medium w-full mt-8">
								{loading ? "Enviando..." : "Enviar Link"}
							</ButtonComponent>
						</>
					)}

					<div className="flex items-start gap-2 mt-4">
						<CircleAlert className="text-brand-forest shrink-0 mt-0.5" size={18} />
						<p className="text-sm text-brand-forest/80">
							Caso o e-mail acima não seja o seu, entre em contato com a sua organização para atualizar seus dados.
						</p>
					</div>
					<Link
						className="text-sm mt-5 link-redirect transition-colors"
						to="/login"
					>
						Voltar para Login
					</Link>
				{loading && <p role="status" aria-live="polite" className="sr-only">Enviando link de redefinição...</p>}
				</form>
			</div>
		</main>
	);
};
