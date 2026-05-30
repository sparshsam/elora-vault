"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useReadContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUnits, parseUnits } from "viem";
import { useVaultDeposit } from "@/lib/web3/hooks";
import { CURRENT_CHAIN } from "@/lib/contracts/contracts";
import { useWalletStore } from "@/store/useWalletStore";
import {
  ArrowDownToLine,
  ExternalLink,
  CheckCircle,
  Loader2,
  AlertTriangle,
  X,
  SwitchCamera,
  Wallet,
  ShieldCheck,
} from "lucide-react";

// Minimal ERC20 ABI for balanceOf, allowance, and approve
const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "remaining", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

type FlowStep = "idle" | "approving" | "approve_confirming" | "depositing" | "deposit_confirming" | "done";

/**
 * Vault Deposit Form.
 * Two-step flow: approve USDC spending → deposit into vault.
 * After deposit, credits the user's wagering balance automatically.
 */
export function VaultDepositForm({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const connectedChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const queryClient = useQueryClient();

  const EXPECTED_CHAIN_ID = CURRENT_CHAIN.chainId;
  const VAULT_ADDRESS = CURRENT_CHAIN.vaultAddress;
  const isWrongNetwork = isConnected && connectedChainId !== EXPECTED_CHAIN_ID;

  // USDC balance
  const {
    data: usdcBalanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    isFetched: isBalanceFetched,
  } = useReadContract({
    address: CURRENT_CHAIN.usdcAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: EXPECTED_CHAIN_ID,
    query: { enabled: !!address && !isWrongNetwork },
  });

  // USDC allowance for vault contract
  const {
    data: allowanceData,
    refetch: refetchAllowance,
  } = useReadContract({
    address: CURRENT_CHAIN.usdcAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    chainId: EXPECTED_CHAIN_ID,
    query: { enabled: !!address && !isWrongNetwork },
  });

  const usdcFormatted = usdcBalanceData
    ? Number(formatUnits(usdcBalanceData as bigint, 6))
    : 0;
  const currentAllowance = allowanceData ? (allowanceData as bigint) : BigInt(0);

  const { deposit, hash: depositHash, isConfirmed: isDepositConfirmed, error: depositError } = useVaultDeposit();

  // Approval write hook — explicitly chain-scoped for L2
  const { writeContract: writeApproval, data: approvalHash, error: approvalError } = useWriteContract();
  const { isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalHash,
    chainId: EXPECTED_CHAIN_ID,
  });

  const { syncFromServer } = useWalletStore();
  const [creditingBalance, setCreditingBalance] = useState(false);
  const [balanceSyncError, setBalanceSyncError] = useState<string | null>(null);
  const confirmedRef = useRef(false);
  const approvedRef = useRef(false);

  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<FlowStep>("idle");
  const [showSuccess, setShowSuccess] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const parsedUnits = parseUnits(
    parsedAmount > 0 ? parsedAmount.toFixed(6).toString() : "0",
    6,
  );
  const isValid = parsedAmount > 0 && parsedAmount <= usdcFormatted;
  const needsApproval = currentAllowance < parsedUnits;

  const handleApprove = () => {
    if (!address || !isValid) return;
    setStep("approving");
    writeApproval({
      address: CURRENT_CHAIN.usdcAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [VAULT_ADDRESS, parsedUnits],
    });
  };

  const handleDeposit = async () => {
    if (!isValid) return;
    setStep("depositing");
    setBalanceSyncError(null);
    try {
      await deposit(parsedAmount);
      setStep("deposit_confirming");
    } catch {
      setStep("idle");
    }
  };

  // Track approval confirmation — via receipt OR allowance polling
  useEffect(() => {
    if (step !== "approving" || approvedRef.current) return;

    // If wagmi confirms the receipt, mark as done
    if (isApprovalConfirmed) {
      approvedRef.current = true;
      setStep("idle");
      refetchAllowance();
      return;
    }

    // Fallback: poll allowance every 3s while waiting for approval
    const interval = setInterval(() => {
      refetchAllowance().then(({ data: newAllowance }) => {
        if (newAllowance && (newAllowance as bigint) >= parsedUnits) {
          approvedRef.current = true;
          setStep("idle");
          clearInterval(interval);
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isApprovalConfirmed, step, refetchAllowance, parsedUnits]);

  // Track deposit confirmation
  useEffect(() => {
    if (!isDepositConfirmed || step !== "deposit_confirming" || confirmedRef.current) return;
    confirmedRef.current = true;
    setStep("done");
    setShowSuccess(true);
    queryClient.invalidateQueries({ queryKey: ["readContract"] });

    (async () => {
      setCreditingBalance(true);
      try {
        const res = await fetch("/api/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: parsedAmount }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to sync balance");
        }
        await syncFromServer();
      } catch (err) {
        setBalanceSyncError(
          err instanceof Error ? err.message : "Failed to credit wagering balance",
        );
      } finally {
        setCreditingBalance(false);
      }
    })();
  }, [isDepositConfirmed, step, confirmedRef, parsedAmount, queryClient, syncFromServer]);

  // Reset on error
  const activeError = depositError || approvalError;
  if (activeError && (step === "approving" || step === "depositing" || step === "deposit_confirming")) {
    setStep("idle");
    setShowSuccess(false);
  }

  const presets = [0.25, 0.5, 0.75, 1];

  const isActionPending = step === "approving" || step === "approve_confirming" || step === "depositing" || step === "deposit_confirming";

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
            {/* ── Wrong Network Banner ── */}
            {isWrongNetwork && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-red-300 font-medium">Wrong Network</p>
                    <p className="text-[10px] text-red-400/70 mt-0.5">
                      Switch to {CURRENT_CHAIN.name} to deposit USDC.
                    </p>
                    <Button
                      onClick={() => switchChain({ chainId: EXPECTED_CHAIN_ID })}
                      size="sm"
                      className="mt-2 h-7 text-[10px] bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/20"
                    >
                      <SwitchCamera className="h-3 w-3 mr-1" />
                      Switch to {CURRENT_CHAIN.name}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* USDC Balance */}
            <div className="rounded-lg bg-white/5 p-3 border border-white/5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                Wallet USDC Balance
              </p>
              {isWrongNetwork ? (
                <p className="text-sm text-red-400/70 mt-0.5">Switch network to read balance</p>
              ) : isBalanceLoading ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                  <span className="text-xs text-gray-500">Reading balance...</span>
                </div>
              ) : isBalanceError ? (
                <div className="flex items-start gap-2 mt-0.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400/70">Unable to read USDC balance</p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-white tabular-nums mt-0.5">
                  {usdcFormatted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                </p>
              )}
            </div>

            {!isWrongNetwork && (
              <>
                {/* Amount Input */}
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">
                    Amount to Deposit
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
                    <input
                      type="number" min="0" max={usdcFormatted} step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      disabled={isActionPending}
                      className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-white text-base pl-7 pr-3
                        focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20
                        placeholder:text-gray-600 tabular-nums disabled:opacity-50"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {presets.map((pct, i) => (
                      <button
                        key={i}
                        onClick={() => setAmount((usdcFormatted * pct).toFixed(2))}
                        disabled={isActionPending || isBalanceLoading || isBalanceError}
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

                {/* Zero-balance hint */}
                {isBalanceFetched && usdcFormatted === 0 && (
                  <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 px-3 py-2">
                    <p className="text-[10px] text-amber-300/80">You may need Base Sepolia test USDC to deposit.</p>
                  </div>
                )}

                {/* Step 1: Approve USDC */}
                {step === "idle" && isValid && needsApproval && (
                  <Button onClick={handleApprove}
                    disabled={!isValid}
                    className="w-full h-10 rounded-lg text-sm font-semibold bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-500/20"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                    Approve USDC
                  </Button>
                )}

                {/* Step 2: Deposit to Vault (after approval or if already approved) */}
                {step === "idle" && isValid && !needsApproval && (
                  <Button onClick={handleDeposit}
                    disabled={!isValid}
                    className={cn(
                      "w-full h-10 rounded-lg text-sm font-semibold transition-all",
                      "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400",
                    )}
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
                    Deposit to Vault
                  </Button>
                )}
              </>
            )}

            {/* Approving states */}
            {step === "approving" && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                <p className="text-xs text-amber-300 font-medium">Approve USDC in your wallet...</p>
              </div>
            )}
            {step === "approve_confirming" && (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
                <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                <p className="text-xs text-indigo-300 font-medium">Approval confirming on Base...</p>
              </div>
            )}

            {/* Deposit signing */}
            {step === "depositing" && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                <div>
                  <p className="text-xs text-amber-300 font-medium">Waiting for wallet signature...</p>
                  <p className="text-[10px] text-amber-400/60 mt-0.5">Check your wallet to confirm the transaction</p>
                </div>
              </div>
            )}
            {step === "deposit_confirming" && (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3">
                <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                <div>
                  <p className="text-xs text-indigo-300 font-medium">Confirming on Base...</p>
                  <p className="text-[10px] text-indigo-400/60 mt-0.5">Waiting for block confirmation</p>
                </div>
              </div>
            )}

            {/* Done */}
            {step === "done" && showSuccess && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs text-emerald-300 font-medium">${parsedAmount.toFixed(2)} USDC deposited to vault</p>
                    <p className="text-[10px] text-emerald-400/70 mt-0.5">
                      {creditingBalance ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          Crediting wagering balance...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Wallet className="h-2.5 w-2.5" />
                          Now available for wagering
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {depositHash && (
                  <a href={`${CURRENT_CHAIN.explorerUrl}/tx/${depositHash}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 mt-1">
                    View on {CURRENT_CHAIN.explorerUrl.replace("https://", "").replace(".org", "").replace(".com", "")}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
                {balanceSyncError && (
                  <p className="text-[10px] text-amber-400/80 mt-1">
                    Note: {balanceSyncError}. The onchain deposit is confirmed, your wagering balance may need a manual refresh.
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {activeError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-red-400 font-medium">Transaction failed</p>
                    <p className="text-[10px] text-red-400/70 mt-0.5 break-words">
                      {activeError.message?.includes("User rejected")
                        ? "You rejected the transaction in your wallet."
                        : activeError.message || "An unexpected error occurred."}
                    </p>
                  </div>
                  <button onClick={() => { setStep("idle"); setShowSuccess(false); }}
                    className="shrink-0 text-red-400/50 hover:text-red-400 transition-colors">
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
