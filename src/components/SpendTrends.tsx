"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Transaction } from "@/lib/types";

const COLORS = [
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#a855f7",
  "#ef4444",
  "#eab308",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#6366f1",
];

interface SpendTrendsProps {
  transactions: Transaction[];
}

// Parse YYYY-MM-DD as a local date. new Date("2026-04-01") is UTC midnight,
// which lands on March 31 in US time zones and shifts spend into the wrong month.
function parseDate(dateString: string): Date {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString.trim());
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  return new Date(dateString);
}

function monthKey(dateString: string): { key: string; label: string } {
  const date = parseDate(dateString);
  if (Number.isNaN(date.getTime())) return { key: "9999-99", label: "Unknown" };
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const label = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  return { key, label };
}

export function SpendTrends({ transactions }: SpendTrendsProps) {
  const spendByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    for (const transaction of transactions) {
      if (transaction.amount >= 0) continue;
      const current = totals.get(transaction.category) ?? 0;
      totals.set(transaction.category, current + Math.abs(transaction.amount));
    }
    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total: Number(total.toFixed(2)) }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const spendByMonth = useMemo(() => {
    const totals = new Map<string, { label: string; total: number }>();
    for (const transaction of transactions) {
      if (transaction.amount >= 0) continue;
      const { key, label } = monthKey(transaction.date);
      const current = totals.get(key) ?? { label, total: 0 };
      current.total += Math.abs(transaction.amount);
      totals.set(key, current);
    }
    return Array.from(totals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, { label, total }]) => ({ month: label, total: Number(total.toFixed(2)) }));
  }, [transactions]);

  if (transactions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Spend by category</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={spendByCategory}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={1}
            >
              {spendByCategory.map((entry, index) => (
                <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Spend by month</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={spendByMonth}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Legend />
            <Bar dataKey="total" name="Spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
