"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { PolicySuggestion, PolicySuggestionActionType } from "@/lib/policies/policy-suggestions";

interface ConfirmActionModalProps {
  open: boolean;
  suggestion: PolicySuggestion | null;
  onConfirm: () => void;
  onCancel: () => void;
  confirming: boolean;
}

/** Action-specific copy for the confirmation button. */
function confirmLabel(action: PolicySuggestionActionType): string {
  switch (action) {
    case "create-template":
      return "Create this policy";
    case "protect-capital":
    case "reprotect-capital":
      return "Protect capital";
    case "delay-withdrawal":
      return "Enable delay";
    case "extend-horizon":
      return "Review horizons";
  }
}

/** Action-specific copy for the confirmation description. */
function confirmDescription(action: PolicySuggestionActionType): string {
  switch (action) {
    case "create-template":
      return "This will create a new behavioral policy based on the template. It will be saved as a draft — you can activate it any time.";
    case "protect-capital":
    case "reprotect-capital":
      return "This would move capital into protection. This action is currently in setup mode and will be available in a future release.";
    case "delay-withdrawal":
      return "This will enable a withdrawal cooling period policy. You can pause or remove it at any time.";
    case "extend-horizon":
      return "Review your active protection horizons to decide if they still match your intent.";
  }
}

export function ConfirmActionModal({
  open,
  suggestion,
  onConfirm,
  onCancel,
  confirming,
}: ConfirmActionModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirming) onCancel();
    },
    [onCancel, confirming],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      setAcknowledged(false);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open || !suggestion) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Confirm action"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 backdrop-blur-sm px-4"
      onClick={(e) => {
        if (e.target === overlayRef.current && !confirming) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-xl animate-in fade-in zoom-in-95 duration-300">
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-heading font-medium text-text-primary">
            {suggestion.title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors disabled:opacity-50"
            aria-label="Cancel"
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

        {/* ── BODY ── */}
        <div className="p-6 space-y-5">
          <div className="rounded-lg border border-border bg-surface-subtle p-4">
            <p className="text-small text-text-secondary leading-relaxed">
              {suggestion.body}
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
            <p className="text-tiny text-amber-800 leading-relaxed">
              {confirmDescription(suggestion.action)}
            </p>
          </div>

          {/* Template preview for policy creation */}
          {suggestion.templatePolicy && (
            <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-text-muted">
                Policy preview
              </p>
              <div className="space-y-1">
                <p className="text-small text-text-primary">
                  {suggestion.templatePolicy.title}
                </p>
                {suggestion.templatePolicy.description && (
                  <p className="text-tiny text-text-secondary leading-relaxed">
                    {suggestion.templatePolicy.description}
                  </p>
                )}
                <div className="flex gap-4 pt-1">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">
                      When
                    </p>
                    <p className="text-tiny text-text-secondary">
                      {suggestion.templatePolicy.condition.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">
                      Effect
                    </p>
                    <p className="text-tiny text-text-secondary">
                      {suggestion.templatePolicy.action.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Acknowledgement checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              disabled={confirming}
              className="mt-0.5 h-4 w-4 rounded border-border text-green-500 focus:ring-green-400 accent-green-500 cursor-pointer"
            />
            <span className="text-tiny text-text-secondary leading-relaxed select-none group-hover:text-text-primary transition-colors">
              I understand this action requires my explicit confirmation and will
              not execute automatically.
            </span>
          </label>

          {/* ── ACTIONS ── */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={confirming}
              className="text-small font-medium text-text-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!acknowledged || confirming}
              className={cn(
                "rounded-lg px-5 py-2 text-small font-medium transition-colors shadow-sm",
                !acknowledged || confirming
                  ? "bg-green-300 text-white cursor-not-allowed"
                  : "bg-green-500 text-white hover:bg-green-600",
              )}
            >
              {confirming
                ? "Creating..."
                : confirmLabel(suggestion.action)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
