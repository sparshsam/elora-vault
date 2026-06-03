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

  const { activeHorizonCount, balances } = capital;
  const hasHorizons = activeHorizonCount > 0;
  const hasReleasing = balances.releasing > 0;
  const hasCommitted = balances.committed > 0;
  const isEmpty = balances.available === 0 && balances.protected === 0 && balances.releasing === 0 && balances.committed === 0;

  return (
    <PageShell>
      {capital.isLoading ? (
        <div className="max-w-3xl mx-auto">
          <VaultSkeleton />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
        {/* ── Page Heading ── */}
        <div>
          <h1 className="text-[28px] font-light tracking-tight text-text-primary">
            Vault
          </h1>
          <p className="text-body text-text-secondary mt-1.5 leading-relaxed">
            A clear view of your capital.
          </p>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* CONNECTED WALLET  — secondary / quiet  */}
        {/* ═══════════════════════════════════════ */}
        <div className="rounded-xl border border-border bg-surface shadow-sm p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted mb-2">
                Connected Wallet
              </p>
              <p className="text-[22px] font-light tabular-nums text-text-primary">
                ${capital.formatted.walletBalance} USDC
              </p>
              <p className="text-small text-text-tertiary mt-1">
                Outside Elora.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDepositOpen(true)}
              className="rounded-lg bg-green-500 text-white px-4 py-2 text-small font-medium hover:bg-green-600 transition-colors shadow-sm shrink-0"
            >
              Deposit
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* ELORA CAPITAL  — main section            */}
        {/* ═══════════════════════════════════════ */}
        <div>
          <div className="mb-5">
            <h2 className="text-sm font-medium tracking-tight text-text-primary">
              Elora Capital
            </h2>
            <p className="text-small text-text-tertiary mt-0.5">
              Capital inside Elora.
            </p>
          </div>

          <div className="space-y-5">
            {/* ── First-time explanation ── */}
          {isEmpty && (
            <div className="rounded-xl border border-border bg-surface-subtle px-6 py-5">
              <p className="text-sm text-text-primary font-medium mb-1">
                Your vault is ready
              </p>
              <p className="text-small text-text-tertiary leading-relaxed">
                Elora separates your capital into states: Available, Protected, Releasing, and Committed.
                Deposit USDC from your connected wallet to get started, then protect what matters and
                use the rest with intention.
              </p>
            </div>
          )}

          {/* ── ① AVAILABLE ── */}
            <VaultStateCard
              state="available"
              label="Available"
              amount={capital.formatted.available}
              description="Ready to use."
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
              description="Protected in active horizons."
              info={
                hasHorizons
                  ? `${capital.activeHorizonCount} active ${capital.activeHorizonCount === 1 ? "horizon" : "horizons"}`
                  : undefined
              }
            >
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
                  ? "Capital returning to availability."
                  : "No active releases."
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

            {/* ── ④ COMMITTED ── */}
            {hasCommitted && (
              <VaultStateCard
                state="committed"
                label="Committed"
                amount={capital.formatted.committed}
                description="Capital in active predictions."
              >
                <Link
                  href="/sessions"
                  className="inline-flex items-center gap-1.5 text-small font-medium text-text-tertiary hover:text-text-primary transition-colors"
                >
                  View active predictions
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </VaultStateCard>
            )}
          </div>
        </div>

        {/* ── Explanatory footer ── */}
        <p className="text-tiny text-text-muted text-center leading-relaxed max-w-md mx-auto pb-8">
          Wallet funds are outside Elora. Capital enters when deposited.
        </p>
      </div>
      )}

      {/* ── Operation Modals ── */}
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
