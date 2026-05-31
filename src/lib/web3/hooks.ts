"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { VAULT_ABI, CURRENT_CHAIN } from "@/lib/contracts/contracts";

/**
 * Vault contract address — defaults to zero address until deployed.
 */
const VAULT_ADDRESS = CURRENT_CHAIN.vaultAddress;

/** Safe formatUnits wrapper — returns 0 for undefined/null values */
function safeFormat(value: bigint | undefined, decimals: number): number {
  if (value == null) return 0;
  return Number(formatUnits(value, decimals));
}

/**
 * Hook: Read vault summary from the contract.
 * Uses stale-while-revalidate: prefers cached data over hard errors.
 */
export function useVaultSummary(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const addr = userAddress ?? address;

  const { data, isLoading, refetch, isStale, error } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getVaultSummary",
    args: addr ? [addr] : undefined,
    chainId: CURRENT_CHAIN.chainId,
    query: {
      enabled: !!addr && VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000",
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      refetchInterval: 60_000,
    },
  });

  const raw = data as
    | { totalDeposited: bigint; totalLocked: bigint; totalWithdrawn: bigint; activeLockCount: bigint }
    | undefined;

  if (!raw) {
    return {
      totalDeposited: 0,
      totalLocked: 0,
      totalWithdrawn: 0,
      activeLockCount: 0,
      isLoading,
      refetch,
      isStale,
      readError: error,
    };
  }

  return {
    totalDeposited: safeFormat(raw.totalDeposited, 6),
    totalLocked: safeFormat(raw.totalLocked, 6),
    totalWithdrawn: safeFormat(raw.totalWithdrawn, 6),
    activeLockCount: Number(raw.activeLockCount ?? BigInt(0)),
    isLoading,
    refetch,
    isStale,
    readError: error,
  };
}

/**
 * Hook: Read all vault locks from the contract.
 * Uses stale-while-revalidate: prefers cached data over hard errors.
 */
export function useVaultLocks(userAddress?: `0x${string}`) {
  const { address } = useAccount();
  const addr = userAddress ?? address;

  const { data, isLoading, refetch, isStale, error } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getAllLocks",
    args: addr ? [addr] : undefined,
    chainId: CURRENT_CHAIN.chainId,
    query: {
      enabled: !!addr && VAULT_ADDRESS !== "0x0000000000000000000000000000000000000000",
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      refetchInterval: 60_000,
    },
  });

  if (!data) {
    return { locks: [], isLoading, refetch, isStale, readError: error };
  }

  const locks = (data as { amount: bigint; createdAt: bigint; unlockAt: bigint; withdrawn: boolean }[]).map(
    (lock, index) => ({
      id: index,
      amount: safeFormat(lock.amount, 6),
      createdAt: Number(lock.createdAt) * 1000,
      unlockAt: Number(lock.unlockAt) * 1000,
      withdrawn: lock.withdrawn,
    }),
  );

  return { locks, isLoading, refetch, isStale, readError: error };
}
