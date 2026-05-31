"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ConfirmationSheetProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  className?: string;
}

export function ConfirmationSheet({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Reconsider",
  loading = false,
  className,
}: ConfirmationSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className={cn(
          "relative w-full md:w-[420px] rounded-t-2xl md:rounded-2xl bg-surface border border-border shadow-xl p-6 md:p-8",
          "md:mb-0",
          className,
        )}
      >
        <div className="md:hidden flex justify-center mb-4">
          <div className="h-1.5 w-12 rounded-full bg-border" />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-green-100 p-2">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <h3 className="text-heading font-semibold text-text-primary">{title}</h3>
        </div>

        {description && (
          <p className="text-body text-text-secondary mb-6">{description}</p>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full rounded-lg bg-green-500 text-white font-medium py-3 px-4 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full rounded-lg text-text-secondary font-medium py-2 px-4 hover:text-text-primary transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
