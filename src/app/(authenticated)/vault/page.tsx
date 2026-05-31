"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useCapitalState } from "@/lib/capital-state";
import { useWalletStore } from "@/store/useWalletStore";
import { PageShell } from "@/components/layout/page-shell";
import { VaultSkeleton } from "@/components/vault/vault-skeleton";
import { WalletConnectPrompt } from "@/components/vault/wallet-connect-prompt";
import { VaultStateCard } from "@/components/vault/vault-state-card";
import { ProtectedCapitalPanel } from "@/components/vault/protected-capital-panel";
import { DepositModal, WithdrawModal, ProtectCapitalModal } from "@/components/capital/capital-operations";
import { EndSessionModal } from "@/components/capital/session-modal";
import { ArrowRight } from "lucide-react";
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
  const [sessionOpen, setSessionOpen] = useState(false);

  // ── Protected panel expand ──
  const [protectedExpanded, setProtectedExpanded] = useState(false);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

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
          <h1 className="text-[28px] font-light tracking-tight text-text-primary">
            Vault
          </h1>
          <p className="text-body text-text-secondary mt-1.5 leading-relaxed">
            A single view of your protected financial state.
          </p>
        </div>

        {/* ── ① AVAILABLE ── */}
        <VaultStateCard
          state="available"
          label="Available"
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
        <VaultStateCard
          state="protected"
          label="Protected"
          amount={capital.formatted.protected}
          description="Capital currently locked inside active horizons."
          info={
            hasHorizons
              ? `${capital.activeHorizonCount} active ${capital.activeHorizonCount === 1 ? "horizon" : "horizons"}`
              : undefined
          }
        >
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
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
            <p className="text-tiny text-green-600/60 mt-2">
              No protected capital yet. Set your first horizon when you&apos;re ready.
            </p>
          )}
        </VaultStateCard>

        {/* ── ③ RELEASING ── */}
        <VaultStateCard
          state="releasing"
          label="Releasing"
          amount={capital.formatted.releasing}
          description={
            hasReleasing
              ? "Capital transitioning back into availability."
              : "No capital currently in transition."
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/intent"
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 px-4 py-2 text-small font-medium hover:bg-amber-100 transition-colors"
            >
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
        </VaultStateCard>

        {/* ── ④ AT RISK ── */}
        {capital.balances.atRisk > 0 && (
          <VaultStateCard
            state="at-risk"
            label="At Risk"
            amount={capital.formatted.atRisk}
            description="Capital committed to open bets."
          >
            <Link
              href="/sessions"
              className="inline-flex items-center gap-1.5 text-small font-medium text-text-tertiary hover:text-text-primary transition-colors"
            >
              View open bets
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </VaultStateCard>
        )}

        {/* ── Session Logging ── */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => setSessionOpen(true)}
            className="inline-flex items-center gap-1.5 text-tiny font-medium text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Log a session
          </button>
        </div>

        {/* ── Calm footer note ── */}
        <p className="text-tiny text-text-muted text-center pt-4 pb-8">
          Four states of capital. One coherent system.
        </p>
      </div>

      {/* ── Operation Modals ── */}
      <EndSessionModal
        open={sessionOpen}
        onClose={() => setSessionOpen(false)}
        availableBalance={capital.balances.available}
      />
      <DepositModal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
      />
      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        maxAmount={capital.balances.available}
      />
      <ProtectCapitalModal
        open={protectOpen}
        onClose={() => setProtectOpen(false)}
        maxAmount={capital.balances.available}
      />
    </PageShell>
  );
}
