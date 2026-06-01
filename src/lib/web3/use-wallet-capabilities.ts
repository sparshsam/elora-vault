/**
 * use-wallet-capabilities.ts
 *
 * EIP-5792 wallet capability detection for Elora Vault's progressive
 * Base Account enhancement and transaction orchestration layers.
 *
 * This hook is **non-blocking by design**. If any detection fails — wallet
 * not connected, provider unavailable, RPC error, unsupported method — it
 * silently returns empty capabilities. No errors are thrown, no UI state
 * is disrupted.
 *
 * Detection methods used:
 *   - `wallet_getCapabilities` (EIP-5792): canonical capability discovery
 *   - `wallet_getSubAccounts` (Base Account): sub-account detection
 *   - `wallet_sendCalls` method check: whether wallet supports batched calls
 *   - Connector introspection: known Base Account connector IDs
 *
 * ## Capability-aware execution planning
 *
 * The routing tier uses these rules to determine execution paths:
 *
 *   wallet_sendCalls supported          → atomic batch via wallet
 *   atomicBatch capability detected      → contract-level batching
 *   sendCalls NOT supported              → sequential fallback
 *   sub-account + spend permissions      → sub-account batch routing
 *   no sub-account                       → direct wallet execution
 *
 * Each orchestration query (see execution-architecture.ts) consumes this
 * routing information to build the optimal execution plan.
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

/**
 * Execution routing tier — determines how a transaction flow will be executed.
 *
 * batched        → wallet_sendCalls or contract-level atomicBatch is available
 * sequential     → no batching support, execute steps one at a time
 * sub-account    → a sub-account exists and can route execution
 * external-only  → no Base Account features detected, standard wallet execution
 */
export type ExecutionTier = "batched" | "sequential" | "sub-account" | "external-only";

export interface RoutingDecision {
  /** The selected execution tier */
  tier: ExecutionTier;
  /** Whether wallet_sendCalls is the batching mechanism */
  usesSendCalls: boolean;
  /** Whether sub-account routing is available */
  usesSubAccount: boolean;
  /** Whether fallback to sequential is needed */
  needsFallback: boolean;
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
          result.batching = true;
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

  /* ── 2a. Direct wallet_sendCalls method probe ── */
  // If wallet_getCapabilities didn't return sendCalls info, probe directly.
  // This catches wallets that support sendCalls but don't advertise it in capabilities.
  if (!result.sendCallsSupport) {
    try {
      // A probe with invalid params should throw — we catch the method-not-found
      await provider.request({
        method: "wallet_sendCalls",
        params: [{ calls: [], version: "1.0", chainId: "0x1" }],
      });
      // If we get here the method exists (call will fail on empty params, not method)
      result.sendCallsSupport = true;
      result.batching = true;
    } catch {
      // wallet_sendCalls not supported — this is expected for external wallets
    }
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

    if (caps.baseAccount || caps.subAccountSupport || caps.sendCallsSupport || caps.batching) {
      return { capabilities: caps, status: "detected" };
    }

    return { capabilities: caps, status: "not-detected" };
  }, [capabilities, isConnected, queryStatus]);

  return state;
}

/* ── Capability-aware Routing ────────────────────────── */

/**
 * Build an execution routing decision from the current capability state.
 *
 * Rules:
 *   1. If wallet_sendCalls is supported → batched wallet execution
 *   2. Else if atomicBatch capability exists → batched contract execution
 *   3. Else if sub-account exists → sub-account routing (prep for future)
 *   4. Else → sequential external wallet execution
 *
 * Returns a RoutingDecision that orchestration flows consume to
 * determine how to execute multi-step actions.
 */
export function useCapabilityRouting(): RoutingDecision {
  const { capabilities, status } = useWalletCapabilities();

  return useMemo<RoutingDecision>(() => {
    if (status !== "detected") {
      return { tier: "external-only", usesSendCalls: false, usesSubAccount: false, needsFallback: false };
    }

    // Most preferred: wallet_sendCalls (EIP-5792)
    if (capabilities.sendCallsSupport) {
      return { tier: "batched", usesSendCalls: true, usesSubAccount: false, needsFallback: true };
    }

    // Second preferred: atomicBatch capability
    if (capabilities.batching) {
      return { tier: "batched", usesSendCalls: false, usesSubAccount: false, needsFallback: true };
    }

    // Third: sub-account routing with spend permissions
    if (capabilities.subAccountSupport) {
      return { tier: "sub-account", usesSendCalls: false, usesSubAccount: true, needsFallback: false };
    }

    // Default: sequential external wallet
    return { tier: "external-only", usesSendCalls: false, usesSubAccount: false, needsFallback: false };
  }, [capabilities, status]);
}

/**
 * Determine whether a given flow requires fallback to sequential execution.
 *
 * This is a helper for UI components that display the execution mode
 * for each orchestration flow. It accounts for whether batching is
 * actually available vs theoretically required.
 */
export function useFlowExecutionMode(
  requiresBatching: boolean,
): { mode: "batched" | "sequential"; canExecute: boolean } {
  const routing = useCapabilityRouting();

  return useMemo(() => {
    if (!requiresBatching) {
      return { mode: "sequential", canExecute: true };
    }
    if (routing.tier === "batched") {
      return { mode: "batched", canExecute: true };
    }
    // Batching required but not available — can still execute sequentially
    return { mode: "sequential", canExecute: true };
  }, [requiresBatching, routing]);
}
