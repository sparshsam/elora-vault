import { cn } from "@/lib/utils";
import { Clock, ExternalLink, Shield } from "lucide-react";

interface LockItem {
  id: string;
  amount: string;
  releaseDate: string;
  progress: number;
  txHash?: string;
  baseScanUrl?: string;
}

interface ProtectedCapitalPanelProps {
  locks: LockItem[];
  className?: string;
}

function LockCard({ lock }: { lock: LockItem }) {
  return (
    <div className="rounded-lg border border-green-200 bg-surface shadow-sm p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg font-semibold text-green-700">${lock.amount}</span>
        <span className="inline-flex items-center gap-1 text-tiny font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
          <Shield className="h-3 w-3" />
          Protected
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-tiny text-text-secondary mb-3">
        <Clock className="h-3 w-3" />
        <span>Horizon ends {lock.releaseDate}</span>
      </div>
      <div className="h-1.5 rounded-full bg-green-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${lock.progress}%` }}
        />
      </div>
      {lock.txHash && lock.baseScanUrl && (
        <a
          href={`${lock.baseScanUrl}/tx/${lock.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-tiny text-text-tertiary hover:text-green-600 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          View on BaseScan
        </a>
      )}
    </div>
  );
}

export function ProtectedCapitalPanel({ locks, className }: ProtectedCapitalPanelProps) {
  if (locks.length === 0) {
    return (
      <div className={cn("rounded-xl border border-dashed border-border p-8 text-center", className)}>
        <p className="text-body text-text-tertiary">No active horizons.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {locks.map((lock) => (
        <LockCard key={lock.id} lock={lock} />
      ))}
    </div>
  );
}
