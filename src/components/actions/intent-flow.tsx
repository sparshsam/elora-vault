"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

interface IntentStep {
  id: string;
  label: string;
}

interface IntentFlowProps {
  steps: IntentStep[];
  currentStep: number;
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function IntentFlow({
  steps,
  currentStep,
  onBack,
  children,
  className,
}: IntentFlowProps) {
  const isFirstStep = currentStep === 0;

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div className="flex items-center gap-3 mb-8">
        {onBack && !isFirstStep && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors duration-300",
                  i <= currentStep ? "bg-green-500" : "bg-border",
                )}
              />
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-px w-6 transition-colors duration-300",
                    i < currentStep ? "bg-green-500" : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <span className="text-tiny text-text-tertiary font-medium ml-auto">
          {steps[currentStep]?.label}
        </span>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {children}
      </div>
    </div>
  );
}
