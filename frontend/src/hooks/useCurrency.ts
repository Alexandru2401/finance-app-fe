import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_CURRENCY, formatCurrency, isCurrency } from "@/lib/format";

/** The logged in user's currency and a formatter bound to it. */
export function useCurrency() {
  const { user } = useAuth();
  const currency = isCurrency(user?.currency) ? user.currency : DEFAULT_CURRENCY;

  const format = useCallback(
    (amount: number, sign?: "auto" | "+" | "-", fixed?: boolean) =>
      formatCurrency(amount, currency, sign, fixed),
    [currency],
  );

  return { currency, format };
}
