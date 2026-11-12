import { get, getFile } from "./client";

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
  page: number;
  limit: number;
  totalPages: number;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface TransactionsParams {
  type?: "income" | "expense" | "expenses" | "savings";
  // Backend default is 15 per page, max 15
  limit?: number;
  page?: number;
  sort?: "newest" | "oldest" | "highest" | "lowest";
  // The backend searches the category name
  search?: string;
  categoryId?: string;
  year?: number;
  // 1-12
  month?: number;
  day?: number;
  minAmount?: number;
  maxAmount?: number;
}

// Same filters for the list and the CSV export
function filtersQuery(params: TransactionsParams): URLSearchParams {
  const qs = new URLSearchParams();
  // The backend uses "expense" (singular); the frontend uses "expenses"
  if (params.type)
    qs.set("type", params.type === "expenses" ? "expense" : params.type);
  if (params.sort) qs.set("sort", params.sort);
  if (params.year) qs.set("year", String(params.year));
  if (params.month) qs.set("month", String(params.month));
  if (params.day) qs.set("day", String(params.day));
  if (params.search) qs.set("search", params.search);
  if (params.categoryId) qs.set("category_id", params.categoryId);
  if (params.minAmount !== undefined)
    qs.set("minAmount", String(params.minAmount));
  if (params.maxAmount !== undefined)
    qs.set("maxAmount", String(params.maxAmount));
  return qs;
}

async function getTransactions(
  params: TransactionsParams = {},
): Promise<Result<TransactionsResponse>> {
  const qs = filtersQuery(params);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.page) qs.set("page", String(params.page));

  const response = await get<TransactionsResponse>(`/transactions?${qs}`);
  if (!response.ok) return { ok: false, error: "Could not load transactions" };
  return { ok: true, data: response.data };
}

// Years in which the user has at least one transaction, newest first
async function getTransactionYears(): Promise<number[]> {
  const response = await get<{ success: boolean; years: number[] }>(
    "/transactions/years",
  );
  if (!response.ok) throw new Error("Could not load transaction years");
  return response.data.years;
}

// CSV with every transaction matching the filters (no pagination).
// lang picks the language of the header and of the types
async function exportTransactions(
  params: TransactionsParams,
  lang: string,
): Promise<Blob> {
  const qs = filtersQuery(params);
  qs.set("lang", lang);
  const response = await getFile(`/transactions/export?${qs}`);
  if (!response.ok || !response.blob)
    throw new Error("Could not export transactions");
  return response.blob;
}

export { getTransactions, getTransactionYears, exportTransactions };
