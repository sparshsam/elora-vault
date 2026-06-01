/**
 * use-wallet-capabilities.ts — Elora wallet capability detection hook.
 *
 * Detects wallet capabilities via EIP-5792 (wallet_getCapabilities),
 * identifies wallet type (EOA vs smart wallet vs Base Account), and
 * surfaces batching, paymaster, sub-account, and Base Account support.
 *
 * This is an architectural preparation layer. No production wallet
 * flows depend on this hook yet.
 *
 * ── Why capability detection matters ──────────────────
 *
 * Before Elora can migrate from external-wallet mode to Base-native
 * account infrastructure, we must know what the connected wallet
 * supports. Capability detection answers:
 *
 * - Can this wallet batch operations? (sendCalls / EIP-5792)
 * - Does it support paymaster sponsorship? (ERC-7677)
 * - Can it create and use sub-accounts? (ERC-7895)
 * - Is this an EOA, a smart wallet, or a Base Account?
 *
 * Without this information, migration decisions are guesses. With it,
 * Elora can progressively enhance: start with batching, add sponsorship
 * when available, and activate sub-account flows once confirmed.
 *
 * Inspired by:
 *   - Base wallet capability detection docs
 *   - EIP-5792 specification
 *   - wagmi useCapabilities hook
 */

"use client";

import { useMemo } from "react";
import { useAccount, useCapabilities } from "wagmi";
import { baseSepolia } from "wagmi/chains";

/* ── Types ───────────────────────────────────────────── */

export type WalletType = "eoa" | "smart-wallet" | "base-account" | "unknown";

export interface WalletCapabilities {
  /** Whether the wallet supports atomic batch calls (sendCalls) */
  supportsBatching: boolean;
  /** Whether the wallet supports a paymaster service */
  supportsPaymaster: boolean;
  /** Whether the wallet is (or can be) a Base Account */
  supportsBaseAccount: boolean;
  /** Whether the wallet supports sub-accounts */
  supportsSubAccounts: boolean;
  /** The detected wallet type */
  walletType: WalletType;
  /** Raw capabilities response from EIP-5792, keyed by chain ID */
  rawCapabilities: Record<string, unknown> | null;
  /** Whether capability detection is still loading */
  isLoading: boolean;
  /** Whether the wallet is connected */
  isConnected: boolean;
  /** The connected wallet address */
  address: `0x${string}` | undefined;
  /** The detected chain ID */
  chainId: number | undefined;
}

/* ── Default state (no wallet) ───────────────────────── */

const DEFAULT_CAPABILITIES: WalletCapabilities = {
  supportsBatching: false,
  supportsPaymaster: false,
  supportsBaseAccount: false,
  supportsSubAccounts: false,
  walletType: "unknown",
  rawCapabilities: null,
  isLoading: false,
  isConnected: false,
  address: undefined,
  chainId: undefined,
};

/* ── Hook ────────────────────────────────────────────── */

/**
 * Detect wallet capabilities and type for the currently connected wallet.
 *
 * Uses wagmi's useCapabilities (EIP-5792 wallet_getCapabilities) to
 * determine atomic batch support, paymaster readiness, and sub-account
 * availability. Wallet type detection distinguishes EOAs from smart
 * wallets and identifies Base Account providers.
 *
 * Returns a stable default when no wallet is connected.
 */
export function useWalletCapabilities(): WalletCapabilities {
  const { address, isConnected, chainId } = useAccount();
  const { data: capabilitiesData, isLoading } = useCapabilities({
    query: {
      enabled: !!isConnected && !!address,
    },
  });

  return useMemo(() => {
    if (!isConnected || !address) {
      return DEFAULT_CAPABILITIES;
    }

    /* ── EIP-5792 capabilities (per-chain) ──────────── */
    const targetChainId = chainId ?? baseSepolia.id;
    const chainCaps = capabilitiesData?.[targetChainId] as
      | Record<string, unknown>
      | undefined;

    /* ── Atomic batching support (EIP-5792 sendCalls) ─ */
    const atomicCaps = chainCaps?.atomic as
      | { status: "supported" | "ready" | "unsupported" }
      | undefined;
    const supportsBatching =
      atomicCaps?.status === "supported" ||
      atomicCaps?.status === "ready";

    /* ── Paymaster service support ──────────────────── */
    const paymasterCaps = chainCaps?.paymasterService as
      | { supported: boolean }
      | undefined;
    const supportsPaymaster = paymasterCaps?.supported === true;

    /* ── Sub-account support (ERC-7895 / Base) ──────── */
    const subAccountCaps = chainCaps?.unstable_addSubAccount as
      | { supported: boolean; keyTypes?: string[] }
      | undefined;
    const supportsSubAccounts = subAccountCaps?.supported === true;

    /* ── Wallet type detection ──────────────────────────
     *
     * Heuristic — refined over time as more providers support
     * EIP-5792 and related standards:
     *
     * - If sub-accounts are supported → smart wallet (likely Base Account)
     * - If atomic batching is supported → smart wallet
     *   (EOAs cannot batch at the RPC level)
     * - Otherwise → EOA (most common for externally-owned wallets)
     *
     * A more precise approach would use wallet_getCode to check
     * for deployed contract code at the address. That is deferred
     * to a future capability pass.
     */
    const walletType: WalletType = (() => {
      // Sub-account support strongly suggests a Base Account provider
      if (supportsSubAccounts) return "base-account";
      // Atomic batching implies smart wallet capabilities
      if (supportsBatching) return "smart-wallet";
      // Onchain code check would go here in a future pass
      return "eoa";
    })();

    /* ── Base Account support ───────────────────────────
     *
     * If the provider supports sub-accounts (ERC-7895), it is
     * effectively a Base-compatible smart wallet capable of
     * running the Base Account SDK.
     */
    const supportsBaseAccount = supportsSubAccounts;

    return {
      supportsBatching,
      supportsPaymaster,
      supportsBaseAccount,
      supportsSubAccounts,
      walletType,
      rawCapabilities: (chainCaps as Record<string, unknown>) ?? null,
      isLoading,
      isConnected,
      address,
      chainId: targetChainId,
    };
  }, [address, isConnected, chainId, capabilitiesData, isLoading]);
}
