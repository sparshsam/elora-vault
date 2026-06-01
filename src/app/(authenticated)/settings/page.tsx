"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import {
  LogOut,
  User,
  Clock,
  Shield,
  Sparkles,
  ArrowRightLeft,
  ClipboardList,
  GitBranch,
  Network,
  ShieldCheck,
  Map as MapIcon,
} from "lucide-react";
import { BaseAccountBadge, WalletCapabilitiesInfo, SubAccountHierarchy } from "@/components/web3/base-account-badge";
import { useWalletCapabilities, useCapabilityRouting } from "@/lib/web3/use-wallet-capabilities";
import {
  ORCHESTRATION_FLOW_LABELS,
  ORCHESTRATION_FLOW_DESCRIPTIONS,
  FLOW_FALLBACK_DESCRIPTIONS,
  FLOW_BATCH_STRATEGIES,
  type OrchestrationFlowId,
} from "@/lib/account/orchestration-flows";
import {
  readPolicyActivity,
  type PolicyActivityEvent,
} from "@/lib/policies/policy-suggestions";
import {
  EXECUTION_DECISION_TREE,
  ARCHITECTURE_LAYERS,
  type DecisionTreeNode,
} from "@/lib/account/execution-architecture";
import { CURRENT_MATURITY_ASSESSMENT } from "@/lib/account/base-maturity-roadmap";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { address, isConnected } = useAccount();
  const { capabilities, status: capsStatus } = useWalletCapabilities();
  const routing = useCapabilityRouting();
  const [email, setEmail] = useState("");
  const [defaultDuration, setDefaultDuration] = useState<7 | 30 | 90>(30);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [policyActivity, setPolicyActivity] = useState<PolicyActivityEvent[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    };
    getUser();
    const savedDuration = localStorage.getItem("elora_vault_default_duration");
    if (savedDuration) {
      const d = parseInt(savedDuration);
      if ([7, 30, 90].includes(d)) setDefaultDuration(d as 7 | 30 | 90);
    }
    setPolicyActivity(readPolicyActivity());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDurationChange = (d: 7 | 30 | 90) => {
    setDefaultDuration(d);
    localStorage.setItem("elora_vault_default_duration", d.toString());
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;
  const recentPolicyActivity = [...policyActivity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  /** Recursively render a decision tree node */
  const renderDecisionNode = (node: DecisionTreeNode, depth: number) => (
    <div key={node.condition} className="space-y-1.5">
      <div className="flex items-start gap-2 text-tiny">
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full shrink-0 mt-0.5",
            "h-4 w-4 text-[9px] font-bold",
            depth === 0
              ? "bg-violet-100 text-violet-700"
              : "bg-surface-hover text-text-subtle",
          )}
        >
          {depth === 0 ? "?" : depth}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary">{node.condition}</p>
          <p className="text-text-tertiary mt-0.5">{node.result}</p>
        </div>
      </div>
      {node.children?.map((child) => (
        <div key={child.condition} className="ml-5 pl-3 border-l border-border">
          {renderDecisionNode(child, depth + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-small text-text-tertiary mt-1.5">
          A quiet place to configure your environment.
        </p>
      </div>

      {/* Account */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Account
          </h2>
        </div>
        <div className="rounded-xl border border-border bg-surface shadow-sm px-5 py-4">
          <div>
            <p className="text-tiny text-text-tertiary mb-0.5">Email</p>
            <p className="text-sm text-text-primary">
              {email || "Loading..."}
            </p>
          </div>
          {isConnected && shortAddress && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-tiny text-text-tertiary mb-0.5">
                Connected wallet
              </p>
              <p className="text-sm font-mono text-text-primary">
                {shortAddress}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Preferences
          </h2>
        </div>

        {/* Default Lock Duration */}
        <div className="rounded-xl border border-border bg-surface px-5 py-4 mb-3">
          <p className="text-sm font-medium text-text-primary mb-1">
            Default lock duration
          </p>
          <p className="text-small text-text-tertiary mb-4">
            How long new capital protections last by default.
          </p>
          <div className="flex gap-2">
            {([7, 30, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => handleDurationChange(d)}
                className={cn(
                  "flex-1 h-9 rounded-lg text-xs font-medium border transition-all",
                  defaultDuration === d
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-border bg-surface-subtle text-text-tertiary hover:text-text-secondary hover:border-border-hover",
                )}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Notifications placeholder */}
        <div className="rounded-xl border border-border bg-surface px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary mb-0.5">
                Lock expiry notifications
              </p>
              <p className="text-small text-text-tertiary">
                Get notified when protected capital unlocks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors shrink-0 ml-4",
                notificationsEnabled ? "bg-green-500" : "bg-surface-hover",
              )}
              disabled
            >
              <div
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  notificationsEnabled
                    ? "translate-x-[22px]"
                    : "translate-x-0.5",
                )}
              />
            </button>
          </div>
          <p className="text-tiny text-text-subtle mt-2 italic">
            Future-ready — available when notifications are supported.
          </p>
        </div>
      </div>

      {/* Policy Activity */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Policy activity
          </h2>
        </div>
        <div className="rounded-xl border border-border bg-surface px-5 py-4">
          <p className="text-sm font-medium text-text-primary mb-1">
            Assisted execution history
          </p>
          <p className="text-small text-text-tertiary mb-4">
            Suggestions are recorded here. Policies never move capital without your confirmation.
          </p>
          {recentPolicyActivity.length > 0 ? (
            <div className="space-y-3">
              {recentPolicyActivity.map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-3 border-t border-border pt-3 first:border-t-0 first:pt-0">
                  <div className="min-w-0">
                    <p className="text-small font-medium text-text-primary">{event.title}</p>
                    <p className="text-tiny text-text-tertiary mt-0.5">
                      {event.sourcePolicy} - {event.status}
                    </p>
                  </div>
                  <span className="shrink-0 text-tiny text-text-muted">
                    {new Date(event.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-surface-subtle px-4 py-3 text-small text-text-tertiary">
              No policy suggestions recorded yet.
            </p>
          )}
        </div>
      </div>

      {/* Base Account Infrastructure */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Base Account
          </h2>
        </div>

        {/* Capability status */}
        <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-text-primary">
                  Progressive Enhancement
                </p>
                <BaseAccountBadge variant="pill" />
              </div>
              <p className="text-small text-text-tertiary">
                Quiet infrastructure layer for Base-native wallets. Detection is
                automatic — nothing changes unless capabilities are found.
              </p>
              <p className="text-tiny text-text-muted mt-2 leading-relaxed">
                When a Base Account is detected, Elora enhances the experience
                with sub-account visibility, feature badges, and future
                batching opportunities. External wallets continue working
                exactly as before.
              </p>
            </div>
            <a
              href="/settings/base-account-lab"
              className="shrink-0 rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 text-tiny font-medium hover:bg-green-100 transition-colors"
            >
              Open lab
            </a>
          </div>
        </div>

        {/* Capability details — only when detected */}
        {isConnected && (
          <>
            {/* Supported features */}
            <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mb-3">
              <WalletCapabilitiesInfo />
            </div>

            {/* Sub-account hierarchy */}
            <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mb-3">
              <SubAccountHierarchy />
            </div>
          </>
        )}

        {/* Future enhancement roadmap */}
        <div className="rounded-xl border border-border bg-surface-subtle px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Enhancement roadmap
          </p>
          <div className="space-y-2.5">
            {[
              {
                label: "Sub-account visibility",
                status: "now" as const,
                desc: "Display Elora Account connection status",
              },
              {
                label: "Capability detection",
                status: "now" as const,
                desc: "Auto-detect Base Account, batching, and sendCalls",
              },
              {
                label: "Safe transaction batching",
                status: "research" as const,
                desc: "Deposit + protect, release + reprotect (research phase)",
              },
              {
                label: "Gas sponsorship",
                status: "future" as const,
                desc: "Optional sponsored gas for vault operations",
              },
              {
                label: "Sub-account vault routing",
                status: "future" as const,
                desc: "Route vault deposits through Elora sub-account",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 text-tiny"
              >
                <span
                  className={cn(
                    "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                    item.status === "now"
                      ? "bg-green-500"
                      : item.status === "research"
                        ? "bg-amber-400"
                        : "bg-text-subtle",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-text-primary">
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-wider",
                        item.status === "now"
                          ? "text-green-600"
                          : item.status === "research"
                            ? "text-amber-600"
                            : "text-text-subtle",
                      )}
                    >
                      {item.status === "now"
                        ? "✓ now"
                        : item.status === "research"
                          ? "◎ research"
                          : "○ future"}
                    </span>
                  </div>
                  <p className="text-text-tertiary mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Productive Protection Research */}
        <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mt-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary mb-0.5">
                Productive Protection
              </p>
              <p className="text-small text-text-tertiary">
                Future optional low-risk yield for protected capital.
              </p>
              <p className="text-tiny text-text-muted mt-2 leading-relaxed">
                Protected capital may eventually support optional low-risk
                productivity while remaining separated. This is a research
                surface — no yield strategies are active.
              </p>
            </div>
            <a
              href="/settings/productive-protection"
              className="shrink-0 rounded-lg border border-border bg-surface-subtle text-text-secondary px-3 py-1.5 text-tiny font-medium hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              View research
            </a>
          </div>
        </div>
      </div>

      {/* Transaction Orchestration Preview */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <ArrowRightLeft className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Transaction Orchestration
          </h2>
        </div>

        <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mb-3">
          <p className="text-sm font-medium text-text-primary mb-1">
            Batched capital flows
          </p>
          <p className="text-small text-text-tertiary mb-4">
            Research phase. Multi-step capital actions composed into single
            wallet confirmations. Not yet active — preview only.
          </p>

          <div className="space-y-3">
            {(Object.keys(ORCHESTRATION_FLOW_LABELS) as OrchestrationFlowId[]).map((flowId) => {
              const label = ORCHESTRATION_FLOW_LABELS[flowId];
              const desc = ORCHESTRATION_FLOW_DESCRIPTIONS[flowId];
              const strategy = FLOW_BATCH_STRATEGIES[flowId];
              const fallback = FLOW_FALLBACK_DESCRIPTIONS[flowId];

              const canBatch = capsStatus === "detected" && capabilities.batching;

              return (
                <div
                  key={flowId}
                  className="rounded-lg border border-border bg-surface-subtle p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {label}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          preview
                        </span>
                      </div>
                      <p className="text-tiny text-text-tertiary mt-1">
                        {desc}
                      </p>
                    </div>
                  </div>

                  {/* Strategy badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium",
                      strategy === "wallet-send-calls"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-surface-hover text-text-subtle",
                    )}>
                      {strategy === "wallet-send-calls" ? "EIP-5792" : strategy}
                    </span>
                    {canBatch ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                        batching ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-surface-hover text-text-subtle">
                        fallback: sequential
                      </span>
                    )}
                  </div>

                  {/* Fallback explanation — shown when batching unavailable */}
                  {!canBatch && (
                    <p className="text-[10px] text-text-muted mt-2 italic leading-relaxed">
                      {fallback}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sub-account execution research note */}
        <div className="rounded-xl border border-border bg-surface-subtle px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Sub-account execution path
          </p>
          <p className="text-tiny text-text-tertiary leading-relaxed">
            When a Base Account sub-account is detected, Elora could route
            vault operations through it for simplified approvals, batch
            execution, and optional gas sponsorship. This requires spend
            permission setup (one-time user approval) and a future contract
            upgrade path. Currently in research phase — no active execution.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: "Spend permissions", color: "text-amber-600" },
              { label: "Batch execution", color: "text-blue-600" },
              { label: "Gas sponsorship", color: "text-text-subtle" },
              { label: "Sub-account routing", color: "text-text-subtle" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 text-[10px]"
              >
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  item.color === "text-amber-600" ? "bg-amber-400" :
                  item.color === "text-blue-600" ? "bg-blue-400" :
                  "bg-text-subtle",
                )} />
                <span className={item.color}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture & Decision Tree */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Network className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Execution Architecture
          </h2>
        </div>

        {/* Current routing tier */}
        <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="h-4 w-4 text-text-tertiary" />
            <p className="text-sm font-medium text-text-primary">
              Current routing tier
            </p>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium",
              routing.tier === "batched"
                ? "bg-green-50 text-green-700 border border-green-200"
                : routing.tier === "sub-account"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-surface-hover text-text-subtle border border-border",
            )}>
              {routing.tier === "batched" ? "⚡ Batched" :
               routing.tier === "sub-account" ? "🔗 Sub-account" :
               routing.tier === "sequential" ? "⏩ Sequential" :
               "🔌 External wallet"}
            </span>
            {routing.usesSendCalls && (
              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                via EIP-5792
              </span>
            )}
          </div>
          <p className="text-tiny text-text-tertiary leading-relaxed">
            {routing.tier === "batched" && routing.usesSendCalls
              ? "Your wallet supports wallet_sendCalls. Multi-step flows can be composed into single atomic batches with one confirmation."
              : routing.tier === "batched" && !routing.usesSendCalls
                ? "Contract-level atomic batch capability detected. Requires vault multicall support for execution."
                : routing.tier === "sub-account"
                  ? "Base Account sub-account detected. Future: spend permissions enable batch execution. Currently in sequential mode."
                  : "No Base-native batching detected. All transactions execute sequentially with individual confirmations. This is the standard path and works with all wallets."}
          </p>
        </div>

        {/* Architecture layers */}
        <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-3 flex items-center gap-1.5">
            <MapIcon className="h-3 w-3" />
            Architecture layers
          </p>
          <div className="space-y-1.5">
            {(Object.keys(ARCHITECTURE_LAYERS) as Array<keyof typeof ARCHITECTURE_LAYERS>).reverse().map((layer) => (
              <div
                key={layer}
                className="flex items-start gap-2 text-tiny py-0.5"
              >
                <span className={cn(
                  "h-2 w-2 rounded-full mt-0.5 shrink-0",
                  layer === "layer-5-ui" ? "bg-emerald-400" :
                  layer === "layer-4-execution" ? "bg-blue-400" :
                  layer === "layer-3-planning" ? "bg-violet-400" :
                  layer === "layer-2-routing" ? "bg-amber-400" :
                  layer === "layer-1-detection" ? "bg-orange-400" :
                  "bg-gray-400",
                )} />
                <span className="text-text-secondary">{ARCHITECTURE_LAYERS[layer]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decision tree */}
        <div className="rounded-xl border border-border bg-surface-subtle px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-text-tertiary mb-3 flex items-center gap-1.5">
            <GitBranch className="h-3 w-3" />
            Execution decision tree
          </p>
          <div className="space-y-2">
            {renderDecisionNode(EXECUTION_DECISION_TREE, 0)}
          </div>
        </div>
      </div>

      {/* Maturity Roadmap */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <MapIcon className="h-4 w-4 text-text-tertiary" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Maturity Roadmap
          </h2>
        </div>

        <div className="rounded-xl border border-border bg-surface shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <p className="text-sm font-medium text-text-primary">
            Phase 2 — Awareness
          </p>
            <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
              current
            </span>
          </div>
          <p className="text-tiny text-text-tertiary leading-relaxed mb-3">
            {CURRENT_MATURITY_ASSESSMENT.summary}
          </p>
          <div className="flex flex-wrap gap-2">
            {CURRENT_MATURITY_ASSESSMENT.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-text-subtle bg-surface-hover px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-small text-text-tertiary hover:text-danger transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  );
}
