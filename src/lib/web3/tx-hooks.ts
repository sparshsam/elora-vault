"use client";

import { useCallback } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseUnits, formatUnits } from "viem";
import { USDC_ABI } from "@/lib/contracts/usdc-abi";
import { CURRENT_CHAIN, VAULT_ABI } from "@/lib/contracts/contracts";

/* ── Types ────────────────────────────────────────────── */

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "error";

export interface TxState {
  status: TxStatus;
  hash: `0x${string}` | undefined;
  error: Error | null;
}

/* ── Constants ───────────────────────────────────────── */

const USDC_ADDRESS = CURRENT_CHAIN.usdcAddress;
const VAULT_ADDRESS = CURRENT_CHAIN.vaultAddress;
const USDC_DECIMALS = 6;

/* ── Helpers ─────────────────────────────────────────── */

/** Format a BigInt USDC amount (6 decimals) to a number. */
export function formatUSDC(value: bigint | undefined): number {
  if (value == null) return 0;
  return Number(formatUnits(value, USDC_DECIMALS));
}

/** Parse a number to BigInt USDC (6 decimals). */
export function parseUSDC(amount: number): bigint {
  return parseUnits(amount.toString(), USDC_DECIMALS);
}

/* ── Read Hooks ──────────────────────────────────────── */

/**
 * Read the user's USDC token balance.
 */
export function useUSDCBalance() {
  const { address } = useAccount();
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CURRENT_CHAIN.chainId,
    query: {
      enabled: !!address,
      refetchInterval: 15_000,
    },
  });

  return {
    balance: formatUSDC(data as bigint | undefined),
    raw: data as bigint | undefined,
    isLoading,
    refetch,
  };
}

/**
 * Read how much USDC the vault contract is allowed to spend from the user.
 */
export function useUSDCAllowance() {
  const { address } = useAccount();
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address && VAULT_ADDRESS ? [address, VAULT_ADDRESS] : undefined,
    chainId: CURRENT_CHAIN.chainId,
    query: {
      enabled: !!address && VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000",
      refetchInterval: 10_000,
    },
  });

  return {
    allowance: formatUSDC(data as bigint | undefined),
    rawAllowance: data as bigint | undefined,
    isLoading,
    refetch,
  };
}

/* ── Write Hooks ─────────────────────────────────────── */

/**
 * Approve the vault contract to spend the user's USDC.
 * Returns execute function + transaction state.
 */
export function useUSDCApprove() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash, chainId: CURRENT_CHAIN.chainId });

  const execute = useCallback(
    async (amount: number) => {
      const parsed = parseUSDC(amount);
      writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [VAULT_ADDRESS, parsed],
        chainId: CURRENT_CHAIN.chainId,
      });
    },
    [writeContract],
  );

  // Invalidate allowance queries after confirmation
  if (isConfirmed) {
    queryClient.invalidateQueries({ queryKey: ["readContract"] });
  }

  return {
    approve: execute,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Deposit USDC into the ProtectedVault contract.
 * User must have approved the vault contract first (see useUSDCApprove).
 */
export function useVaultDeposit() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash, chainId: CURRENT_CHAIN.chainId });

  const execute = useCallback(
    async (amount: number) => {
      const parsed = parseUSDC(amount);
      writeContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [parsed],
        chainId: CURRENT_CHAIN.chainId,
      });
    },
    [writeContract],
  );

  if (isConfirmed) {
    queryClient.invalidateQueries({ queryKey: ["readContract"] });
  }

  return {
    deposit: execute,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Create a new vault lock (horizon).
 */
export function useCreateLock() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash, chainId: CURRENT_CHAIN.chainId });

  const execute = useCallback(
    async (amount: number, durationSeconds: number) => {
      const parsed = parseUSDC(amount);
      writeContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "createLock",
        args: [parsed, BigInt(durationSeconds)],
        chainId: CURRENT_CHAIN.chainId,
      });
    },
    [writeContract],
  );

  if (isConfirmed) {
    queryClient.invalidateQueries({ queryKey: ["readContract"] });
  }

  return {
    createLock: execute,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Release a lock after its unlock time has passed.
 */
export function useReleaseLock() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash, chainId: CURRENT_CHAIN.chainId });

  const execute = useCallback(
    async (lockId: number) => {
      writeContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "releaseLock",
        args: [BigInt(lockId)],
        chainId: CURRENT_CHAIN.chainId,
      });
    },
    [writeContract],
  );

  if (isConfirmed) {
    queryClient.invalidateQueries({ queryKey: ["readContract"] });
  }

  return {
    releaseLock: execute,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Withdraw all unlocked balance from the vault.
 */
export function useWithdrawUnlocked() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash, chainId: CURRENT_CHAIN.chainId });

  const execute = useCallback(async () => {
    writeContract({
      address: VAULT_ADDRESS,
      abi: VAULT_ABI,
      functionName: "withdrawUnlocked",
      args: [],
      chainId: CURRENT_CHAIN.chainId,
    });
  }, [writeContract]);

  if (isConfirmed) {
    queryClient.invalidateQueries({ queryKey: ["readContract"] });
  }

  return {
    withdrawUnlocked: execute,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}
