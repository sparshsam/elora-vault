import { cn } from "@/lib/utils";

type StatusType = "available" | "in-motion" | "protected";

interface StatusPillProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { color: string; defaultLabel: string }> = {
  available: {
    color: "bg-gray-200 text-gray-700",
    defaultLabel: "Available",
  },
  "in-motion": {
    color: "bg-amber-100 text-amber-700",
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
