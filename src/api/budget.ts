import { del, get, patch, post } from "./client";
import type { BudgetItemPayload } from "@/schemas/budget-item.schema";
import { DEFAULT_PERIOD, periodMonth } from "@/lib/periods";

export interface BudgetItem {
  id: string;
  type: "income" | "expenses" | "savings";
  category: string;
  categoryId?: string;
  amount: number;
  date?: string;
  notes?: string;
}

type BudgetType = "income" | "expenses" | "savings";

// The backend uses "expense" (singular); the frontend uses "expenses"
type ApiBudgetType = "income" | "expense" | "savings";

const toApiType = (type: BudgetType): ApiBudgetType =>
  type === "expenses" ? "expense" : type;

const fromApiType = (type: ApiBudgetType): BudgetType =>
  type === "expense" ? "expenses" : type;

export interface Category {
  category_id: string;
  type: BudgetType;
  name: string;
  key: string | null; // null pentru categoriile custom
}

type ApiCategory = Omit<Category, "type"> & { type: ApiBudgetType };

const fromApiCategory = (category: ApiCategory): Category => ({
  ...category,
  type: fromApiType(category.type),
});

interface CategoriesResponse {
  success: boolean;
  categories: ApiCategory[];
}

interface CategoryResponse {
  success: boolean;
  category: ApiCategory;
  message?: string;
}
export type NewBudgetItem = Omit<BudgetItem, "id">;

async function getCategories(type?: BudgetType): Promise<Category[]> {
  const query = type ? `?type=${toApiType(type)}` : "";
  const response = await get<CategoriesResponse>(`/categories${query}`);
  if (!response.ok) throw new Error("Could not load categories");
  return response.data.categories.map(fromApiCategory);
}

// Keeps the HTTP status, so callers can tell e.g. 409 (duplicate) from other errors
export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

// POST /categories → 201 { category }; 409 if a category with the same name and
// type already exists (custom or default, case-insensitive); 400 if invalid
async function createCategory(payload: {
  type: BudgetType;
  name: string;
}): Promise<Category> {
  const response = await post<CategoryResponse | ApiError>("/categories", {
    ...payload,
    type: toApiType(payload.type),
  });
  if (!response.ok || !response.data || !("category" in response.data)) {
    throw new ApiRequestError(
      response.data?.message ?? "Could not create category",
      response.status,
    );
  }
  return fromApiCategory(response.data.category);
}

// PATCH /categories/:id { name } → 200 { category }. Only the name of a custom
// category can change (not its type); 409 if the name is taken, 404 if it is
// not the user's own category
async function renameCategory(id: string, name: string): Promise<Category> {
  const response = await patch<CategoryResponse | ApiError>(
    `/categories/${id}`,
    { name },
  );
  if (!response.ok || !response.data || !("category" in response.data)) {
    throw new ApiRequestError(
      response.data?.message ?? "Could not rename category",
      response.status,
    );
  }
  return fromApiCategory(response.data.category);
}

// DELETE /categories/:id → 200 { category } with the deleted category.
// Only custom categories of the user can be deleted (404 otherwise); their
// transactions are kept, without a category
async function deleteCategory(id: string): Promise<Category> {
  const response = await del<CategoryResponse | ApiError>(`/categories/${id}`);
  if (!response.ok || !response.data || !("category" in response.data)) {
    throw new ApiRequestError(
      response.data?.message ?? "Could not delete category",
      response.status,
    );
  }
  return fromApiCategory(response.data.category);
}

async function addNewTransaction(item: BudgetItemPayload): Promise<void> {
  const response = await post<{ message?: string }>("/transactions", {
    type: toApiType(item.type),
    category_id: item.category,
    amount: item.amount,
    date: item.date,
    ...(item.notes && { notes: item.notes }),
  });
  if (!response.ok) {
    throw new Error(response.data?.message ?? "Could not add new transaction");
  }
}

export interface UpdateTransactionPayload {
  // Backend type; the category must belong to it (400 otherwise)
  type?: ApiBudgetType;
  amount?: number;
  date?: string;
  category_id?: string;
  // null or "" clears the note
  notes?: string | null;
}

// Errors come as { message } (4xx) or { error } (500)
type ApiError = { message?: string; error?: string } | null;

async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload,
): Promise<void> {
  const response = await patch<ApiError>(`/transactions/${id}`, payload);
  if (!response.ok) {
    throw new Error(
      response.data?.message ??
        response.data?.error ??
        "Could not update transaction",
    );
  }
}

async function deleteTransaction(id: string): Promise<void> {
  const response = await del<ApiError>(`/transactions/${id}`);
  if (!response.ok) {
    throw new Error(
      response.data?.message ??
        response.data?.error ??
        "Could not delete transaction",
    );
  }
}

export {
  getCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  addNewTransaction,
  updateTransaction,
  deleteTransaction,
};

// Same shape for targets and progress (%); null = not set
export interface BudgetTarget {
  income: number | null;
  expense: number | null;
  savings: number | null;
  net: number | null;
}

export interface MonthlyBudgetTarget extends BudgetTarget {
  id: string;
  month: string;
  inheritedFrom: string | null;
}

type ApiNumber = number | string | null;

type ApiBudgetTarget = {
  income: ApiNumber;
  expense: ApiNumber;
  savings: ApiNumber;
};

// GET target sends the net as "netBalance", the summary sends it as "net"
type ApiMonthlyTarget = ApiBudgetTarget & {
  id: string;
  month: string;
  inheritedFrom: string | null;
  netBalance: ApiNumber;
};

const toNullableNumber = (value: ApiNumber): number | null =>
  value === null ? null : Number(value);

const fromApiTarget = (
  target: ApiBudgetTarget,
  net: ApiNumber,
): BudgetTarget => ({
  income: toNullableNumber(target.income),
  expense: toNullableNumber(target.expense),
  savings: toNullableNumber(target.savings),
  net: toNullableNumber(net),
});

interface BudgetTargetResponse {
  success: boolean;
  target: ApiMonthlyTarget | null;
}

const fromApiMonthlyTarget = (
  target: ApiMonthlyTarget,
): MonthlyBudgetTarget => ({
  ...fromApiTarget(target, target.netBalance),
  id: target.id,
  month: target.month,
  inheritedFrom: target.inheritedFrom,
});

// Defaults to the month of the overview's default period
async function getBudgetTarget(month = periodMonth(DEFAULT_PERIOD)) {
  const response = await get<BudgetTargetResponse>(`/target?month=${month}`);

  const target = response.ok ? response.data.target : null;
  return {
    ok: response.ok,
    data: target ? fromApiMonthlyTarget(target) : null,
  };
}

interface AllBudgetTargetsResponse {
  success: boolean;
  targets: ApiMonthlyTarget[];
}

// Only the months with a saved target (no inherited ones), newest first
async function getAllBudgetTargets() {
  const response = await get<AllBudgetTargetsResponse>("/target/all");

  return {
    ok: response.ok,
    data: response.ok ? response.data.targets.map(fromApiMonthlyTarget) : null,
  };
}

export type BudgetTargetValues = Pick<
  BudgetTarget,
  "income" | "expense" | "savings"
>;

// Creates the month's target or updates it. The backend ignores null fields
// (they keep their current value), so a target cannot be cleared from here
async function saveBudgetTarget(
  month: string,
  values: BudgetTargetValues,
): Promise<MonthlyBudgetTarget> {
  const body = Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== null),
  );
  const response = await post<(BudgetTargetResponse & ApiError) | null>(
    "/target",
    { month, ...body },
  );

  if (!response.ok || !response.data?.target) {
    throw new Error(
      response.data?.message ??
        response.data?.error ??
        "Could not save targets",
    );
  }
  return fromApiMonthlyTarget(response.data.target);
}

export { getBudgetTarget, getAllBudgetTargets, saveBudgetTarget };

export interface BudgetSummary {
  income: number;
  expense: number;
  savings: number;
  net: number;
  target: BudgetTarget;
  progress: BudgetTarget;
}

type ApiBudgetTargetWithNet = ApiBudgetTarget & { net: ApiNumber };

interface BudgetSummaryResponse {
  success: boolean;
  summary: {
    income: ApiNumber;
    expense: ApiNumber;
    savings: ApiNumber;
    net: ApiNumber;
    target: ApiBudgetTargetWithNet;
    progress: ApiBudgetTargetWithNet;
  };
}

async function getBudgetSummary(period: string = DEFAULT_PERIOD) {
  const response = await get<BudgetSummaryResponse>(
    `/budget/summary?period=${period}`,
  );

  const summary = response.ok ? response.data.summary : null;
  return {
    ok: response.ok,
    // Numeric DB columns may arrive as strings, so coerce them
    data: summary
      ? {
          income: Number(summary.income),
          expense: Number(summary.expense),
          savings: Number(summary.savings),
          net: Number(summary.net),
          target: fromApiTarget(summary.target, summary.target.net),
          progress: fromApiTarget(summary.progress, summary.progress.net),
        }
      : null,
  };
}

export { getBudgetSummary };

export interface TopExpense {
  item_id: string;
  category_id: string | null;
  category: string | null;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

interface TopExpensesResponse {
  success: boolean;
  topExpenses: (Omit<TopExpense, "amount"> & { amount: string })[];
}

async function getTopExpenses(period: string = DEFAULT_PERIOD) {
  const response = await get<TopExpensesResponse>(
    `/budget/spending/top?period=${period}`,
  );

  return {
    ok: response.ok,
    data: response.ok
      ? response.data.topExpenses.map((item) => ({
          ...item,
          amount: parseFloat(item.amount),
        }))
      : null,
  };
}

export { getTopExpenses };

export interface BudgetTrendPoint {
  month: string;
  income: number;
  expense: number;
}

interface BudgetTrendResponse {
  success: boolean;
  trend: BudgetTrendPoint[];
}

// Without a period the backend returns the last 6 months
async function getBudgetTrend(period?: string) {
  const query = period ? `?period=${period}` : "";
  const response = await get<BudgetTrendResponse>(
    `/budget/budget-trend${query}`,
  );

  return {
    ok: response.ok,
    data: response.ok
      ? response.data.trend.map((point) => ({
          month: point.month,
          income: Number(point.income),
          expense: Number(point.expense),
        }))
      : null,
  };
}

export { getBudgetTrend };
