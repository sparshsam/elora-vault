export type PredictionType = "moneyline" | "spread" | "totals";

export type PredictionStatus = "open" | "won" | "lost" | "push";

export interface PredictionRecord {
  id: string;
  description: string;
  predictionType: PredictionType;
  odds: number;
  stake: number;
  potentialProfit: number;
  potentialReturn: number;
  status: PredictionStatus;
  settledProfitLoss?: number;
  createdAt: string;
  settledAt?: string;
  horizonProtected?: boolean;
}

export interface CreatePredictionRequest {
  description: string;
  predictionType: PredictionType;
  odds: number;
  stake: number;
}

export type PredictionSettleResult = "WIN" | "LOSS" | "PUSH";

// Compatibility aliases while API routes and database models still use Bet.
export type BetType = PredictionType;
export type BetStatus = PredictionStatus;
export type BetRecord = PredictionRecord & { betType: PredictionType };
export type CreateBetRequest = CreatePredictionRequest & { betType?: PredictionType };
export type SettleResult = PredictionSettleResult;
