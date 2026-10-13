import { usePasswordReset } from "@/hooks/usePasswordReset";

interface ProfileSecurityProps {
  email: string;
}

export function ProfileSecurity({ email }: ProfileSecurityProps) {
  const { submit, loading, sent, error, emailError } = usePasswordReset();

  return (
    <section aria-labelledby="profile-security-heading" className="rounded-xl border border-brand-sand bg-white p-6">
      <h2 id="profile-security-heading" className="text-xl font-semibold text-brand-ink">Segurança</h2>
      <p className="mt-2 text-brand-forest">
        Enviaremos um link de redefinição de senha para <span className="break-all font-medium">{email}</span>.
      </p>
      <button
        type="button"
        onClick={() => void submit(email)}
        disabled={loading}
        aria-describedby="profile-password-status"
        className="mt-4 min-h-11 rounded-lg bg-brand-forest px-4 py-3 font-medium text-white hover:bg-brand-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-forest disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Enviando link..." : "Enviar link para alterar senha"}
      </button>
      <p id="profile-password-status" role="status" aria-live="polite" className="mt-3 text-brand-forest">
        {loading ? "Enviando link de redefinição..." : sent ? "Link solicitado. Verifique sua caixa de entrada e a pasta de spam." : ""}
      </p>
      {error || emailError ? <p role="alert" className="mt-2 text-brand-ink">{error ?? emailError}</p> : null}
    </section>
  );
}
