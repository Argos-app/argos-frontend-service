import { useNavigate } from "react-router";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <main id="main-content" tabIndex={-1} className="grid min-h-screen place-items-center bg-brand-cream p-6 text-center">
      <section>
        <h1 className="text-4xl font-semibold text-brand-ink">Página não encontrada</h1>
        <p className="mt-3 text-brand-forest">O endereço informado não corresponde a uma página disponível.</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-6 rounded-lg bg-brand-forest px-5 py-3 text-brand-cream focus-visible:outline-2 focus-visible:outline-offset-2">
          Voltar
        </button>
      </section>
    </main>
  );
}

