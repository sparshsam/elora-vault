"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { CURRENT_CHAIN } from "@/lib/contracts/contracts";

export interface NetworkCheck {
  isCorrectChain: boolean;
  chainName: string;
  expectedChainName: string;
  switchChain: (() => void) | null;
  isSwitching: boolean;
}

/**
 * Check whether the connected wallet is on the expected chain (Base Sepolia).
 * Returns the chain state and a switchChain function.
 *
 * Usage in modals:
 *   const { isCorrectChain, chainName, expectedChainName, switchChain, isSwitching } = useNetworkCheck();
 *
 *   if (!isCorrectChain) {
 *     return <WrongNetworkBanner ... />;
 *   }
 */
export function useNetworkCheck(): NetworkCheck {
  const { chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  const isCorrectChain = chainId === CURRENT_CHAIN.chainId;

  return {
    isCorrectChain: chainId ? isCorrectChain : true, // not connected = no error
    chainName: chainId ? `Chain ID ${chainId}` : "Not connected",
    expectedChainName: CURRENT_CHAIN.name,
    switchChain: !isCorrectChain
      ? () => switchChain({ chainId: CURRENT_CHAIN.chainId })
      : null,
    isSwitching: isPending,
  };
}
