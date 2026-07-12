"use client";

import { CATEGORIES, type Category, type Transaction } from "@/lib/types";

interface TransactionTableProps {
  transactions: Transaction[];
  onCategoryChange: (id: string, category: Category) => void;
}

export function TransactionTable({ transactions, onCategoryChange }: TransactionTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Description</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Category</th>
            <th className="px-4 py-2 text-right font-medium text-gray-500">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="px-4 py-2 whitespace-nowrap text-gray-600">{transaction.date}</td>
              <td className="px-4 py-2 text-gray-900">{transaction.description}</td>
              <td className="px-4 py-2">
                <select
                  value={transaction.category}
                  onChange={(event) =>
                    onCategoryChange(transaction.id, event.target.value as Category)
                  }
                  className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ${
                    transaction.wasCorrected
                      ? "bg-amber-50 text-amber-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                  title={
                    transaction.wasCorrected
                      ? `AI originally guessed "${transaction.aiCategory}"`
                      : "AI-categorized"
                  }
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </td>
              <td
                className={`px-4 py-2 text-right font-medium whitespace-nowrap ${
                  transaction.amount < 0 ? "text-gray-900" : "text-green-600"
                }`}
              >
                {transaction.amount < 0 ? "-" : "+"}$
                {Math.abs(transaction.amount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
