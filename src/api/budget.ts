import { del, get, getFile, patch, post } from "./client";
import type { BudgetItemPayload } from "@/schemas/budget-item.schema";
import { DEFAULT_PERIOD, periodMonth } from "@/lib/periods";

export interface BudgetItem {
  item_id: string;
  type: BudgetType;
  category: string;
  categoryId?: string;
  amount: number;
  date?: string;
  notes?: string;
  // Set when the item was created by a recurring rule
  recurringId?: string;
}

// Values of the budget_type enum in the DB
export type BudgetType = "income" | "expenses" | "savings";

export interface Category {
  category_id: string;
  type: BudgetType;
  name: string;
}

interface CategoriesResponse {
  success: boolean;
  categories: Category[];
}

interface CategoryResponse {
  success: boolean;
  category: Category;
  message?: string;
}
export type NewBudgetItem = Omit<BudgetItem, "item_id">;

async function getCategories(type?: BudgetType): Promise<Category[]> {
  const query = type ? `?type=${type}` : "";
  const response = await get<CategoriesResponse>(`/categories${query}`);
  if (!response.ok) throw new Error("Could not load categories");
  return response.data.categories;
}

// Keeps the HTTP status, so callers can tell e.g. 409 (duplicate) or 422 (a
// per-user limit reached: 100 categories, 20,000 transactions) from other errors
export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

// POST /categories → 201 { category }; 409 if a category with the same name and
// type already exists (case-insensitive); 400 if invalid
async function createCategory(payload: {
  type: BudgetType;
  name: string;
}): Promise<Category> {
  const response = await post<CategoryResponse | ApiError>(
    "/categories",
    payload,
  );
  if (!response.ok || !response.data || !("category" in response.data)) {
    throw new ApiRequestError(
      response.data?.message ?? "Could not create category",
      response.status,
    );
  }
  return response.data.category;
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
  return response.data.category;
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
  return response.data.category;
}

async function addNewTransaction(item: BudgetItemPayload): Promise<void> {
  const response = await post<{ message?: string }>("/transactions", {
    type: item.type,
    category_id: item.category,
    amount: item.amount,
    date: item.date,
    ...(item.notes && { notes: item.notes }),
  });
  if (!response.ok) {
    // 422 = the account reached the transaction limit (LIMIT_REACHED)
    throw new ApiRequestError(
      response.data?.message ?? "Could not add new transaction",
      response.status,
    );
  }
}

export interface UpdateTransactionPayload {
  // The category must belong to this type (400 otherwise)
  type?: BudgetType;
  amount?: number;
  date?: string;
  category_id?: string;
  // null or "" clears the note
  notes?: string | null;
}

// Every error from the backend is { success: false, message }
type ApiError = { success?: boolean; message?: string } | null;

async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload,
): Promise<void> {
  const response = await patch<ApiError>(`/transactions/${id}`, payload);
  if (!response.ok) {
    throw new Error(response.data?.message ?? "Could not update transaction");
  }
}

async function deleteTransaction(id: string): Promise<void> {
  const response = await del<ApiError>(`/transactions/${id}`);
  if (!response.ok) {
    throw new Error(response.data?.message ?? "Could not delete transaction");
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
  // null when the month inherits an earlier target
  id: string | null;
  month: string;
  inheritedFrom: string | null;
}

// The backend sends the numbers ready to use, so targets need no mapping
interface BudgetTargetResponse {
  success: boolean;
  target: MonthlyBudgetTarget | null;
}

// Defaults to the month of the overview's default period
async function getBudgetTarget(month = periodMonth(DEFAULT_PERIOD)) {
  const response = await get<BudgetTargetResponse>(`/target?month=${month}`);

  return { ok: response.ok, data: response.ok ? response.data.target : null };
}

interface AllBudgetTargetsResponse {
  success: boolean;
  targets: MonthlyBudgetTarget[];
}

// Only the months with a saved target (no inherited ones), newest first
async function getAllBudgetTargets() {
  const response = await get<AllBudgetTargetsResponse>("/target/all");

  return {
    ok: response.ok,
    data: response.ok ? response.data.targets : null,
  };
}

export type BudgetTargetValues = Pick<
  BudgetTarget,
  "income" | "expense" | "savings"
>;

// Creates the month's target or updates it. All three fields are sent:
// null clears that target (no target), a number sets it
async function saveBudgetTarget(
  month: string,
  values: BudgetTargetValues,
): Promise<MonthlyBudgetTarget> {
  const response = await post<(BudgetTargetResponse & ApiError) | null>(
    "/target",
    { month, ...values },
  );

  if (!response.ok || !response.data?.target) {
    throw new Error(response.data?.message ?? "Could not save targets");
  }
  return response.data.target;
}

// CSV with every saved target, the actual totals of that month and the
// progress; lang picks the language of the header
async function exportTargetHistory(lang: string): Promise<Blob> {
  const response = await getFile(
    `/target/export?lang=${encodeURIComponent(lang)}`,
  );
  if (!response.ok || !response.blob)
    throw new Error("Could not export target history");
  return response.blob;
}

export {
  getBudgetTarget,
  getAllBudgetTargets,
  saveBudgetTarget,
  exportTargetHistory,
};

export interface BudgetSummary {
  income: number;
  expense: number;
  savings: number;
  net: number;
  target: BudgetTarget;
  progress: BudgetTarget;
}

interface BudgetSummaryResponse {
  success: boolean;
  summary: BudgetSummary;
}

async function getBudgetSummary(period: string = DEFAULT_PERIOD) {
  const response = await get<BudgetSummaryResponse>(
    `/budget/summary?period=${period}`,
  );

  return { ok: response.ok, data: response.ok ? response.data.summary : null };
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
  topExpenses: TopExpense[];
}

async function getTopExpenses(period: string = DEFAULT_PERIOD) {
  const response = await get<TopExpensesResponse>(
    `/budget/spending/top?period=${period}`,
  );

  return {
    ok: response.ok,
    data: response.ok ? response.data.topExpenses : null,
  };
}

export { getTopExpenses };

export interface BudgetTrendPoint {
  month: string;
  income: number;
  expense: number;
  savings: number;
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
    data: response.ok ? response.data.trend : null,
  };
}

export { getBudgetTrend };

export interface CategoryTotal {
  // null = transactions whose category was deleted
  category_id: string | null;
  category: string | null;
  total: number;
}

interface CategoryTotalsResponse {
  success: boolean;
  categories: CategoryTotal[];
}

// Total per category for one type in the period, biggest first
async function getCategoryTotals(
  type: BudgetType,
  period: string = DEFAULT_PERIOD,
) {
  const response = await get<CategoryTotalsResponse>(
    `/budget/by-category?type=${type}&period=${period}`,
  );

  return {
    ok: response.ok,
    data: response.ok ? response.data.categories : null,
  };
}

export { getCategoryTotals };

// ---- Costs and savings forecast (GET /budget/costs, /budget/forecast) ----

export interface CostItem {
  // Set on the fixed costs (the recurring rule behind the row)
  recurring_id?: string;
  // null = transactions whose category was deleted
  category_id: string | null;
  category: string | null;
  amount: number;
  // Share of the list total, 0-100
  pct: number;
}

export interface CostList {
  items: CostItem[];
  // Sum of the listed items
  total: number;
}

export interface BudgetCosts {
  // Active recurring expenses (they do not depend on the period)
  fixed: CostList;
  // The 5 biggest non-recurring expense categories in the period
  variable: CostList;
}

async function getBudgetCosts(period: string = DEFAULT_PERIOD) {
  const response = await get<{ success: boolean; costs: BudgetCosts }>(
    `/budget/costs?period=${period}`,
  );
  return { ok: response.ok, data: response.ok ? response.data.costs : null };
}

export interface ForecastPoint {
  month: string;
  // Savings of a past month; null on the forecast months
  savings: number | null;
  // Forecast; set on the last real month too, so the dashed line starts there
  forecast: number | null;
}

export interface BudgetForecast {
  points: ForecastPoint[];
  // Average savings of the last 3 months; null without any month
  average: number | null;
}

// Without a period the backend uses the last 6 months; 3 forecast months
async function getBudgetForecast(period?: string) {
  const query = period ? `?period=${period}` : "";
  const response = await get<{ success: boolean; forecast: BudgetForecast }>(
    `/budget/forecast${query}`,
  );
  return {
    ok: response.ok,
    data: response.ok ? response.data.forecast : null,
  };
}

export { getBudgetCosts, getBudgetForecast };

// ---- Budget Health (GET /budget/health, analitycs.md) ----

export type HealthLabel = "excellent" | "good" | "warning" | "risk";

// The values behind each component; the frontend builds the sentence from them
export type HealthComponent =
  | {
      key: "pace";
      points: number;
      max: number;
      values: {
        spent: number;
        base: number;
        expected: number;
        fromTarget: boolean;
        pace: number;
      };
    }
  | {
      key: "savingsRate";
      points: number;
      max: number;
      values: {
        ratePct: number;
        goalPct: number;
        fromTarget: boolean;
        noIncome: boolean;
      };
    }
  | {
      key: "positiveMonths";
      points: number;
      max: number;
      values: { positive: number; months: number };
    }
  | {
      key: "trend";
      points: number;
      max: number;
      values: { projection: number; average: number; deltaPct: number };
    };

export interface BudgetHealth {
  // null = not one complete month with transactions yet
  score: number | null;
  label: HealthLabel | null;
  // The most problematic first (most points lost)
  components: HealthComponent[];
  // "YYYY-MM" and day of the month the score is for
  month: string;
  day: number;
}

// `today` = the user's day ("YYYY-MM-DD"), so the month is not the UTC one
async function getBudgetHealth(today: string) {
  const response = await get<{ success: boolean; health: BudgetHealth }>(
    `/budget/health?today=${today}`,
  );
  return { ok: response.ok, data: response.ok ? response.data.health : null };
}

export { getBudgetHealth };
