import { cn } from "@/lib/utils";

interface VaultEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * VaultEmptyState — Calm, complete-feeling empty state.
 * Used when there's no capital in a particular state.
 * Should feel "complete" not "unfinished."
 */
export function VaultEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: VaultEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-text-tertiary opacity-30">
          {icon}
        </div>
      )}
      <p className="text-body font-medium text-text-secondary">{title}</p>
      {description && (
        <p className="text-small text-text-tertiary mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
