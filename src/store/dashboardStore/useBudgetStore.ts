import { useContext } from "react";
import { BudgetStoreContext } from "./BudgetStoreContext";

export function useBudgetStore() {
  const context = useContext(BudgetStoreContext);
  if (!context)
    throw new Error("useBudgetStore must be used within BudgetStoreProvider");
  return context;
}
