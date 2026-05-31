"use client";

import { Shield } from "lucide-react";

/**
 * WalletConnectPrompt — Calm prompt shown when no wallet is connected.
 * Replace the old "Connect your wallet" dark card.
 */
export function WalletConnectPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 rounded-2xl bg-surface-subtle p-4">
        <Shield className="h-10 w-10 text-text-tertiary" />
      </div>
      <h2 className="text-heading font-semibold text-text-primary mb-2">
        Connect your wallet
      </h2>
      <p className="text-body text-text-secondary max-w-md">
        Connect your wallet to Base to deposit USDC, create vault locks,
        and protect your future capital onchain.
      </p>
    </div>
  );
}
