/**
 * Base Account Client — isolated SDK wrapper for Elora's Base Account exploration.
 *
 * This module is NOT wired into production wallet flows.
 * It exists only for the Base Account Lab at /settings/base-account-lab.
 *
 * Uses Base Sepolia (chain ID 84532).
 *
 * ── Why Sub Accounts matter for Elora ─────────────────
 *
 * Sub Accounts (ERC-7895) are app-specific signing contexts derived
 * from a user's Universal Base Account. They are significant for
 * Elora because:
 *
 * 1. Capital-boundary clarity
 *    Protected capital can live inside an Elora-specific sub-account,
 *    creating a clean separation between the user's personal wallet
 *    and their Elora capital environment. The sub-account holds only
 *    what the user has chosen to protect within Elora.
 *
 * 2. Reduced wallet friction
 *    Sub-accounts support session keys and pre-approved execution,
 *    meaning routine operations (deposit → protect) can happen
 *    without repeated wallet prompts. This dramatically improves the
 *    calmness of the protection flow.
 *
 * 3. Preserved self-custody
 *    The sub-account is derived from the user's Universal Account.
 *    The user always retains the root key. They can exit at any time
 *    by withdrawing from the sub-account back to their universal address.
 *
 * 4. Paymaster-ready architecture
 *    Sub-account execution pairs naturally with paymaster sponsorship
 *    (ERC-7677). Protection flows can be gasless: the user signs,
 *    Elora's paymaster covers the gas.
 *
 * ── How protected capital could live in sub-accounts ─
 *
 * Future flow (not implemented):
 *   1. User connects their Universal Base Account
 *   2. User deposits USDC from universal → sub-account
 *   3. Sub-account calls createLock() on ProtectedVault
 *   4. Protected capital is tracked within the sub-account context
 *   5. On release, capital returns to the sub-account
 *   6. User withdraws from sub-account → universal → external wallet
 *
 * ── Why capability detection matters before migration ─
 *
 * Before any production migration to Base Account flows, we must
 * confirm via EIP-5792 wallet_getCapabilities that the connected
 * provider supports:
 *
 * - atomic batching (wallet_sendCalls) — for bundling multi-step ops
 * - paymasterService — for sponsored gas on protection flows
 * - unstable_addSubAccount — for sub-account creation and execution
 *
 * The use-wallet-capabilities hook in src/hooks/ provides this
 * detection layer. No migration step should proceed without
 * capability confirmation.
 * See: src/hooks/use-wallet-capabilities.ts
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
