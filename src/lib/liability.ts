/**
 * Liability Engine v0.2 — pure functions for Elora Vault calculations.
 * The "house" is virtual. User losses become savings in their vault.
 */

/**
 * Calculate potential profit from American odds and stake.
 * Positive odds (+200): stake * (odds / 100)
 * Negative odds (-150): stake * (100 / Math.abs(odds))
 */
export function calculateProfit(odds: number, stake: number): number {
  if (odds > 0) {
    return stake * (odds / 100);
  }
  return stake * (100 / Math.abs(odds));
}

/**
 * Calculate total return (stake + profit).
 */
export function calculateTotalReturn(odds: number, stake: number): number {
  return stake + calculateProfit(odds, stake);
}

/**
 * Validate a prediction against available capital only (no external house liability cap).
 */
export function validateBet(
  odds: number,
  stake: number,
  userBalance: number,
): { valid: boolean; reason?: string; profit: number; totalReturn: number } {
  const profit = calculateProfit(odds, stake);
  const totalReturn = calculateTotalReturn(odds, stake);

  if (stake <= 0) {
    return { valid: false, reason: "Stake must be greater than 0", profit, totalReturn };
  }

  if (odds === 0) {
    return { valid: false, reason: "Odds cannot be zero", profit, totalReturn };
  }

  if (stake > userBalance) {
    return {
      valid: false,
      reason: `Stake ($${stake.toFixed(2)}) exceeds your balance ($${userBalance.toFixed(2)})`,
      profit,
      totalReturn,
    };
  }

  return { valid: true, profit, totalReturn };
}

export const validatePrediction = validateBet;

/**
 * Settlement calculations for a winning prediction.
 * User gets stake + profit back. Virtual house pays the profit.
 */
export function settleWin(
  houseBalance: number,
  userBalance: number,
  savingsVault: number,
  stake: number,
  profit: number,
): {
  newHouseBalance: number;
  newUserBalance: number;
  newSavingsVault: number;
  withdrawableWinnings: number;
} {
  const newHouseBalance = houseBalance - profit;
  const newUserBalance = userBalance + stake + profit;
  const withdrawableWinnings = profit;
  const newSavingsVault = savingsVault;

  return { newHouseBalance, newUserBalance, newSavingsVault, withdrawableWinnings };
}

export const calculateWinSettlementForPrediction = settleWin;

/**
 * Settlement calculations for a losing prediction.
 * Stake leaves committed capital. Virtual house gains the stake.
 */
export function settleLoss(
  houseBalance: number,
  userBalance: number,
  savingsVault: number,
  stake: number,
): {
  newHouseBalance: number;
  newUserBalance: number;
  newSavingsVault: number;
  withdrawableWinnings: number;
} {
  const newHouseBalance = houseBalance + stake;
  const newUserBalance = userBalance; // already deducted when prediction was created
  const newSavingsVault = savingsVault + stake;
  const withdrawableWinnings = 0;

  return { newHouseBalance, newUserBalance, newSavingsVault, withdrawableWinnings };
}

export const calculateLossSettlementForPrediction = settleLoss;

/**
 * Settlement for a push/tie — stake returned to available capital.
 */
export function settlePush(
  houseBalance: number,
  userBalance: number,
  savingsVault: number,
  stake: number,
): {
  newHouseBalance: number;
  newUserBalance: number;
  newSavingsVault: number;
  withdrawableWinnings: number;
} {
  const newHouseBalance = houseBalance;
  const newUserBalance = userBalance + stake;
  const newSavingsVault = savingsVault;
  const withdrawableWinnings = 0;

  return { newHouseBalance, newUserBalance, newSavingsVault, withdrawableWinnings };
}

export const calculatePushSettlementForPrediction = settlePush;
