"use client";

import { http, createStorage, cookieStorage } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

/**
 * Wagmi + RainbowKit configuration for Base network.
 * Supports WalletConnect, Coinbase Wallet, MetaMask, and Rainbow.
 */
export const wagmiConfig = getDefaultConfig({
  appName: "Elora Vault",
  projectId,
  chains: [base, baseSepolia] as const,
  transports: {
    [base.id]: http(
      process.env.NEXT_PUBLIC_BASE_RPC_URL ?? "https://mainnet.base.org",
    ),
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ??
        "https://sepolia.base.org",
    ),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
