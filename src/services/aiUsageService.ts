import { api } from "@/lib/api";
import { serviceRequest } from "@/services/serviceRequest";
import type { AiUsageUser } from "@/types/ai-usage.type";

export class InvalidAiUsageResponseError extends Error {
  constructor() {
    super("O servidor retornou dados de uso de IA inválidos. Tente novamente ou contate o suporte.");
    this.name = "InvalidAiUsageResponseError";
  }
}

function isAiUsageUser(value: unknown): value is AiUsageUser {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  const nullableString = (field: unknown) => field === null || typeof field === "string";
  const count = (field: unknown) => typeof field === "number" && Number.isSafeInteger(field) && field >= 0;
  return typeof row.userId === "string" && row.userId.trim().length > 0
    && nullableString(row.name) && nullableString(row.email) && nullableString(row.photoUrl)
    && count(row.calls) && count(row.tokens) && count(row.modelCalls)
    && count(row.unknownTokenCalls) && count(row.knownCostCalls) && count(row.unknownCostCalls)
    && typeof row.costUsd === "string" && /^\d+(?:\.\d+)?$/.test(row.costUsd)
    && Number.isFinite(Number(row.costUsd));
}

export async function getAiUsage(signal?: AbortSignal): Promise<AiUsageUser[]> {
  const data = await serviceRequest(async () => {
    const response = await api.get<unknown>("/ai-usage/users", { signal });
    return response.data;
  }, "Não foi possível consultar o uso de IA.");
  if (!Array.isArray(data) || !data.every(isAiUsageUser) || new Set(data.map((user) => user.userId)).size !== data.length) {
    throw new InvalidAiUsageResponseError();
  }
  return data;
}
