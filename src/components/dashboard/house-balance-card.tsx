"use client";

import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface HouseBalanceCardProps {
  balance: number;
}

export function HouseBalanceCard({ balance }: HouseBalanceCardProps) {
  return (
    <Card className="relative overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 to-transparent group hover:border-indigo-500/30 transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl" />
      <CardContent className="p-6 relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/15 border border-indigo-500/25">
            <Shield className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Vault Balance
            </p>
            <p className="text-xs text-gray-600">Available to back bets</p>
          </div>
        </div>

        <motion.div
          key={balance}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex items-baseline gap-1"
        >
          <span className="text-lg text-indigo-300">$</span>
          <span className="text-4xl sm:text-5xl font-bold text-white tracking-tight tabular-nums">
            {balance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </motion.div>

        {/* Progress bar showing vault utilization */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Vault utilization</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min((balance / (balance || 1)) * 100, 100)}%`,
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
