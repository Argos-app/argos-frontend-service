import Alert from "antd/es/alert";
import Sidebar from "@/components/Sidebar/SidebarComponent";
import { ButtonComponent } from "@/components/Button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAiUsage } from "@/hooks/useAiUsage";
import { AiUsagePanel } from "./AiUsagePanel";

function AiUsageContent() {
  const { users, loading, error, updatedAt, reload } = useAiUsage();
  return <AiUsagePanel users={users} loading={loading} error={error} updatedAt={updatedAt} onRefresh={reload} />;
}

export function AiUsage() {
  const { profile, loading, error, reload } = useUserProfile();
  return <div className="flex h-screen min-h-0 bg-brand-cream"><Sidebar />{profile?.permissionCode === "ADMIN" ? <AiUsageContent /> : <main id="main-content" tabIndex={-1} className="flex-1 p-6"><h1 className="mb-4 text-3xl font-semibold">Uso de IA por usuários</h1>{loading ? <p role="status">Verificando acesso...</p> : error ? <Alert type="error" showIcon message={error} action={<ButtonComponent className="w-auto rounded-xl" onClick={reload}>Tentar novamente</ButtonComponent>} /> : <Alert type="warning" showIcon message="Acesso restrito a administradores." />}</main>}</div>;
}
