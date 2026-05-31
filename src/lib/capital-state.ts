"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useWalletStore } from "@/store/useWalletStore";
import { useVaultSummary, useVaultLocks } from "@/lib/web3/hooks";

/* ── Types ────────────────────────────────────────────── */

/** Canonical capital states — these are the ONLY terms used everywhere. */
export type CapitalState = "available" | "protected" | "releasing" | "activity" | "intent" | "horizon";

/** A protection period boundary for capital. */
export interface HorizonInfo {
  id: string;
  amount: number;
  amountFormatted: string;
  createdAt: number;
  unlockAt: number;
  durationDays: number;
  progress: number;           // 0-100
  withdrawn: boolean;
  released: boolean;
  releaseDate: string;
}

/** The mathematical breakdown of a user's capital. */
export interface CapitalBalances {
  available: number;
  protected: number;
  releasing: number;
  total: number;
}

/** Formatted string versions (for display). */
export interface CapitalBalancesFormatted {
  available: string;
  protected: string;
  releasing: string;
  total: string;
}

/** High-level summary derived from capital state. */
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
 * Every page reads from this single source of truth.
 * Balances are mathematically coherent: total = available + protected + releasing.
 */
export function useCapitalState(): CapitalSummary {
  const { address, isConnected } = useAccount();
  const walletStore = useWalletStore();
  const vaultSummary = useVaultSummary(address);
  const vaultLocks = useVaultLocks(address);

  const isLoading = walletStore.isLoading || (isConnected && vaultSummary.isLoading);

  // Capture a reference timestamp once (lazy initializer — not called on re-render)
  const [now] = useState(() => Date.now());

  // ── Derive the three canonical balances ──
  const balances: CapitalBalances = useMemo(() => {
    const available = walletStore.user_balance ?? 0;
    const protected_ =
      walletStore.locked_vault_balance > 0
        ? walletStore.locked_vault_balance
        : vaultSummary.totalLocked > 0
          ? vaultSummary.totalLocked
          : 0;
    const releasing = walletStore.savings_vault ?? 0;

    return {
      available,
      protected: protected_,
      releasing,
      total: available + protected_ + releasing,
    };
  }, [
    walletStore.user_balance,
    walletStore.locked_vault_balance,
    walletStore.savings_vault,
    vaultSummary.totalLocked,
  ]);

  const formatted: CapitalBalancesFormatted = useMemo(
    () => ({
      available: formatUSD(balances.available),
      protected: formatUSD(balances.protected),
      releasing: formatUSD(balances.releasing),
      total: formatUSD(balances.total),
    }),
    [balances],
  );

  // ── Active horizon info ──

  const activeHorizons: HorizonInfo[] = useMemo(() => {
    if (!vaultLocks.locks || vaultLocks.locks.length === 0) return [];

    return vaultLocks.locks
      .filter((lock) => !lock.withdrawn)
      .map((lock) => {
        const durationMs = lock.unlockAt - lock.createdAt;
        const durationDays = Math.round(durationMs / 86400000);
        const progress = computeHorizonProgress(lock.createdAt, lock.unlockAt, now);
        return {
          id: String(lock.id),
          amount: lock.amount,
          amountFormatted: formatUSD(lock.amount),
          createdAt: lock.createdAt,
          unlockAt: lock.unlockAt,
          durationDays,
          progress,
          withdrawn: lock.withdrawn,
          released: progress >= 100,
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
    () => activeHorizons.filter((h) => h.released && !h.withdrawn).length,
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
