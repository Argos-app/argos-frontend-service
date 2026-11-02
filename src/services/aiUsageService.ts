import { api } from "@/lib/api";
import { serviceRequest } from "@/services/serviceRequest";
import type { AiUsageUser, PageResponse } from "@/types";

type AiUsageUserResponse = Omit<AiUsageUser, "knownCostCalls" | "unknownCostCalls" | "costUsd"> & {
	known_cost_calls: number;
	unknown_cost_calls: number;
	cost_usd: number;
};

export class InvalidAiUsageResponseError extends Error {
	constructor() {
		super(
			"O servidor retornou dados de uso de IA inválidos. Tente novamente ou contate o suporte.",
		);
		this.name = "InvalidAiUsageResponseError";
	}
}

const count = (value: unknown): value is number =>
	typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

function isAiUsageUser(value: unknown): value is AiUsageUserResponse {
	if (!value || typeof value !== "object") return false;
	const row = value as Record<string, unknown>;
	return (
		typeof row.userId === "string" &&
		row.userId.trim().length > 0 &&
		typeof row.name === "string" &&
		typeof row.email === "string" &&
		typeof row.photoUrl === "string" &&
		count(row.calls) &&
		count(row.tokens) &&
		count(row.modelCalls) &&
		count(row.unknownTokenCalls) &&
		count(row.known_cost_calls) &&
		count(row.unknown_cost_calls) &&
		typeof row.cost_usd === "number" &&
		Number.isFinite(row.cost_usd) &&
		row.cost_usd >= 0
	);
}

function isAiUsagePage(value: unknown): value is PageResponse<AiUsageUserResponse> {
	if (!value || typeof value !== "object") return false;
	const page = value as Record<string, unknown>;
	return Array.isArray(page.data) && page.data.every(isAiUsageUser) &&
		count(page.page) && count(page.size) && page.size > 0 &&
		count(page.totalElements) && count(page.totalPages) &&
		typeof page.first === "boolean" && typeof page.last === "boolean" &&
		page.data.length <= page.size &&
		new Set(page.data.map((user) => user.userId)).size === page.data.length;
}

export async function getAiUsage(page = 0, size = 10, signal?: AbortSignal): Promise<PageResponse<AiUsageUser>> {
	const data = await serviceRequest(async () => {
		const response = await api.get<unknown>("/users/ai-usage", { params: { page, size }, signal });
		return response.data;
	}, "Não foi possível consultar o uso de IA.");
	if (!isAiUsagePage(data) || data.page !== page || data.size !== size) {
		throw new InvalidAiUsageResponseError();
	}
	return {
		...data,
		data: data.data.map(({ known_cost_calls, unknown_cost_calls, cost_usd, ...user }) => ({
			...user,
			knownCostCalls: known_cost_calls,
			unknownCostCalls: unknown_cost_calls,
			costUsd: cost_usd,
		})),
	};
}
