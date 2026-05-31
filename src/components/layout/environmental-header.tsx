"use client";

import { usePathname } from "next/navigation";
import { WalletPill } from "./wallet-pill";

const routeContext: Record<
  string,
  { title: string; description: string }
> = {
  "/vault": {
    title: "Vault",
    description: "Your protected capital",
  },
  "/activity": {
    title: "Activity",
    description: "Your financial timeline",
  },
  "/intent": {
    title: "Intent",
    description: "Set your financial horizons",
  },
  "/settings": {
    title: "Settings",
    description: "Configure your environment",
  },
  "/deposit": {
    title: "Deposit",
    description: "Add capital to your vault",
  },
  "/dashboard": {
    title: "Dashboard",
    description: "Overview",
  },
  "/bets/new": {
    title: "New Bet",
    description: "Place a wager",
  },
  "/bets/open": {
    title: "Open Bets",
    description: "Active wagers",
  },
  "/history": {
    title: "History",
    description: "Past activity",
  },
  "/transactions": {
    title: "Transactions",
    description: "All transactions",
  },
};

export function EnvironmentalHeader() {
  const pathname = usePathname();

  // Find best match - exact first, then prefix
  const context =
    routeContext[pathname] ||
    Object.entries(routeContext).find(([key]) =>
      pathname.startsWith(key),
    )?.[1] || { title: "", description: "" };

  // Don't show header on pages without context
  if (!context.title) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 md:px-8">
        {/* Page context — invisible on desktop (sidebar handles it), shown on mobile */}
        <div className="flex items-center gap-3 md:opacity-0 md:pointer-events-none md:select-none">
          <div>
            <h1 className="text-sm font-medium text-text-primary">
              {context.title}
            </h1>
            <p className="text-[11px] text-text-tertiary leading-none mt-0.5">
              {context.description}
            </p>
          </div>
        </div>

        {/* Wallet indicator — shown on desktop for environmental continuity */}
        <div className="hidden md:flex items-center">
          <WalletPill variant="minimal" />
        </div>

        {/* Mobile spacer */}
        <div className="md:hidden" />
      </div>
    </header>
  );
}
