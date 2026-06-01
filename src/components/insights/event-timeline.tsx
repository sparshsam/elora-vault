"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

/* ── Types ────────────────────────────────── */

export interface TimelineEvent {
  id: string;
  type: "deposit" | "protection-created" | "protection-released" | "withdrawal" | "committed" | "return";
  amount: string;
  date: string;
  label: string;
}

/* ── Event type colors ────────────────────── */

const DOT_COLORS: Record<TimelineEvent["type"], string> = {
  deposit: "bg-green-400",
  "protection-created": "bg-green-600",
  "protection-released": "bg-green-300",
  withdrawal: "bg-text-secondary bg-opacity-30",
  committed: "bg-amber-400",
  return: "bg-green-500",
};

const DOT_LABELS: Record<TimelineEvent["type"], string> = {
  deposit: "Deposit",
  "protection-created": "Protected",
  "protection-released": "Released",
  withdrawal: "Withdrawal",
  committed: "Committed",
  return: "Return",
};

/* ── Props ────────────────────────────────── */

interface EventTimelineProps {
  events: TimelineEvent[];
}

/**
 * EventTimeline — A gentle horizontal event strip.
 *
 * Colored dots on a thin line, evenly spaced.
 * No grid, no axes, no chart framing.
 * Events can be viewed by hovering or tapping.
 */
export function EventTimeline({ events }: EventTimelineProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8">
        <p className="text-small text-text-tertiary text-center">
          No capital events yet. The timeline will populate as activity occurs.
        </p>
      </div>
    );
  }

  // Group events into months for labels
  const monthLabels: { label: string; count: number }[] = [];
  let lastMonth = "";
  let monthCount = 0;

  for (const event of events) {
    const month = new Date(event.date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    if (month !== lastMonth) {
      if (monthCount > 0) {
        monthLabels.push({ label: lastMonth, count: monthCount });
      }
      lastMonth = month;
      monthCount = 1;
    } else {
      monthCount++;
    }
  }
  if (monthCount > 0) {
    monthLabels.push({ label: lastMonth, count: monthCount });
  }

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm p-5 md:p-6">
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-thin -mx-2 px-2"
      >
        <div className="relative pt-6 pb-8 min-w-[320px]">
          {/* ── Month labels ── */}
          <div className="absolute top-0 left-0 right-0 flex">
            {events.map((event, idx) => {
              // Show month label only at month boundaries
              const eventDate = new Date(event.date);
              const monthStr = eventDate.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              });
              const prevDate = idx > 0 ? new Date(events[idx - 1].date) : null;
              const prevMonth = prevDate
                ? prevDate.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : "";
              const isNewMonth = monthStr !== prevMonth;

              return (
                <div
                  key={`label-${event.id}`}
                  className={cn(
                    "flex-1 text-center",
                    isNewMonth ? "block" : "invisible",
                  )}
                >
                  <span className="text-tiny text-text-muted font-medium">
                    {monthStr}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── Connecting line ── */}
          <div className="absolute left-4 right-4 top-[52px] h-px bg-border" />

          {/* ── Dots ── */}
          <div className="relative flex">
            {events.map((event) => {
              const isHovered = hoveredId === event.id;
              const dotColor = DOT_COLORS[event.type];

              return (
                <div
                  key={event.id}
                  className="flex-1 flex flex-col items-center"
                  onMouseEnter={() => setHoveredId(event.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Dot */}
                  <div
                    className={cn(
                      "relative z-10 h-3 w-3 rounded-full transition-all duration-200",
                      dotColor,
                      isHovered && "scale-150",
                    )}
                  />

                  {/* Tooltip / label */}
                  <div
                    className={cn(
                      "absolute mt-6 transition-all duration-200 text-center pointer-events-none",
                      isHovered
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-1",
                    )}
                  >
                    <span className="text-tiny font-medium text-text-primary whitespace-nowrap">
                      {DOT_LABELS[event.type]}
                    </span>
                    <br />
                    <span className="text-tiny text-text-muted whitespace-nowrap">
                      {event.amount}
                    </span>
                    <br />
                    <span className="text-tiny text-text-muted whitespace-nowrap">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border mt-2">
        {(Object.keys(DOT_COLORS) as TimelineEvent["type"][]).map((type) => {
          const used = events.some((e) => e.type === type);
          if (!used) return null;
          return (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  DOT_COLORS[type],
                )}
              />
              <span className="text-tiny text-text-muted">
                {DOT_LABELS[type]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
