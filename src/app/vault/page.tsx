"use client";

import { useAccount } from "wagmi";
import { WalletInfoCard } from "@/components/web3/wallet-card";
import { VaultSummaryCard } from "@/components/web3/vault-summary";
import { VaultDepositForm } from "@/components/web3/vault-deposit";
import { VaultLockForm } from "@/components/web3/vault-lock-form";
import { VaultLocksCard } from "@/components/web3/vault-locks";
import { Shield, ExternalLink } from "lucide-react";
import { CURRENT_CHAIN } from "@/lib/contracts/contracts";

export default function VaultPage() {
  const { isConnected } = useAccount();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Vault</h1>
        <p className="text-sm text-gray-500 mt-1">
          Self-custodied protected capital on {CURRENT_CHAIN.name}
        </p>
      </div>

      {/* UX Messaging */}
      <div className="rounded-lg border border-indigo-500/10 bg-indigo-500/5 px-4 py-3">
        <p className="text-xs text-indigo-300/70 italic">
          &ldquo;Stored today. Available later. Discipline compounds quietly.&rdquo;
        </p>
      </div>

      {/* Wallet Connection Card (top-level) */}
      {isConnected && <WalletInfoCard />}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Deposit + Lock Form */}
        <div className="space-y-6 lg:col-span-1">
          <VaultDepositForm />
          <VaultLockForm />
        </div>

        {/* Right Column — Vault Summary + Locks */}
        <div className="space-y-6 lg:col-span-2">
          <VaultSummaryCard />
          <VaultLocksCard />
        </div>
      </div>

      {/* Not connected state */}
      {!isConnected && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Shield className="h-12 w-12 mb-3 opacity-20" />
          <p className="text-base font-medium">Connect your wallet</p>
          <p className="text-sm mt-1 text-center max-w-md text-gray-600">
            Connect your wallet to {CURRENT_CHAIN.name} to deposit USDC,
            create vault locks, and protect your future capital onchain.
          </p>
          <a
            href={`${CURRENT_CHAIN.explorerUrl}/address/${CURRENT_CHAIN.usdcAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-500 mt-3"
          >
            USDC on {CURRENT_CHAIN.name}{" "}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-lg border border-white/5 bg-black/20 px-4 py-3">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Elora Vault is a self-custodied behavioral savings vault on Base.
          You remain in full control of your funds at all times.
          The ProtectedVault contract enforces lock durations;
          no early unlocks are possible. The virtual house balance
          ($1B starting) is psychological only and not tokenized.
        </p>
      </div>
    </div>
  );
}
