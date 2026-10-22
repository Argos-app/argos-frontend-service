import { usePaginatedResource } from "@/hooks/usePaginatedResource";
import { getApplicationHistory } from "@/services/applicationHistoryService";
import type { ApplicationHistoryItem } from "@/types/application-history.type";

export function useApplicationHistory() {
  return usePaginatedResource<ApplicationHistoryItem>(
    getApplicationHistory,
    "Não foi possível carregar o histórico de aplicações.",
  );
}
