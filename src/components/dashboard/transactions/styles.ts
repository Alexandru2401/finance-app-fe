import type { Transaction } from "@/api/transactions";

type TxType = Transaction["type"];

// Badge of the transaction type
export const TYPE_STYLES: Record<TxType, string> = {
  income: "bg-finance-success-bg text-finance-success",
  expenses: "bg-finance-danger-bg text-finance-danger",
  savings: "bg-finance-primary-bg text-finance-primary",
};

export const AMOUNT_STYLES: Record<TxType, string> = {
  income: "text-finance-success",
  expenses: "text-finance-danger",
  savings: "text-finance-primary",
};

// Savings are money kept, not spent, so they get no sign
export const AMOUNT_SIGNS: Record<TxType, string> = {
  income: "+",
  expenses: "-",
  savings: "",
};
