"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Settings,
  LogOut,
  List,
  ArrowDownToLine,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/deposit",
    label: "Deposit",
    icon: ArrowDownToLine,
  },
  {
    href: "/bets/new",
    label: "New Bet",
    icon: PlusCircle,
  },
  {
    href: "/bets/open",
    label: "Open Bets",
    icon: List,
  },
  {
    href: "/history",
    label: "Bet History",
    icon: History,
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: Wallet,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
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
    <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-[#0a0a0f] min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-white/5">
        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-xs font-bold text-white">E</span>
        </div>
        <span className="text-lg font-semibold text-white">Elora</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href))
                ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                : "text-gray-400 hover:text-white hover:bg-white/5",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/5">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Every loss becomes saved capital. The house is virtual. The discipline is real.
        </p>
      </div>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
