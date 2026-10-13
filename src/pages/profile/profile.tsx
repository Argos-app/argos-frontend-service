import Sidebar from "@/components/Sidebar/SidebarComponent";
import { AvatarComponent } from "@/components/Avatar/AvatarComponent";
import { ProfileSecurity } from "@/components/ProfileSecurity";
import { useUserProfile } from "@/hooks/useUserProfile";

export function Profile() {
  const { profile, loading, error, reload } = useUserProfile();
  const cpf = profile?.cpf?.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

  return (
    <div className="flex h-screen bg-brand-cream">
      <Sidebar />
      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto p-4 text-brand-ink sm:p-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-6">
            <h1 className="text-3xl font-semibold sm:text-4xl">Meu perfil</h1>
            <p className="mt-2 text-brand-forest">Seus dados pessoais, acesso e fazendas vinculadas.</p>
          </header>

          {loading ? <p role="status" aria-live="polite">Carregando seu perfil...</p> : null}
          {error ? (
            <div className="rounded-xl border border-brand-sand bg-white p-6">
              <p role="alert">{error}</p>
              <button type="button" onClick={reload} className="mt-4 min-h-11 rounded-lg bg-brand-forest px-4 py-3 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-forest">
                Tentar novamente
              </button>
            </div>
          ) : null}

          {profile ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-xl bg-brand-sand p-6">
                <AvatarComponent name={profile.name} photoUrl={profile.photoUrl} className="h-16 w-16 text-xl" />
                <p className="min-w-0 wrap-break-word text-2xl font-semibold">{profile.name}</p>
              </div>

              <section aria-labelledby="profile-personal-heading" className="rounded-xl border border-brand-sand bg-white p-6">
                <h2 id="profile-personal-heading" className="text-xl font-semibold">Dados pessoais</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><dt className="font-medium text-brand-forest">Nome</dt><dd className="mt-1 wrap-break-word">{profile.name}</dd></div>
                  <div><dt className="font-medium text-brand-forest">E-mail</dt><dd className="mt-1 break-all">{profile.email}</dd></div>
                  <div><dt className="font-medium text-brand-forest">CPF</dt><dd className="mt-1">{cpf || "Não informado"}</dd></div>
                </dl>
              </section>

              <section aria-labelledby="profile-access-heading" className="rounded-xl border border-brand-sand bg-white p-6">
                <h2 id="profile-access-heading" className="text-xl font-semibold">Acesso</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><dt className="font-medium text-brand-forest">Tipo de acesso</dt><dd className="mt-1 wrap-break-word">{profile.permissionName}</dd></div>
                  <div><dt className="font-medium text-brand-forest">Status da conta</dt><dd className="mt-1">{profile.active ? "Ativa" : "Inativa"}</dd></div>
                </dl>
              </section>

              <section aria-labelledby="profile-properties-heading" className="rounded-xl border border-brand-sand bg-white p-6">
                <h2 id="profile-properties-heading" className="text-xl font-semibold">Fazendas vinculadas</h2>
                {profile.properties.length > 0 ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5">
                    {profile.properties.map((property) => <li key={property.id} className="wrap-break-word">{property.name}</li>)}
                  </ul>
                ) : <p className="mt-4 text-brand-forest">Você não possui fazendas vinculadas ativas.</p>}
              </section>

              <ProfileSecurity email={profile.email} />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
