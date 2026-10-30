import Sidebar from "@/components/Sidebar/SidebarComponent";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Empty } from "antd";
import { ButtonComponent } from "@/components";
import { usePasswordReset } from "@/hooks/usePasswordReset";
import { AvatarComponent } from "@/components/Avatar";

export function Profile() {
	const { profile, loading, error, reload } = useUserProfile();
	const { submit, loading: passwordLoading, sent, error: passwordError } = usePasswordReset();

	const cpf = profile?.cpf?.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

	return (
		<div className="flex h-screen bg-brand-cream">
			<Sidebar />
			<main
				id="main-content"
				tabIndex={-1}
				className="min-w-0 flex-1 overflow-y-auto p-4 text-brand-ink sm:p-8"
			>
				<div className="mx-auto max-w-4xl">
					<header className="mb-6">
						<h1 className="text-3xl font-semibold sm:text-4xl">Meu perfil</h1>
						<p className="mt-2 text-brand-forest">
							Seus dados pessoais, acesso e fazendas vinculadas.
						</p>
					</header>

					{loading ? (
						<p role="status" aria-live="polite">
							Carregando seu perfil...
						</p>
					) : null}
					{error ? (
						<div className="rounded-xl border border-brand-sand bg-brand-sand/10 p-6">
							<Empty
								children={
									<button
										type="button"
										onClick={reload}
										className="ml-3 rounded-md border border-brand-sand px-3 py-1 text-sm text-brand-forest hover:bg-brand-sand/40"
									>
										Tentar novamente
									</button>
								}
								description={error}
								styles={{
									description: {
										color: "var(--text-brand-forest)",
									},
									image: { filter: "grayscale(100%)" },
								}}
							/>
						</div>
					) : null}

					{profile ? (
						<div className="space-y-6">
							<section
								aria-labelledby="profile-personal-heading"
								className="rounded-xl border border-brand-sand bg-brand-sand/10 p-6"
							>
								<div className="flex items-center gap-4">
									<AvatarComponent
										name={profile.name}
										photoUrl={profile.photoUrl}
										className="h-16 w-16 text-lg"
									/>
									<h2 id="profile-personal-heading" className="text-xl font-semibold">
										Dados pessoais
									</h2>
								</div>
								<dl className="mt-4 grid gap-4 sm:grid-cols-2">
									<div>
										<dt className="font-medium text-brand-forest">Nome</dt>
										<dd className="mt-1 wrap-break-word">{profile.name}</dd>
									</div>
									<div>
										<dt className="font-medium text-brand-forest">E-mail</dt>
										<dd className="mt-1 break-all">{profile.email}</dd>
									</div>
									<div>
										<dt className="font-medium text-brand-forest">CPF</dt>
										<dd className="mt-1">{cpf || "Não informado"}</dd>
									</div>
								</dl>
							</section>

							<section
								aria-labelledby="profile-access-heading"
								className="rounded-xl border border-brand-sand bg-brand-sand/10 p-6"
							>
								<h2 id="profile-access-heading" className="text-xl font-semibold">
									Acesso
								</h2>
								<dl className="mt-4 grid gap-4 sm:grid-cols-2">
									<div>
										<dt className="font-medium text-brand-forest">
											Tipo de acesso
										</dt>
										<dd className="mt-1 wrap-break-word">
											{profile.permissionName}
										</dd>
									</div>
									<div>
										<dt className="font-medium text-brand-forest">
											Status da conta
										</dt>
										<dd className="mt-1">
											{profile.active ? "Ativa" : "Inativa"}
										</dd>
									</div>
								</dl>
							</section>

							<section
								aria-labelledby="profile-properties-heading"
								className="rounded-xl border border-brand-sand bg-brand-sand/10 p-6"
							>
								<h2
									id="profile-properties-heading"
									className="text-xl font-semibold"
								>
									Fazendas vinculadas
								</h2>
								{profile.properties.length > 0 ? (
									<ul className="mt-4 list-disc space-y-2 pl-5">
										{profile.properties.map((property) => (
											<li key={property.id} className="wrap-break-word">
												{property.name}
											</li>
										))}
									</ul>
								) : (
									<p className="mt-4 text-brand-forest">
										Você não possui fazendas vinculadas ativas.
									</p>
								)}
							</section>

							<section
								aria-labelledby="profile-security-heading"
								className="rounded-xl border border-brand-sand bg-brand-sand/10 p-6"
							>
								<h2
									id="profile-security-heading"
									className="text-xl font-semibold text-brand-ink"
								>
									Segurança
								</h2>
								<p className="mt-2 text-brand-forest">
									Enviaremos um link de redefinição de senha para{" "}
									<span className="break-all font-medium">{profile.email}</span>.
								</p>

								<ButtonComponent
									type="button"
									onClick={() => void submit(profile.email)}
									aria-label="Enviar link de redefinição de senha"
									disabled={passwordLoading}
									className="px-4 py-3 mt-4 min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-forest disabled:cursor-wait disabled:opacity-70"
								>
									{passwordLoading
										? "Enviando link..."
										: "Enviar link para alterar senha"}
								</ButtonComponent>
								<p
									id="profile-password-status"
									role="status"
									aria-live="polite"
									className="mt-3 text-brand-forest"
								>
									{passwordLoading
										? "Enviando link de redefinição..."
										: sent
											? "Solicitação concluída. Verifique sua caixa de entrada e a pasta de spam."
											: ""}
								</p>
								{passwordError ? (
									<p role="alert" className="mt-2 text-brand-ink">
										{passwordError}
									</p>
								) : null}
							</section>

						</div>
					) : null}
				</div>
			</main>
		</div>
	);
}
