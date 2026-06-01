import { cn } from "@/lib/utils";

interface SummaryCardProps {
  label: string;
  value: number;
  color: "green" | "muted";
  subtitle?: string;
}

const colorConfig: Record<
  string,
  { valueColor: string; labelColor: string; border: string }
> = {
  green: {
    valueColor: "text-green-700",
    labelColor: "text-green-700/70",
    border: "border-green-200/50",
  },
  muted: {
    valueColor: "text-text-tertiary",
    labelColor: "text-text-muted",
    border: "border-border",
  },
};

export function SummaryCard({ label, value, color, subtitle }: SummaryCardProps) {
  const cfg = colorConfig[color];

  return (
    <div
      className={cn(
        "rounded-xl border bg-surface shadow-sm p-4 transition-colors",
        cfg.border,
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-[0.08em] mb-2",
          cfg.labelColor,
        )}
      >
        {label}
      </p>
      <p className={cn("text-[22px] font-light tabular-nums", cfg.valueColor)}>
        {value}
      </p>
      {subtitle && (
        <p className="text-tiny text-text-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
}
