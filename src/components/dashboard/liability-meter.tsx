"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LiabilityMeterProps {
  currentExposure: number;
  maxExposure: number;
  label?: string;
  className?: string;
}

export function LiabilityMeter({
  currentExposure,
  maxExposure,
  label = "Vault Exposure",
  className,
}: LiabilityMeterProps) {
  const percentage =
    maxExposure > 0 ? Math.min((currentExposure / maxExposure) * 100, 100) : 0;

  const getBarColor = () => {
    if (percentage < 50) return "bg-emerald-500";
    if (percentage < 80) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusText = () => {
    if (percentage === 0) return "No exposure";
    if (percentage < 50) return "Low risk";
    if (percentage < 80) return "Moderate risk";
    if (percentage < 100) return "High risk";
    return "Max exposure";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {label}
        </span>
        <span
          className={cn(
            "text-xs font-medium",
            percentage < 50 && "text-emerald-400",
            percentage >= 50 && percentage < 80 && "text-amber-400",
            percentage >= 80 && "text-red-400",
          )}
        >
          {getStatusText()}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full transition-colors", getBarColor())}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          ${currentExposure.toFixed(2)} exposed
        </span>
        <span>
          ${maxExposure.toFixed(2)} max
        </span>
      </div>
    </div>
  );
}
