import { cn } from "@/lib/utils";

interface BalanceDisplayProps {
  amount: string;
  label: string;
  currency?: string;
  className?: string;
  size?: "default" | "large";
}

export function BalanceDisplay({
  amount,
  label,
  currency = "USDC",
  className,
  size = "default",
}: BalanceDisplayProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-tiny font-medium text-text-tertiary uppercase tracking-wide">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className={cn(
          size === "large" ? "text-hero" : "text-number",
          "font-light text-text-primary tabular-nums",
        )}>
          {amount}
        </span>
        <span className={cn(
          size === "large" ? "text-heading" : "text-body",
          "font-medium text-text-tertiary",
        )}>
          {currency}
        </span>
      </div>
    </div>
  );
}
