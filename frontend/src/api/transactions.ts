import { get } from "./client";

export interface Transaction {
  item_id: string;
  type: "income" | "expense" | "savings";
  amount: number;
  date: string;
  category_id: string | null;
  category_name: string | null;
  notes: string | null;
}

interface TransactionsResponse {
  success: boolean;
  transactions: Transaction[];
  // Count of all transactions matching the filters (not just this page)
  total: number;
  net: number;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

interface TransactionsParams {
  type?: "income" | "expenses" | "savings";
  // Backend default is 10 per page, max 100
  limit?: number;
  page?: number;
  sort?: "newest" | "oldest";
  year?: number;
  // 1-12
  month?: number;
}

async function getTransactions(
  params: TransactionsParams = {},
): Promise<Result<TransactionsResponse>> {
  const qs = new URLSearchParams();
  // The backend uses "expense" (singular); the frontend uses "expenses"
  if (params.type)
    qs.set("type", params.type === "expenses" ? "expense" : params.type);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.page) qs.set("page", String(params.page));
  if (params.sort) qs.set("sort", params.sort);
  if (params.year) qs.set("year", String(params.year));
  if (params.month) qs.set("month", String(params.month));

  const response = await get<TransactionsResponse>(`/transactions?${qs}`);
  if (!response.ok) return { ok: false, error: "Could not load transactions" };
  return { ok: true, data: response.data };
}

export { getTransactions };
