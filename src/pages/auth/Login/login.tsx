import { useState } from "react";
import {ButtonComponent, InputComponent} from "../../../components";
import Logo from "../../../assets/logo_main.svg";
import { KeyRound, Mail } from "lucide-react";
import { Link } from "react-router";
import { useAuthActions } from "../../../hooks/useAuthActions";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { handleSignIn, loading, error, rememberMe, setRememberMe } = useAuthActions();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleSignIn(email, password);
  }

  return (
    <div className="flex h-screen w-full bg-brand-cream">
      <div className="w-1/2 h-full hidden md:block shrink-0">
        <img
          className="w-full h-full object-cover object-left"
          src="https://portaldbo.com.br/wp-content/uploads/2026/06/pecuarista_gado_seca_celular-na-mao-e1781625578676.jpg"
          alt="Pecuarista de gado com celular na mão"
        />
      </div>

      <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-brand-cream">
        <form onSubmit={onSubmit} className="md:w-96 w-96 flex flex-col items-center justify-center">
          <img className="w-100 h-42" src={Logo} alt="Logo" />

          <h2 className="text-4xl text-brand-ink font-medium">Área administrativa</h2>
          <div className="flex items-center gap-4 w-full my-5">
            <div className="w-full h-px bg-brand-sand"></div>
            <p className="w-full text-nowrap text-sm text-brand-forest/70">O aplicativo que gere, cuida e organiza para você.</p>
            <div className="w-full h-px bg-brand-sand"></div>
          </div>

          {error && (
            <p className="w-full text-sm text-brand-brown text-center">{error}</p>
          )}

          <InputComponent
            type="email"
            placeholder="exemplo@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          >
            <Mail color="gray" size={18}/>
          </InputComponent>
          <InputComponent
            type="password"
            placeholder="Senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          >
            <KeyRound color="gray" size={18} />
          </InputComponent>


          <div className="w-full flex items-center justify-between mt-8 text-brand-forest/70">
            <div className="flex items-center gap-2">
              <input className="h-5" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} id="checkbox" />
              <label className="text-sm" htmlFor="checkbox">
                Lembrar acesso
              </label>
            </div>
            <Link className="text-sm underline" to="/forget-password">
              Esqueceu a senha?
            </Link>
          </div>

          <ButtonComponent type="submit" className="mt-10" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </ButtonComponent>
        </form>
      </div>
    </div>
  );
}
