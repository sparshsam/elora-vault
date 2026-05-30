"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUnits } from "viem";
import { useVaultDeposit } from "@/lib/web3/hooks";
import { CURRENT_CHAIN } from "@/lib/contracts/contracts";
import { ArrowDownToLine, ExternalLink, CheckCircle, Loader2, AlertTriangle, X } from "lucide-react";

// Minimal ERC20 ABI
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
 * Vault Deposit Form.
 * User enters amount, approves USDC, and deposits into the vault.
 */
export function VaultDepositForm({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const { data: usdcBalanceData } = useReadContract({
    address: CURRENT_CHAIN.usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const usdcFormatted = usdcBalanceData
    ? Number(formatUnits(usdcBalanceData as bigint, 6))
    : 0;
  const { deposit, isPending, isConfirming, isConfirmed, hash, error } =
    useVaultDeposit();

  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"idle" | "signing" | "confirming" | "done">("idle");
  const [showSuccess, setShowSuccess] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const isValid = parsedAmount > 0 && parsedAmount <= usdcFormatted;

  const handleDeposit = async () => {
    if (!isValid) return;
    setStep("signing");
    try {
      await deposit(parsedAmount);
      setStep("confirming");
    } catch {
      setStep("idle");
    }
  };

  // Track confirmation + invalidate
  if (isConfirmed && step === "confirming") {
    setStep("done");
    setShowSuccess(true);
    queryClient.invalidateQueries({ queryKey: ["vault"] });
  }

  // Reset on error
  if (error && step !== "idle") {
    setStep("idle");
    setShowSuccess(false);
  }

  // Percent presets
  const presets = [0.25, 0.5, 0.75, 1];

  return (
    <Card className={cn("border-white/10 bg-black/40 backdrop-blur-xl", className)}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ArrowDownToLine className="h-4 w-4 text-indigo-400" />
          Deposit USDC
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <p className="text-xs text-gray-500">Connect your wallet to deposit.</p>
        ) : (
          <>
            {/* USDC Balance */}
            <div className="rounded-lg bg-white/5 p-3 border border-white/5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                Wallet USDC Balance
              </p>
              <p className="text-lg font-semibold text-white tabular-nums mt-0.5">
                {usdcFormatted.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USDC
              </p>
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-xs font-medium text-gray-400 mb-2 block">
                Amount to Deposit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  max={usdcFormatted}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={step !== "idle"}
                  className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-base pl-7 pr-3
                    focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20
                    placeholder:text-gray-600 tabular-nums disabled:opacity-50"
                />
              </div>
              {/* Presets */}
              <div className="flex gap-2 mt-2">
                {presets.map((pct, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setAmount((usdcFormatted * pct).toFixed(2))
                    }
                    disabled={step !== "idle"}
                    className={cn(
                      "flex-1 h-7 rounded-md text-[10px] font-medium border transition-all",
                      parsedAmount === usdcFormatted * pct
                        ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                        : "border-white/5 bg-white/5 text-gray-500 hover:border-white/10 hover:text-gray-400",
                      "disabled:opacity-50",
                    )}
                  >
                    {pct === 1 ? "All" : `${(pct * 100).toFixed(0)}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            {step === "idle" && (
              <Button
                onClick={handleDeposit}
                disabled={!isValid}
                className={cn(
                  "w-full h-10 rounded-lg text-sm font-semibold transition-all",
                  isValid
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400"
                    : "bg-white/5 text-gray-500 cursor-not-allowed",
                )}
              >
                <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
                Deposit to Vault
              </Button>
            )}

            {step === "signing" && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                <div>
                  <p className="text-xs text-amber-300 font-medium">
                    Waiting for wallet signature...
                  </p>
                  <p className="text-[10px] text-amber-400/60 mt-0.5">
                    Check your wallet to confirm the transaction
                  </p>
                </div>
              </div>
            )}

            {step === "confirming" && (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
                <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                <div>
                  <p className="text-xs text-indigo-300 font-medium">
                    Confirming on Base...
                  </p>
                  <p className="text-[10px] text-indigo-400/60 mt-0.5">
                    Waiting for block confirmation
                  </p>
                </div>
              </div>
            )}

            {step === "done" && showSuccess && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-300 font-medium">
                    ${parsedAmount.toFixed(2)} USDC deposited to vault
                  </p>
                </div>
                {hash && (
                  <a
                    href={`${CURRENT_CHAIN.explorerUrl}/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 mt-1"
                  >
                    View on {CURRENT_CHAIN.explorerUrl.replace("https://", "").replace(".org", "").replace(".com", "")}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-red-400 font-medium">
                      Transaction failed
                    </p>
                    <p className="text-[10px] text-red-400/70 mt-0.5 break-words">
                      {error.message?.includes("User rejected")
                        ? "You rejected the transaction in your wallet."
                        : error.message || "An unexpected error occurred."}
                    </p>
                  </div>
                  <button
                    onClick={() => { setStep("idle"); setShowSuccess(false); }}
                    className="shrink-0 text-red-400/50 hover:text-red-400 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
