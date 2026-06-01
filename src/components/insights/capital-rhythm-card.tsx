"use client";

import { cn } from "@/lib/utils";

interface CapitalRhythmCardProps {
  label: string;
  value: string;
  description: string;
  className?: string;
}

/**
 * CapitalRhythmCard — A quiet metric card.
 *
 * Shows a single capital rhythm measurement without
 * judgment, gamification, or scoring energy.
 *
 * Design: minimal border, soft typography, no icon.
 */
export function CapitalRhythmCard({
  label,
  value,
  description,
  className,
}: CapitalRhythmCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm p-5 md:p-6 transition-all duration-200 hover:shadow-md",
        className,
      )}
    >
      <span className="text-tiny font-medium uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      <p className="text-[22px] font-light tracking-tight text-text-primary mt-2 tabular-nums">
        {value}
      </p>
      <p className="text-small text-text-muted mt-1 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
