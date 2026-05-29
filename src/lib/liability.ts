/**
 * Liability Engine — pure functions for bankroll vault calculations.
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
 * Maximum allowable stake given house balance.
 * Returns the max stake where potential profit <= house balance.
 */
export function maxAllowableStake(
  odds: number,
  houseBalance: number,
): number {
  if (houseBalance <= 0) return 0;
  if (odds > 0) {
    return houseBalance / (odds / 100);
  }
  return houseBalance / (100 / Math.abs(odds));
}

/**
 * Validate a potential bet against the vault.
 */
export function validateBet(
  odds: number,
  stake: number,
  houseBalance: number,
): { valid: boolean; reason?: string; maxStake: number; profit: number } {
  const profit = calculateProfit(odds, stake);
  const maxStake = maxAllowableStake(odds, houseBalance);

  if (stake <= 0) {
    return { valid: false, reason: "Stake must be greater than 0", maxStake, profit };
  }

  if (odds === 0) {
    return { valid: false, reason: "Odds cannot be zero", maxStake, profit };
  }

  if (profit > houseBalance) {
    return {
      valid: false,
      reason: `Potential profit ($${profit.toFixed(2)}) exceeds house balance ($${houseBalance.toFixed(2)})`,
      maxStake,
      profit,
    };
  }

  return { valid: true, maxStake, profit };
}

/**
 * Settlement calculations for a winning bet.
 */
export function settleWin(
  houseBalance: number,
  stake: number,
  profit: number,
): {
  newHouseBalance: number;
  withdrawableProfit: number;
  amountSaved: number;
} {
  // Stake goes back to user + profit paid from house
  // The liability (profit) was already reserved when bet was placed
  // On win: house pays the profit, stake + profit -> user withdrawable
  const newHouseBalance = houseBalance - profit;
  const withdrawableProfit = stake + profit;
  const amountSaved = 0;

  return { newHouseBalance, withdrawableProfit, amountSaved };
}

/**
 * Settlement calculations for a losing bet.
 */
export function settleLoss(
  houseBalance: number,
  stake: number,
): {
  newHouseBalance: number;
  withdrawableProfit: number;
  amountSaved: number;
} {
  // When user loses: the stake gets absorbed into house balance
  // A portion goes to saved-from-losses (the "savings mechanic")
  // The stake is fully absorbed
  const amountSaved = stake;
  const newHouseBalance = houseBalance + stake;
  const withdrawableProfit = 0;

  return { newHouseBalance, withdrawableProfit, amountSaved };
}

/**
 * Settlement for a push (tie) — stake returned, no change.
 */
export function settlePush(
  houseBalance: number,
): {
  newHouseBalance: number;
  withdrawableProfit: number;
  amountSaved: number;
} {
  return {
    newHouseBalance: houseBalance,
    withdrawableProfit: 0,
    amountSaved: 0,
  };
}
