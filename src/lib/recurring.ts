// Same rule and same time zone as the backend (utils/recurring.js,
// notification.md → "Calculul primei date"):
// - no day chosen: the 1st of next month
// - a day chosen: that day this month if it is still ahead, otherwise next month
// - days 29-31 in shorter months fall on the last day of the month
// The first run is always in the future, nothing is added retroactively.
// "Today" is the day in Romania, as on the backend, so a user in another time
// zone sees the date the backend will actually use. All dates are "YYYY-MM-DD"
// and the math is done in UTC, so the browser's time zone does not move them.

const TIME_ZONE = "Europe/Bucharest";

/** Today in Romania as "YYYY-MM-DD" (en-CA formats exactly like that). */
export const todayInRomania = (): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());

const pad = (n: number) => String(n).padStart(2, "0");

// monthIndex 0-11; Date.UTC moves to the next / previous year by itself
const toDateString = (year: number, monthIndex: number, day: number) => {
  const date = new Date(Date.UTC(year, monthIndex, day));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

const daysIn = (year: number, monthIndex: number) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const onDay = (year: number, monthIndex: number, day: number) =>
  toDateString(year, monthIndex, Math.min(day, daysIn(year, monthIndex)));

/**
 * First date ("YYYY-MM-DD") a recurring item is added on, after `from`
 * ("YYYY-MM-DD", default today in Romania).
 */
export function firstRunDate(
  dayOfMonth: number | null,
  from: string = todayInRomania(),
): string {
  const [year, month] = from.split("-").map(Number);
  const monthIndex = month - 1;

  if (dayOfMonth === null) return toDateString(year, monthIndex + 1, 1);

  // "YYYY-MM-DD" strings compare like dates
  const thisMonth = onDay(year, monthIndex, dayOfMonth);
  return thisMonth > from ? thisMonth : onDay(year, monthIndex + 1, dayOfMonth);
}
