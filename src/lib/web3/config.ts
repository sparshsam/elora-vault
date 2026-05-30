"use client";

import { http, createStorage, cookieStorage, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

/**
 * Explicit wallet connectors for RainbowKit.
 * - metaMaskWallet uses its own detection, not shared injected provider
 * - coinbaseWallet uses Coinbase SDK
 * - walletConnectWallet for WalletConnect deep links
 * - rainbowWallet for Rainbow browser extension
 *
 * This ensures MetaMask is always listed even when Coinbase Wallet
 * extension is also installed (both inject window.ethereum).
 */
const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, coinbaseWallet, rainbowWallet, walletConnectWallet],
    },
  ],
  { appName: "Elora Vault", projectId },
);

/**
 * Wagmi + RainbowKit configuration for Base network.
 * Supports MetaMask, Coinbase Wallet, WalletConnect, and Rainbow.
 */
export const wagmiConfig = createConfig({
  connectors,
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
