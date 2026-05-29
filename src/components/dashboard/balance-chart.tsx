"use client";

import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BalanceDataPoint {
  date: string;
  balance: number;
}

interface BalanceChartProps {
  data: BalanceDataPoint[];
}

export function BalanceChart({ data }: BalanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500">
        <TrendingUp className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No balance history yet</p>
        <p className="text-xs">Deposit funds and place bets to see trends</p>
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#888", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#888", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              background: "#12121a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#e8e8e8",
              fontSize: "12px",
            }}
            formatter={(value) => {
              const v = Number(value) || 0;
              return [`$${v.toFixed(2)}`, "House Balance"];
            }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#6366f1" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
