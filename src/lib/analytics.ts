import { PERIODS } from "@/lib/periods";
import type { BudgetTrendPoint, CategoryTotal } from "@/api/budget";
import type { RecurringItem } from "@/api/recurring";

// Pure calculations for the Analytics page, from the existing routes only:
// /budget/budget-trend, /budget/by-category and /recurring

/** "YYYY-MM" -> short month, e.g. "nov." / "Nov"; local time, no UTC shift. */
export function shortMonth(month: string, locale: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString(locale, {
    month: "short",
  });
}

/** "YYYY-MM" of the month `delta` months away from `month`. */
export function addMonths(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** The current month as "YYYY-MM", in the browser's time zone. */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export interface CostRow {
  key: string;
  label: string;
  amount: number;
  // Share of the list total, 0-100
  pct: number;
}

const withShares = (rows: Omit<CostRow, "pct">[]): CostRow[] => {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return rows.map((row) => ({
    ...row,
    pct: total > 0 ? Math.round((row.amount / total) * 100) : 0,
  }));
};

/** Fixed costs: the active recurring expenses (the amount added every month). */
export function fixedCosts(recurring: RecurringItem[]): CostRow[] {
  return withShares(
    recurring
      .filter((item) => item.is_active && item.type === "expenses")
      .sort((a, b) => b.amount - a.amount)
      .map((item) => ({
        key: item.id,
        label: item.category_name,
        amount: item.amount,
      })),
  );
}

/**
 * Variable costs: the expenses per category in the period, without the
 * categories that recur (those are the fixed costs). Biggest first, at most `limit`.
 */
export function variableCosts(
  totals: CategoryTotal[],
  recurring: RecurringItem[],
  uncategorized: string,
  limit = 5,
): CostRow[] {
  const fixedIds = new Set(
    recurring
      .filter((item) => item.is_active && item.type === "expenses")
      .map((item) => item.category_id),
  );
  return withShares(
    totals
      .filter((row) => !row.category_id || !fixedIds.has(row.category_id))
      .slice(0, limit)
      .map((row) => ({
        key: row.category_id ?? "uncategorized",
        label: row.category ?? uncategorized,
        amount: row.total,
      })),
  );
}

export interface SavingsPoint {
  month: string;
  // Savings of a past month; null on the forecast months
  savings: number | null;
  // Forecast; set on the last real month too, so the dashed line starts there
  forecast: number | null;
}

/**
 * Monthly savings (the "savings" transactions) plus a simple forecast for the
 * next `ahead` months: the average of the last 3 months.
 */
export function savingsWithForecast(
  trend: BudgetTrendPoint[],
  ahead = 3,
): SavingsPoint[] {
  if (trend.length === 0) return [];
  const points: SavingsPoint[] = trend.map((p) => ({
    month: p.month,
    savings: p.savings,
    forecast: null,
  }));

  const recent = trend.slice(-3).map((p) => p.savings);
  const average =
    Math.round((recent.reduce((s, n) => s + n, 0) / recent.length) * 100) / 100;

  const last = points[points.length - 1];
  last.forecast = last.savings;
  for (let i = 1; i <= ahead; i++) {
    points.push({
      month: addMonths(last.month, i),
      savings: null,
      forecast: average,
    });
  }
  return points;
}

export interface SpendingTip {
  key: string;
  category: string;
  // Spent last month in the category
  last: number;
  // Average of the 3 months before
  average: number;
  // How much more than the average, in %
  increasePct: number;
  // last - average: what returning to the average would save per month
  saving: number;
}

/**
 * Categories (without the recurring ones) where last month's spending was at
 * least `minIncreasePct`% above the average of the 3 months before. Complete
 * months only, so a salary on the 10th or a half-passed month do not distort it.
 */
export function spendingTips(
  lastMonth: CategoryTotal[],
  threeMonthsBefore: CategoryTotal[],
  recurring: RecurringItem[],
  uncategorized: string,
  minIncreasePct = 20,
  limit = 3,
): SpendingTip[] {
  const fixedIds = new Set(
    recurring
      .filter((item) => item.is_active && item.type === "expenses")
      .map((item) => item.category_id),
  );
  const keyOf = (row: CategoryTotal) => row.category_id ?? "uncategorized";
  const before = new Map(
    threeMonthsBefore.map((row) => [keyOf(row), row.total / 3]),
  );

  return lastMonth
    .filter((row) => !row.category_id || !fixedIds.has(row.category_id))
    .map((row) => {
      const average = before.get(keyOf(row)) ?? 0;
      return {
        key: keyOf(row),
        category: row.category ?? uncategorized,
        last: row.total,
        average,
        increasePct:
          average > 0 ? Math.round(((row.total - average) / average) * 100) : 0,
        saving: Math.round((row.total - average) * 100) / 100,
      };
    })
    .filter((tip) => tip.average > 0 && tip.increasePct >= minIncreasePct)
    .sort((a, b) => b.saving - a.saving)
    .slice(0, limit);
}

/** Expenses of the last complete month vs the average of the 3 months before it. */
export function spendingChange(
  trend: BudgetTrendPoint[],
): { last: number; average: number; changePct: number } | null {
  // trend = the 3 months before + the last complete month, oldest first
  if (trend.length < 4) return null;
  const before = trend.slice(-4, -1);
  const last = trend[trend.length - 1].expense;
  const average = before.reduce((s, p) => s + p.expense, 0) / before.length;
  if (average === 0) return null;
  return {
    last,
    average,
    changePct: Math.round(((last - average) / average) * 100),
  };
}

// ---- the period of the Analytics page ----

// The presets of the backend (?period=), plus "all" for the whole history
export const ANALYTICS_PRESETS = [...PERIODS, "all"] as const;
export type AnalyticsPreset = (typeof ANALYTICS_PRESETS)[number];

// A custom range is "YYYY-MM:YYYY-MM" (whole months, both included)
export const isCustomPeriod = (period: string) => period.includes(":");

// Same limit as the backend (utils/period.js, MAX_YEARS)
export const MAX_CUSTOM_MONTHS = 10 * 12;

/** Months from `from` to `to` ("YYYY-MM"); negative if `to` is before `from`. */
export const monthsBetween = (from: string, to: string) => {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
};

/** "YYYY-MM" -> "nov. 2025" / "Nov 2025", local time. */
export const monthYear = (month: string, locale: string) => {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString(locale, {
    month: "short",
    year: "numeric",
  });
};
