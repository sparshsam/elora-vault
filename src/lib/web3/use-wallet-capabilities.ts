/**
 * use-wallet-capabilities.ts
 *
 * EIP-5792 wallet capability detection for Elora Vault's progressive
 * Base Account enhancement layer.
 *
 * This hook is **non-blocking by design**. If any detection fails — wallet
 * not connected, provider unavailable, RPC error, unsupported method — it
 * silently returns empty capabilities. No errors are thrown, no UI state
 * is disrupted.
 *
 * Detection methods used:
 *   - `wallet_getCapabilities` (EIP-5792): canonical capability discovery
 *   - `wallet_getSubAccounts` (Base Account): sub-account detection
 *   - Connector introspection: known Base Account connector IDs
 */

"use client";

import { useMemo } from "react";
import { useAccount, useConnectorClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";

/* ── Types ───────────────────────────────────────────── */

/** Minimal EIP-1193 provider interface for capability detection */
interface EIP1193Provider {
  request: (args: { method: string; params?: readonly unknown[] | object }) => Promise<unknown>;
}

/* ── Types ───────────────────────────────────────────── */

export interface WalletCapabilities {
  /** Whether the wallet supports Base Account infrastructure */
  baseAccount: boolean;
  /** Whether the wallet supports batched calls (atomicBatch / wallet_sendCalls) */
  batching: boolean;
  /** Whether sub-accounts are available */
  subAccountSupport: boolean;
  /** Whether wallet_sendCalls (EIP-5792) is available */
  sendCallsSupport: boolean;
  /** Universal account address (if Base Account) */
  universalAddress: Address | null;
  /** Elora sub-account address (if one exists) */
  subAccountAddress: Address | null;
}

export type DetectionStatus = "idle" | "detecting" | "detected" | "not-detected" | "error";

export interface CapabilitiesState {
  capabilities: WalletCapabilities;
  status: DetectionStatus;
}

/* ── Empty defaults ─────────────────────────────────── */

const EMPTY_CAPABILITIES: WalletCapabilities = {
  baseAccount: false,
  batching: false,
  subAccountSupport: false,
  sendCallsSupport: false,
  universalAddress: null,
  subAccountAddress: null,
};

/* ── Detection ───────────────────────────────────────── */

// Known Base Account connector IDs from common wallet providers
const BASE_ACCOUNT_CONNECTOR_IDS = new Set([
  "coinbaseWalletSDK",
  "com.coinbase.wallet",
  "injected", // Some injected wallets expose Base Account features
]);

/**
 * Detect capabilities by calling the provider directly.
 * Returns partial results — each capability is independently detected.
 */
async function detectCapabilities(
  provider: EIP1193Provider,
  accountAddress: Address,
): Promise<WalletCapabilities> {
  const result = { ...EMPTY_CAPABILITIES, universalAddress: accountAddress };

  /* ── 1. EIP-5792: wallet_getCapabilities ── */
  try {
    const caps = (await provider.request({
      method: "wallet_getCapabilities",
      params: [],
    })) as Record<string, Record<string, boolean | Record<string, unknown>>> | undefined;

    if (caps) {
      // Check across all returned chains
      for (const chainId of Object.keys(caps)) {
        const chainCaps = caps[chainId];
        if (!chainCaps) continue;

        if (chainCaps.atomicBatch === true) {
          result.batching = true;
        }
        if (
          chainCaps.sendCalls === true ||
          typeof chainCaps.sendCalls === "object"
        ) {
          result.sendCallsSupport = true;
        }
        if (
          chainCaps.subAccounts === true ||
          typeof chainCaps.subAccounts === "object"
        ) {
          result.subAccountSupport = true;
        }
        if (chainCaps.baseAccount === true || chainCaps.baseAccountSDK === true) {
          result.baseAccount = true;
        }
      }
    }
  } catch {
    // wallet_getCapabilities not supported — fall through
  }

  /* ── 2. Detect sub-accounts via wallet_getSubAccounts ── */
  try {
    const subAccounts = (await provider.request({
      method: "wallet_getSubAccounts",
      params: [],
    })) as Address[] | undefined;

    if (subAccounts && subAccounts.length > 0) {
      result.subAccountSupport = true;
      result.subAccountAddress = subAccounts[0];
      // If we can call getSubAccounts, we have Base Account
      result.baseAccount = true;
    }
  } catch {
    // wallet_getSubAccounts not supported — that's fine
  }

  /* ── 3. Try to get the universal account ── */
  // If wallet_getCapabilities didn't return it, eth_accounts is our fallback
  if (!result.baseAccount && !result.subAccountSupport) {
    // No Base Account detected via RPC
    result.baseAccount = false;
  }

  return result;
}

/* ── Hook ────────────────────────────────────────────── */

/**
 * Quietly detect wallet capabilities for progressive Base Account enhancement.
 *
 * Returns a CapabilitiesState with detected features and addresses.
 * Safe to call unconditionally — returns empty defaults when not applicable.
 */
export function useWalletCapabilities(): CapabilitiesState {
  const { address, isConnected, connector } = useAccount();

  // We need the raw provider for EIP-1193 requests
  const { data: client } = useConnectorClient();

  const { data: capabilities, status: queryStatus } = useQuery({
    queryKey: ["wallet-capabilities", address, connector?.id],
    queryFn: async (): Promise<WalletCapabilities> => {
      if (!address || !client) return EMPTY_CAPABILITIES;

      // Quick check: known Base Account connectors
      const isKnownBaseConnector =
        connector?.id
          ? BASE_ACCOUNT_CONNECTOR_IDS.has(connector.id)
          : false;

      const provider = client.transport?.value?.transport
        ?.source as EIP1193Provider | undefined;
      if (!provider) {
        // No raw provider available — use connector heuristic
        return {
          ...EMPTY_CAPABILITIES,
          baseAccount: isKnownBaseConnector,
          universalAddress: address,
        };
      }

      try {
        return await detectCapabilities(provider, address);
      } catch {
        return {
          ...EMPTY_CAPABILITIES,
          baseAccount: isKnownBaseConnector,
          universalAddress: address,
        };
      }
    },
    enabled: isConnected && !!address,
    staleTime: 5 * 60 * 1000, // Re-check every 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const state = useMemo<CapabilitiesState>(() => {
    if (!isConnected) {
      return { capabilities: EMPTY_CAPABILITIES, status: "idle" };
    }

    const caps = capabilities ?? EMPTY_CAPABILITIES;

    if (queryStatus === "pending") {
      return { capabilities: EMPTY_CAPABILITIES, status: "detecting" };
    }

    if (caps.baseAccount || caps.subAccountSupport || caps.sendCallsSupport) {
      return { capabilities: caps, status: "detected" };
    }

    return { capabilities: caps, status: "not-detected" };
  }, [capabilities, isConnected, queryStatus]);

  return state;
}
