import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Section — A vertical section with consistent spacing.
 * Optional title + description header.
 */
export function Section({ children, title, description, className }: SectionProps) {
  return (
    <section className={cn("mb-10", className)}>
      {title && (
        <div className="mb-6">
          <h2 className="text-heading text-text-primary">{title}</h2>
          {description && (
            <p className="text-body text-text-secondary mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
