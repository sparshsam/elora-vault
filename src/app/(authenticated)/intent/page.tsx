import { Target } from "lucide-react";

export default function IntentPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10 md:py-12">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Target className="h-8 w-8 text-text-tertiary/40 mb-4" />
        <h1 className="text-lg font-medium text-text-primary mb-2">
          Intent
        </h1>
        <p className="text-small text-text-tertiary max-w-xs">
          Your financial horizons and goals will appear here.
        </p>
      </div>
    </div>
  );
}
