import TransactionsFilters from "@/components/dashboard/transactions/TransactionsFilters";
import TransactionsTable from "@/components/dashboard/transactions/TransactionsTable";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import BudgetForm from "@/components/dashboard/budget/BudgetForm";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import {
  DEFAULT_FILTERS,
  type TransactionFilters,
} from "@/components/dashboard/transactions/filters";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getTransactions,
  type Transaction,
  type TransactionsParams,
} from "@/api/transactions";
import {
  deleteTransaction,
  getCategories,
  updateTransaction,
  type Category,
  type UpdateTransactionPayload,
} from "@/api/budget";
import { toast } from "sonner";

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  // Net of all filtered transactions, not just this page
  net: number;
}

const SORTS: Record<string, TransactionsParams["sort"]> = {
  "date-desc": "newest",
  "date-asc": "oldest",
  "amount-desc": "highest",
  "amount-asc": "lowest",
};

// Wait for a pause in typing before searching
const SEARCH_DELAY = 300;

// No endpoint lists the years with data, so offer the last few
const YEARS = Array.from({ length: 6 }, (_, i) =>
  String(new Date().getFullYear() - i),
);

const toNumber = (value: string) =>
  value === "all" ? undefined : Number(value);
const toAmount = (value: string) =>
  value.trim() === "" ? undefined : Number(value);

export default function TransactionsPage() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  // Debounced copy of filters.search, the one sent to the backend
  const [search, setSearch] = useState(DEFAULT_FILTERS.search);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(15);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  // Key of the last request that finished; loading while it differs from the current one
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  // Key of the last request that failed; shows the error instead of the table
  const [failedKey, setFailedKey] = useState<string | null>(null);
  // Bumped after a delete so the current page is fetched again
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  function addCategory(category: Category) {
    setCategories((prev) => [...prev, category]);
  }

  // The search only reaches the backend after the user stops typing
  useEffect(() => {
    if (filters.search === search) return;
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(filters.search);
    }, SEARCH_DELAY);
    return () => clearTimeout(timeout);
  }, [filters.search, search]);

  const params = useMemo<TransactionsParams>(
    () => ({
      search: search.trim() || undefined,
      type:
        filters.type === "all"
          ? undefined
          : (filters.type as TransactionsParams["type"]),
      categoryId: filters.categoryId === "all" ? undefined : filters.categoryId,
      year: toNumber(filters.year),
      month: toNumber(filters.month),
      day: toNumber(filters.day),
      minAmount: toAmount(filters.minAmount),
      maxAmount: toAmount(filters.maxAmount),
      sort: SORTS[filters.sort] ?? "newest",
    }),
    [
      search,
      filters.type,
      filters.categoryId,
      filters.year,
      filters.month,
      filters.day,
      filters.minAmount,
      filters.maxAmount,
      filters.sort,
    ],
  );

  const request = useMemo(
    () => ({ ...params, page, limit }),
    [params, page, limit],
  );
  // refreshKey is part of the key, so a refetch after a delete shows loading too
  const requestKey = `${JSON.stringify(request)}#${refreshKey}`;
  const loading = loadedKey !== requestKey;
  const error = !loading && failedKey === requestKey;

  useEffect(() => {
    let ignore = false;

    getTransactions(request)
      .then((res) => {
        if (ignore) return;
        if (!res.ok) {
          setFailedKey(requestKey);
          return;
        }
        setFailedKey(null);
        setTransactions(res.data.transactions);
        setPagination({
          page: res.data.page,
          limit: res.data.limit,
          total: res.data.total,
          totalPages: res.data.totalPages,
          net: res.data.net,
        });
      })
      // Network error (the backend is unreachable)
      .catch(() => !ignore && setFailedKey(requestKey))
      // Also on failure, so the skeleton does not stay forever
      .finally(() => !ignore && setLoadedKey(requestKey));

    return () => {
      ignore = true;
    };
  }, [request, requestKey]);

  async function handleDelete(id: string): Promise<boolean> {
    try {
      await deleteTransaction(id);
      toast.success(t("dashboard.transactions.deleted"));
      // The last row of a page: go back one page instead of showing it empty
      if (transactions?.length === 1 && page > 1) setPage(page - 1);
      else setRefreshKey((k) => k + 1);
      return true;
    } catch {
      toast.error(t("dashboard.transactions.deleteError"));
      return false;
    }
  }

  async function handleUpdate(
    tx: Transaction,
    payload: UpdateTransactionPayload,
  ): Promise<boolean> {
    try {
      await updateTransaction(tx.item_id, payload);
    } catch (err) {
      // The backend message explains e.g. a category of another type
      toast.error(t("dashboard.transactions.updateError"), {
        description: err instanceof Error ? err.message : undefined,
      });
      return false;
    }

    // Shown right away (the open dialog reads the row), then the page is
    // fetched again, since the row may no longer match the filters / sort
    const category = payload.category_id
      ? categories.find((c) => c.category_id === payload.category_id)
      : undefined;
    setTransactions(
      (prev) =>
        prev?.map((row) =>
          row.item_id === tx.item_id
            ? {
                ...row,
                ...(payload.type && { type: payload.type }),
                ...(payload.amount !== undefined && { amount: payload.amount }),
                ...(payload.date && { date: payload.date }),
                ...(payload.notes !== undefined && {
                  notes: payload.notes?.trim() || null,
                }),
                ...(category && {
                  category_id: category.category_id,
                  category_name: category.name,
                }),
              }
            : row,
        ) ?? prev,
    );
    toast.success(t("dashboard.transactions.updated"));
    setRefreshKey((k) => k + 1);
    return true;
  }

  function changeLimit(newLimit: number) {
    setLimit(newLimit);
    // The current page may not exist with the new size
    setPage(1);
  }

  function changeFilters(patch: Partial<TransactionFilters>) {
    // Typing in the search waits for the debounce above
    const onlySearch = Object.keys(patch).every((key) => key === "search");
    if (!onlySearch) setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function clearFilters() {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
    setSearch(DEFAULT_FILTERS.search);
  }

  return (
    <section className="px-4 py-4 max-w-7xl mx-auto">
      <PageHeader
        title={t("dashboard.transactions.title")}
        subtitle={t("dashboard.transactions.subtitle")}
      >
        <Button
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="cursor-pointer gap-1.5"
        >
          <Plus size={16} />
          {t("dashboard.transactions.add")}
        </Button>
      </PageHeader>

      {/* Same form as on the Budget page; it stays open to add more in a row */}
      <Sheet open={showAddForm} onOpenChange={setShowAddForm}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t("dashboard.budget.form.title")}</SheetTitle>
            <SheetDescription>
              {t("dashboard.budget.form.subtitle")}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            {/* The list is fetched again, so the new transaction shows up
                if it matches the current filters */}
            <BudgetForm
              onCreated={() => setRefreshKey((k) => k + 1)}
              onCategoryCreated={addCategory}
            />
          </div>
        </SheetContent>
      </Sheet>
      <TransactionsFilters
        filters={filters}
        onChange={changeFilters}
        onClear={clearFilters}
        years={YEARS}
        categories={categories}
      />
      <TransactionsTable
        transactions={transactions}
        loading={loading}
        error={error}
        // A new refreshKey means a new request for the same filters
        onRetry={() => setRefreshKey((k) => k + 1)}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={changeLimit}
        onDelete={handleDelete}
        categories={categories}
        onCategoryCreated={addCategory}
        onUpdate={handleUpdate}
      />
    </section>
  );
}
