"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Lock, Shield, Info, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  PROTECTION_MODES,
  getFutureProtectionModes,
} from "@/types/productive-protection";
import type { ProtectionMode } from "@/types/productive-protection";

/* ── Protection Mode Card ───────────────────────────── */

function ProtectionModeCard({
  mode,
}: {
  mode: (typeof PROTECTION_MODES)[ProtectionMode];
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all duration-200",
        mode.isAvailable
          ? "border-border bg-surface shadow-sm"
          : "border-dashed border-border bg-surface-subtle/50",
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-sm font-medium text-text-primary">
            {mode.label}
          </h3>
          <p
            className={cn(
              "text-tiny mt-1 leading-relaxed",
              mode.isAvailable ? "text-text-tertiary" : "text-text-muted",
            )}
          >
            {mode.description}
          </p>
        </div>
        {!mode.isAvailable && (
          <span className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-0.5 text-tiny text-text-muted">
            future
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
        <div>
          <span className="text-tiny text-text-tertiary">Risk level</span>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-4 rounded-full",
                  i < mode.riskLevel ? "bg-amber-300" : "bg-border",
                )}
              />
            ))}
          </div>
        </div>
        <div>
          <span className="text-tiny text-text-tertiary">Yield range</span>
          <p className="text-small font-medium text-text-primary mt-0.5">
            {mode.estimatedYieldRange}
          </p>
        </div>
        <div>
          <span className="text-tiny text-text-tertiary">Principal</span>
          <p className="text-small text-text-primary mt-0.5">
            {mode.principalProtected ? "Protected" : "Market-dependent"}
          </p>
        </div>
        <div>
          <span className="text-tiny text-text-tertiary">Liquidity</span>
          <p className="text-small text-text-primary mt-0.5 capitalize">
            {mode.liquidityProfile}
          </p>
        </div>
      </div>

      {!mode.isAvailable && (
        <p className="mt-4 pt-3 border-t border-border/50 text-tiny text-text-subtle italic">
          {mode.notes}
        </p>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────── */

export default function ProductiveProtectionPage() {
  const futureModes = getFutureProtectionModes();
  const currentMode = PROTECTION_MODES["static-protection"];

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        {/* ── Page Header ── */}
        <div className="mb-2">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-tiny text-text-tertiary hover:text-text-secondary transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Settings
          </Link>
          <h1 className="text-xl font-semibold text-text-primary">
            Productive Protection
          </h1>
          <p className="text-small text-text-tertiary mt-1.5">
            Protected capital may eventually support optional low-risk
            productivity while remaining separated.
          </p>
        </div>

        {/* ── Philosophy ── */}
        <div className="rounded-xl border border-border bg-surface p-5 my-8">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-subtle">
              <Info className="h-4 w-4 text-text-tertiary" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-text-primary mb-1">
                Optionality over optimization
              </h2>
              <p className="text-small text-text-secondary leading-relaxed">
                Protected capital can remain static — that is the default and
                always will be. Productive protection is an opt-in concept for
                capital that is already intentionally separated. It is not
                about maximizing yield. It is about giving protected capital
                the option to grow quietly, without urgency or speculation.
              </p>
              <p className="text-small text-text-secondary leading-relaxed mt-2">
                No yield strategies are active. No protocols are integrated.
                This page is a research surface for future optionality.
              </p>
            </div>
          </div>
        </div>

        {/* ── Current Mode ── */}
        <div className="mb-8">
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-4 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            Current protection mode
          </h2>
          <ProtectionModeCard mode={currentMode} />
        </div>

        {/* ── Future Modes ── */}
        <div className="mb-8">
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-4 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            Future protection modes (research)
          </h2>
          <div className="space-y-4">
            {futureModes.map((mode) => (
              <ProtectionModeCard key={mode.mode} mode={mode} />
            ))}
          </div>
        </div>

        {/* ── Restraint statement ── */}
        <div className="rounded-xl border border-amber-200/40 bg-amber-50/20 p-5 mb-8">
          <p className="text-tiny text-amber-700/80 leading-relaxed">
            <span className="font-medium">Restraint.</span> Productive
            protection will only be introduced when it does not compromise
            the calm that makes Elora valuable. Yield is never the goal —
            separation is.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
