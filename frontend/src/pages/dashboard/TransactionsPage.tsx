import TransactionsFilters from "@/components/dashboard/transactions/TransactionsFilters";
import TransactionsTable from "@/components/dashboard/transactions/TransactionsTable";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import {
  DEFAULT_FILTERS,
  type TransactionFilters,
} from "@/components/dashboard/transactions/filters";

import { useEffect, useMemo, useState } from "react";
import { getTransactions, type Transaction } from "@/api/transactions";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);

  useEffect(() => {
    getTransactions({ limit: 10, sort: "newest" })
      .then((res) => res.ok && setTransactions(res.data.transactions))
      .finally(() => setLoading(false));
  }, []);

  const years = useMemo(() => {
    if (!transactions) return [];
    const unique = new Set(
      transactions.map((t) => String(new Date(t.date).getFullYear())),
    );
    return Array.from(unique).sort((a, b) => Number(b) - Number(a));
  }, [transactions]);

  const categories = useMemo(() => {
    if (!transactions) return [];
    const names = transactions
      .map((t) => t.category_name)
      .filter((name): name is string => name !== null);
    return Array.from(new Set(names)).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return null;

    const search = filters.search.trim().toLowerCase();
    const min = filters.minAmount ? parseFloat(filters.minAmount) : null;
    const max = filters.maxAmount ? parseFloat(filters.maxAmount) : null;

    const result = transactions.filter((t) => {
      const d = new Date(t.date);

      // No title anymore: search in notes and category name
      if (
        search &&
        !`${t.notes ?? ""} ${t.category_name ?? ""}`
          .toLowerCase()
          .includes(search)
      )
        return false;
      if (filters.year !== "all" && String(d.getFullYear()) !== filters.year)
        return false;
      if (filters.month !== "all" && String(d.getMonth() + 1) !== filters.month)
        return false;
      if (filters.day !== "all" && String(d.getDate()) !== filters.day)
        return false;
      if (filters.type !== "all" && t.type !== filters.type) return false;
      if (
        filters.categories.length > 0 &&
        (!t.category_name || !filters.categories.includes(t.category_name))
      )
        return false;
      if (min !== null && t.amount < min) return false;
      if (max !== null && t.amount > max) return false;

      return true;
    });

    result.sort((a, b) => {
      switch (filters.sort) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        case "date-desc":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [transactions, filters]);

  return (
    <section className="px-4 py-4 max-w-7xl mx-auto">
      <PageHeader
        title="Transactions"
        subtitle="Take a look over all your transactions."
      />
      <TransactionsFilters
        filters={filters}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onClear={() => setFilters(DEFAULT_FILTERS)}
        years={years}
        categories={categories}
      />
      <TransactionsTable
        transactions={filteredTransactions}
        loading={loading}
      />
    </section>
  );
}
