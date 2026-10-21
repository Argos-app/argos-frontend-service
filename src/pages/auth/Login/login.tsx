import { useEffect, useState } from "react";
import { ButtonComponent } from "@/components/Button";
import { InputComponent } from "@/components/Input";
import Logo from "@/assets/logo_main.svg";
import { KeyRound, Mail } from "lucide-react";
import { Link } from "react-router";
import { useAuthActions } from "@/hooks/useAuthActions";

export const Login = () => {
	const [credentials, setCredentials] = useState({ email: "", password: "" });
	const [submitAttempt, setSubmitAttempt] = useState(0);
  const { handleSignIn, loading, status, error, fieldErrors, rememberMe, setRememberMe } = useAuthActions();
  const firstInvalidField = fieldErrors.email ? "login-email" : fieldErrors.password ? "login-password" : null;

  useEffect(() => {
    if (firstInvalidField) document.getElementById(firstInvalidField)?.focus();
  }, [firstInvalidField, submitAttempt]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
		setSubmitAttempt((attempt) => attempt + 1);
		void handleSignIn(credentials.email, credentials.password);
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
        <form noValidate aria-busy={loading} onSubmit={onSubmit} className="md:w-96 w-96 flex flex-col items-center justify-center">
          <img className="w-100 h-42" src={Logo} alt="Argos" />

          <header>
            <h1 className="text-4xl text-brand-ink font-medium">Área administrativa</h1>
          </header>
          <div className="flex items-center gap-4 w-full my-5">
            <div className="w-full h-px bg-brand-sand"></div>
            <p className="w-full text-nowrap text-sm text-brand-forest">O aplicativo que gere, cuida e organiza para você.</p>
            <div className="w-full h-px bg-brand-sand"></div>
          </div>

          {error && (
            <p role="alert" className="w-full text-sm text-brand-ink text-center">{error}</p>
          )}

          <InputComponent
				id="login-email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
				label="E-mail"
				name="email"
				autoComplete="email"
				spellCheck={false}
				maxLength={120}
            type="email"
            placeholder="exemplo@email.com"
            required
				value={credentials.email}
				onChange={(e) => setCredentials((current) => ({ ...current, email: e.target.value }))}
          >
            <Mail color="gray" size={18}/>
          </InputComponent>
          {fieldErrors.email && <p id="login-email-error" role="alert" className="w-full text-sm text-brand-ink">{fieldErrors.email}</p>}
          <InputComponent
				id="login-password"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
				label="Senha"
				name="password"
				autoComplete="current-password"
				maxLength={128}
            type="password"
            placeholder="Senha"
            required
				value={credentials.password}
				onChange={(e) => setCredentials((current) => ({ ...current, password: e.target.value }))}
          >
            <KeyRound color="gray" size={18} />
          </InputComponent>
          {fieldErrors.password && <p id="login-password-error" role="alert" className="w-full text-sm text-brand-ink">{fieldErrors.password}</p>}


          <div className="w-full flex items-center justify-between mt-8 text-brand-forest">
            <div className="flex items-center gap-2">
              <input className="h-5" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} id="checkbox" />
              <label className="text-sm" htmlFor="checkbox">
                Lembrar acesso
              </label>
            </div>
            <Link
              className="text-sm underline link-redirect"
              to="/forget-password"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <ButtonComponent type="submit" className="mt-10" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </ButtonComponent>
          {loading && <p role="status" aria-live="polite" className="sr-only">Autenticando...</p>}
          {status === "success" && <p role="status" aria-live="polite">Login realizado com sucesso.</p>}
        </form>
      </div>
    </main>
  );
}
