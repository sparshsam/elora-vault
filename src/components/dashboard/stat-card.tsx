"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
  formatter?: (value: number) => string;
}

export function StatCard({
  title,
  value,
  prefix = "$",
  suffix = "",
  icon,
  trend,
  className,
  formatter,
}: StatCardProps) {
  const displayValue = formatter ? formatter(value) : value.toFixed(2);

  return (
    <Card
      className={cn(
        "group hover:border-indigo-500/20 transition-all duration-300",
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              {prefix && (
                <span className="text-sm text-gray-400">{prefix}</span>
              )}
              <motion.span
                key={value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "text-2xl font-bold text-white tabular-nums",
                  trend === "up" && "text-emerald-400",
                  trend === "down" && "text-red-400",
                )}
              >
                {displayValue}
              </motion.span>
              {suffix && (
                <span className="text-sm text-gray-400">{suffix}</span>
              )}
            </div>
          </div>
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10 border border-indigo-500/20 group-hover:bg-indigo-600/20 transition-colors">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
