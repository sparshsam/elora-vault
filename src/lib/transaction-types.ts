export const TX_TYPES = {
  depositCompleted: "DEPOSIT_COMPLETED",
  predictionCreated: "PREDICTION_CREATED",
  predictionWon: "PREDICTION_WON",
  predictionLost: "PREDICTION_LOST",
  predictionPushed: "PREDICTION_PUSHED",
  withdrawalCompleted: "WITHDRAWAL_COMPLETED",
  protectionCreated: "PROTECTION_CREATED",
  protectionReleased: "PROTECTION_RELEASED",
} as const;

export type CanonicalTransactionType = typeof TX_TYPES[keyof typeof TX_TYPES];

export const STORED_TX_TYPES = {
  depositCompleted: "DEPOSIT",
  predictionCreated: "BET_PLACED",
  predictionWon: "WIN_PROFIT",
  predictionLost: "LOSS_TO_SAVINGS",
  predictionPushed: "PUSH_RETURN",
  withdrawalCompleted: "WITHDRAWAL",
  protectionCreated: "LOCK_CREATED",
  protectionReleased: "LOCK_RELEASED",
} as const;

const LEGACY_TRANSACTION_TYPE_MAP: Record<string, CanonicalTransactionType> = {
  DEPOSIT: TX_TYPES.depositCompleted,
  ONCHAIN_DEPOSIT: TX_TYPES.depositCompleted,
  BET_PLACED: TX_TYPES.predictionCreated,
  WIN_PROFIT: TX_TYPES.predictionWon,
  LOSS_TO_SAVINGS: TX_TYPES.predictionLost,
  PUSH_RETURN: TX_TYPES.predictionPushed,
  WITHDRAWAL: TX_TYPES.withdrawalCompleted,
  ONCHAIN_WITHDRAWAL: TX_TYPES.withdrawalCompleted,
  LOCK_CREATED: TX_TYPES.protectionCreated,
  ONCHAIN_LOCK_CREATED: TX_TYPES.protectionCreated,
  LOCK_RELEASED: TX_TYPES.protectionReleased,
  ONCHAIN_LOCK_RELEASED: TX_TYPES.protectionReleased,
};

export function normalizeTransactionType(type: string): CanonicalTransactionType | string {
  return LEGACY_TRANSACTION_TYPE_MAP[type] ?? type;
}
