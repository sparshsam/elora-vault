"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useWalletStore } from "@/store/useWalletStore";
import { useVaultSummary, useVaultLocks } from "@/lib/web3/hooks";
import { useUSDCBalance } from "@/lib/web3/tx-hooks";

export type CapitalStateLabel =
  | "available"
  | "protected"
  | "releasing"
  | "committed"
  | "activity"
  | "intent"
  | "horizon";

export type CapitalState = CapitalStateLabel;

export interface NormalizeCapitalStateInput {
  walletBalance?: number | null;
  fallbackWalletBalance?: number | null;
  availableBalance?: number | null;
  protectedBalance?: number | null;
  releasingBalance?: number | null;
  committedBalance?: number | null;
  protectedLocksTotal?: number | null;
  vaultSummaryLockedTotal?: number | null;
}

export interface HorizonInfo {
  id: string;
  amount: number;
  amountFormatted: string;
  createdAt: number;
  unlockAt: number;
  durationDays: number;
  progress: number;
  withdrawn: boolean;
  released: boolean;
  canRelease: boolean;
  releaseDate: string;
}

export interface CapitalBalances {
  /** External connected-wallet USDC. This is outside Elora and never enters totalEloraCapital. */
  walletBalance: number;
  /** Deposited capital inside Elora that can be used now. */
  available: number;
  /** Capital inside active protection horizons. */
  protected: number;
  /** Capital transitioning from a released horizon back into availability. */
  releasing: number;
  /** Capital allocated to active predictions. Legacy DB field: at_risk_balance. */
  committed: number;
  /** Sum of available + protected + releasing + committed. Wallet balance is excluded. */
  totalEloraCapital: number;
}

export interface CapitalBalancesFormatted {
  walletBalance: string;
  available: string;
  protected: string;
  releasing: string;
  committed: string;
  totalEloraCapital: string;
}

export interface CapitalStateMetrics {
  activeStates: Array<"available" | "protected" | "releasing" | "committed">;
  activeStatesCount: number;
  hasEloraCapital: boolean;
  hasAnyCapital: boolean;
  protectedPct: number;
  committedProtectedRatio: number | null;
}

export interface CapitalSummary {
  balances: CapitalBalances;
  formatted: CapitalBalancesFormatted;
  activeHorizons: HorizonInfo[];
  activeHorizonCount: number;
  pendingReleaseCount: number;
  isLoading: boolean;
  isConnected: boolean;
}

export function formatCapitalUSD(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function nonNegative(value: number | null | undefined): number {
  return Math.max(0, Number.isFinite(value ?? NaN) ? Number(value) : 0);
}

function computeHorizonProgress(createdAt: number, unlockAt: number, now: number): number {
  const duration = unlockAt - createdAt;
  if (duration <= 0) return 100;
  const elapsed = now - createdAt;
  return Math.min(100, Math.max(0, (elapsed / duration) * 100));
}

function formatReleaseDate(unlockAt: number): string {
  return new Date(unlockAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Canonical Elora capital state normalization.
 *
 * The database and API still expose some legacy names:
 * - user_balance may be used only as a disconnected wallet fallback.
 * - savings_vault represents releasing capital, not deposited idle capital.
 * - at_risk_balance represents committed prediction capital.
 *
 * walletBalance is deliberately excluded from totalEloraCapital.
 */
export function normalizeCapitalState(input: NormalizeCapitalStateInput): CapitalBalances {
  const walletBalance = nonNegative(input.walletBalance ?? input.fallbackWalletBalance);
  const available = nonNegative(input.availableBalance);
  const committed = nonNegative(input.committedBalance);
  const releasing = nonNegative(input.releasingBalance);
  const protected_ = [
    input.protectedLocksTotal,
    input.vaultSummaryLockedTotal,
    input.protectedBalance,
  ].map(nonNegative).find((amount) => amount > 0) ?? 0;

  const totalEloraCapital = available + protected_ + releasing + committed;

  return {
    walletBalance,
    available,
    protected: protected_,
    releasing,
    committed,
    totalEloraCapital,
  };
}

export function formatCapitalBalances(balances: CapitalBalances): CapitalBalancesFormatted {
  return {
    walletBalance: formatCapitalUSD(balances.walletBalance),
    available: formatCapitalUSD(balances.available),
    protected: formatCapitalUSD(balances.protected),
    releasing: formatCapitalUSD(balances.releasing),
    committed: formatCapitalUSD(balances.committed),
    totalEloraCapital: formatCapitalUSD(balances.totalEloraCapital),
  };
}

export function getCapitalStateMetrics(balances: CapitalBalances): CapitalStateMetrics {
  const activeStates: CapitalStateMetrics["activeStates"] = [];
  if (balances.available > 0) activeStates.push("available");
  if (balances.protected > 0) activeStates.push("protected");
  if (balances.releasing > 0) activeStates.push("releasing");
  if (balances.committed > 0) activeStates.push("committed");

  return {
    activeStates,
    activeStatesCount: activeStates.length,
    hasEloraCapital: balances.totalEloraCapital > 0,
    hasAnyCapital: balances.totalEloraCapital > 0 || balances.walletBalance > 0,
    protectedPct: balances.totalEloraCapital > 0
      ? Math.round((balances.protected / balances.totalEloraCapital) * 100)
      : 0,
    committedProtectedRatio: balances.protected > 0
      ? Math.round((balances.committed / balances.protected) * 100)
      : null,
  };
}

export function useCapitalState(): CapitalSummary {
  const { address, isConnected } = useAccount();
  const walletStore = useWalletStore();
  const vaultSummary = useVaultSummary(address);
  const vaultLocks = useVaultLocks(address);
  const usdcBalance = useUSDCBalance();
  const [now] = useState(() => Date.now());

  const isLoading = walletStore.isLoading || (isConnected && vaultSummary.isLoading);

  const balances: CapitalBalances = useMemo(() => {
    const protectedFromLocks = (vaultLocks.locks ?? []).reduce(
      (sum, lock) => lock.withdrawn ? sum : sum + lock.amount,
      0,
    );

    return normalizeCapitalState({
      walletBalance: isConnected ? usdcBalance.balance : undefined,
      fallbackWalletBalance: walletStore.user_balance,
      availableBalance: walletStore.available_vault_balance,
      protectedBalance: walletStore.locked_vault_balance,
      releasingBalance: walletStore.savings_vault,
      committedBalance: walletStore.at_risk_balance,
      protectedLocksTotal: protectedFromLocks,
      vaultSummaryLockedTotal: vaultSummary.totalLocked,
    });
  }, [
    isConnected,
    usdcBalance.balance,
    walletStore.user_balance,
    walletStore.available_vault_balance,
    walletStore.locked_vault_balance,
    walletStore.savings_vault,
    walletStore.at_risk_balance,
    vaultLocks.locks,
    vaultSummary.totalLocked,
  ]);

  const formatted: CapitalBalancesFormatted = useMemo(() => formatCapitalBalances(balances), [balances]);

  const activeHorizons: HorizonInfo[] = useMemo(() => {
    if (!vaultLocks.locks || vaultLocks.locks.length === 0) return [];

    return vaultLocks.locks
      .filter((lock) => !lock.withdrawn)
      .map((lock) => {
        const durationMs = lock.unlockAt - lock.createdAt;
        const durationDays = Math.round(durationMs / 86400000);
        const progress = computeHorizonProgress(lock.createdAt, lock.unlockAt, now);
        const isReleased = lock.unlockAt <= now;

        return {
          id: String(lock.id),
          amount: lock.amount,
          amountFormatted: formatCapitalUSD(lock.amount),
          createdAt: lock.createdAt,
          unlockAt: lock.unlockAt,
          durationDays,
          progress,
          withdrawn: lock.withdrawn,
          released: isReleased,
          canRelease: isReleased,
          releaseDate: formatReleaseDate(lock.unlockAt),
        };
      });
  }, [vaultLocks.locks, now]);

  const activeHorizonCount = useMemo(
    () => vaultSummary.activeLockCount || activeHorizons.length,
    [vaultSummary.activeLockCount, activeHorizons.length],
  );

  const pendingReleaseCount = useMemo(
    () => activeHorizons.filter((h) => h.canRelease).length,
    [activeHorizons],
  );

  return {
    balances,
    formatted,
    activeHorizons,
    activeHorizonCount,
    pendingReleaseCount,
    isLoading,
    isConnected: !!isConnected,
  };
}
