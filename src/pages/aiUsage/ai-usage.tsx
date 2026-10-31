import Sidebar from "@/components/Sidebar/SidebarComponent";
import { useAiUsage } from "@/hooks/useAiUsage";
import { AiUsagePanel } from "@/components/Table/AiUsagePanel";

export function AiUsage() {
	const { users, loading, error, updatedAt, reload } = useAiUsage();
	return (
		<div className="flex h-screen min-h-0 bg-brand-cream">
			<Sidebar />
			<AiUsagePanel
				users={users}
				loading={loading}
				error={error}
				updatedAt={updatedAt}
				onRefresh={reload}
			/>
		</div>
	);
}
