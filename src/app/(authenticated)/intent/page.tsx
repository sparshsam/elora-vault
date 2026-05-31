import { Target } from "lucide-react";

export default function IntentPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-12">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-text-primary">Intent</h1>
        <p className="text-small text-text-tertiary mt-1.5">
          Set your financial horizons.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-12 md:p-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-subtle">
            <Target className="h-5 w-5 text-text-tertiary" />
          </div>
          <p className="text-sm font-medium text-text-primary">
            No horizons yet
          </p>
          <p className="text-small text-text-tertiary mt-2 max-w-xs">
            Choose a horizon duration — 7, 30, or 90 days — and commit
            capital. Discipline compounds quietly.
          </p>
        </div>
      </div>
    </div>
  );
}
