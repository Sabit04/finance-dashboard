"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Transaction } from "@/lib/types";

const BAR_COLOR = "#3b82f6";

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAxis(value: number): string {
  return value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`;
}

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
          <BarChart data={spendByCategory} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={formatAxis} />
            <YAxis
              type="category"
              dataKey="category"
              width={130}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Spend"]} />
            <Bar dataKey="total" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Spend by month</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={spendByMonth}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={formatAxis} />
            <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Spend"]} />
            <Bar dataKey="total" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
