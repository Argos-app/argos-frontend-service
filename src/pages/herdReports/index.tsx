import Alert from "antd/es/alert";
import { ButtonComponent } from "@/components/Button/ButtonComponent";
import { HerdReportsContent } from "@/components/HerdReportsContent";
import { SignInAgain } from "@/components/SignInAgain";
import Sidebar from "@/components/Sidebar/SidebarComponent";
import { useUserProfile } from "@/hooks/useUserProfile";

export function HerdReports() {
	const { profile, loading, error, reload } = useUserProfile();
	return (
		<div className="flex h-screen min-h-0 bg-brand-cream">
			<Sidebar />
			<main
				id="main-content"
				tabIndex={-1}
				aria-labelledby="herd-reports-title"
				className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto rounded-lg border border-brand-sand bg-brand-cream shadow-sm"
			>
				<header className="shrink-0 p-4 md:p-6">
					<h1 id="herd-reports-title" className="text-3xl font-semibold text-brand-ink">
						Relatórios de rebanho
					</h1>
					<p className="mt-1 text-sm text-brand-forest">
						Consulte o histórico das suas fazendas e baixe os relatórios em XLSX, do
						mais recente para o mais antigo.
					</p>
				</header>
				{loading ? (
					<p role="status" aria-live="polite" className="p-4 text-brand-forest">
						Verificando acesso...
					</p>
				) : null}
				{error ? (
					<div className="space-y-3 p-4">
						<Alert
							type="error"
							showIcon
							message={error}
							action={
								<ButtonComponent className="w-auto rounded-xl" onClick={reload}>
									Tentar novamente
								</ButtonComponent>
							}
						/>
						<SignInAgain />
					</div>
				) : null}
				{profile?.permissionCode === "ADMIN" ? <HerdReportsContent /> : null}
				{profile && profile.permissionCode !== "ADMIN" ? (
					<div className="p-4">
						<Alert
							type="warning"
							showIcon
							message="Acesso restrito a administradores."
						/>
					</div>
				) : null}
			</main>
		</div>
	);
}
