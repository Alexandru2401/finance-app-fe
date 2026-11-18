import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";

// The backend sends days as "YYYY-MM-DD" (no time). new Date("YYYY-MM-DD")
// reads them as UTC and can move the day by one; parseISO reads them in local time.
export const parseDay = (day: string): Date => parseISO(day);

const DEFAULT_DAY_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

/** "2026-11-18" -> e.g. "18 nov. 2026" / "Nov 18, 2026" in the given locale. */
export const formatDay = (
  day: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = DEFAULT_DAY_FORMAT,
): string => parseDay(day).toLocaleDateString(locale, options);

/** "2026-11" -> the first day of that month, in local time. */
export const parseMonth = (month: string): Date => parseISO(`${month}-01`);

/** Today as "YYYY-MM-DD", in local time. */
export const todayString = (): string => format(new Date(), "yyyy-MM-dd");
