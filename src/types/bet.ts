/* ── Bet Types — shared across API, pages, and components ── */

export type BetType = "moneyline" | "spread" | "totals";

export type BetStatus = "open" | "won" | "lost" | "push";

export interface BetRecord {
  id: string;
  description: string;
  betType: BetType;
  odds: number;
  stake: number;
  potentialProfit: number;
  potentialReturn: number;
  status: BetStatus;
  settledProfitLoss?: number;
  createdAt: string;
  settledAt?: string;
}

export interface CreateBetRequest {
  description: string;
  betType: BetType;
  odds: number;
  stake: number;
}

export type SettleResult = "WIN" | "LOSS" | "PUSH";
