"use client";

import { useMemo } from "react";
import type { AlertRating, Category, Transaction } from "@/lib/types";

function money(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface BudgetAlertsProps {
  transactions: Transaction[];
  budgets: Partial<Record<Category, number>>;
  ratings: Partial<Record<Category, AlertRating>>;
  onBudgetChange: (category: Category, budget: number) => void;
  onRate: (category: Category, rating: AlertRating) => void;
}

export function BudgetAlerts({
  transactions,
  budgets,
  ratings,
  onBudgetChange,
  onRate,
}: BudgetAlertsProps) {
  const spendByCategory = useMemo(() => {
    const totals = new Map<Category, number>();
    for (const transaction of transactions) {
      if (transaction.amount >= 0) continue;
      totals.set(
        transaction.category,
        (totals.get(transaction.category) ?? 0) + Math.abs(transaction.amount),
      );
    }
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const alerts = spendByCategory.filter(
    ([category, spend]) => budgets[category] != null && spend > (budgets[category] ?? 0),
  );

  const ratedAlerts = alerts.filter(([category]) => ratings[category] != null);
  const relevantCount = ratedAlerts.filter(([category]) => ratings[category] === "relevant").length;
  const relevanceRate =
    ratedAlerts.length > 0 ? Math.round((relevantCount / ratedAlerts.length) * 100) : null;

  if (transactions.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Budget alerts</h3>
        {relevanceRate !== null && (
          <span className="text-xs font-medium text-gray-500">
            Alert relevance: {relevanceRate}% ({ratedAlerts.length} rated)
          </span>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {spendByCategory.map(([category, spend]) => (
          <label key={category} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-gray-700">
              {category} <span className="text-gray-500">(${money(spend, 0)})</span>
            </span>
            <input
              type="number"
              placeholder="Budget"
              min={0}
              value={budgets[category] ?? ""}
              onChange={(event) =>
                onBudgetChange(
                  category,
                  event.target.value === "" ? NaN : Number(event.target.value),
                )
              }
              className="w-20 rounded border border-gray-300 bg-white px-1.5 py-0.5 text-right text-gray-900 placeholder:text-gray-400"
            />
          </label>
        ))}
      </div>

      {alerts.length === 0 ? (
        <p className="text-xs text-gray-500">
          No categories are over budget. Set a budget above to get alerts.
        </p>
      ) : (
        <ul className="space-y-2">
          {alerts.map(([category, spend]) => (
            <li
              key={category}
              className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800"
            >
              <span>
                You spent <strong>${money(spend)}</strong> on {category}, over your $
                {money(budgets[category] ?? 0)} budget.
              </span>
              <span className="flex gap-1">
                <button
                  onClick={() => onRate(category, "relevant")}
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    ratings[category] === "relevant"
                      ? "bg-red-600 text-white"
                      : "bg-white text-red-700 hover:bg-red-100"
                  }`}
                >
                  Relevant
                </button>
                <button
                  onClick={() => onRate(category, "not_relevant")}
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    ratings[category] === "not_relevant"
                      ? "bg-gray-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Not relevant
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
