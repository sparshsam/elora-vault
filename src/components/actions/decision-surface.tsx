"use client";

import { cn } from "@/lib/utils";

interface DecisionOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
}

interface DecisionSurfaceProps {
  prompt: string;
  options: [DecisionOption, DecisionOption];
  selectedOption?: string | null;
  onSelect?: (optionId: string) => void;
  className?: string;
}

export function DecisionSurface({
  prompt,
  options,
  selectedOption,
  onSelect,
  className,
}: DecisionSurfaceProps) {
  return (
    <div className={cn("w-full", className)}>
      <h2 className="text-display text-text-primary mb-8 text-balance">{prompt}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect?.(option.id)}
            className={cn(
              "flex flex-col items-start gap-4 rounded-xl border-2 p-6 md:p-8 text-left transition-all duration-300 min-h-[200px]",
              selectedOption === option.id
                ? "border-green-500 bg-green-50 shadow-sm"
                : "border-border bg-surface hover:border-green-200 hover:bg-surface-subtle hover:shadow-sm",
            )}
          >
            <div className={cn(
              "rounded-lg p-3",
              selectedOption === option.id ? "bg-green-100 text-green-600" : "bg-surface-subtle text-text-secondary",
            )}>
              {option.icon}
            </div>
            <div className="space-y-1">
              <h3 className="text-heading font-semibold text-text-primary">{option.title}</h3>
              <p className="text-body text-text-secondary">{option.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
