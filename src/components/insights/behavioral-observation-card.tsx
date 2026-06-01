"use client";

import { cn } from "@/lib/utils";
import type { ObservationCategory } from "@/lib/insights/behavioral-observations";

/* ── Category config ──────────────────────── */

const CATEGORY_LABELS: Record<ObservationCategory, string> = {
  "protection-behavior": "Protection behavior",
  "release-timing": "Release timing",
  "commitment-patterns": "Commitment patterns",
  "capital-separation": "Capital separation",
};

const CATEGORY_COLORS: Record<ObservationCategory, string> = {
  "protection-behavior": "text-green-700 bg-green-100",
  "release-timing": "text-amber-700 bg-amber-50",
  "commitment-patterns": "text-text-secondary bg-surface-subtle",
  "capital-separation": "text-text-secondary bg-surface-subtle",
};

/* ── Props ────────────────────────────────── */

interface BehavioralObservationCardProps {
  category: ObservationCategory;
  text: string;
  detail?: string;
}

/**
 * BehavioralObservationCard — A single observation.
 *
 * Presents behavioral patterns as soft observations.
 * No scores, rankings, or progress indicators.
 */
export function BehavioralObservationCard({
  category,
  text,
  detail,
}: BehavioralObservationCardProps) {
  const label = CATEGORY_LABELS[category];
  const colorClass = CATEGORY_COLORS[category];

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-tiny font-medium",
              colorClass,
            )}
          >
            {label}
          </span>
          <p className="text-sm text-text-primary mt-3 leading-relaxed">
            {text}
          </p>
          {detail && (
            <p className="text-small text-text-tertiary mt-2 leading-relaxed">
              {detail}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
