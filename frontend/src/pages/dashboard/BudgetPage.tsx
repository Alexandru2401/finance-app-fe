import BudgetForm from "@/components/dashboard/budget/BudgetForm";
import ItemCard from "@/components/dashboard/budget/ItemCard";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, Target } from "lucide-react";
import { useEffect, useState } from "react";

import ExtraInfo from "@/components/dashboard/budget/ExtraInfo";
import Insights from "@/components/dashboard/budget/Insights";
import SummaryCards from "@/components/dashboard/budget/SummaryCards";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TargetsPanel from "@/components/dashboard/budget/TargetsPanel";
import {
  deleteTransaction,
  getBudgetSummary,
  type BudgetItem,
  type BudgetSummary,
  type BudgetTarget,
  type BudgetTargetValues,
  type UpdateTransactionPayload,
  saveBudgetTarget,
  updateTransaction,
} from "@/api/budget";
import { getTransactions, type Transaction } from "@/api/transactions";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { toast } from "sonner";
import {
  DEFAULT_PERIOD,
  formatMonth,
  monthPeriod,
  periodMonth,
  shiftMonth,
} from "@/lib/periods";

function toBudgetItem(t: Transaction): BudgetItem {
  return {
    id: t.item_id,
    type: t.type === "expense" ? "expenses" : t.type,
    category: t.category_name ?? "Uncategorized",
    categoryId: t.category_id ?? undefined,
    amount: Number(t.amount),
    date: t.date,
    notes: t.notes ?? undefined,
  };
}

const EMPTY_TARGET: BudgetTarget = {
  income: null,
  expense: null,
  savings: null,
  net: null,
};

function SummaryCardsSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0">
      {[0, 1, 2, 3].map((i) => (
        <Card
          key={i}
          className="border min-w-[80%] snap-center shrink-0 md:min-w-0 md:shrink"
        >
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-20" />
            <div className="mt-3 space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ItemListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-1 h-3 w-40" />
      </CardHeader>
      <CardContent className="space-y-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-1.5"
          >
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-col gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="ml-auto h-4 w-14 shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export interface Section {
  title: string;
  items: BudgetItem[];
  total: number;
  section: "income" | "expenses" | "savings";
  onDelete: (id: string) => void;
  onEdit: (id: string, payload: UpdateTransactionPayload) => void;
}

export default function BudgetPage() {
  // Cached per tab so refetches and tab switches keep showing the last data
  // instead of flashing a skeleton; undefined = not loaded yet
  const [itemsByTab, setItemsByTab] = useState<
    Partial<Record<"income" | "expenses" | "savings", BudgetItem[]>>
  >({});
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  // Bumped after any change so the list and the totals are fetched again
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"income" | "expenses" | "savings">(
    "income",
  );

  const [showForm, setShowForm] = useState(false);

  const [openTargets, setOpenTargets] = useState(false);

  // Month the whole page shows (YYYY-MM-01); starts on the overview's default
  const currentMonth = periodMonth(DEFAULT_PERIOD);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  // Current month first, then the 11 before it; later months have no data yet
  const monthOptions = Array.from({ length: 12 }, (_, i) =>
    shiftMonth(currentMonth, -i),
  );

  function changeMonth(month: string) {
    setSelectedMonth(month);
    // The cached lists belong to the previous month
    setItemsByTab({});
  }

  const refresh = () => setRefreshKey((k) => k + 1);

  // Jump to the tab of the new transaction so it shows up in the list
  function handleCreated(type: typeof activeTab) {
    setActiveTab(type);
    refresh();
  }

  // Latest 5 transactions of the selected month for the active tab
  useEffect(() => {
    let ignore = false;

    async function fetchTransactions() {
      const [year, month] = selectedMonth.split("-").map(Number);
      const res = await getTransactions({
        type: activeTab,
        limit: 5,
        sort: "newest",
        year,
        month,
      });
      if (ignore) return;

      if (res.ok) {
        setItemsByTab((prev) => ({
          ...prev,
          [activeTab]: res.data.transactions.map(toBudgetItem),
        }));
        setItemsError(null);
      } else {
        setItemsError(res.error);
      }
    }

    fetchTransactions();
    return () => {
      ignore = true;
    };
  }, [activeTab, refreshKey, selectedMonth]);

  // Totals come from the summary endpoint, not from the 5 items shown
  useEffect(() => {
    let ignore = false;

    async function fetchSummary() {
      const res = await getBudgetSummary(monthPeriod(selectedMonth));
      if (ignore) return;

      // Keep the previous totals if a refetch fails
      if (res.ok) setSummary(res.data);
      setSummaryLoaded(true);
    }

    fetchSummary();
    return () => {
      ignore = true;
    };
  }, [refreshKey, selectedMonth]);

  const totalIncome = summary?.income ?? 0;
  const totalExpenses = summary?.expense ?? 0;
  const totalSavings = summary?.savings ?? 0;
  const netBalance = summary?.net ?? totalIncome - totalExpenses;
  const target = summary?.target ?? EMPTY_TARGET;
  const progress = summary?.progress ?? EMPTY_TARGET;

  // The summary is fetched again so target and progress come from the backend
  async function saveTargets(values: BudgetTargetValues): Promise<boolean> {
    try {
      await saveBudgetTarget(selectedMonth, values);
      toast.success("Targets saved.");
      refresh();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save targets");
      return false;
    }
  }

  async function deleteItem(id: string) {
    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted.");
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not delete transaction",
      );
    }
  }

  async function editItem(id: string, payload: UpdateTransactionPayload) {
    try {
      await updateTransaction(id, payload);
      toast.success("Transaction updated.");
      refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update transaction",
      );
    }
  }

  const totalsByType = {
    income: totalIncome,
    expenses: totalExpenses,
    savings: totalSavings,
  };

  const sections: Section[] = (
    [
      { title: "Income", section: "income" },
      { title: "Expenses", section: "expenses" },
      { title: "Savings", section: "savings" },
    ] as const
  ).map(({ title, section }) => ({
    title,
    section,
    // Only the active tab is rendered, so it is the only one that needs items
    items: itemsByTab[section] ?? [],
    total: totalsByType[section],
    onDelete: deleteItem,
    onEdit: editItem,
  }));

  return (
    <section className="relative py-4 px-4 max-w-7xl mx-auto">
      <PageHeader
        title="Budget Overview"
        subtitle="Track income, expenses, savings and add new budget items quickly."
      >
        {" "}
        <div className="flex flex-col md:items-end">
          <div className="flex flex-wrap md:flex-row md:items-center gap-2 mt-4">
            <Select value={selectedMonth} onValueChange={changeMonth}>
              <SelectTrigger
                size="sm"
                className="w-44 cursor-pointer"
                aria-label="Select month"
              >
                <CalendarDays size={16} className="text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month} value={month}>
                    {formatMonth(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenTargets(true)}
              className="cursor-pointer gap-2"
            >
              <Target size={16} />
              Your Target
            </Button>

            <Button
              variant="default"
              onClick={() => setShowForm((prev) => !prev)}
              className="cursor-pointer max-w-34 md:w-auto"
              size="sm"
            >
              <Plus size={16} />
              {showForm ? "Close" : "Add new entry"}
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-3">
          {!summaryLoaded ? (
            <SummaryCardsSkeleton />
          ) : (
            <SummaryCards
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              totalSavings={totalSavings}
              netBalance={netBalance}
              target={target}
              progress={progress}
            />
          )}

          <div className="grid items-start gap-6">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              className="w-full"
            >
              <TabsList>
                {sections.map((section) => (
                  <TabsTrigger
                    key={section.section}
                    value={section.section}
                    className="cursor-pointer"
                  >
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {sections.map((section) => (
                <TabsContent key={section.section} value={section.section}>
                  {itemsByTab[section.section] ? (
                    <ItemCard
                      section={section}
                      onShowForm={() => setShowForm(true)}
                    />
                  ) : itemsError ? (
                    <Card>
                      <CardContent className="py-6 text-sm text-destructive">
                        {itemsError}
                      </CardContent>
                    </Card>
                  ) : (
                    <ItemListSkeleton />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between lg:flex-col gap-6">
          <Insights />
          <ExtraInfo activeTab={activeTab} />
        </div>
      </div>

      {showForm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setShowForm(false)}
          />
          <aside className="fixed inset-y-0 right-0 z-50 max-w-md overflow-y-auto bg-background shadow-2xl border-l border-muted/30 md:max-w-xl lg:max-w-2xl">
            <div className="flex items-center justify-between border-b border-muted/20 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold">Add a budget item</h2>
                <p className="text-sm text-muted-foreground">
                  Choose whether it's income, expense or savings.
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>

            <div className="p-6">
              <BudgetForm onCreated={handleCreated} />
            </div>
          </aside>
        </>
      )}

      {openTargets && (
        <TargetsPanel
          targets={target}
          month={selectedMonth}
          onSave={saveTargets}
          onClose={() => setOpenTargets(false)}
        />
      )}
    </section>
  );
}
