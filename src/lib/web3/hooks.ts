"use client";

import { useCallback } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { parseUnits, formatUnits } from "viem";
import { VAULT_ABI, CURRENT_CHAIN } from "@/lib/contracts/contracts";

/**
 * Vault contract address — defaults to zero address until deployed.
 */
const VAULT_ADDRESS = CURRENT_CHAIN.vaultAddress;

/**
 * React Query key prefix for vault-related queries.
 * Used to invalidate all vault queries after successful writes.
 */
const VAULT_QUERY_KEY = "vault";

/**
 * Hook: Check if the vault contract is deployed and usable.
 */
export function useVaultStatus() {
  const { data: totalDeposited, isLoading } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getVaultSummary",
    args: [VAULT_ADDRESS], // placeholder — will be user's address
    query: {
      enabled: VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000",
    },
  });

  const isDeployed = VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000";
  return { isDeployed, isLoading };
}

/**
 * Base hook for contract writes — provides consistent write UX + query invalidation.
 */
function useVaultWrite<TArgs extends unknown[]>(
  functionName: string,
) {
  const queryClient = useQueryClient();
  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const execute = useCallback(
    async (args: TArgs) => {
      if (VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") return;
      writeContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName,
        args: args as unknown[],
      });
    },
    [writeContract, functionName],
  );

  // Invalidate vault queries on successful confirmation
  if (isConfirmed) {
    queryClient.invalidateQueries({ queryKey: [VAULT_QUERY_KEY] });
  }

  return { execute, hash, isPending, isConfirming, isConfirmed, error };
}

/**
 * Hook: Deposit USDC into the ProtectedVault contract.
 * User must have approved the vault contract to spend their USDC.
 */
export function useVaultDeposit() {
  const { address } = useAccount();
  const { execute, hash, isPending, isConfirming, isConfirmed, error } =
    useVaultWrite<[bigint]>("deposit");

  const deposit = useCallback(
    async (amount: number) => {
      if (!address) return;
      const parsed = parseUnits(amount.toString(), 6); // USDC has 6 decimals
      await execute([parsed]);
    },
    [address, execute],
  );

  return { deposit, hash, isPending, isConfirming, isConfirmed, error };
}

/**
 * Hook: Create a new vault lock.
 */
export function useCreateLock() {
  const { address } = useAccount();
  const { execute, hash, isPending, isConfirming, isConfirmed, error } =
    useVaultWrite<[bigint, bigint]>("createLock");

  const createLock = useCallback(
    async (amount: number, durationSeconds: number) => {
      if (!address) return;
      const parsed = parseUnits(amount.toString(), 6);
      await execute([parsed, BigInt(durationSeconds)]);
    },
    [address, execute],
  );

  return { createLock, hash, isPending, isConfirming, isConfirmed, error };
}

/**
 * Hook: Release a lock after its unlock time has passed.
 */
export function useReleaseLock() {
  const { address } = useAccount();
  const { execute, hash, isPending, isConfirming, isConfirmed, error } =
    useVaultWrite<[bigint]>("releaseLock");

  const releaseLock = useCallback(
    async (lockId: number) => {
      if (!address) return;
      await execute([BigInt(lockId)]);
    },
    [address, execute],
  );

  return { releaseLock, hash, isPending, isConfirming, isConfirmed, error };
}

/**
 * Hook: Withdraw from a specific released lock.
 */
export function useWithdrawLock() {
  const { address } = useAccount();
  const { execute, hash, isPending, isConfirming, isConfirmed, error } =
    useVaultWrite<[bigint]>("withdrawLock");

  const withdrawLock = useCallback(
    async (lockId: number) => {
      if (!address) return;
      await execute([BigInt(lockId)]);
    },
    [address, execute],
  );

  return { withdrawLock, hash, isPending, isConfirming, isConfirmed, error };
}

/**
 * Hook: Withdraw all unlocked balance from the vault.
 */
export function useWithdrawUnlocked() {
  const { address } = useAccount();
  const { execute, hash, isPending, isConfirming, isConfirmed, error } =
    useVaultWrite<[]>("withdrawUnlocked");

  const withdrawUnlocked = useCallback(async () => {
    if (!address) return;
    await execute([]);
  }, [address, execute]);

  return {
    withdrawUnlocked,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

/**
 * Hook: Read vault summary from the contract.
 * Uses stale-while-revalidate: prefers cached data over hard errors.
 */
export function useVaultSummary(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const addr = userAddress ?? address;

  const { data, isLoading, refetch, isStale } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getVaultSummary",
    args: addr ? [addr] : undefined,
    query: {
      enabled: !!addr && VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000",
      // Return stale cached data while refetching in background
      staleTime: 30_000,        // 30s — data considered fresh
      gcTime: 5 * 60 * 1000,    // 5min — keep in cache when unused
      refetchInterval: 60_000,  // auto-refresh every 60s for lock countdowns
    },
  });

  const summary = data as readonly [bigint, bigint, bigint, bigint] | undefined;

  if (!summary) {
    return {
      totalDeposited: 0,
      totalLocked: 0,
      totalWithdrawn: 0,
      activeLockCount: 0,
      isLoading,
      refetch,
      isStale,
    };
  }

  return {
    totalDeposited: Number(formatUnits(summary[0], 6)),
    totalLocked: Number(formatUnits(summary[1], 6)),
    totalWithdrawn: Number(formatUnits(summary[2], 6)),
    activeLockCount: Number(summary[3]),
    isLoading,
    refetch,
    isStale,
  };
}

/**
 * Hook: Read all vault locks from the contract.
 * Uses stale-while-revalidate: prefers cached data over hard errors.
 */
export function useVaultLocks(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const addr = userAddress ?? address;

  const { data, isLoading, refetch, isStale } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getAllLocks",
    args: addr ? [addr] : undefined,
    query: {
      enabled: !!addr && VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000",
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      refetchInterval: 60_000,
    },
  });

  if (!data) {
    return { locks: [], isLoading, refetch, isStale };
  }

  const locks = (data as { amount: bigint; createdAt: bigint; unlockAt: bigint; withdrawn: boolean }[]).map(
    (lock, index) => ({
      id: index,
      amount: Number(formatUnits(lock.amount, 6)),
      createdAt: Number(lock.createdAt) * 1000,
      unlockAt: Number(lock.unlockAt) * 1000,
      withdrawn: lock.withdrawn,
    }),
  );

  return { locks, isLoading, refetch, isStale };
}
