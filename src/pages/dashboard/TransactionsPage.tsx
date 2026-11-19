import TransactionsFilters from "@/components/dashboard/transactions/TransactionsFilters";
import TransactionsTable from "@/components/dashboard/transactions/TransactionsTable";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import PageTour, {
  type TourStep,
} from "@/components/dashboard/shared/PageTour";
import BudgetForm from "@/components/dashboard/budget/BudgetForm";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/dashboard/shared/ResponsiveSheet";
import { Plus } from "lucide-react";
import {
  DEFAULT_FILTERS,
  daysInMonth,
  filtersFromParams,
  isValidFilterAmount,
  filtersToParams,
  type TransactionFilters,
} from "@/components/dashboard/transactions/filters";

import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import type { SearchNavigationState } from "@/components/dashboard/shared/RemountOnSearch";
import { useTranslation } from "react-i18next";
import {
  exportTransactions,
  getTransactions,
  getTransactionYears,
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

// Rows per page, fixed
const PAGE_SIZE = 15;

// Wait for a pause in typing before searching
const SEARCH_DELAY = 300;

const toNumber = (value: string) =>
  value === "all" ? undefined : Number(value);
// An invalid amount (e.g. 3 decimals while typing) is not sent: the backend
// answers 400 to it
const toAmount = (value: string) =>
  value.trim() === "" || !isValidFilterAmount(value)
    ? undefined
    : Number(value);

const TRANSACTIONS_TOUR: TourStep<"transactions">[] = [
  { key: "add" },
  { key: "filters" },
  { key: "table" },
];

export default function TransactionsPage() {
  const { t, i18n } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  // Read from the URL once, so the filters survive a refresh / Back
  const [filters, setFilters] = useState<TransactionFilters>(() =>
    filtersFromParams(searchParams),
  );
  // Debounced copy of filters.search, the one sent to the backend
  const [search, setSearch] = useState(filters.search);
  const [categories, setCategories] = useState<Category[]>([]);
  // Years with transactions, from the backend (newest first)
  const [years, setYears] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  // Key of the last request that finished; loading while it differs from the current one
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  // Key of the last request that failed; shows the error instead of the table
  const [failedKey, setFailedKey] = useState<string | null>(null);
  // Bumped after a delete so the current page is fetched again
  const [refreshKey, setRefreshKey] = useState(0);
  // ?add=1 (the "Add transaction" action of the global search) opens the form
  const [showAddForm, setShowAddForm] = useState(
    () => searchParams.get("add") === "1",
  );
  const [exporting, setExporting] = useState(false);
  // Categories / years (the filter options) failed; "Try again" reloads both
  const [optionsError, setOptionsError] = useState(false);
  const [optionsAttempt, setOptionsAttempt] = useState(0);
  const retryOptions = () => {
    setOptionsError(false);
    setOptionsAttempt((n) => n + 1);
  };

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setOptionsError(true));
  }, [optionsAttempt]);

  // Fetched again after every change (add / edit / delete), since a
  // transaction can add or remove a year
  useEffect(() => {
    let ignore = false;
    getTransactionYears()
      .then((data) => !ignore && setYears(data.map(String)))
      .catch(() => !ignore && setOptionsError(true));
    return () => {
      ignore = true;
    };
  }, [refreshKey, optionsAttempt]);

  // The selected year stays in the list even if it no longer has transactions
  const yearOptions =
    filters.year !== "all" && !years.includes(filters.year)
      ? [...years, filters.year].sort((a, b) => Number(b) - Number(a))
      : years;

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

  // Filters -> URL; replace, so every change does not add a history entry.
  // The debounced search is used, so the URL does not change on every key.
  // The global search nonce is kept in the navigation state: dropping it would
  // mount the page again (RemountOnSearch). Only the number is a dependency;
  // the state object is a new copy after every URL change
  const searchNonce = (useLocation().state as SearchNavigationState | null)
    ?.searchNonce;
  useEffect(() => {
    setSearchParams(filtersToParams({ ...filters, search }), {
      replace: true,
      state: searchNonce === undefined ? undefined : { searchNonce },
    });
  }, [filters, search, setSearchParams, searchNonce]);

  const request = useMemo(
    () => ({ ...params, page, limit: PAGE_SIZE }),
    [params, page],
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

  // Same filters as the table, without pagination
  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = await exportTransactions(params, i18n.language);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("dashboard.transactions.filters.exportError"));
    } finally {
      setExporting(false);
    }
  }

  function changeFilters(patch: Partial<TransactionFilters>) {
    // Typing in the search waits for the debounce above
    const onlySearch = Object.keys(patch).every((key) => key === "search");
    if (!onlySearch) setPage(1);
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      // e.g. day 31 and then February: the day no longer exists
      if (
        next.day !== "all" &&
        Number(next.day) > daysInMonth(next.year, next.month)
      ) {
        next.day = "all";
      }
      return next;
    });
  }

  function clearFilters() {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
    setSearch(DEFAULT_FILTERS.search);
  }

  return (
    <section className="px-4 py-4 max-w-7xl mx-auto">
      {/* The actions (tour, add) live in the toolbar under the title, with
          the search: tour, search, export, filters, add */}
      <PageHeader
        title={t("dashboard.transactions.title")}
        subtitle={t("dashboard.transactions.subtitle")}
      />

      {/* Same form as on the Budget page; it stays open to add more in a row */}
      <ResponsiveSheet
        open={showAddForm}
        onOpenChange={setShowAddForm}
        title={t("dashboard.budget.form.title")}
        description={t("dashboard.budget.form.subtitle")}
        className="sm:max-w-xl"
      >
        {/* The list is fetched again, so the new transaction shows up
            if it matches the current filters */}
        <BudgetForm
          onCreated={() => setRefreshKey((k) => k + 1)}
          onCategoryCreated={addCategory}
        />
      </ResponsiveSheet>
      <TransactionsFilters
        start={
          <PageTour
            tour="transactions"
            steps={TRANSACTIONS_TOUR}
            className="h-8 shrink-0 @3xl:h-9"
          />
        }
        end={
          // Icon only on phones, like the Guided tour button
          <Button
            data-tour="add"
            onClick={() => setShowAddForm(true)}
            className="h-8 shrink-0 cursor-pointer gap-2 px-3 @3xl:h-9"
            aria-label={t("dashboard.transactions.add")}
          >
            <Plus size={16} aria-hidden="true" />
            <span className="hidden @md:inline">
              {t("dashboard.transactions.add")}
            </span>
          </Button>
        }
        filters={filters}
        optionsError={optionsError}
        onRetryOptions={retryOptions}
        onChange={changeFilters}
        onClear={clearFilters}
        years={yearOptions}
        onExport={handleExport}
        exporting={exporting}
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
        onDelete={handleDelete}
        categories={categories}
        onCategoryCreated={addCategory}
        onUpdate={handleUpdate}
        sort={filters.sort}
        onSortChange={(sort) => changeFilters({ sort })}
      />
    </section>
  );
}
