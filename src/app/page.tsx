"use client";

import { useMemo, useState } from "react";
import { BudgetAlerts } from "@/components/BudgetAlerts";
import { CsvUpload } from "@/components/CsvUpload";
import { SpendTrends } from "@/components/SpendTrends";
import { TransactionTable } from "@/components/TransactionTable";
import { parseTransactionsCsv, CsvParseError } from "@/lib/csv";
import type { AlertRating, Category, Transaction } from "@/lib/types";

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Partial<Record<Category, number>>>({});
  const [ratings, setRatings] = useState<Partial<Record<Category, AlertRating>>>({});

  const totalSpend = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.amount < 0)
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0),
    [transactions],
  );

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.amount >= 0)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions],
  );

  const categorizationAccuracy = useMemo(() => {
    if (transactions.length === 0) return null;
    const correctedCount = transactions.filter((t) => t.wasCorrected).length;
    return Math.round(((transactions.length - correctedCount) / transactions.length) * 100);
  }, [transactions]);

  async function handleFileSelected(file: File) {
    await processCsv(() => file.text());
  }

  async function handleLoadDemo() {
    await processCsv(async () => {
      const response = await fetch("/example-transactions.csv");
      if (!response.ok) throw new Error("Couldn't load the sample data.");
      return response.text();
    });
  }

  async function processCsv(getText: () => Promise<string>) {
    setError(null);
    setIsLoading(true);
    try {
      const text = await getText();
      const raw = parseTransactionsCsv(text);
      const withIds = raw.map((transaction, index) => ({
        ...transaction,
        id: `${index}-${transaction.date}-${transaction.description.slice(0, 10)}`,
      }));

      const response = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: withIds.map((t) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
          })),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to categorize transactions.");
      }

      const { categorized } = await response.json();
      const categoryById = new Map(
        categorized.map((item: { id: string; category: string }) => [item.id, item.category]),
      );

      setTransactions(
        withIds.map((transaction) => {
          const category = (categoryById.get(transaction.id) as Category) ?? "Other";
          return {
            ...transaction,
            category,
            aiCategory: category,
            wasCorrected: false,
          };
        }),
      );
      setBudgets({});
      setRatings({});
    } catch (err) {
      if (err instanceof CsvParseError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleCategoryChange(id: string, category: Category) {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id
          ? { ...transaction, category, wasCorrected: category !== transaction.aiCategory }
          : transaction,
      ),
    );
  }

  function handleBudgetChange(category: Category, budget: number) {
    setBudgets((prev) => ({ ...prev, [category]: Number.isNaN(budget) ? undefined : budget }));
  }

  function handleRate(category: Category, rating: AlertRating) {
    setRatings((prev) => ({ ...prev, [category]: rating }));
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10">
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">Personal Finance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Import a bank CSV to get AI-categorized transactions, spend trends, and budget alerts.
          </p>
        </header>

        <CsvUpload onFileSelected={handleFileSelected} isLoading={isLoading} />

        <p className="-mt-5 text-center text-sm text-gray-500">
          No CSV handy?{" "}
          <button
            type="button"
            onClick={handleLoadDemo}
            disabled={isLoading}
            className="font-medium text-blue-600 hover:underline disabled:opacity-50"
          >
            Try it with sample data
          </button>
        </p>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {transactions.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-500">Total spend</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  ${totalSpend.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-500">Total income</p>
                <p className="mt-1 text-2xl font-semibold text-green-600">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-500">Categorization accuracy</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {categorizationAccuracy}%
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  Based on how many AI categories you haven&apos;t corrected
                </p>
              </div>
            </div>

            <SpendTrends transactions={transactions} />

            <BudgetAlerts
              transactions={transactions}
              budgets={budgets}
              ratings={ratings}
              onBudgetChange={handleBudgetChange}
              onRate={handleRate}
            />

            <TransactionTable transactions={transactions} onCategoryChange={handleCategoryChange} />
          </>
        )}
      </main>
    </div>
  );
}
