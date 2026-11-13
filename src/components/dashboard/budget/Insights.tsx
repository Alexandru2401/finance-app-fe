import {
  Calendar,
  Home,
  Lightbulb,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/hooks/useCurrency";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getBudgetTrend,
  getTopExpenses,
  type BudgetSummary,
  type TopExpense,
} from "@/api/budget";
import { monthPeriod, periodMonth, shiftMonth } from "@/lib/periods";

interface InsightsProps {
  // null while the summary of the page is loading
  summary: BudgetSummary | null;
  // "YYYY-MM-01", the month the Budget page shows
  month: string;
  // Bumped by the page after a change, so the data is fetched again
  refreshKey: number;
}

interface Insight {
  icon: ReactNode;
  tone: string;
  label: string;
  // undefined = still loading
  value: string | undefined;
}

// Income of the month and of the one before, from the trend endpoint
type IncomePair = { current: number; previous: number };

// Shown when a request fails (e.g. 429); the toast from api/client explains why
const ERROR = "—";

const percent = (part: number, total: number) =>
  Math.round((part / total) * 100);

export default function Insights({
  summary,
  month,
  refreshKey,
}: InsightsProps) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  // Short keys, e.g. k("goal") = dashboard.budget.insights.goal
  const { t: k } = useTranslation(undefined, {
    keyPrefix: "dashboard.budget.insights",
  });

  // undefined = loading, null = no expenses in the month
  const [topExpense, setTopExpense] = useState<
    TopExpense | null | "error" | undefined
  >();
  // undefined = loading
  const [income, setIncome] = useState<IncomePair | "error" | undefined>();

  useEffect(() => {
    let ignore = false;
    const previous = shiftMonth(month, -1).slice(0, 7);
    const current = month.slice(0, 7);

    getTopExpenses(monthPeriod(month))
      .then(
        (res) =>
          !ignore && setTopExpense(res.data ? (res.data[0] ?? null) : "error"),
      )
      .catch(() => !ignore && setTopExpense("error"));

    getBudgetTrend(`${previous}:${current}`)
      .then((res) => {
        if (ignore) return;
        const points = res.data;
        setIncome(
          points && points.length === 2
            ? { previous: points[0].income, current: points[1].income }
            : "error",
        );
      })
      .catch(() => !ignore && setIncome("error"));

    return () => {
      ignore = true;
    };
  }, [month, refreshKey]);

  // Savings target: the message depends on how close the user is
  function savingsGoal(): Insight {
    const base = { icon: <Target className="h-4 w-4" /> };
    if (!summary)
      return { ...base, tone: "", label: k("goal"), value: undefined };

    const pct = summary.progress.savings;
    if (pct === null)
      return {
        ...base,
        tone: "text-muted-foreground",
        label: k("goal"),
        value: k("goalNoTarget"),
      };
    if (pct >= 100)
      return {
        ...base,
        tone: "text-finance-success",
        label: k("goalReached"),
        value: k("goalReachedValue", { pct }),
      };
    if (pct >= 50)
      return {
        ...base,
        tone: "text-finance-primary",
        label: k("goalClose"),
        value: k("goalValue", { pct }),
      };
    if (pct > 0)
      return {
        ...base,
        tone: "text-finance-warning",
        label: k("goalKeepGoing"),
        value: k("goalValue", { pct }),
      };
    return {
      ...base,
      tone: "text-finance-danger",
      label: k("goalNotStarted"),
      value: k("goalNotStartedValue"),
    };
  }

  function topExpenseInsight(): Insight {
    const base = {
      icon: <Home className="h-4 w-4" />,
      tone: "text-finance-danger",
      label: k("topExpense"),
    };
    if (topExpense === undefined) return { ...base, value: undefined };
    if (topExpense === "error") return { ...base, tone: "", value: ERROR };
    if (topExpense === null)
      return {
        ...base,
        tone: "text-muted-foreground",
        value: k("topExpenseNone"),
      };
    const name = topExpense.category ?? t("dashboard.common.uncategorized");
    return { ...base, value: `${name} · ${format(topExpense.amount)}` };
  }

  function incomeTrend(): Insight {
    const base = { label: k("incomeTrend") };
    const up = { ...base, icon: <TrendingUp className="h-4 w-4" /> };
    if (income === undefined) return { ...up, tone: "", value: undefined };
    if (income === "error") return { ...up, tone: "", value: ERROR };
    // Nothing to compare with
    if (income.previous === 0)
      return {
        ...up,
        tone: "text-muted-foreground",
        value: k("incomeTrendNoData"),
      };

    const pct = percent(income.current - income.previous, income.previous);
    if (pct < 0)
      return {
        ...base,
        icon: <TrendingDown className="h-4 w-4" />,
        tone: "text-finance-danger",
        value: k("incomeTrendValue", { pct }),
      };
    return {
      ...up,
      tone: "text-finance-success",
      value: k("incomeTrendValue", { pct: `+${pct}` }),
    };
  }

  function savingsRate(): Insight {
    const base = {
      icon: <PiggyBank className="h-4 w-4" />,
      label: k("savingsRate"),
    };
    if (!summary) return { ...base, tone: "", value: undefined };
    if (summary.income === 0)
      return {
        ...base,
        tone: "text-muted-foreground",
        value: k("savingsRateNoIncome"),
      };

    const pct = percent(summary.savings, summary.income);
    const tone =
      pct >= 20
        ? "text-finance-success"
        : pct >= 10
          ? "text-finance-primary"
          : "text-finance-warning";
    return { ...base, tone, value: k("savingsRateValue", { pct }) };
  }

  // Only the current month has days left; a past month is closed
  function daysLeft(): Insight {
    const base = {
      icon: <Calendar className="h-4 w-4" />,
      tone: "text-finance-purple",
      label: k("daysLeft"),
    };
    if (month !== periodMonth("this-month"))
      return {
        ...base,
        tone: "text-muted-foreground",
        value: k("monthClosed"),
      };

    const today = new Date();
    const lastDay = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();
    // Today counts as a day left
    const count = lastDay - today.getDate() + 1;
    return { ...base, value: k("daysLeftValue", { count }) };
  }

  const insights = [
    savingsGoal(),
    topExpenseInsight(),
    incomeTrend(),
    savingsRate(),
    daysLeft(),
  ];

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Lightbulb className="h-4 w-4 text-finance-warning" />
        {k("title")}
      </div>
      <div className="flex flex-col gap-2">
        {insights.map((i) => (
          <div
            key={i.label}
            className="flex items-start gap-2 rounded-lg border p-3"
          >
            <span className={`rounded-md p-1.5 bg-accent ${i.tone}`}>
              {i.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{i.label}</p>
              {i.value === undefined ? (
                <Skeleton className="mt-1 h-4 w-24" />
              ) : (
                <p className="text-sm font-medium">{i.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
