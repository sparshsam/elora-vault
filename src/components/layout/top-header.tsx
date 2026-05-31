"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, Settings } from "lucide-react";
import { WalletControl } from "@/components/wallet/wallet-control";

const navItems = [
  { href: "/vault", label: "Vault" },
  { href: "/sessions", label: "Sessions" },
  { href: "/activity", label: "Activity" },
  { href: "/intent", label: "Intent" },
];

export function TopHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 md:px-8">
        {/* Left: Logo */}
        <Link
          href="/vault"
          className="flex items-center gap-2.5 shrink-0 transition-all duration-200 hover:opacity-70"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-green-200 bg-green-50">
            <Shield className="h-3.5 w-3.5 text-green-700" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-text-primary">
            Elora
          </span>
        </Link>

        {/* Center: Primary nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-green-50 text-green-700"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Wallet + Settings */}
        <div className="flex items-center gap-3">
          <WalletControl variant="compact" />

          <Link
            href="/settings"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
              isActive("/settings")
                ? "bg-green-50 text-green-600"
                : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover",
            )}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
