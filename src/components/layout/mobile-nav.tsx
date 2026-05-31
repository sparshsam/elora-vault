"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, History, Target, BookOpen, Settings } from "lucide-react";

const primaryItems = [
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
  {
    href: "/sessions",
    label: "Sessions",
    icon: BookOpen,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-xl">
      <div className="flex items-center justify-around py-1">
        {primaryItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 min-w-[64px] rounded-lg transition-colors",
                active
                  ? "text-green-600"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "text-green-600" : "",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-green-600" : "text-text-tertiary",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
