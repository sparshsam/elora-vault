"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, History, Target, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { WalletPill } from "./wallet-pill";

const navItems = [
  {
    href: "/vault",
    label: "Vault",
    icon: Shield,
  },
  {
    href: "/activity",
    label: "Activity",
    icon: History,
  },
  {
    href: "/intent",
    label: "Intent",
    icon: Target,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-border bg-surface min-h-screen">
      {/* Logo — quieter, more architectural */}
      <div className="flex items-center gap-2.5 px-6 pt-8 pb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-700" />
        </div>
        <span className="text-base font-semibold tracking-tight text-text-primary">
          Elora
        </span>
      </div>

      {/* Primary Nav — more breathing between items */}
      <nav className="flex-1 px-4 py-2 space-y-1.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-green-600" : "text-text-tertiary",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom utility zone */}
      <div className="px-4 pb-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive("/settings")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover",
          )}
        >
          <Settings
            className={cn(
              "h-4 w-4",
              isActive("/settings") ? "text-green-600" : "text-text-tertiary",
            )}
          />
          Settings
        </Link>
      </div>

      {/* Wallet area */}
      <div className="px-4 py-4 border-t border-border">
        <WalletPill />
      </div>

      {/* Sign out */}
      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-tertiary hover:text-danger hover:bg-danger/10 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
