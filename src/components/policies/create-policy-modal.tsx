"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { POLICY_TYPE_META } from "@/types/policy";
import type { PolicyType } from "@/types/policy";

interface CreatePolicyModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type FormStep = "type" | "details" | "review";

export function CreatePolicyModal({
  open,
  onClose,
  onCreated,
}: CreatePolicyModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<FormStep>("type");
  const [selectedType, setSelectedType] = useState<PolicyType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [conditionDesc, setConditionDesc] = useState("");
  const [actionDesc, setActionDesc] = useState("");
  const [protectPercentage, setProtectPercentage] = useState(30);
  const [delayHours, setDelayHours] = useState(12);
  const [thresholdAmount, setThresholdAmount] = useState(500);
  const [minAmount, setMinAmount] = useState<number | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Keyboard handler
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  function handleClose() {
    if (step === "details" || step === "review") {
      setStep("type");
      setSelectedType(null);
      setTitle("");
      setDescription("");
      setConditionDesc("");
      setActionDesc("");
      setProtectPercentage(30);
      setDelayHours(12);
      setThresholdAmount(500);
      setMinAmount(undefined);
      setError("");
    }
    onClose();
  }

  function selectType(type: PolicyType) {
    setSelectedType(type);
    const meta = POLICY_TYPE_META[type];
    setTitle(meta.label);
    setConditionDesc(meta.triggerLabel);
    setActionDesc(meta.effectLabel);
    setStep("details");
  }

  async function handleSubmit() {
    if (!selectedType || !title.trim()) {
      setError("Please provide a title for this policy.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const condition: Record<string, unknown> = {
        description:
          conditionDesc.trim() ||
          POLICY_TYPE_META[selectedType]?.triggerLabel ||
          "",
      };

      const action: Record<string, unknown> = {
        description:
          actionDesc.trim() ||
          POLICY_TYPE_META[selectedType]?.effectLabel ||
          "",
      };

      // Add type-specific parameters
      if (
        selectedType === "protect-profit-percentage" ||
        selectedType === "prediction-profit-protection"
      ) {
        action.protectPercentage = protectPercentage;
      }
      if (
        selectedType === "delayed-withdrawal" ||
        selectedType === "large-transfer-cooling"
      ) {
        action.delayHours = delayHours;
        if (selectedType === "large-transfer-cooling") {
          condition.minAmount = minAmount ?? 1000;
        }
        if (selectedType === "delayed-withdrawal") {
          action.thresholdAmount = thresholdAmount;
        }
      }

      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type: selectedType,
          description: description.trim() || undefined,
          condition,
          action,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to create policy.");
        return;
      }

      // Reset and close
      setStep("type");
      setSelectedType(null);
      setTitle("");
      setDescription("");
      setConditionDesc("");
      setActionDesc("");
      setProtectPercentage(30);
      setDelayHours(12);
      setThresholdAmount(500);
      setMinAmount(undefined);
      onCreated();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Create a policy"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 backdrop-blur-sm px-4"
      onClick={(e) => {
        if (e.target === overlayRef.current && step === "type") handleClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-xl animate-in fade-in zoom-in-95 duration-300">
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="text-heading font-medium text-text-primary">
              {step === "type"
                ? "Create a policy"
                : step === "details"
                  ? "Define your policy"
                  : "Review your policy"}
            </h2>
            {step === "type" && (
              <p className="text-small text-text-tertiary mt-1">
                Choose what kind of behavioral rule to create.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* ═══════════════════════════════════════ */}
          {/* STEP 1: Select Policy Type            */}
          {/* ═══════════════════════════════════════ */}
          {step === "type" && (
            <div className="space-y-3">
              {(Object.entries(POLICY_TYPE_META) as [PolicyType, typeof POLICY_TYPE_META[PolicyType]][]).map(
                ([type, meta]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => selectType(type)}
                    className="w-full text-left rounded-lg border border-border bg-surface-subtle p-4 hover:border-green-200 hover:bg-green-50/30 transition-all duration-200 group"
                  >
                    <p className="text-small font-medium text-text-primary group-hover:text-green-700 transition-colors">
                      {meta.label}
                    </p>
                    <p className="text-tiny text-text-tertiary mt-1 leading-relaxed">
                      {meta.description}
                    </p>
                  </button>
                ),
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* STEP 2: Define Details                */}
          {/* ═══════════════════════════════════════ */}
          {step === "details" && selectedType && (
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1.5">
                  Policy name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Protect prediction profits"
                  className="w-full rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-small text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-green-400 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1.5">
                  Description{" "}
                  <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe when and why this policy matters to you."
                  rows={2}
                  className="w-full rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-small text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-green-400 transition-all resize-none"
                />
              </div>

              {/* When — trigger condition */}
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1.5">
                  When should this happen?
                </label>
                <input
                  type="text"
                  value={conditionDesc}
                  onChange={(e) => setConditionDesc(e.target.value)}
                  placeholder="Describe the trigger"
                  className="w-full rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-small text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-green-400 transition-all"
                />
              </div>

              {/* What — action effect */}
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1.5">
                  What should Elora do?
                </label>
                <input
                  type="text"
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                  placeholder="Describe the effect"
                  className="w-full rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-small text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-green-400 transition-all"
                />
              </div>

              {/* Type-specific parameters */}
              {(selectedType === "protect-profit-percentage" ||
                selectedType === "prediction-profit-protection") && (
                <div>
                  <label className="block text-small font-medium text-text-secondary mb-1.5">
                    What percentage to protect?
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={protectPercentage}
                      onChange={(e) =>
                        setProtectPercentage(Number(e.target.value))
                      }
                      className="flex-1 h-2 rounded-full appearance-none bg-surface-hover accent-green-500 cursor-pointer"
                    />
                    <span className="text-small font-medium text-text-primary tabular-nums w-12 text-right">
                      {protectPercentage}%
                    </span>
                  </div>
                </div>
              )}

              {(selectedType === "delayed-withdrawal" ||
                selectedType === "large-transfer-cooling") && (
                <>
                  <div>
                    <label className="block text-small font-medium text-text-secondary mb-1.5">
                      Delay duration (hours)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={1}
                        max={72}
                        step={1}
                        value={delayHours}
                        onChange={(e) =>
                          setDelayHours(Number(e.target.value))
                        }
                        className="flex-1 h-2 rounded-full appearance-none bg-surface-hover accent-green-500 cursor-pointer"
                      />
                      <span className="text-small font-medium text-text-primary tabular-nums w-16 text-right">
                        {delayHours}h
                      </span>
                    </div>
                  </div>

                  {selectedType === "delayed-withdrawal" && (
                    <div>
                      <label className="block text-small font-medium text-text-secondary mb-1.5">
                        Minimum withdrawal amount ($)
                      </label>
                      <input
                        type="number"
                        value={thresholdAmount}
                        onChange={(e) =>
                          setThresholdAmount(Number(e.target.value))
                        }
                        min={0}
                        className="w-full rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-small text-text-primary focus:outline-none focus:ring-1 focus:ring-green-400 transition-all"
                      />
                    </div>
                  )}

                  {selectedType === "large-transfer-cooling" && (
                    <div>
                      <label className="block text-small font-medium text-text-secondary mb-1.5">
                        Minimum deposit amount ($)
                      </label>
                      <input
                        type="number"
                        value={minAmount ?? 1000}
                        onChange={(e) =>
                          setMinAmount(Number(e.target.value))
                        }
                        min={0}
                        className="w-full rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-small text-text-primary focus:outline-none focus:ring-1 focus:ring-green-400 transition-all"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Error */}
              {error && (
                <p className="text-tiny text-red-600">{error}</p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep("type")}
                  className="text-small font-medium text-text-tertiary hover:text-text-primary transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep("review")}
                  className="rounded-lg bg-green-500 text-white px-5 py-2 text-small font-medium hover:bg-green-600 transition-colors shadow-sm"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════ */}
          {/* STEP 3: Review                        */}
          {/* ═══════════════════════════════════════ */}
          {step === "review" && selectedType && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
                    Policy
                  </p>
                  <p className="text-small font-medium text-text-primary mt-0.5">
                    {title}
                  </p>
                </div>
                {description && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
                      Description
                    </p>
                    <p className="text-small text-text-secondary mt-0.5">
                      {description}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
                    When
                  </p>
                  <p className="text-small text-text-secondary mt-0.5">
                    {conditionDesc}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
                    Effect
                  </p>
                  <p className="text-small text-text-secondary mt-0.5">
                    {actionDesc}
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-tiny text-red-600">{error}</p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="text-small font-medium text-text-tertiary hover:text-text-primary transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={cn(
                    "rounded-lg px-5 py-2 text-small font-medium transition-colors shadow-sm",
                    submitting
                      ? "bg-green-300 text-white cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600",
                  )}
                >
                  {submitting ? "Creating..." : "Create policy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
