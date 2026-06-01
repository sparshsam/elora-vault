/**
 * Base Account Client — isolated SDK wrapper for Elora's Base Account exploration.
 *
 * This module is NOT wired into production wallet flows.
 * It exists only for the Base Account Lab at /settings/base-account-lab.
 *
 * Uses Base Sepolia (chain ID 84532).
 */

import { createBaseAccountSDK } from "@base-org/account";
import type { ProviderInterface } from "@base-org/account";
import type { Address } from "viem";

/* ── Constants ───────────────────────────────────────── */

const BASE_SEPOLIA_CHAIN_ID = 84532;

/* ── Types ───────────────────────────────────────────── */

export interface BaseAccountState {
  sdkInitialized: boolean;
  providerReady: boolean;
  universalAddress: Address | null;
  subAccountAddress: Address | null;
  error: string | null;
}

export type LabStatus =
  | "idle"
  | "sdk-ready"
  | "connected"
  | "universal-detected"
  | "sub-account-found"
  | "sub-account-created"
  | "error";

export interface LabStep {
  status: LabStatus;
  message: string;
  timestamp: number;
}

/* ── SDK Instance (singleton, lazy) ──────────────────── */

let _sdk: ReturnType<typeof createBaseAccountSDK> | null = null;
let _provider: ProviderInterface | null = null;

/**
 * Initialize the Base Account SDK.
 * Safe to call multiple times — returns existing instance.
 */
export function initBaseAccountSDK() {
  if (_sdk) return _sdk;

  _sdk = createBaseAccountSDK({
    appName: "Elora Vault",
    appLogoUrl: null,
    appChainIds: [BASE_SEPOLIA_CHAIN_ID],
    preference: {
      telemetry: false,
    },
    subAccounts: {
      creation: "manual",
      defaultAccount: "universal",
    },
  });

  return _sdk;
}

/**
 * Get the EIP-1193 provider. Initializes SDK if needed.
 */
export function getProvider(): ProviderInterface {
  if (_provider) return _provider;
  const sdk = initBaseAccountSDK();
  _provider = sdk.getProvider();
  return _provider;
}

/**
 * Connect to Base Account. Returns the connected address(es).
 */
export async function connectBaseAccount(): Promise<Address[]> {
  const provider = getProvider();
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as Address[];
  return accounts;
}

/**
 * Get the universal account address.
 * Must call connectBaseAccount() first.
 */
export async function getUniversalAccount(): Promise<Address | null> {
  try {
    const provider = getProvider();
    const accounts = (await provider.request({
      method: "eth_accounts",
    })) as Address[];
    return accounts.length > 0 ? accounts[0] : null;
  } catch {
    return null;
  }
}

/**
 * Get all sub-accounts for the current domain.
 */
export async function getSubAccounts(): Promise<Address[]> {
  try {
    const provider = getProvider();
    const accounts = (await provider.request({
      method: "wallet_getSubAccounts",
    })) as Address[];
    return accounts;
  } catch {
    return [];
  }
}

/**
 * Create a sub-account for the current domain.
 */
export async function createSubAccount(): Promise<Address | null> {
  try {
    const sdk = initBaseAccountSDK();
    const result = await sdk.subAccount.create({
      type: "create",
      keys: [],
    });
    return result?.address ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the existing sub-account via the SDK (returns structured SubAccount object).
 */
export async function getExistingSubAccount() {
  try {
    const sdk = initBaseAccountSDK();
    const result = await sdk.subAccount.get();
    return result;
  } catch {
    return null;
  }
}

/**
 * Disconnect the provider.
 */
export async function disconnectProvider() {
  try {
    if (_provider) {
      await _provider.disconnect();
    }
  } catch {
    // silently fail
  } finally {
    _provider = null;
    _sdk = null;
  }
}

/**
 * Reset the SDK state (useful for testing / lab page).
 */
export function resetSDK() {
  _provider = null;
  _sdk = null;
}

/* ── Helper: create a log entry ──────────────────────── */

export function logStep(
  status: LabStatus,
  message: string,
): LabStep {
  return { status, message, timestamp: Date.now() };
}
