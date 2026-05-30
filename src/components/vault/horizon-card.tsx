"use client";

import { cn } from "@/lib/utils";
import { Sprout, Leaf, TreePine } from "lucide-react";

interface HorizonCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: "sprout" | "leaf" | "tree";
  selected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

const iconMap = {
  sprout: Sprout,
  leaf: Leaf,
  tree: TreePine,
};

export function HorizonCard({
  id,
  title,
  description,
  duration,
  icon,
  selected,
  onSelect,
  className,
}: HorizonCardProps) {
  const Icon = iconMap[icon];

  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className={cn(
        "relative flex flex-col items-start gap-3 rounded-xl border-2 p-6 md:p-8 text-left transition-all duration-300 min-h-[160px] w-full",
        selected
          ? "border-green-500 bg-green-50 shadow-sm"
          : "border-border bg-surface hover:border-green-200 hover:bg-surface-subtle hover:shadow-sm",
        className,
      )}
    >
      <div className={cn(
        "rounded-lg p-2.5",
        selected ? "bg-green-100 text-green-600" : "bg-surface-subtle text-text-secondary",
      )}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-heading font-semibold text-text-primary">{title}</h3>
        <p className="text-body text-text-secondary">{description}</p>
      </div>
      <span className={cn(
        "text-sm font-medium",
        selected ? "text-green-600" : "text-text-tertiary",
      )}>
        {duration}
      </span>
    </button>
  );
}
