"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { POLICY_TYPE_META } from "@/types/policy";
import type { CreatePolicyRequest } from "@/types/policy";
import type {
  PolicySuggestion,
  PolicyActivityEvent,
} from "@/lib/policies/policy-suggestions";
import { recordPolicyActivity } from "@/lib/policies/policy-suggestions";
import { ConfirmActionModal } from "./confirm-action-modal";
import { Zap } from "lucide-react";

interface SuggestedActionsProps {
  suggestions: PolicySuggestion[];
  policyActivity: PolicyActivityEvent[];
  onActivityChange: (activity: PolicyActivityEvent[]) => void;
  onPolicyCreated: (template: CreatePolicyRequest) => Promise<void>;
}

const priorityConfig = {
  high: {
    dot: "bg-green-500",
    label: "High priority",
  },
  medium: {
    dot: "bg-amber-400",
    label: "Medium priority",
  },
  low: {
    dot: "bg-text-muted",
    label: "Low priority",
  },
};

export function SuggestedActions({
  suggestions,
  policyActivity,
  onActivityChange,
  onPolicyCreated,
}: SuggestedActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<PolicySuggestion | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (suggestions.length === 0) return null;

  function openConfirmation(suggestion: PolicySuggestion) {
    setActiveSuggestion(suggestion);
    setConfirmOpen(true);
  }

  function closeConfirmation() {
    setConfirmOpen(false);
    setActiveSuggestion(null);
  }

  async function handleConfirm() {
    if (!activeSuggestion) return;

    setConfirming(true);

    try {
      // If this is a template-based suggestion, create the policy
      if (activeSuggestion.templatePolicy) {
        const res = await fetch("/api/policies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activeSuggestion.templatePolicy),
        });

        if (!res.ok) {
          // Silently fail — the suggestion remains available
          setConfirming(false);
          closeConfirmation();
          return;
        }
      }

      // Record the acceptance
      const next = recordPolicyActivity(
        policyActivity,
        activeSuggestion,
        "accepted",
      );
      onActivityChange(next);

      // If this was a template suggestion, refresh the policy list
      if (activeSuggestion.templatePolicy) {
        await onPolicyCreated(activeSuggestion.templatePolicy);
      }
    } catch {
      // Silently handle
    } finally {
      setConfirming(false);
      closeConfirmation();
    }
  }

  function handleDismiss(suggestion: PolicySuggestion) {
    const next = recordPolicyActivity(policyActivity, suggestion, "dismissed");
    onActivityChange(next);
  }

  function handleSnooze(suggestion: PolicySuggestion) {
    const next = recordPolicyActivity(policyActivity, suggestion, "snoozed");
    onActivityChange(next);
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-2">
          <Zap className="h-4 w-4 text-green-500" />
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
            Suggested actions
          </h2>
          <span className="ml-auto text-tiny text-text-muted">
            {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
          </span>
        </div>

        <p className="px-5 pb-3 text-small text-text-tertiary">
          Contextual recommendations based on your capital state. Nothing
          executes without your confirmation.
        </p>

        {/* Suggestion list */}
        <div className="divide-y divide-border">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="px-5 py-4 transition-colors hover:bg-surface-subtle"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Title row */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        priorityConfig[suggestion.priority].dot,
                      )}
                    />
                    <p className="text-small font-medium text-text-primary">
                      {suggestion.title}
                    </p>
                  </div>

                  {/* Body */}
                  <p className="text-tiny text-text-secondary leading-relaxed ml-3.5">
                    {suggestion.body}
                  </p>

                  {/* Template tag */}
                  {suggestion.templatePolicy && (
                    <div className="mt-2 ml-3.5 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50/50 px-2.5 py-0.5">
                      <span className="text-[10px] font-medium text-green-700">
                        Template ·{" "}
                        {POLICY_TYPE_META[suggestion.templatePolicy.type]?.label ??
                          suggestion.templatePolicy.type}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openConfirmation(suggestion)}
                    className="rounded-lg bg-green-500 text-white px-3 py-1.5 text-[11px] font-medium hover:bg-green-600 transition-colors shadow-sm"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSnooze(suggestion)}
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-medium text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    Later
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismiss(suggestion)}
                    className="rounded-lg p-1.5 text-text-tertiary hover:text-text-primary transition-colors"
                    aria-label="Dismiss suggestion"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 4l8 8M12 4l-8 8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calm footer */}
        <p className="px-5 py-3 text-tiny text-text-muted border-t border-border">
          Suggestions are generated from your capital state. They expire after a
          few days if not reviewed.
        </p>
      </div>

      {/* Confirmation Modal */}
      <ConfirmActionModal
        open={confirmOpen}
        suggestion={activeSuggestion}
        onConfirm={handleConfirm}
        onCancel={closeConfirmation}
        confirming={confirming}
      />
    </>
  );
}
