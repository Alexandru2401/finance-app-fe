export type Currency = "RON" | "EUR" | "USD";

// The only currencies the backend accepts
export const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "RON", label: "RON – Romanian Leu (lei)" },
  { value: "EUR", label: "EUR – Euro (€)" },
  { value: "USD", label: "USD – US Dollar ($)" },
];

// Used while the user has no currency set
export const DEFAULT_CURRENCY: Currency = "RON";

export const isCurrency = (value: unknown): value is Currency =>
  CURRENCIES.some((c) => c.value === value);

const SYMBOLS: Record<Currency, { before: string; after: string }> = {
  USD: { before: "$", after: "" },
  EUR: { before: "€", after: "" },
  RON: { before: "", after: " RON" },
};

/**
 * Formats an amount in the given currency, e.g. 1234.5 -> "$1,234.5" / "1,234.5 RON",
 * -20 -> "-€20". `fixed` always shows 2 decimals. Amounts already come in the
 * user's currency, so nothing is converted here.
 */
export function formatCurrency(
  amount: number,
  currency: Currency = DEFAULT_CURRENCY,
  sign: "auto" | "+" | "-" = "auto",
  fixed = false,
  // App language; without it the browser locale is used
  locale?: string,
) {
  const prefix = sign === "auto" ? (amount < 0 ? "-" : "") : sign;
  const { before, after } = SYMBOLS[currency];
  const value = Math.abs(amount).toLocaleString(locale, {
    minimumFractionDigits: fixed ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${prefix}${before}${value}${after}`;
}
