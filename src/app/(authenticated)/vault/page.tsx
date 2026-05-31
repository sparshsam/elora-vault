"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { useWalletStore } from "@/store/useWalletStore";
import { useVaultSummary, useVaultLocks } from "@/lib/web3/hooks";
import { PageShell } from "@/components/layout/page-shell";
import { VaultSkeleton } from "@/components/vault/vault-skeleton";
import { WalletConnectPrompt } from "@/components/vault/wallet-connect-prompt";
import { VaultStateCard } from "@/components/vault/vault-state-card";
import { ProtectedCapitalPanel } from "@/components/vault/protected-capital-panel";
import { ArrowRight, Lock, Activity } from "lucide-react";
import Link from "next/link";

export default function VaultPage() {
  const { address, isConnected } = useAccount();
  const {
    user_balance,
    locked_vault_balance,
    savings_vault,
    isLoading: walletLoading,
    syncFromServer,
  } = useWalletStore();

  const {
    totalLocked,
    activeLockCount,
    isLoading: vaultLoading,
  } = useVaultSummary(address);

  const { locks } = useVaultLocks(address);

  const [protectedExpanded, setProtectedExpanded] = useState(false);
  const [now, setNow] = useState(0);

  // Update timestamp once per minute for lock progress calculations
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  const isLoading = walletLoading || (isConnected && vaultLoading);

  const formatBalance = useCallback(
    (n: number) =>
      n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const lockItems = useMemo(
    () =>
      (locks || [])
        .filter((l) => !l.withdrawn)
        .map((lock) => {
          const duration = lock.unlockAt - lock.createdAt;
          const elapsed = now - lock.createdAt;
          const progress =
            duration > 0
              ? Math.min(100, Math.max(0, (elapsed / duration) * 100))
              : 0;

          return {
            id: String(lock.id),
            amount: formatBalance(lock.amount),
            releaseDate: new Date(lock.unlockAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            progress,
            txHash: undefined,
            baseScanUrl: "https://sepolia.basescan.org",
          };
        }),
    [locks, now, formatBalance],
  );

  const hasLocks = lockItems.length > 0;

  // ── Not connected ──
  if (!isConnected) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto">
          <WalletConnectPrompt />
        </div>
      </PageShell>
    );
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto">
          <VaultSkeleton />
        </div>
      </PageShell>
    );
  }

  // ── Connected + Loaded ──
  const availableAmount = user_balance;
  const protectedAmount =
    locked_vault_balance > 0 ? locked_vault_balance : totalLocked;
  const inMotionAmount = savings_vault;

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
        {/* ── Page Heading ── */}
        <div className="mb-2">
          <h1 className="text-display text-text-primary">Vault</h1>
          <p className="text-body text-text-secondary mt-1">
            Your protected financial state
          </p>
        </div>

        {/* ── ① AVAILABLE ── */}
        <VaultStateCard
          state="available"
          amount={formatBalance(availableAmount)}
        >
          <div className="mt-4">
            <Link
              href="/intent"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
            >
              Move funds into a horizon
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </VaultStateCard>

        {/* ── ② PROTECTED ── */}
        <div className="rounded-xl border-2 border-green-200 bg-green-50/50 p-6 md:p-8 transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-green-100 p-1.5">
                  <Lock className="h-4 w-4 text-green-600" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-tiny font-medium bg-green-100 text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Protected
                </span>
              </div>
              <p className="text-number text-green-700">
                ${formatBalance(protectedAmount)}
              </p>
              {hasLocks && (
                <p className="text-tiny text-green-600 mt-1">
                  {activeLockCount} active{" "}
                  {activeLockCount === 1 ? "horizon" : "horizons"}
                </p>
              )}
            </div>
          </div>

          {/* Expand/collapse toggle */}
          {hasLocks && (
            <>
              <button
                type="button"
                onClick={() => setProtectedExpanded(!protectedExpanded)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors mt-3"
              >
                {protectedExpanded ? "Hide horizons" : "View active horizons"}
                <ArrowRight
                  className={`h-4 w-4 transition-transform duration-300 ${
                    protectedExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Expanded content — inline on desktop, sheet on mobile */}
              {protectedExpanded && (
                <div className="mt-6 pt-6 border-t border-green-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <ProtectedCapitalPanel locks={lockItems} />
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!hasLocks && (
            <p className="text-sm text-green-600/70 mt-3">
              No protected capital yet. Set your first horizon when
              you&apos;re ready.
            </p>
          )}
        </div>

        {/* ── ③ IN MOTION ── */}
        <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-text-tertiary" />
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-tiny font-medium bg-surface-subtle text-text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 opacity-60" />
              In Motion
            </span>
          </div>
          <p className="text-number text-text-primary">
            ${formatBalance(inMotionAmount)}
          </p>
          <div className="mt-4">
            <Link
              href="/activity"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              View activity
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
