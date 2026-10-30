import { api } from "@/lib/api";
import { serviceRequest } from "@/services/serviceRequest";
import type { AiUsageUser } from "@/types/ai-usage.type";

export async function getAiUsage(signal?: AbortSignal): Promise<AiUsageUser[]> {
  return serviceRequest(async () => {
    const { data } = await api.get<AiUsageUser[]>("/ai-usage/users", { signal });
    if (!Array.isArray(data)) throw new Error("Resposta de uso de IA inválida.");
    return data;
  }, "Não foi possível consultar o uso de IA.");
}
