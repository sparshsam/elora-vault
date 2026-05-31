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

  return (
    <aside className="hidden md:flex flex-col w-56 border-r border-border bg-surface min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6 border-b border-border">
        <div className="h-8 w-8 rounded-xl bg-green-500 flex items-center justify-center">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold text-text-primary">Elora</span>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-3 pb-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            pathname === "/settings"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "text-text-tertiary hover:text-text-secondary hover:bg-surface-hover",
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>

      {/* Wallet Pill */}
      <div className="px-3 py-3 border-t border-border">
        <WalletPill />
      </div>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-border">
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
