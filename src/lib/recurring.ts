import { format } from "date-fns/format";

// Same rule as the backend (notification.md → "Calculul primei date"):
// - no day chosen: the 1st of next month
// - a day chosen: that day this month if it is still ahead, otherwise next month
// - days 29-31 in shorter months fall on the last day of the month
// The first run is always in the future, nothing is added retroactively.

const daysIn = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

const onDay = (year: number, monthIndex: number, day: number) =>
  new Date(year, monthIndex, Math.min(day, daysIn(year, monthIndex)));

/** First date ("YYYY-MM-DD", local time) a recurring item is added on. */
export function firstRunDate(
  dayOfMonth: number | null,
  today: Date = new Date(),
): string {
  const year = today.getFullYear();
  const month = today.getMonth();

  if (dayOfMonth === null)
    return format(new Date(year, month + 1, 1), "yyyy-MM-dd");

  const thisMonth = onDay(year, month, dayOfMonth);
  const run =
    thisMonth.getDate() > today.getDate()
      ? thisMonth
      : onDay(year, month + 1, dayOfMonth);
  return format(run, "yyyy-MM-dd");
}
