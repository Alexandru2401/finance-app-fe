import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns/format";
import {
  getBudgetHealth,
  getBudgetTrend,
  getCategoryTotals,
} from "@/api/budget";
import { getRecurring } from "@/api/recurring";
import AnalyticsChart from "@/components/dashboard/analytics/AnalyticsCharts";
import AnalyticsInsight from "@/components/dashboard/analytics/AnalyticsInsight";
import AnalyticsPeriodPicker from "@/components/dashboard/analytics/AnalyticsPeriodPicker";
import BudgetHealth from "@/components/dashboard/analytics/BudgetHealth";
import ExpensesInfo from "@/components/dashboard/analytics/ExpensesInfo";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { usePeriodLabel } from "@/hooks/usePeriodLabel";
import { useRequest } from "@/hooks/useRequest";
import {
  addMonths,
  currentMonth,
  fixedCosts,
  savingsWithForecast,
  spendingChange,
  spendingTips,
  variableCosts,
} from "@/lib/analytics";

// Data from /budget/budget-trend, /budget/by-category, /recurring and
// /budget/health (the score from analitycs.md)

// The api/budget helpers resolve { ok, data }; here a failure must reject, so
// useRequest shows the error
const unwrap = <T,>(res: { ok: boolean; data: T | null }): T => {
  if (!res.ok || res.data === null) throw new Error("Request failed");
  return res.data;
};

// A preset (this-month ... last-12, all) or a custom range "YYYY-MM:YYYY-MM"
const DEFAULT_ANALYTICS_PERIOD = "last-6";

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<string>(DEFAULT_ANALYTICS_PERIOD);
  const label = usePeriodLabel();
  const periodLabel = label(period);

  // A one-month trend is a single point, so short periods show the last 6
  // months on the charts (as on the Overview)
  const trendPeriod =
    period === "this-month" || period === "last-month" ? "last-6" : period;

  // ---- requests ----
  const loadTrend = useCallback(
    () => getBudgetTrend(trendPeriod).then(unwrap),
    [trendPeriod],
  );
  const trend = useRequest(`trend#${trendPeriod}`, loadTrend);

  // Budget Health: always on the user's today (it does not follow the period)
  const today = format(new Date(), "yyyy-MM-dd");
  const loadHealth = useCallback(
    () => getBudgetHealth(today).then(unwrap),
    [today],
  );
  const health = useRequest(`health#${today}`, loadHealth);

  const loadRecurring = useCallback(() => getRecurring(), []);
  const recurring = useRequest("recurring", loadRecurring);

  const loadExpenses = useCallback(
    () => getCategoryTotals("expenses", period).then(unwrap),
    [period],
  );
  const expenses = useRequest(`expenses#${period}`, loadExpenses);

  // Insights: the last complete month vs the 3 months before it
  const month = currentMonth();
  const lastMonth = addMonths(month, -1);
  const beforeStart = addMonths(month, -4);
  const beforeEnd = addMonths(month, -2);

  const loadInsightTrend = useCallback(
    () => getBudgetTrend(`${beforeStart}:${lastMonth}`).then(unwrap),
    [beforeStart, lastMonth],
  );
  const insightTrend = useRequest(`insight#${lastMonth}`, loadInsightTrend);

  const loadTipTotals = useCallback(
    () =>
      Promise.all([
        getCategoryTotals("expenses", `${lastMonth}:${lastMonth}`).then(unwrap),
        getCategoryTotals("expenses", `${beforeStart}:${beforeEnd}`).then(
          unwrap,
        ),
      ]),
    [lastMonth, beforeStart, beforeEnd],
  );
  const tipTotals = useRequest(`tips#${lastMonth}`, loadTipTotals);

  // ---- derived data (same loading / error state as the request behind it) ----
  const uncategorized = t("dashboard.common.uncategorized");

  // A section waits for every request it uses; Try again sends the failed ones
  const combine = <T,>(
    parts: { loading: boolean; error: boolean; retry: () => void }[],
    data: T | undefined,
  ) => ({
    data,
    loading: parts.some((p) => p.loading),
    error: !parts.some((p) => p.loading) && parts.some((p) => p.error),
    retry: () => parts.filter((p) => p.error).forEach((p) => p.retry()),
  });

  const fixed = useMemo(
    () => recurring.data && fixedCosts(recurring.data),
    [recurring.data],
  );
  const variable = useMemo(
    () =>
      expenses.data &&
      recurring.data &&
      variableCosts(expenses.data, recurring.data, uncategorized),
    [expenses.data, recurring.data, uncategorized],
  );
  const savings = useMemo(
    () => trend.data && savingsWithForecast(trend.data),
    [trend.data],
  );
  const change = useMemo(
    () => insightTrend.data && spendingChange(insightTrend.data),
    [insightTrend.data],
  );
  const tips = useMemo(
    () =>
      tipTotals.data &&
      recurring.data &&
      spendingTips(
        tipTotals.data[0],
        tipTotals.data[1],
        recurring.data,
        uncategorized,
      ),
    [tipTotals.data, recurring.data, uncategorized],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-4">
      <PageHeader
        title={t("dashboard.analytics.title")}
        subtitle={t("dashboard.analytics.subtitle")}
      >
        <AnalyticsPeriodPicker value={period} onChange={setPeriod} />
      </PageHeader>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col-reverse gap-6 lg:flex-row lg:items-stretch lg:gap-10">
          <AnalyticsInsight
            change={combine([insightTrend], change)}
            tips={combine([tipTotals, recurring], tips || undefined)}
          />
          <BudgetHealth health={health} />
        </div>

        <AnalyticsChart trend={trend} periodLabel={label(trendPeriod)} />

        <ExpensesInfo
          fixed={combine([recurring], fixed || undefined)}
          variable={combine([expenses, recurring], variable || undefined)}
          savings={combine([trend], savings || undefined)}
          periodLabel={periodLabel}
        />
      </div>
    </section>
  );
}
