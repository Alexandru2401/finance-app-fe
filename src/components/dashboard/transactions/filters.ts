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
