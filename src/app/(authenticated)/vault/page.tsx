"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useCapitalState } from "@/lib/capital-state";
import { useWalletStore } from "@/store/useWalletStore";
import { PageShell } from "@/components/layout/page-shell";
import { VaultSkeleton } from "@/components/vault/vault-skeleton";
import { WalletConnectPrompt } from "@/components/vault/wallet-connect-prompt";
import { VaultStateCard } from "@/components/vault/vault-state-card";
import { ProtectedCapitalPanel } from "@/components/vault/protected-capital-panel";
import { DepositModal } from "@/components/capital/capital-operations";
import { WithdrawModal } from "@/components/capital/capital-operations";
import { ProtectCapitalModal } from "@/components/capital/capital-operations";
import { ArrowRight, Shield, History, Target } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function VaultPage() {
  const { isConnected } = useAccount();
  const capital = useCapitalState();
  const { syncFromServer } = useWalletStore();

  // ── Modal state ──
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [protectOpen, setProtectOpen] = useState(false);

  // ── Protected panel expand ──
  const [protectedExpanded, setProtectedExpanded] = useState(false);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  // ── Operation handlers ──
  const handleDeposit = useCallback((amount: number) => {
    useWalletStore.setState((s) => ({
      user_balance: s.user_balance + amount,
    }));
  }, []);

  const handleWithdraw = useCallback((amount: number) => {
    useWalletStore.setState((s) => ({
      user_balance: Math.max(0, s.user_balance - amount),
    }));
  }, []);

  const handleProtect = useCallback((amount: number) => {
    useWalletStore.setState((s) => ({
      user_balance: Math.max(0, s.user_balance - amount),
      locked_vault_balance: s.locked_vault_balance + amount,
    }));
  }, []);

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
  if (capital.isLoading) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto">
          <VaultSkeleton />
        </div>
      </PageShell>
    );
  }

  const hasHorizons = capital.activeHorizonCount > 0;
  const hasReleasing = capital.balances.releasing > 0;

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
        {/* ── Page Heading ── */}
        <div className="mb-2">
          <h1 className="text-display text-text-primary">Vault</h1>
          <p className="text-body text-text-secondary mt-1">
            A single view of your protected financial state.
          </p>
        </div>

        {/* ── ① AVAILABLE — Operational home ── */}
        <VaultStateCard
          state="available"
          amount={capital.formatted.available}
          description={
            capital.balances.available > 0
              ? "Capital immediately usable or withdrawable."
              : "No capital available."
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setDepositOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-4 py-2 text-small font-medium hover:bg-green-600 transition-colors shadow-sm"
            >
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setProtectOpen(true)}
              disabled={capital.balances.available <= 0}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-small font-medium transition-colors",
                capital.balances.available > 0
                  ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                  : "bg-surface-subtle text-text-muted cursor-not-allowed border border-border",
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              Protect Capital
            </button>
            {capital.balances.available > 0 && (
              <button
                type="button"
                onClick={() => setWithdrawOpen(true)}
                className="inline-flex items-center gap-1 text-small font-medium text-text-tertiary hover:text-text-primary transition-colors"
              >
                Withdraw
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </VaultStateCard>

        {/* ── ② PROTECTED ── */}
        <div className="rounded-xl border border-green-200 bg-green-50/30 shadow-sm p-6 md:p-8 transition-all duration-300">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-green-100 p-1.5">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-tiny font-medium bg-green-100 text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Protected
                </span>
              </div>
              <p className="text-number text-green-700">
                ${capital.formatted.protected}
              </p>
              {capital.balances.protected > 0 && (
                <p className="text-tiny text-green-600/80 mt-1">
                  {capital.activeHorizonCount} active{" "}
                  {capital.activeHorizonCount === 1 ? "horizon" : "horizons"}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {hasHorizons && (
              <button
                type="button"
                onClick={() => setProtectedExpanded(!protectedExpanded)}
                className="inline-flex items-center gap-1.5 text-small font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                {protectedExpanded ? "Hide horizons" : "View horizons"}
                <ArrowRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-300",
                    protectedExpanded && "rotate-90",
                  )}
                />
              </button>
            )}
            {capital.balances.protected > 0 && (
              <button
                type="button"
                onClick={() => setProtectOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 text-tiny font-medium hover:bg-green-100 transition-colors"
              >
                Extend protection
              </button>
            )}
          </div>

          {/* Expanded horizons */}
          {protectedExpanded && hasHorizons && (
            <div className="mt-6 pt-6 border-t border-green-200 animate-in fade-in slide-in-from-top-2 duration-300">
              <ProtectedCapitalPanel
                locks={capital.activeHorizons.map((h) => ({
                  id: h.id,
                  amount: h.amountFormatted,
                  releaseDate: h.releaseDate,
                  progress: h.progress,
                }))}
              />
            </div>
          )}

          {/* Empty state */}
          {!hasHorizons && (
            <p className="text-sm text-green-600/70 mt-3">
              No protected capital yet. Set your first horizon when
              you&apos;re ready.
            </p>
          )}
        </div>

        {/* ── ③ RELEASING ── */}
        <div className="rounded-xl border border-amber-200/30 bg-amber-50/30 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-4 w-4 text-amber-600" />
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-tiny font-medium bg-amber-50 text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Releasing
            </span>
          </div>
          <p className="text-number text-text-primary">
            ${capital.formatted.releasing}
          </p>
          {hasReleasing ? (
            <p className="text-tiny text-text-muted mt-1">
              Capital transitioning back into availability.
            </p>
          ) : (
            <p className="text-tiny text-text-muted mt-1">
              No capital currently in transition.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Link
              href="/intent"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 text-amber-700 px-4 py-2 text-small font-medium hover:bg-amber-200 transition-colors border border-amber-200"
            >
              <Target className="h-3.5 w-3.5" />
              Review intent
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/activity"
              className="inline-flex items-center gap-1 text-small font-medium text-text-tertiary hover:text-text-primary transition-colors"
            >
              View pending releases
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* ── Calm footer note ── */}
        <p className="text-tiny text-text-muted text-center pt-4 pb-8">
          Three states of capital. One coherent system.
        </p>
      </div>

      {/* ── Operation Modals ── */}
      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        onDeposit={handleDeposit}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onWithdraw={handleWithdraw}
        maxAmount={capital.balances.available}
      />
      <ProtectCapitalModal
        open={protectOpen}
        onClose={() => setProtectOpen(false)}
        onProtect={handleProtect}
        maxAmount={capital.balances.available}
      />
    </PageShell>
  );
}
