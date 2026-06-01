/**
 * delayed-release-mocks.tsx — Mock UX flows for delayed release concepts.
 *
 * These components demonstrate future release window interfaces.
 * They are NOT wired into production release logic — they exist
 * to explore how delayed, scheduled, staged, and reviewed releases
 * would feel in the Elora interface.
 *
 * ── Design tone ────────────────────────────────────────
 * Calm, informative, restrained. Each flow emphasizes:
 * - What will happen
 * - When it will happen
 * - That the user is in control
 */

"use client";

import { cn } from "@/lib/utils";
import {
  Clock,
  Calendar,
  Layers,
  Eye,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";

/* ── Delayed Release Demo ───────────────────────────── */

/**
 * Demonstrates a 12-hour delayed release flow.
 * The user confirms, then capital becomes available after the delay.
 */
export function DelayedReleaseDemo() {
  const [state, setState] = useState<"idle" | "scheduled" | "complete">(
    "idle",
  );

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mb-8">
      <h3 className="text-sm font-medium text-text-primary mb-3">
        12-hour delayed release
      </h3>
      <p className="text-tiny text-text-tertiary mb-4">
        Capital will become available 12 hours after you confirm. No further
        action needed. The delay creates intentional separation between
        deciding and receiving.
      </p>

      <div className="space-y-3">
        {state === "idle" && (
          <>
            <div className="rounded-lg border border-border bg-surface-subtle p-4">
              <p className="text-tiny text-text-tertiary mb-3">
                You are about to release $1,500.00 from a 30-day horizon.
                Capital will be available in 12 hours.
              </p>
              <div className="flex items-center gap-1.5 text-tiny text-text-muted mb-3">
                <Clock className="h-3 w-3" />
                Available: Tomorrow at 9:00 PM
              </div>
              <button
                type="button"
                onClick={() => setState("scheduled")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-4 py-2 text-tiny font-medium hover:bg-green-600 transition-all shadow-sm"
              >
                Confirm delayed release
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </>
        )}
        {state === "scheduled" && (
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-tiny font-medium text-green-700">
                Release scheduled
              </span>
            </div>
            <p className="text-tiny text-green-700/70">
              $1,500.00 will become available in 12 hours (tomorrow at
              9:00 PM). No further action is required.
            </p>
          </div>
        )}
        {state === "complete" && (
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-tiny font-medium text-green-700">
                Capital available
              </span>
            </div>
            <p className="text-tiny text-green-700/70">
              $1,500.00 is now available in your Available balance. The
              12-hour delay has ended.
            </p>
          </div>
        )}
      </div>

      {state === "scheduled" && (
        <button
          type="button"
          onClick={() => setState("complete")}
          className="text-tiny text-text-muted hover:text-text-secondary mt-3 transition-colors"
        >
          Skip to completion (demo)
        </button>
      )}
    </div>
  );
}

/* ── Scheduled Release Demo ─────────────────────────── */

/**
 * Demonstrates a scheduled release flow where the user picks
 * a specific time for capital to become available.
 */
export function ScheduledReleaseDemo() {
  const [state, setState] = useState<"idle" | "scheduled" | "complete">(
    "idle",
  );

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mb-8">
      <h3 className="text-sm font-medium text-text-primary mb-3">
        Scheduled release
      </h3>
      <p className="text-tiny text-text-tertiary mb-4">
        Choose the exact moment you want capital to become available.
        Pick a time that aligns with your planning rhythm.
      </p>

      <div className="space-y-3">
        {state === "idle" && (
          <>
            <div className="rounded-lg border border-border bg-surface-subtle p-4">
              <p className="text-tiny text-text-tertiary mb-2">
                Select release time:
              </p>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-3.5 w-3.5 text-text-muted" />
                <span className="text-tiny text-text-primary font-medium">
                  Tomorrow at 9:00 AM
                </span>
              </div>
              <button
                type="button"
                onClick={() => setState("scheduled")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-4 py-2 text-tiny font-medium hover:bg-green-600 transition-all shadow-sm"
              >
                Schedule release for tomorrow
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </>
        )}
        {state === "scheduled" && (
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-tiny font-medium text-green-700">
                Release scheduled
              </span>
            </div>
            <p className="text-tiny text-green-700/70">
              $2,000.00 will become available tomorrow at 9:00 AM. This
              was selected to align with your morning review.
            </p>
          </div>
        )}
      </div>

      {state === "scheduled" && (
        <button
          type="button"
          onClick={() => setState("complete")}
          className="text-tiny text-text-muted hover:text-text-secondary mt-3 transition-colors"
        >
          Skip to completion (demo)
        </button>
      )}
    </div>
  );
}

/* ── Reviewed Release Demo ──────────────────────────── */

/**
 * Demonstrates a reviewed release flow with a reflection period.
 * The user confirms intent, then has 24 hours to cancel before
 * execution.
 */
export function ReviewedReleaseDemo() {
  const [state, setState] = useState<
    "idle" | "pending-review" | "cancelled" | "executed"
  >("idle");

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mb-8">
      <h3 className="text-sm font-medium text-text-primary mb-3">
        Reviewed release
      </h3>
      <p className="text-tiny text-text-tertiary mb-4">
        Confirm your intent to release, then take 24 hours to reflect.
        You can cancel at any time during the review period. The release
        only executes after the reflection window closes.
      </p>

      <div className="space-y-3">
        {state === "idle" && (
          <div className="rounded-lg border border-border bg-surface-subtle p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-text-tertiary" />
              <span className="text-tiny font-medium text-text-secondary">
                Reflection period: 24 hours
              </span>
            </div>
            <p className="text-tiny text-text-tertiary mb-3">
              Request release of $3,000.00. You will have 24 hours to
              cancel before capital becomes available.
            </p>
            <button
              type="button"
              onClick={() => setState("pending-review")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 text-white px-4 py-2 text-tiny font-medium hover:bg-green-600 transition-all shadow-sm"
            >
              Request reviewed release
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
        {state === "pending-review" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-tiny font-medium text-amber-700">
                Review period active — 23h 47m remaining
              </span>
            </div>
            <p className="text-tiny text-amber-700/70 mb-3">
              Release of $3,000.00 requested. You can cancel during the
              review period. If not cancelled, capital will be available
              tomorrow at 2:30 PM.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setState("executed")}
                className="rounded-lg bg-green-500 text-white px-3 py-1.5 text-tiny font-medium hover:bg-green-600 transition-all shadow-sm"
              >
                Complete release (demo)
              </button>
              <button
                type="button"
                onClick={() => setState("cancelled")}
                className="rounded-lg border border-border bg-surface text-text-secondary px-3 py-1.5 text-tiny font-medium hover:text-text-primary transition-colors"
              >
                Cancel release
              </button>
            </div>
          </div>
        )}
        {state === "executed" && (
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-tiny font-medium text-green-700">
                Release completed
              </span>
            </div>
            <p className="text-tiny text-green-700/70">
              $3,000.00 is now available. The review period ended without
              cancellation.
            </p>
          </div>
        )}
        {state === "cancelled" && (
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-text-tertiary" />
              <span className="text-tiny font-medium text-text-secondary">
                Release cancelled
              </span>
            </div>
            <p className="text-tiny text-text-tertiary">
              The release request was cancelled during the review period.
              Your $3,000.00 remains protected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Staged Release Demo ────────────────────────────── */

/**
 * Demonstrates a staged release where capital returns in
 * tranches over time.
 */
export function StagedReleaseDemo() {
  const [tranches, setTranches] = useState([
    { week: 1, amount: "$375.00", status: "completed" as const },
    { week: 2, amount: "$375.00", status: "completed" as const },
    { week: 3, amount: "$375.00", status: "active" as const },
    { week: 4, amount: "$375.00", status: "pending" as const },
  ]);

  const releaseNextTranche = () => {
    setTranches((prev) =>
      prev.map((t) =>
        t.status === "active" ? { ...t, status: "completed" as const } : t,
      ),
    );
    const nextPending = tranches.find((t) => t.status === "pending");
    if (nextPending) {
      setTranches((prev) =>
        prev.map((t) =>
          t.week === nextPending.week
            ? { ...t, status: "active" as const }
            : t,
        ),
      );
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-5 mb-8">
      <h3 className="text-sm font-medium text-text-primary mb-3">
        Staged release
      </h3>
      <p className="text-tiny text-text-tertiary mb-4">
        Capital returns in four weekly tranches of 25%. Each tranche
        becomes available automatically. This spreads the availability
        of capital over time.
      </p>

      <div className="space-y-2 mb-4">
        {tranches.map((tranche) => (
          <div
            key={tranche.week}
            className={cn(
              "flex items-center justify-between rounded-lg border px-4 py-3",
              tranche.status === "completed"
                ? "border-green-200 bg-green-50/30"
                : tranche.status === "active"
                ? "border-green-200 bg-green-50/50"
                : "border-border bg-surface-subtle/50",
            )}
          >
            <div className="flex items-center gap-3">
              {tranche.status === "completed" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : tranche.status === "active" ? (
                <Clock className="h-4 w-4 text-green-600" />
              ) : (
                <Layers className="h-4 w-4 text-text-muted" />
              )}
              <span
                className={cn(
                  "text-tiny",
                  tranche.status === "completed"
                    ? "text-green-700"
                    : tranche.status === "active"
                    ? "text-text-primary font-medium"
                    : "text-text-muted",
                )}
              >
                Week {tranche.week} — {tranche.amount}
              </span>
            </div>
            <span
              className={cn(
                "text-tiny",
                tranche.status === "completed"
                  ? "text-green-600"
                  : tranche.status === "active"
                  ? "text-green-600 font-medium"
                  : "text-text-muted",
              )}
            >
              {tranche.status === "completed"
                ? "Available"
                : tranche.status === "active"
                ? "Releasing today"
                : `Available week ${tranche.week}`}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={releaseNextTranche}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-subtle text-text-secondary px-4 py-2 text-tiny font-medium hover:text-text-primary hover:bg-surface-hover transition-colors"
      >
        Advance to next tranche (demo)
      </button>
    </div>
  );
}

/* ── All mocks container ────────────────────────────── */

/**
 * Container that renders all delayed release UX mock flows.
 * Used on the Intent page for preview purposes.
 */
export function DelayedReleaseMocks() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-subtle/30 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-4 w-4 text-text-tertiary" />
        <h2 className="text-sm font-medium text-text-primary">
          Delayed release previews
        </h2>
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-tiny text-text-muted ml-auto">
          research concepts
        </span>
      </div>
      <p className="text-tiny text-text-tertiary mb-6 leading-relaxed">
        These are mock flows demonstrating future release window concepts.
        No release timing logic is active. These previews exist to explore
        how delayed, scheduled, reviewed, and staged releases would feel.
      </p>

      <DelayedReleaseDemo />
      <ScheduledReleaseDemo />
      <ReviewedReleaseDemo />
      <StagedReleaseDemo />
    </div>
  );
}
