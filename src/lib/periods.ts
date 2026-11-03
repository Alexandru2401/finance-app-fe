export const PERIODS = [
  "this-month",
  "last-month",
  "last-3",
  "last-6",
  "last-12",
] as const;

// Labels live in the translations, under dashboard.periods.<period>
export type Period = (typeof PERIODS)[number];

// Period selected by default in the overview; the budget page uses the same one
export const DEFAULT_PERIOD = "this-month" satisfies Period;

// Months are passed around as the backend expects them: "YYYY-MM-01"
const toMonth = (year: number, monthIndex: number) => {
  // new Date normalizes overflow, e.g. month -1 -> December of the year before
  const date = new Date(year, monthIndex, 1);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}-01`;
};

// First day of the month a single-month period covers
export function periodMonth(period: "this-month" | "last-month"): string {
  const now = new Date();
  return toMonth(now.getFullYear(), now.getMonth() - (period === "last-month" ? 1 : 0));
}

// Moves a month by `delta` months (negative = back)
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return toMonth(year, monthNumber - 1 + delta);
}

// "YYYY-MM-01" -> "YYYY-MM:YYYY-MM", the custom period covering just that month
export function monthPeriod(month: string): string {
  const yearMonth = month.slice(0, 7);
  return `${yearMonth}:${yearMonth}`;
}

// "YYYY-MM-01" -> e.g. "October 2026"; without a locale the browser's is used
export function formatMonth(month: string, locale?: string): string {
  return new Date(`${month}T00:00:00`).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}
