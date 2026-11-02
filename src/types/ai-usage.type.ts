export interface AiUsageUser {
  userId: string;
  name: string;
  email: string;
  photoUrl: string;
  calls: number;
  tokens: number;
  modelCalls: number;
  unknownTokenCalls: number;
  costUsd: number;
  knownCostCalls: number;
  unknownCostCalls: number;
}
