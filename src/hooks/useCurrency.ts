import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import {
  DEFAULT_CURRENCY,
  formatCurrency,
  formatCurrencyCompact,
  isCurrency,
} from "@/lib/format";

/** The logged in user's currency and a formatter bound to it. */
export function useCurrency() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const currency = isCurrency(user?.currency)
    ? user.currency
    : DEFAULT_CURRENCY;

  const format = useCallback(
    (amount: number, sign?: "auto" | "+" | "-", fixed?: boolean) =>
      formatCurrency(amount, currency, sign, fixed, locale),
    [currency, locale],
  );

  // Rounded short form (200K RON) for places where the full amount doesn't fit
  const formatCompact = useCallback(
    (amount: number, sign?: "auto" | "+" | "-") =>
      formatCurrencyCompact(amount, currency, sign, locale),
    [currency, locale],
  );

  return { currency, format, formatCompact };
}
