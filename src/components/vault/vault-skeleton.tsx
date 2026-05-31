/**
 * VaultSkeleton — Beautiful skeleton loading state for the vault page.
 * Uses soft pulse animation matching card shapes.
 * No spinner — skeleton cards that feel calm and intentional.
 */
export function VaultSkeleton() {
  return (
    <div className="space-y-6 md:space-y-8 animate-pulse">
      {/* Heading skeleton */}
      <div className="space-y-2 mb-2">
        <div className="h-9 w-24 bg-surface-hover rounded-lg" />
        <div className="h-5 w-48 bg-surface-hover rounded-md" />
      </div>

      {/* Available skeleton */}
      <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
        <div className="h-4 w-20 bg-surface-hover rounded-full mb-4" />
        <div className="h-10 w-40 bg-surface-hover rounded-lg" />
        <div className="h-4 w-36 bg-surface-hover rounded mt-4" />
      </div>

      {/* Protected skeleton (larger, green-tinted) */}
      <div className="rounded-xl border border-green-200 bg-green-50/30 shadow-sm p-6 md:p-8">
        <div className="h-4 w-24 bg-green-200 rounded-full mb-4" />
        <div className="h-10 w-40 bg-green-200 rounded-lg" />
        <div className="h-4 w-28 bg-green-100 rounded mt-4" />
      </div>

      {/* Releasing skeleton */}
      <div className="rounded-xl border border-border bg-surface p-6 md:p-8">
        <div className="h-4 w-20 bg-surface-hover rounded-full mb-4" />
        <div className="h-10 w-36 bg-surface-hover rounded-lg" />
        <div className="h-4 w-24 bg-surface-hover rounded mt-4" />
      </div>
    </div>
  );
}
