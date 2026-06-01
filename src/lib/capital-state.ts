"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useWalletStore } from "@/store/useWalletStore";
import { useVaultSummary, useVaultLocks } from "@/lib/web3/hooks";
import { useUSDCBalance } from "@/lib/web3/tx-hooks";

export type CapitalState =
  | "available"
  | "protected"
  | "releasing"
  | "committed"
  | "activity"
  | "intent"
  | "horizon";

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
  walletBalance: number;
  available: number;
  protected: number;
  releasing: number;
  committed: number;
  atRisk: number;
  totalEloraCapital: number;
  total: number;
}

export interface CapitalBalancesFormatted {
  walletBalance: string;
  available: string;
  protected: string;
  releasing: string;
  committed: string;
  atRisk: string;
  totalEloraCapital: string;
  total: string;
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

function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
 * Canonical capital state for the app.
 *
 * walletBalance is external connected-wallet USDC and is outside Elora.
 * available is deposited capital inside Elora that can be used now.
 * releasing is only capital transitioning from a horizon release; it is not
 * deposited idle capital.
 */
export function useCapitalState(): CapitalSummary {
  const { address, isConnected } = useAccount();
  const walletStore = useWalletStore();
  const vaultSummary = useVaultSummary(address);
  const vaultLocks = useVaultLocks(address);
  const usdcBalance = useUSDCBalance();
  const [now] = useState(() => Date.now());

  const isLoading = walletStore.isLoading || (isConnected && vaultSummary.isLoading);

  const balances: CapitalBalances = useMemo(() => {
    const walletBalance = isConnected ? usdcBalance.balance : (walletStore.user_balance ?? 0);
    const available = Math.max(0, walletStore.available_vault_balance ?? 0);
    const committed = Math.max(0, walletStore.at_risk_balance ?? 0);
    const protectedFromLocks = (vaultLocks.locks ?? []).reduce(
      (sum, lock) => lock.withdrawn ? sum : sum + lock.amount,
      0,
    );

    const protected_ =
      protectedFromLocks > 0
        ? protectedFromLocks
        : vaultSummary.totalLocked > 0
        ? vaultSummary.totalLocked
        : walletStore.locked_vault_balance > 0
          ? walletStore.locked_vault_balance
          : 0;

    const releasing = Math.max(0, walletStore.savings_vault ?? 0);
    const totalEloraCapital = available + protected_ + releasing + committed;

    return {
      walletBalance,
      available,
      protected: protected_,
      releasing,
      committed,
      atRisk: committed,
      totalEloraCapital,
      total: totalEloraCapital,
    };
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

  const formatted: CapitalBalancesFormatted = useMemo(
    () => ({
      walletBalance: formatUSD(balances.walletBalance),
      available: formatUSD(balances.available),
      protected: formatUSD(balances.protected),
      releasing: formatUSD(balances.releasing),
      committed: formatUSD(balances.committed),
      atRisk: formatUSD(balances.atRisk),
      totalEloraCapital: formatUSD(balances.totalEloraCapital),
      total: formatUSD(balances.total),
    }),
    [balances],
  );

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
          amountFormatted: formatUSD(lock.amount),
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
