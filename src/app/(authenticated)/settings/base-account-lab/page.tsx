"use client";

import { useState, useCallback } from "react";
import {
  initBaseAccountSDK,
  connectBaseAccount,
  createSubAccount,
  getExistingSubAccount,
  disconnectProvider,
  resetSDK,
  logStep,
} from "@/lib/account/base-account-client";
import type { LabStep } from "@/lib/account/base-account-client";
import { AccountCapabilityPanel } from "@/components/account/account-capability-panel";
import { AccountModeTable } from "@/components/account/account-mode-table";
import { useWalletCapabilities } from "@/hooks/use-wallet-capabilities";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowDown,
  Target,
  Info,
  Shield,
} from "lucide-react";

/* ── Helpers ───────────────────────────────── */

function shortenAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/* ── Page ──────────────────────────────────── */

export default function BaseAccountLabPage() {
  const caps = useWalletCapabilities();
  const [logs, setLogs] = useState<LabStep[]>([]);
  const [universalAddress, setUniversalAddress] = useState<string | null>(null);
  const [subAccountAddress, setSubAccountAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [creatingSub, setCreatingSub] = useState(false);

  const addLog = useCallback((status: LabStep["status"], message: string) => {
    setLogs((prev) => [...prev, logStep(status, message)]);
  }, []);

  /* ── Initialize SDK ── */
  const handleInit = useCallback(() => {
    try {
      initBaseAccountSDK();
      addLog("sdk-ready", "SDK initialized.");
    } catch (err) {
      addLog("error", `SDK init failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [addLog]);

  /* ── Connect ── */
  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      addLog("sdk-ready", "Connecting to Base Account...");
      const accounts = await connectBaseAccount();
      if (accounts.length > 0) {
        setUniversalAddress(accounts[0]);
        addLog("connected", `Connected. Account: ${shortenAddress(accounts[0])}`);
        addLog("universal-detected", `Universal Account: ${accounts[0]}`);

        const existing = await getExistingSubAccount();
        if (existing?.address) {
          setSubAccountAddress(existing.address);
          addLog("sub-account-found", `Elora Sub Account found: ${shortenAddress(existing.address)}`);
        } else {
          addLog("sdk-ready", "No Elora Sub Account found yet. Create one below.");
        }
      } else {
        addLog("error", "No accounts returned. Connection may have been cancelled.");
      }
    } catch (err) {
      addLog("error", `Connection failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setConnecting(false);
    }
  }, [addLog]);

  /* ── Create Sub Account ── */
  const handleCreateSubAccount = useCallback(async () => {
    setCreatingSub(true);
    try {
      addLog("sdk-ready", "Creating Elora Sub Account...");
      const address = await createSubAccount();
      if (address) {
        setSubAccountAddress(address);
        addLog("sub-account-created", `Elora Sub Account created: ${shortenAddress(address)}`);
      } else {
        addLog("error", "Sub Account creation returned no address.");
      }
    } catch (err) {
      addLog("error", `Sub Account creation failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCreatingSub(false);
    }
  }, [addLog]);

  /* ── Disconnect ── */
  const handleDisconnect = useCallback(async () => {
    await disconnectProvider();
    setUniversalAddress(null);
    setSubAccountAddress(null);
    setLogs([]);
    addLog("sdk-ready", "Disconnected. SDK ready.");
  }, [addLog]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    resetSDK();
    setUniversalAddress(null);
    setSubAccountAddress(null);
    setLogs([]);
  }, []);

  const sdkInitialized = true;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:py-12">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-text-primary">Base Account Lab</h1>
        <p className="text-small text-text-tertiary mt-1.5">
          A safe test area for future account infrastructure.
        </p>
      </div>

      {/* ── Disclaimer ── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 mb-8">
        <p className="text-tiny font-medium text-amber-700 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          Test area — production unaffected
        </p>
        <p className="text-tiny text-amber-600/80 mt-1">
          Current wallet flows remain unchanged. This page only explores future Base
          Account support. No real vault transactions are sent from this page.
        </p>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* CAPABILITY OVERVIEW                     */}
      {/* ═══════════════════════════════════════ */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          Wallet Infrastructure
        </h2>

        <AccountCapabilityPanel />

        {/* Wallet type guide — shown when connected */}
        {caps.isConnected && (
          <div className="rounded-xl border border-border bg-surface-subtle p-4">
            <div className="flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" />
              <div>
                <p className="text-tiny font-medium text-text-primary">
                  {caps.walletType === "eoa"
                    ? "EOA detected — fallback mode active"
                    : caps.walletType === "base-account"
                      ? "Base Account detected — progressive enhancement ready"
                      : caps.walletType === "smart-wallet"
                        ? "Smart wallet detected — batching available"
                        : "Wallet type undetermined"}
                </p>
                <p className="text-tiny text-text-tertiary mt-1 leading-relaxed">
                  {caps.walletType === "eoa"
                    ? "External wallets work with Elora through direct-wallet mode. Batch execution, paymaster sponsorship, and sub-account flows are unavailable until a compatible smart wallet or Base Account is connected."
                    : caps.walletType === "base-account"
                      ? "Base Account detected. All execution modes are available for exploration in this lab. Production migration requires capability confirmation and a phased rollout."
                      : caps.walletType === "smart-wallet"
                        ? "Smart wallet detected. Atomic batching is available. Paymaster sponsorship and sub-account flows require additional capability confirmation."
                        : "Connect a wallet to determine capability support."}
                </p>
              </div>
            </div>
          </div>
        )}

        <AccountModeTable />
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* ACCOUNT STATE                          */}
      {/* ═══════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mb-8">
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-4">
          Account State
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-tiny text-text-tertiary">Universal Account</span>
            <span className={cn(
              "text-small font-mono",
              universalAddress ? "text-text-primary" : "text-text-muted",
            )}>
              {universalAddress ? shortenAddress(universalAddress) : "Not connected"}
            </span>
          </div>

          {/* Account relationship diagram */}
          {universalAddress && (
            <div className="flex flex-col items-center py-2 gap-1">
              <div className="text-tiny text-text-tertiary">
                Universal Account
              </div>
              <ArrowDown className="h-3.5 w-3.5 text-text-muted" />
              <div className={cn(
                "rounded-md border px-3 py-1 text-tiny font-mono",
                subAccountAddress
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-dashed border-border text-text-muted",
              )}>
                {subAccountAddress
                  ? `Elora Account (${shortenAddress(subAccountAddress)})`
                  : "Elora Account (not created)"}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-tiny text-text-tertiary">Elora Sub Account</span>
            <span className={cn(
              "text-small font-mono",
              subAccountAddress ? "text-text-primary" : "text-text-muted",
            )}>
              {subAccountAddress ? shortenAddress(subAccountAddress) : "Not created"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-tiny text-text-tertiary">Chain</span>
            <span className="text-small text-text-primary">Base Sepolia (84532)</span>
          </div>
          {caps.isConnected && caps.address && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-tiny text-text-tertiary">Connected wallet</span>
              <span className="text-small font-mono text-text-muted">
                {shortenAddress(caps.address)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* SDK CONTROLS                            */}
      {/* ═══════════════════════════════════════ */}
      <div className="mb-8">
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-4 flex items-center gap-2">
          <Target className="h-3.5 w-3.5" />
          Base Account SDK controls
        </h2>

        <div className="rounded-xl border border-border bg-surface shadow-sm p-5">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleInit}
              disabled={!sdkInitialized}
              className="rounded-lg bg-green-500 text-white px-4 py-2 text-small font-medium hover:bg-green-600 shadow-sm transition-colors disabled:opacity-50"
            >
              Init SDK
            </button>
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className="rounded-lg bg-green-500 text-white px-4 py-2 text-small font-medium hover:bg-green-600 shadow-sm transition-colors disabled:opacity-50"
            >
              {connecting ? "Connecting..." : "Connect Base Account"}
            </button>
            <button
              type="button"
              onClick={handleCreateSubAccount}
              disabled={creatingSub || !universalAddress}
              className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-2 text-small font-medium hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingSub ? "Creating..." : "Create Sub Account"}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={!universalAddress}
              className="rounded-lg border border-border bg-surface-subtle text-text-secondary px-4 py-2 text-small font-medium hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Disconnect
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-border bg-surface-subtle text-text-muted px-4 py-2 text-tiny font-medium hover:text-text-secondary transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* STATUS LOG                              */}
      {/* ═══════════════════════════════════════ */}
      <div className="rounded-xl border border-border bg-surface shadow-sm p-5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-4 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          Status Log
        </h2>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-subtle">
              <Clock className="h-4 w-4 text-text-tertiary" />
            </div>
            <p className="text-small text-text-tertiary">No activity yet.</p>
            <p className="text-tiny text-text-muted mt-1 max-w-xs">
              Start by initializing the SDK, then connect to explore Base
              Account capabilities.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 text-tiny">
                <span className={cn(
                  "shrink-0 mt-0.5",
                  log.status === "error" ? "text-danger" :
                  log.status === "connected" || log.status === "universal-detected" ||
                  log.status === "sub-account-found" || log.status === "sub-account-created" ? "text-green-600" :
                  "text-text-tertiary",
                )}>
                  {log.status === "error" ? <AlertCircle className="h-3 w-3" /> :
                   log.status === "connected" || log.status === "universal-detected" ||
                   log.status === "sub-account-found" || log.status === "sub-account-created" ? <CheckCircle className="h-3 w-3" /> :
                   <ArrowRight className="h-3 w-3" />}
                </span>
                <span className="text-text-secondary">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
