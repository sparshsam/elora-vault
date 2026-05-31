"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, History, Target } from "lucide-react";

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

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-xl">
      <div className="flex items-center justify-around py-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors min-h-0",
                isActive
                  ? "text-green-600"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
