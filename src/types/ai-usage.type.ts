/** Contrato proposto para o endpoint Spring de uso de IA. */
export interface AiUsageUser {
  userId: string;
  name: string | null;
  email: string | null;
  photoUrl: string | null;
  calls: number;
  tokens: number;
  modelCalls: number;
  unknownTokenCalls: number;
  costUsd: string;
  knownCostCalls: number;
  unknownCostCalls: number;
}
