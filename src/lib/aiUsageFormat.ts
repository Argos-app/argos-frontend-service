import type { AiUsageUser } from "@/types";

export const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
export const formatCost = (value: number) =>
	new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 6,
	}).format(value);
export const displayName = (user: AiUsageUser) => user.name || "Usuário sem nome";

