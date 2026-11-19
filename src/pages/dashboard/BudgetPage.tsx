import { FEATURES } from "@/lib/features";
import BudgetForm from "@/components/dashboard/budget/BudgetForm";
import ItemCard from "@/components/dashboard/budget/ItemCard";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ExternalLink,
  Plus,
  Tags,
  Target,
  X,
} from "lucide-react";
import { Link } from "react-router";
import { ResponsiveSheet } from "@/components/dashboard/shared/ResponsiveSheet";
import { CategoriesManager } from "@/components/dashboard/settings/CategoriesSettings";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import ExtraInfo from "@/components/dashboard/budget/ExtraInfo";
import Insights from "@/components/dashboard/budget/Insights";
import SummaryCards, {
  SUMMARY_CARD,
  SUMMARY_GRID,
} from "@/components/dashboard/budget/SummaryCards";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CardError from "@/components/dashboard/shared/CardError";

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
import PageTour, {
  type TourStep,
} from "@/components/dashboard/shared/PageTour";
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
    item_id: t.item_id,
    type: t.type,
    // Empty = no category; ItemCard shows the translated "Uncategorized"
    category: t.category_name ?? "",
    categoryId: t.category_id ?? undefined,
    amount: Number(t.amount),
    date: t.date,
    notes: t.notes ?? undefined,
    recurringId: t.recurring_id ?? undefined,
  };
}

const EMPTY_TARGET: BudgetTarget = {
  income: null,
  expense: null,
  savings: null,
  net: null,
};

// Every bar sits in a box as tall as the real line (text-lg = 28px,
// text-xl = 28px, text-xs = 16px...), so the page doesn't jump on load
function SummaryCardsSkeleton() {
  return (
    <div className="@container">
      <div className={SUMMARY_GRID}>
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className={SUMMARY_CARD}>
            <CardHeader>
              <div className="flex h-7 items-center gap-2">
                <Skeleton className="size-6 rounded-md" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex h-7 items-center">
                <Skeleton className="h-5 w-32" />
              </div>
              {/* The net balance card has no target row */}
              {i < 3 && (
                <div className="mt-3 space-y-1">
                  <div className="flex h-4 items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Same structure as ItemCard: header (title + "See all"), 5 rows, footer
function ItemListSkeleton() {
  return (
    <Card className="@container flex-1">
      <CardHeader className="!px-4 md:!px-6">
        <div className="flex h-7 items-center justify-between gap-2">
          <Skeleton className="h-4.5 w-24" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
        <div className="flex h-4 items-center">
          <Skeleton className="h-3 w-44" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-1 !px-4 md:!px-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-border/50 px-2 py-1.5 @md:gap-3 @md:px-3"
          >
            <Skeleton className="size-8 shrink-0 rounded-lg @md:size-9" />
            <div className="flex min-w-20 flex-1 flex-col">
              <div className="flex h-5 items-center">
                <Skeleton className="h-3.5 w-24 max-w-full" />
              </div>
              <div className="flex h-4 items-center">
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-20 shrink-0" />
            {/* Actions: a menu button on narrow cards, three buttons on wider ones */}
            <Skeleton className="size-8 shrink-0 rounded-md @md:hidden" />
            <Skeleton className="hidden h-8 w-26 shrink-0 rounded-md @md:block" />
          </div>
        ))}
      </CardContent>
      <CardFooter className="!px-4 md:!px-6">
        <Skeleton className="h-9 w-36 rounded-md" />
      </CardFooter>
    </Card>
  );
}

export interface Section {
  title: string;
  items: BudgetItem[];
  total: number;
  section: "income" | "expenses" | "savings";
  // Resolve to false if the request failed, so the dialog stays open
  onDelete: (id: string) => Promise<boolean>;
  onEdit: (id: string, payload: UpdateTransactionPayload) => Promise<boolean>;
}

export default function BudgetPage() {
  const { t, i18n } = useTranslation();
  // Cached per tab so refetches and tab switches keep showing the last data
  // instead of flashing a skeleton; undefined = not loaded yet
  const [itemsByTab, setItemsByTab] = useState<
    Partial<Record<"income" | "expenses" | "savings", BudgetItem[]>>
  >({});
  // Key of the request that failed (tab|month|refresh|attempt): the error
  // only shows for that request, not for the next tab or month
  const [itemsErrorKey, setItemsErrorKey] = useState<string | null>(null);
  const [itemsAttempt, setItemsAttempt] = useState(0);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  // The last summary request failed (the old totals stay if there are any)
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [summaryAttempt, setSummaryAttempt] = useState(0);
  // Bumped after any change so the list and the totals are fetched again
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"income" | "expenses" | "savings">(
    "income",
  );

  const [showForm, setShowForm] = useState(false);

  const [openTargets, setOpenTargets] = useState(false);

  const [openCategories, setOpenCategories] = useState(false);

  // Month the whole page shows (YYYY-MM-01); starts on the overview's default
  const currentMonth = periodMonth(DEFAULT_PERIOD);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  // Current month first, then the 11 before it; later months have no data yet
  const monthOptions = Array.from({ length: 12 }, (_, i) =>
    shiftMonth(currentMonth, -i),
  );

  function changeMonth(month: string) {
    setSelectedMonth(month);
    // The cached lists and totals belong to the previous month
    setItemsByTab({});
    setSummary(null);
    setSummaryLoaded(false);
  }

  const retrySummary = () => {
    setSummaryLoaded(false);
    setSummaryAttempt((n) => n + 1);
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  // The last two steps open the add form: new category and recurring
  const closeForm = () => setShowForm(false);
  const openForm = () => setShowForm(true);
  const tourSteps: TourStep<"budget">[] = [
    { key: "month", before: closeForm },
    { key: "target", before: closeForm },
    { key: "categories", before: closeForm },
    { key: "add", before: closeForm },
    // The sheet / drawer slides in for 500ms: wait for it, so the tooltip
    // is placed next to the field and not where the panel started
    { key: "formCategory", before: openForm, wait: 550 },
    { key: "formRecurring", before: openForm },
  ];

  // Jump to the tab of the new transaction so it shows up in the list
  function handleCreated(type: typeof activeTab) {
    setActiveTab(type);
    refresh();
  }

  // Latest 5 transactions of the selected month for the active tab
  const itemsKey = `${activeTab}|${selectedMonth}|${refreshKey}|${itemsAttempt}`;
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
        setItemsErrorKey(null);
      } else {
        setItemsErrorKey(itemsKey);
      }
    }

    fetchTransactions();
    return () => {
      ignore = true;
    };
  }, [activeTab, itemsKey, selectedMonth]);

  // Totals come from the summary endpoint, not from the 5 items shown
  useEffect(() => {
    let ignore = false;

    async function fetchSummary() {
      const res = await getBudgetSummary(monthPeriod(selectedMonth));
      if (ignore) return;

      // Keep the previous totals if a refetch fails
      if (res.ok) setSummary(res.data);
      setSummaryFailed(!res.ok);
      setSummaryLoaded(true);
    }

    fetchSummary();
    return () => {
      ignore = true;
    };
  }, [refreshKey, selectedMonth, summaryAttempt]);

  // Nothing to show: failed and no older totals (otherwise those stay)
  const summaryError = summaryLoaded && summaryFailed && !summary;

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
      toast.success(t("dashboard.budget.targets.saved"));
      refresh();
      return true;
    } catch {
      toast.error(t("dashboard.budget.targets.saveError"));
      return false;
    }
  }

  async function deleteItem(id: string): Promise<boolean> {
    try {
      await deleteTransaction(id);
      toast.success(t("dashboard.budget.toasts.deleted"));
      refresh();
      return true;
    } catch {
      toast.error(t("dashboard.budget.toasts.deleteError"));
      return false;
    }
  }

  async function editItem(
    id: string,
    payload: UpdateTransactionPayload,
  ): Promise<boolean> {
    try {
      await updateTransaction(id, payload);
    } catch (err) {
      // The backend message explains e.g. a category of another type
      toast.error(t("dashboard.budget.toasts.updateError"), {
        description: err instanceof Error ? err.message : undefined,
      });
      return false;
    }
    // The notes dialog stays open and reads the item: show the new note
    // right away, before the lists are fetched again
    if (payload.notes !== undefined) {
      const notes = payload.notes?.trim() || undefined;
      setItemsByTab((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([tab, items]) => [
            tab,
            items?.map((item) =>
              item.item_id === id ? { ...item, notes } : item,
            ),
          ]),
        ),
      );
    }
    toast.success(t("dashboard.budget.toasts.updated"));
    refresh();
    return true;
  }

  const totalsByType = {
    income: totalIncome,
    expenses: totalExpenses,
    savings: totalSavings,
  };

  const sections: Section[] = (["income", "expenses", "savings"] as const).map(
    (section) => ({
      title: t(`dashboard.common.${section}`),
      section,
      // Only the active tab is rendered, so it is the only one that needs items
      items: itemsByTab[section] ?? [],
      total: totalsByType[section],
      onDelete: deleteItem,
      onEdit: editItem,
    }),
  );

  return (
    // @container: the layout follows the space next to the sidebar (open or
    // collapsed), not the viewport width
    <section className="@container relative mx-auto max-w-7xl px-4 py-4">
      <PageHeader
        title={t("dashboard.budget.title")}
        subtitle={t("dashboard.budget.subtitle")}
        actionsClassName="w-full sm:w-auto"
      >
        {/* Phones: one row, only the month select keeps its text and takes the
            free space; the other buttons are icons (like Guided tour).
            From sm: labels back, one wrapping row */}
        <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-wrap">
          <PageTour tour="budget" steps={tourSteps} onEnd={closeForm} />

          <Select value={selectedMonth} onValueChange={changeMonth}>
            <SelectTrigger
              data-tour="month"
              size="sm"
              className="min-w-0 flex-1 cursor-pointer sm:w-44 sm:flex-none"
              aria-label={t("dashboard.budget.selectMonth")}
            >
              <CalendarDays size={16} className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month}>
                  {formatMonth(month, i18n.language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            data-tour="target"
            onClick={() => setOpenTargets(true)}
            className="shrink-0 cursor-pointer gap-2"
            aria-label={t("dashboard.budget.yourTarget")}
          >
            <Target size={16} aria-hidden="true" />
            <span className="hidden sm:inline">
              {t("dashboard.budget.yourTarget")}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            data-tour="categories"
            onClick={() => setOpenCategories(true)}
            className="shrink-0 cursor-pointer gap-2"
            aria-label={t("dashboard.budget.categories.button")}
          >
            <Tags size={16} aria-hidden="true" />
            <span className="hidden sm:inline">
              {t("dashboard.budget.categories.button")}
            </span>
          </Button>

          <Button
            variant="default"
            data-tour="add"
            onClick={() => setShowForm((prev) => !prev)}
            className="shrink-0 cursor-pointer"
            size="sm"
            aria-label={
              showForm
                ? t("dashboard.budget.close")
                : t("dashboard.budget.addEntry")
            }
          >
            {/* Icon only on phones: X while the form is open */}
            {showForm ? (
              <X size={16} aria-hidden="true" />
            ) : (
              <Plus size={16} aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {showForm
                ? t("dashboard.budget.close")
                : t("dashboard.budget.addEntry")}
            </span>
          </Button>
        </div>
      </PageHeader>

      {/* Without the side column the lists take the whole width.
          Side column from a 64rem content width; min-w-0 lets the columns
          shrink below their content instead of spilling out */}
      <div
        className={`grid grid-cols-1 gap-6 ${FEATURES.budgetInsights ? "@5xl:grid-cols-3" : ""}`}
      >
        <div
          className={`${FEATURES.budgetInsights ? "@5xl:col-span-2" : ""} flex min-w-0 flex-col gap-3`}
        >
          {!summaryLoaded ? (
            <SummaryCardsSkeleton />
          ) : summaryError ? (
            // Not zeros: 0 RON everywhere would look like real (empty) data
            <Card className="min-h-36">
              <CardError
                message={t("dashboard.budget.summary.loadError")}
                onRetry={retrySummary}
              />
            </Card>
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

          {/* With the side column, the grid stretches this column to the height of the side
              column, so the list card ends at the same level as the donut */}
          <div className="flex flex-1 flex-col">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              className="w-full flex-1"
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
                <TabsContent
                  key={section.section}
                  value={section.section}
                  className="flex flex-col"
                >
                  {itemsByTab[section.section] ? (
                    <ItemCard
                      section={section}
                      onShowForm={() => setShowForm(true)}
                    />
                  ) : itemsErrorKey === itemsKey &&
                    section.section === activeTab ? (
                    // Title kept, and about the height of the 5-row list
                    <Card className="flex-1">
                      <CardHeader className="!px-4 md:!px-6">
                        <CardTitle className="text-lg text-foreground">
                          {section.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex min-h-64 flex-1 !px-4 md:!px-6">
                        <CardError
                          message={t("dashboard.budget.loadError")}
                          onRetry={() => setItemsAttempt((n) => n + 1)}
                        />
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

        {FEATURES.budgetInsights && (
          // Under the lists: side by side from 48rem, stacked below; in the
          // side column (64rem+) stacked again
          <div className="grid min-w-0 grid-cols-1 content-start gap-6 @3xl:grid-cols-2 @5xl:grid-cols-1">
            <Insights
              summary={summaryLoaded ? summary : null}
              summaryError={summaryError}
              onRetrySummary={retrySummary}
              month={selectedMonth}
              refreshKey={refreshKey}
            />
            <ExtraInfo
              activeTab={activeTab}
              month={selectedMonth}
              refreshKey={refreshKey}
            />
          </div>
        )}
      </div>

      {/* Add form: bottom drawer on phones, side sheet from md. Both modal
          (focus trap, Escape, aria-modal); the tour can still point inside */}
      <ResponsiveSheet
        open={showForm}
        onOpenChange={setShowForm}
        title={t("dashboard.budget.form.title")}
        description={t("dashboard.budget.form.subtitle")}
        className="sm:max-w-xl lg:max-w-2xl"
      >
        <BudgetForm onCreated={handleCreated} />
      </ResponsiveSheet>

      <ResponsiveSheet
        open={openCategories}
        onOpenChange={setOpenCategories}
        title={t("dashboard.settings.categories.title")}
        description={t("dashboard.settings.categories.description")}
        className="sm:max-w-lg"
        // Same height with 2 or 20 categories; only the list scrolls
        fixedHeight
        footer={
          <Button variant="link" size="sm" asChild className="gap-1.5">
            <Link to="/dashboard/settings?tab=categories">
              <ExternalLink size={14} />
              {t("dashboard.budget.categories.openSettings")}
            </Link>
          </Button>
        }
      >
        {/* Opens on the active tab; a delete can change the list names */}
        <CategoriesManager
          initialType={activeTab}
          onChange={refresh}
          fillHeight
        />
      </ResponsiveSheet>

      {/* Always mounted (like the categories panel), so it animates in and out */}
      <TargetsPanel
        open={openTargets}
        onOpenChange={setOpenTargets}
        targets={target}
        month={selectedMonth}
        onSave={saveTargets}
      />
    </section>
  );
}
