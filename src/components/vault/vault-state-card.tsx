import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui/status-pill";

type StateType = "available" | "in-motion" | "protected";

interface VaultStateCardProps {
  state: StateType;
  amount: string;
  label?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const stateStyles: Record<StateType, { bg: string; border: string }> = {
  available: {
    bg: "bg-surface",
    border: "border-border",
  },
  "in-motion": {
    bg: "bg-amber-50/50",
    border: "border-amber-200/50",
  },
  protected: {
    bg: "bg-green-50/50",
    border: "border-green-200/50",
  },
};

export function VaultStateCard({
  state,
  amount,
  label,
  onClick,
  className,
  children,
}: VaultStateCardProps) {
  const style = stateStyles[state];
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); } : undefined}
      className={cn(
        "rounded-xl border p-6 md:p-8 transition-all duration-300",
        style.bg,
        style.border,
        isClickable && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <StatusPill status={state} label={label} />
      </div>
      <p className="text-number text-text-primary">${amount}</p>
      {children}
    </div>
  );
}
