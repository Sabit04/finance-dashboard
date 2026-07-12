export const CATEGORIES = [
  "Housing",
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Health & Fitness",
  "Utilities & Bills",
  "Income",
  "Transfer",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface RawTransaction {
  date: string;
  description: string;
  amount: number;
}

export interface Transaction extends RawTransaction {
  id: string;
  category: Category;
  aiCategory: Category;
  wasCorrected: boolean;
}

export type AlertRating = "relevant" | "not_relevant";

export interface BudgetAlert {
  category: Category;
  spend: number;
  budget: number;
  rating: AlertRating | null;
}
