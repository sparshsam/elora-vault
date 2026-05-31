"use client";

import { Shield } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * WalletConnectPrompt — Calm prompt shown when no wallet is connected.
 * Includes an inline connect button matching Elora's green aesthetic.
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
      <p className="text-body text-text-secondary max-w-md mb-8">
        Connect your wallet to Base to deposit USDC, create vault locks,
        and protect your future capital onchain.
      </p>
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            type="button"
            onClick={openConnectModal}
            className="inline-flex items-center gap-2 rounded-xl bg-green-500 text-white px-6 py-3 text-base font-medium hover:bg-green-600 transition-colors shadow-sm"
          >
            Connect wallet
          </button>
        )}
      </ConnectButton.Custom>
      <p className="text-tiny text-text-tertiary mt-6 max-w-xs leading-relaxed">
        Base Sepolia network. MetaMask, Coinbase Wallet, Rainbow, or
        WalletConnect supported.
      </p>
    </div>
  );
}
