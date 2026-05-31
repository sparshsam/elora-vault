/* ── Session Types — shared across API, pages, and components ── */

export type SessionOutcome = "won" | "lost" | "break-even";

export type SessionAction =
  | "kept-available"
  | "protected-gains"
  | "moved-to-horizon";

export interface BettingSession {
  id: string;
  title: string;
  category: string;
  outcome: SessionOutcome;
  pnl: number;
  bankrollBefore: number;
  bankrollAfter: number;
  actionTaken: SessionAction;
  horizonId?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateSessionRequest {
  outcome: SessionOutcome;
  pnl: number;
  bankrollBefore: number;
  bankrollAfter: number;
  actionTaken: SessionAction;
  horizonId?: string;
  horizonDuration?: number;
  horizonAmount?: number;
  category?: string;
  title?: string;
  notes?: string;
}

export interface CreateSessionResponse {
  session: BettingSession;
  horizonCreated: boolean;
}
