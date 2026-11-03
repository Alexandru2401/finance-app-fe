import { createContext, useContext, useState } from "react";
import { toast } from "sonner";

export interface BudgetItem {
  id: string;
  category: string;
  amount: number;
  date?: string;
  description?: string;
  notes?: string;
}

export type NewBudgetItem = Omit<BudgetItem, "id">;

interface BudgetStoreContextType {
  incomeItems: BudgetItem[];
  expenseItems: BudgetItem[];
  savingsItems: BudgetItem[];

  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;

  addIncomeItem: (payload: NewBudgetItem) => void;
  editIncomeItem: (id: string, payload: Partial<NewBudgetItem>) => void;
  deleteIncomeItem: (id: string) => void;

  addExpenseItem: (payload: NewBudgetItem) => void;
  editExpenseItem: (id: string, payload: Partial<NewBudgetItem>) => void;
  deleteExpenseItem: (id: string) => void;

  addSavingsItem: (payload: NewBudgetItem) => void;
  editSavingsItem: (id: string, payload: Partial<NewBudgetItem>) => void;
  deleteSavingsItem: (id: string) => void;
}

const BudgetStoreContext = createContext<BudgetStoreContextType | undefined>(
  undefined,
);

export function BudgetStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [incomeItems, setIncomeItems] = useState<BudgetItem[]>([
    {
      id: crypto.randomUUID(),
      category: "Salariu",
      amount: 5000,
      date: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      category: "Investitii",
      amount: 2500,
      date: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      category: "Salariu",
      amount: 5000,
      date: "2026-06-15T10:30:00.000Z",
    },
    {
      id: crypto.randomUUID(),
      category: "Investitii",
      amount: 2500,
      date: "2026-05-20T10:30:00.000Z",
    },
    {
      id: crypto.randomUUID(),
      category: "Salariu",
      amount: 5000,
      date: "2026-04-10T10:30:00.000Z",
    },
    {
      id: crypto.randomUUID(),
      category: "Investitii",
      amount: 2500,
      date: "2026-03-25T10:30:00.000Z",
    },
    {
      id: crypto.randomUUID(),
      category: "Salariu",
      amount: 5000,
      date: "2026-02-12T10:30:00.000Z",
    },
    {
      id: crypto.randomUUID(),
      category: "Investitii",
      amount: 2500,
      date: "2026-01-18T10:30:00.000Z",
    },
    {
      id: crypto.randomUUID(),
      category: "Salariu",
      amount: 5000,
      date: "2025-12-05T10:30:00.000Z",
    },
    {
      id: crypto.randomUUID(),
      category: "Investitii",
      amount: 2500,
      date: "2025-11-22T10:30:00.000Z",
    },
  ]);
  const [expenseItems, setExpenseItems] = useState<BudgetItem[]>([
    {
      id: crypto.randomUUID(),
      category: "Facturi",
      amount: 530,
      date: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      category: "Chirie",
      amount: 2500,
      date: new Date().toISOString(),
    },
  ]);
  const [savingsItems, setSavingsItems] = useState<BudgetItem[]>([
    // {
    //   id: crypto.randomUUID(),
    //   category: "Economii",
    //   amount: 1000,
    //   date: new Date().toISOString(),
    // },
  ]);

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenseItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const totalSavings = savingsItems.reduce((sum, item) => sum + item.amount, 0);

  // ── INCOME ──
  function addIncomeItem(payload: NewBudgetItem) {
    setIncomeItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ...payload },
    ]);
    toast.success("Venit adăugat");
  }
  function editIncomeItem(id: string, payload: Partial<NewBudgetItem>) {
    setIncomeItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...payload } : item)),
    );
    toast.success("Venit actualizat");
  }
  function deleteIncomeItem(id: string) {
    setIncomeItems((prev) => prev.filter((item) => item.id !== id));
    toast.error("Venit șters");
  }

  // ── EXPENSES ──
  function addExpenseItem(payload: NewBudgetItem) {
    setExpenseItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ...payload },
    ]);
    toast.success("Cheltuială adăugată");
  }
  function editExpenseItem(id: string, payload: Partial<NewBudgetItem>) {
    setExpenseItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...payload } : item)),
    );
    toast.success("Cheltuială actualizată");
  }
  function deleteExpenseItem(id: string) {
    setExpenseItems((prev) => prev.filter((item) => item.id !== id));
    toast.error("Cheltuială ștearsă");
  }

  // ── SAVINGS ──
  function addSavingsItem(payload: NewBudgetItem) {
    setSavingsItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ...payload },
    ]);
    toast.success("Economie adăugată");
  }
  function editSavingsItem(id: string, payload: Partial<NewBudgetItem>) {
    setSavingsItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...payload } : item)),
    );
    toast.success("Economie actualizată");
  }
  function deleteSavingsItem(id: string) {
    setSavingsItems((prev) => prev.filter((item) => item.id !== id));
    toast.error("Economie ștearsă");
  }

  return (
    <BudgetStoreContext.Provider
      value={{
        incomeItems,
        expenseItems,
        savingsItems,
        totalIncome,
        totalExpenses,
        totalSavings,
        addIncomeItem,
        editIncomeItem,
        deleteIncomeItem,
        addExpenseItem,
        editExpenseItem,
        deleteExpenseItem,
        addSavingsItem,
        editSavingsItem,
        deleteSavingsItem,
      }}
    >
      {children}
    </BudgetStoreContext.Provider>
  );
}

export function useBudgetStore() {
  const context = useContext(BudgetStoreContext);
  if (!context)
    throw new Error("useBudgetStore must be used within BudgetStoreProvider");
  return context;
}

export { BudgetStoreContext };
