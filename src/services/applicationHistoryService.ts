import { api } from "@/lib/api";
import { serviceRequest } from "@/services/serviceRequest";
import type { ApplicationHistoryItem } from "@/types/application-history.type";
import type { PageResponse } from "@/types/page-response.type";

export async function getApplicationHistory(
  page: number,
  size: number,
  signal: AbortSignal,
): Promise<PageResponse<ApplicationHistoryItem>> {
  return serviceRequest(async () => {
    const { data } = await api.get<PageResponse<ApplicationHistoryItem>>("/application/history", {
      params: { page, size },
      signal,
    });
    return data;
  }, "Não foi possível carregar o histórico de aplicações.");
}
