"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useReadContract } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUnits } from "viem";
import {
  Wallet,
  Shield,
  Lock,
  ExternalLink,
  AlertTriangle,
  Loader2,
  SwitchCamera,
  Bug,
} from "lucide-react";
import { CURRENT_CHAIN } from "@/lib/contracts/contracts";

// Minimal ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

/**
 * Connected Wallet Information Card.
 * Shows wallet address, network status, USDC balance, and vault actions.
 * Forces reads against CURRENT_CHAIN (Base Sepolia) regardless of wallet network.
 */
export function WalletInfoCard({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { switchChain } = useSwitchChain();

  const EXPECTED_CHAIN_ID = CURRENT_CHAIN.chainId;
  const isWrongNetwork = isConnected && connectedChainId !== EXPECTED_CHAIN_ID;

  const {
    data: usdcBalanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    error: balanceError,
    isFetched: isBalanceFetched,
  } = useReadContract({
    address: CURRENT_CHAIN.usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: EXPECTED_CHAIN_ID,
    query: {
      enabled: !!address && !isWrongNetwork,
    },
  });

  const usdcBalance = usdcBalanceData
    ? Number(formatUnits(usdcBalanceData as bigint, 6))
    : 0;

  if (!isConnected || !address) {
    return null;
  }

  const formattedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const explorerUrl = `${CURRENT_CHAIN.explorerUrl}/address/${address}`;

  return (
    <Card
      className={cn(
        "border-white/10 bg-black/40 backdrop-blur-xl",
        className,
      )}
    >
      <CardContent className="p-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-600/10">
              <Wallet className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">Connected Wallet</p>
              <p className="text-sm font-semibold text-white font-mono tabular-nums">
                {formattedAddress}
              </p>
            </div>
          </div>

          {/* Network badge */}
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium",
              "border transition-all",
              isWrongNetwork
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isWrongNetwork ? "bg-red-400" : "bg-emerald-400",
              )}
            />
            {isWrongNetwork ? `Wrong network (ID: ${connectedChainId})` : CURRENT_CHAIN.name}
            <ExternalLink className="h-2.5 w-2.5 opacity-50" />
          </a>
        </div>

        {/* ── Wrong Network Banner ── */}
        {isWrongNetwork && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 mb-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-300">
                  Wrong Network
                </p>
                <p className="text-xs text-red-400/70 mt-1">
                  Your wallet is connected to chain ID{" "}
                  <span className="font-mono">{connectedChainId}</span>. Switch to{" "}
                  <span className="font-mono">{CURRENT_CHAIN.name}</span> (ID:{" "}
                  <span className="font-mono">{EXPECTED_CHAIN_ID}</span>) to
                  interact with the vault.
                </p>
                <Button
                  onClick={() => switchChain({ chainId: EXPECTED_CHAIN_ID })}
                  size="sm"
                  className="mt-3 h-8 text-xs bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/20"
                >
                  <SwitchCamera className="h-3.5 w-3.5 mr-1.5" />
                  Switch to {CURRENT_CHAIN.name}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── USDC Balance ── */}
        <div className="rounded-lg bg-white/5 border border-white/5 p-3 mb-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 mb-0.5">
            Wallet USDC Balance
          </p>

          {isWrongNetwork ? (
            <p className="text-sm text-red-400/70">
              Switch network to read balance
            </p>
          ) : isBalanceLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
              <span className="text-sm text-gray-500">Reading balance...</span>
            </div>
          ) : isBalanceError ? (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400 font-medium">
                  Balance read failed
                </p>
                <p className="text-[10px] text-red-400/70 mt-0.5 break-words">
                  {balanceError?.message?.includes("network")
                    ? "Network error. Make sure your RPC is reachable."
                    : balanceError?.message?.includes("execution reverted")
                      ? "The USDC contract did not respond as expected."
                      : balanceError?.message || "An unexpected error occurred."}
                </p>
              </div>
            </div>
          ) : isBalanceFetched && usdcBalance === 0 ? (
            <div>
              <p className="text-lg font-semibold text-gray-500 tabular-nums">
                0.00 USDC
              </p>
              <p className="text-[10px] text-gray-600 mt-1">
                You may need Base Sepolia test USDC.
              </p>
            </div>
          ) : (
            <p className="text-lg font-semibold text-white tabular-nums">
              {usdcBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USDC
            </p>
          )}
        </div>

        {/* ── Action Hints ── */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-2.5">
            <Shield className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <p className="text-[10px] text-indigo-300/70 leading-relaxed">
              Deposit USDC to activate vault
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/10 p-2.5">
            <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <p className="text-[10px] text-amber-300/70 leading-relaxed">
              Lock capital to protect savings
            </p>
          </div>
        </div>

        {/* ── Status Row ── */}
        <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isWrongNetwork ? "bg-red-400" : "bg-emerald-400",
              )}
            />
            <span className="text-[10px] text-gray-500">
              {isWrongNetwork
                ? "Unsupported network"
                : `Connected to ${CURRENT_CHAIN.name}`}
            </span>
          </div>
          <span className="text-gray-600">·</span>
          <span className="text-[10px] text-gray-500 font-mono">
            v0.5 onchain
          </span>
        </div>

        {/* ── Debug Info (development only) ── */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-3 border-t border-white/5 pt-3">
            <summary className="flex items-center gap-1.5 text-[10px] text-gray-600 cursor-pointer hover:text-gray-500">
              <Bug className="h-3 w-3" />
              Debug — wallet & chain info
            </summary>
            <pre className="mt-2 text-[10px] text-gray-600 font-mono leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(
                {
                  connectedAddress: address,
                  connectedChainId,
                  expectedChainId: EXPECTED_CHAIN_ID,
                  usdcContractAddress: CURRENT_CHAIN.usdcAddress,
                  vaultContractAddress: CURRENT_CHAIN.vaultAddress,
                  rawBalance: usdcBalanceData?.toString() ?? "undefined (not fetched / error)",
                  isWrongNetwork,
                  balanceLoading: isBalanceLoading,
                  balanceError: isBalanceError,
                  balanceFetched: isBalanceFetched,
                },
                null,
                2,
              )}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
