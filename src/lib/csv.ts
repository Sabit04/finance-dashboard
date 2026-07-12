import Papa from "papaparse";
import type { RawTransaction } from "./types";

const DATE_KEYS = ["date", "transaction date", "posted date"];
const DESCRIPTION_KEYS = ["description", "name", "merchant", "payee", "memo"];
const AMOUNT_KEYS = ["amount", "value"];
const DEBIT_KEYS = ["debit", "withdrawal"];
const CREDIT_KEYS = ["credit", "deposit"];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

function findKey(row: Record<string, string>, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  return keys.find((key) => candidates.includes(normalizeHeader(key)));
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.\-()]/g, "");
  if (!cleaned) return NaN;
  const isParenNegative = cleaned.startsWith("(") && cleaned.endsWith(")");
  const numeric = parseFloat(cleaned.replace(/[()]/g, ""));
  return isParenNegative ? -numeric : numeric;
}

export class CsvParseError extends Error {}

export function parseTransactionsCsv(csvText: string): RawTransaction[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    throw new CsvParseError(result.errors[0].message);
  }

  const rows = result.data;
  if (rows.length === 0) {
    throw new CsvParseError("The CSV file has no data rows.");
  }

  const firstRow = rows[0];
  const dateKey = findKey(firstRow, DATE_KEYS);
  const descriptionKey = findKey(firstRow, DESCRIPTION_KEYS);
  const amountKey = findKey(firstRow, AMOUNT_KEYS);
  const debitKey = findKey(firstRow, DEBIT_KEYS);
  const creditKey = findKey(firstRow, CREDIT_KEYS);

  if (!dateKey || !descriptionKey || (!amountKey && !debitKey && !creditKey)) {
    throw new CsvParseError(
      "Couldn't find date, description, and amount columns. Expected headers like Date, Description, and Amount (or Debit/Credit).",
    );
  }

  const transactions: RawTransaction[] = [];

  for (const row of rows) {
    const date = row[dateKey]?.trim();
    const description = row[descriptionKey]?.trim();
    if (!date || !description) continue;

    let amount: number;
    if (amountKey) {
      amount = parseAmount(row[amountKey] ?? "");
    } else {
      const debit = debitKey ? parseAmount(row[debitKey] || "0") : 0;
      const credit = creditKey ? parseAmount(row[creditKey] || "0") : 0;
      amount = (credit || 0) - (debit || 0);
    }

    if (Number.isNaN(amount)) continue;

    transactions.push({ date, description, amount });
  }

  if (transactions.length === 0) {
    throw new CsvParseError("No valid transaction rows were found in the file.");
  }

  return transactions;
}
