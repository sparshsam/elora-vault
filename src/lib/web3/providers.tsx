"use client";

import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "./config";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

/**
 * Elora Web3 Provider — wraps the app with Wagmi, React Query, and RainbowKit.
 * Coinbase Smart Wallet is supported natively via RainbowKit's coinbaseWallet
 * connector. @base-org/account SDK is available for programmatic account
 * operations if needed.
 *
 * Uses a restrained dark theme consistent with Elora's calm, premium aesthetic.
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#4f46e5",
            accentColorForeground: "#fff",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
          modalSize="compact"
          coolMode
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
