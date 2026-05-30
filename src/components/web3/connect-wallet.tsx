"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * Elora-styled wallet connection button.
 * Calm, restrained — no casino energy.
 *
 * Handles all wallet states:
 * - disconnected: "Connect Wallet" button
 * - connecting: spinner while connecting
 * - reconnecting: detected via useAccount
 * - connected: network badge + account name
 * - wrong network: switch prompt
 */
export function ConnectWalletButton({
  className,
}: {
  className?: string;
}) {
  const { isConnecting, isReconnecting } = useAccount();

  // Show spinner while connecting or reconnecting
  if (isConnecting || isReconnecting) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium",
          "bg-white/5 text-gray-400 border border-white/10",
          className,
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {isReconnecting ? "Reconnecting..." : "Connecting..."}
      </div>
    );
  }

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                      "bg-indigo-600 text-white hover:bg-indigo-500",
                      "border border-indigo-500/20",
                      className,
                    )}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
                      />
                    </svg>
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                      "bg-red-600/10 text-red-400 hover:bg-red-600/20",
                      "border border-red-500/20",
                      className,
                    )}
                  >
                    Wrong network — switch to Base
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  {/* Network indicator */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                      "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10",
                      "border border-white/5",
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {chain.name}
                  </button>

                  {/* Account */}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                      "bg-white/5 text-gray-300 hover:text-white hover:bg-white/10",
                      "border border-white/5",
                      "tabular-nums",
                    )}
                  >
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
