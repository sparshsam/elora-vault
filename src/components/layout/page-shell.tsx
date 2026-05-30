import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageShell — Consistent page wrapper.
 * Provides max-width, horizontal padding, and vertical spacing.
 * Every app page should use this as its root container.
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl px-6 py-8 md:py-10", className)}>
      {children}
    </div>
  );
}
