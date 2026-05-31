"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useWalletStore } from "@/store/useWalletStore";
import {
  useVaultSummary,
  useVaultLocks,
} from "@/lib/web3/hooks";
import {
  useUSDCBalance,
} from "@/lib/web3/tx-hooks";

/* ── Types ────────────────────────────────────────────── */

export type CapitalState = "available" | "protected" | "releasing" | "at-risk" | "activity" | "intent" | "horizon";

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
  available: number;
  protected: number;
  releasing: number;
  atRisk: number;
  total: number;
}

export interface CapitalBalancesFormatted {
  available: string;
  protected: string;
  releasing: string;
  atRisk: string;
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

/* ── Helpers ──────────────────────────────────────────── */

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

/* ── Hook ─────────────────────────────────────────────── */

/**
 * useCapitalState
 *
 * THE canonical hook for ALL capital state across the application.
 *
 * Derives balances from:
 *   1. Connected wallet USDC balance (available)
 *   2. ProtectedVault contract reads (protected, releasing)
 *   3. Wallet store fallback (when contract data unavailable)
 *
 * Every page reads from this single source of truth.
 * Balances are mathematically coherent: total = available + protected + releasing.
 */
export function useCapitalState(): CapitalSummary {
  const { address, isConnected } = useAccount();
  const walletStore = useWalletStore();
  const vaultSummary = useVaultSummary(address);
  const vaultLocks = useVaultLocks(address);
  const usdcBalance = useUSDCBalance();

  const isLoading = walletStore.isLoading || (isConnected && vaultSummary.isLoading);

  // ── Derive the four canonical balances ──
  const balances: CapitalBalances = useMemo(() => {
    // At Risk first so available can subtract it
    const atRisk = walletStore.at_risk_balance ?? 0;

    // Available: USDC in wallet minus at-risk (betting is virtual — no onchain deduction)
    const rawAvailable = isConnected ? usdcBalance.balance : (walletStore.user_balance ?? 0);
    const available = Math.max(0, rawAvailable - atRisk);

    // Protected: onchain locked vault balance | fallback: backend locked_vault_balance
    const protected_ =
      vaultSummary.totalLocked > 0
        ? vaultSummary.totalLocked
        : walletStore.locked_vault_balance > 0
          ? walletStore.locked_vault_balance
          : 0;

    // Releasing: vault unlocked balance (totalDeposited - totalLocked - totalWithdrawn)
    const releasedVault =
      vaultSummary.totalDeposited > 0
        ? Math.max(0, vaultSummary.totalDeposited - vaultSummary.totalLocked - vaultSummary.totalWithdrawn)
        : 0;

    const releasing = releasedVault > 0
      ? releasedVault
      : (walletStore.savings_vault ?? 0);

    return {
      available,
      protected: protected_,
      releasing,
      atRisk,
      total: available + protected_ + releasing + atRisk,
    };
  }, [
    isConnected,
    usdcBalance.balance,
    walletStore.user_balance,
    walletStore.locked_vault_balance,
    walletStore.savings_vault,
    walletStore.at_risk_balance,
    vaultSummary.totalLocked,
    vaultSummary.totalDeposited,
    vaultSummary.totalWithdrawn,
  ]);

  const formatted: CapitalBalancesFormatted = useMemo(
    () => ({
      available: formatUSD(balances.available),
      protected: formatUSD(balances.protected),
      releasing: formatUSD(balances.releasing),
      atRisk: formatUSD(balances.atRisk),
      total: formatUSD(balances.total),
    }),
    [balances],
  );

  // ── Active horizon info ──
  const [now] = useState(() => Date.now());

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

  // ── Derived counts ──
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
