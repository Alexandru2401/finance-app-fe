import { isValidTargetAmount } from "@/lib/validation";

export interface TransactionFilters {
  search: string;
  year: string;
  month: string;
  day: string;
  type: string;
  // "all" or a category_id; the backend filters by a single category
  categoryId: string;
  minAmount: string;
  maxAmount: string;
  sort: string;
}

// Days in the selected month; 29 for February without a year (leap years
// have it) and 31 without a month
export function daysInMonth(year: string, month: string): number {
  if (month === "all") return 31;
  const y = year === "all" ? 2024 : Number(year);
  // Day 0 of the next month = last day of this month
  return new Date(y, Number(month), 0).getDate();
}

export const DEFAULT_FILTERS: TransactionFilters = {
  search: "",
  year: "all",
  month: "all",
  day: "all",
  type: "all",
  categoryId: "all",
  minAmount: "",
  maxAmount: "",
  sort: "date-desc",
};

const FILTER_KEYS = Object.keys(
  DEFAULT_FILTERS,
) as (keyof TransactionFilters)[];

// The sort values of the table headers (TransactionsPage maps them to the API)
export const SORT_KEYS = ["date-desc", "date-asc", "amount-desc", "amount-asc"];

const isIntIn = (value: string, min: number, max: number) =>
  /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max;

// The amount filters: empty, or >= 0 with at most 2 decimals (as the backend)
export const isValidFilterAmount = (value: string) =>
  value.trim() === "" || isValidTargetAmount(Number(value));

// What a filter accepts from the URL ("all" = no filter)
const URL_RULES: Partial<
  Record<keyof TransactionFilters, (value: string) => boolean>
> = {
  year: (v) => v === "all" || /^\d{4}$/.test(v),
  month: (v) => v === "all" || isIntIn(v, 1, 12),
  day: (v) => v === "all" || isIntIn(v, 1, 31),
  type: (v) => ["all", "income", "expenses", "savings"].includes(v),
  categoryId: (v) =>
    v === "all" ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
  minAmount: isValidFilterAmount,
  maxAmount: isValidFilterAmount,
  sort: (v) => SORT_KEYS.includes(v),
};

// Filters from the URL (?type=expenses&year=2026...); missing or invalid ones
// (e.g. ?minAmount=abc, edited by hand) stay default
export function filtersFromParams(params: URLSearchParams): TransactionFilters {
  const filters = { ...DEFAULT_FILTERS };
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value === null) continue;
    const isValid = URL_RULES[key];
    if (!isValid || isValid(value)) filters[key] = value;
  }
  return filters;
}

// Only the filters that differ from the default, so the URL stays short
export function filtersToParams(filters: TransactionFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    if (filters[key] !== DEFAULT_FILTERS[key]) params.set(key, filters[key]);
  }
  return params;
}
