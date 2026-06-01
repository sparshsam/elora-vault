import { cn } from "@/lib/utils";

type StateType = "available" | "protected" | "releasing" | "committed";

interface VaultStateCardProps {
  state: StateType;
  amount: string;
  label: string;
  description?: string;
  /** Optional horizon/info line shown below the value */
  info?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

/* ── State config: accent color, background tone, top/border treatment ── */

const stateConfig: Record<StateType, {
  accent: string;
  bg: string;
  border: string;
  labelColor: string;
  valueColor: string;
}> = {
  available: {
    accent: "bg-green-500",
    bg: "bg-surface",
    border: "border-border",
    labelColor: "text-text-tertiary",
    valueColor: "text-text-primary",
  },
  protected: {
    accent: "bg-green-500",
    bg: "bg-green-50/40",
    border: "border-green-200/50",
    labelColor: "text-green-700/70",
    valueColor: "text-green-700",
  },
  releasing: {
    accent: "bg-amber-400",
    bg: "bg-amber-50/20",
    border: "border-amber-200/30",
    labelColor: "text-amber-700/70",
    valueColor: "text-text-primary",
  },
  committed: {
    accent: "bg-amber-500",
    bg: "bg-surface",
    border: "border-border",
    labelColor: "text-amber-700/70",
    valueColor: "text-text-primary",
  },
};

export function VaultStateCard({
  state,
  amount,
  label,
  description,
  info,
  onClick,
  className,
  children,
}: VaultStateCardProps) {
  const cfg = stateConfig[state];
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.();
            }
          : undefined
      }
      className={cn(
        "relative rounded-xl border p-6 md:p-8 transition-all duration-300",
        "shadow-sm",
        cfg.bg,
        cfg.border,
        isClickable && "cursor-pointer hover:shadow-md",
        className,
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-0.5 rounded-r",
          cfg.accent,
        )}
        aria-hidden="true"
      />

      {/* Label — uppercase, no pill, no icon */}
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-[0.08em] mb-4",
          cfg.labelColor,
        )}
      >
        {label}
      </p>

      {/* Value */}
      <p className={cn("text-number", cfg.valueColor)}>${amount}</p>

      {/* Description */}
      {description && (
        <p className="text-small text-text-tertiary mt-2 leading-relaxed max-w-lg">
          {description}
        </p>
      )}

      {/* Info line (e.g. horizon count) */}
      {info && (
        <p className="text-tiny text-text-muted mt-1">{info}</p>
      )}

      {/* Actions */}
      {children && (
        <div className="mt-6 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
