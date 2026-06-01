"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { POLICY_TYPE_META } from "@/types/policy";
import type { ProtectionPolicy, PolicyStatus } from "@/types/policy";
import { Calendar, Trash2 } from "lucide-react";

interface PolicyCardProps {
  policy: ProtectionPolicy;
  onStatusChange: (id: string, status: PolicyStatus) => void;
  onDelete: (id: string) => void;
}

const statusConfig: Record<
  PolicyStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  active: {
    label: "Active",
    dot: "bg-green-500",
    bg: "bg-green-50/60",
    text: "text-green-700",
  },
  paused: {
    label: "Paused",
    dot: "bg-amber-400",
    bg: "bg-amber-50/30",
    text: "text-amber-700",
  },
  draft: {
    label: "Draft",
    dot: "bg-text-muted",
    bg: "bg-surface-subtle",
    text: "text-text-tertiary",
  },
};

export function PolicyCard({ policy, onStatusChange, onDelete }: PolicyCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = POLICY_TYPE_META[policy.type];
  const status = statusConfig[policy.status];

  const createdDate = new Date(policy.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="relative rounded-xl border border-border bg-surface shadow-sm p-6 transition-all duration-200 hover:shadow-md">
      {/* Top row: type label + status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("w-0.5 h-8 rounded-r shrink-0", status.dot)} aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-text-primary truncate">
              {policy.title}
            </h3>
            {meta && (
              <p className="text-tiny text-text-muted mt-0.5">
                {meta.label}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              status.bg,
              status.text,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>

          {/* Status change menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
              aria-label="Change status"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="4" r="1.5" fill="currentColor" />
                <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                <circle cx="8" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-border bg-surface shadow-lg py-1">
                  {(["active", "paused", "draft"] as PolicyStatus[]).map(
                    (s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          onStatusChange(policy.id, s);
                          setMenuOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-1.5 text-small transition-colors",
                          s === policy.status
                            ? "text-text-primary bg-surface-hover"
                            : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover",
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            statusConfig[s].dot,
                          )}
                        />
                        {statusConfig[s].label}
                      </button>
                    ),
                  )}
                  <div className="border-t border-border my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(policy.id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-small text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {policy.description && (
        <p className="text-small text-text-secondary leading-relaxed mb-4">
          {policy.description}
        </p>
      )}

      {/* Condition + Effect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted mb-1">
            When
          </p>
          <p className="text-small text-text-secondary">
            {policy.condition.description}
          </p>
          {policy.condition.minAmount !== undefined && (
            <p className="text-tiny text-text-tertiary mt-0.5">
              Minimum: ${policy.condition.minAmount.toLocaleString()}
            </p>
          )}
          {policy.condition.windowHours !== undefined && (
            <p className="text-tiny text-text-tertiary mt-0.5">
              Window: {policy.condition.windowHours} hours
            </p>
          )}
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted mb-1">
            Effect
          </p>
          <p className="text-small text-text-secondary">
            {policy.action.description}
          </p>
          {policy.action.protectPercentage !== undefined && (
            <p className="text-tiny text-text-tertiary mt-0.5">
              Protect {policy.action.protectPercentage}%
            </p>
          )}
          {policy.action.delayHours !== undefined && (
            <p className="text-tiny text-text-tertiary mt-0.5">
              Delay: {policy.action.delayHours} hours
            </p>
          )}
          {policy.action.thresholdAmount !== undefined && (
            <p className="text-tiny text-text-tertiary mt-0.5">
              Threshold: ${policy.action.thresholdAmount.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Footer: created date */}
      <div className="flex items-center gap-1.5 text-tiny text-text-muted">
        <Calendar className="h-3 w-3" />
        Created {createdDate}
      </div>
    </div>
  );
}
