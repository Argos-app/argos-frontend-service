import { useState } from "react";
import { CircleAlert, Mail, CheckCircle } from "lucide-react";
import { ButtonComponent, InputComponent } from "../../../components";
import { Link } from "react-router";
import { resetPassword } from "../../../services/authService";

export const ForgetPassword = () => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		setError(null);
		try {
			await resetPassword(email);
			setSent(true);
		} catch {
			setError("Erro ao enviar link. Verifique o e-mail informado.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="flex min-h-screen justify-center items-center w-full bg-brand-cream px-4 py-8">
			<div className="w-full max-w-lg">
				<form onSubmit={onSubmit} className="flex flex-col items-center w-full">
					<h1 className="text-4xl md:text-5xl text-brand-ink font-medium mb-4 text-center">
						Esqueceu sua senha?
					</h1>
					<p className="text-brand-forest/80 text-center text-sm sm:text-base mb-2">
						Um link de redefinição de senha será enviado para o e-mail cadastrado abaixo:
					</p>

					{sent ? (
						<div className="flex items-center gap-2 mt-6 text-brand-forest">
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
								label="E-mail para redefinição de senha"
								type="email"
								placeholder="exemplo@email.com"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							>
								<Mail color="gray" size={18} />
							</InputComponent>
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
				</form>
			</div>
		</main>
	);
};
