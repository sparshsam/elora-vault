"use client";

import { cn } from "@/lib/utils";
import { ArrowDownToLine, Lock, Unlock, PiggyBank } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "LOCK_CREATED" | "LOCK_RELEASED" | "LOSS_TO_SAVINGS" | "DEPOSIT";
  amount: number;
  description: string;
  createdAt: string;
}

interface VaultTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getEventIcon(type: string) {
  switch (type) {
    case "LOCK_CREATED":
      return Lock;
    case "LOCK_RELEASED":
      return Unlock;
    case "LOSS_TO_SAVINGS":
      return PiggyBank;
    case "DEPOSIT":
      return ArrowDownToLine;
    default:
      return PiggyBank;
  }
}

function getEventColor(type: string): string {
  switch (type) {
    case "LOCK_CREATED":
      return "text-indigo-400 border-indigo-500/30 bg-indigo-500/10";
    case "LOCK_RELEASED":
      return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    case "LOSS_TO_SAVINGS":
      return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    case "DEPOSIT":
      return "text-blue-400 border-blue-500/30 bg-blue-500/10";
    default:
      return "text-gray-400 border-gray-500/30 bg-gray-500/10";
  }
}

export function VaultTimeline({ events, className }: VaultTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-6 text-gray-500", className)}>
        <PiggyBank className="h-6 w-6 mb-2 opacity-30" />
        <p className="text-xs font-medium">No vault activity yet</p>
        <p className="text-[10px] mt-1 text-center max-w-xs text-gray-600">
          Place bets or protect capital to see vault activity.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, idx) => {
        const Icon = getEventIcon(event.type);
        const colorClasses = getEventColor(event.type);
        const isLast = idx === events.length - 1;

        return (
          <div key={event.id} className="relative flex gap-3 pb-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-white/5" />
            )}

            {/* Icon circle */}
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                colorClasses,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs text-gray-300 leading-relaxed">
                {event.description}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {formatTime(event.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
