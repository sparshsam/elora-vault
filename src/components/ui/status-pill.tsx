import { cn } from "@/lib/utils";

type StatusType = "available" | "in-motion" | "protected";

interface StatusPillProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { color: string; defaultLabel: string }> = {
  available: {
    color: "bg-surface-subtle text-text-secondary",
    defaultLabel: "Available",
  },
  "in-motion": {
    color: "bg-warning/10 text-warning",
    defaultLabel: "In Motion",
  },
  protected: {
    color: "bg-green-100 text-green-700",
    defaultLabel: "Protected",
  },
};

export function StatusPill({ status, label, className }: StatusPillProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-tiny font-medium",
        config.color,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {label || config.defaultLabel}
    </span>
  );
}
