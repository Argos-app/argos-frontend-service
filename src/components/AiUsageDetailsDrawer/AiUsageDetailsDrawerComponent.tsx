import Drawer from "antd/es/drawer";
import Alert from "antd/es/alert";
import { AvatarComponent } from "@/components/Avatar";
import { displayName, formatCost, formatNumber } from "@/lib/aiUsageFormat";
import type { AiUsageUser } from "@/types";

interface AiUsageDetailsDrawerProps {
  user: AiUsageUser | null;
  open: boolean;
  stale: boolean;
  onClose: () => void;
}

export function AiUsageDetailsDrawer({ user: selected, open, stale, onClose }: AiUsageDetailsDrawerProps) {
  return (
			<Drawer
				title="Detalhes de uso de IA"
				width={480}
				open={open}
				onClose={onClose}
				rootClassName="argos-user-drawer"
				destroyOnHidden
			>
				{selected ? (
					<div className="space-y-6 text-brand-forest">
						{stale && (
							<Alert
								type="warning"
								showIcon
								message="Dados desatualizados"
								description="A última atualização falhou; estes detalhes são da última consulta bem-sucedida."
							/>
						)}
						<div className="flex items-center gap-4">
							<AvatarComponent
								name={displayName(selected)}
								photoUrl={selected.photoUrl}
								className="h-14 w-14 text-base"
							/>
							<div>
								<h2 className="text-lg font-semibold text-brand-ink">
									{displayName(selected)}
								</h2>
								<p className="text-sm">
									{selected.email || "E-mail não disponível"}
								</p>
							</div>
						</div>
						<dl className="space-y-3 text-sm">
							{[
								["Requisições", formatNumber(selected.calls)],
								["Chamadas ao modelo", formatNumber(selected.modelCalls)],
								["Tokens conhecidos", formatNumber(selected.tokens)],
								[
									"Chamadas com tokens incompletos",
									formatNumber(selected.unknownTokenCalls),
								],
								[
									"Custo conhecido (USD)",
									selected.knownCostCalls
										? formatCost(Number(selected.costUsd))
										: "Não disponível",
								],
								[
									"Chamadas com custo conhecido",
									formatNumber(selected.knownCostCalls),
								],
								[
									"Chamadas com custo desconhecido",
									formatNumber(selected.unknownCostCalls),
								],
							].map(([label, value]) => (
								<div
									key={label}
									className="flex justify-between gap-4 border-b border-brand-sand/60 pb-3"
								>
									<dt>{label}</dt>
									<dd className="text-right font-medium text-brand-ink">
										{value}
									</dd>
								</div>
							))}
						</dl>
						<p className="text-sm">
							O custo conhecido pode incluir estimativas e ser parcial. Tokens
							conhecidos podem incluir contagens parciais.
						</p>
					</div>
				) : (
					<p>Os dados deste usuário não estão mais disponíveis.</p>
				)}
			</Drawer>
  );
}
