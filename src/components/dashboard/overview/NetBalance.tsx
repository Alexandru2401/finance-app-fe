import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useEffect, useState } from "react";
import {
  getBudgetSummary,
  getBudgetTrend,
  type BudgetSummary,
  type BudgetTrendPoint,
} from "@/api/budget";
import CardError from "@/components/dashboard/shared/CardError";
import { useCurrency } from "@/hooks/useCurrency";
import type { Period } from "@/lib/periods";
import { useTranslation } from "react-i18next";
import { parseMonth } from "@/lib/date";
import FitAmount from "@/components/dashboard/shared/FitAmount";
import InlineError from "@/components/dashboard/shared/InlineError";

interface Props {
  period: Period;
  // All-time balance, shown under the period net: undefined while loading, null if it could not be loaded
  totalBalance?: number | null;
  // Reloads the all-time balance after an error
  onRetryTotal?: () => void;
}

const formatMonth = (month: string, locale: string) =>
  parseMonth(month).toLocaleDateString(locale, {
    month: "short",
    year: "numeric",
  });

// The tiles cover only the selected period; the period is shown next to each label
const TILES = [
  {
    key: "income",
    label: "dashboard.common.income",
    color: "text-finance-success",
  },
  {
    key: "expense",
    label: "dashboard.common.expenses",
    color: "text-finance-danger",
  },
  {
    key: "savings",
    label: "dashboard.common.savings",
    color: "text-finance-primary",
  },
] as const;

// Each bar sits in a box as tall as the real line it stands for (text-sm = 20px,
// text-3xl/4xl = 36/40px, text-xs = 16px...), so nothing moves when data arrives
function NetBalanceSkeleton() {
  return (
    <CardContent className="grid gap-6 @lg:grid-cols-5">
      <div className="min-w-0 @lg:col-span-3">
        <div className="flex h-5 items-center">
          <Skeleton className="h-3.5 w-36" />
        </div>
        <div className="mt-1 flex h-9 items-center @md:h-10">
          <Skeleton className="h-7 w-44 @md:h-8" />
        </div>
        <div className="mt-1 flex h-4 items-center">
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <div className="mt-3 flex h-4 items-center">
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="mt-1 flex h-4 items-center">
          <Skeleton className="h-3 w-44" />
        </div>
        <SparklineSkeleton />
      </div>
      <div className="flex flex-col gap-3 @lg:col-span-2">
        {TILES.map((tile) => (
          <div
            key={tile.key}
            className="rounded-lg border border-border bg-accent/50 p-3"
          >
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-32" />
            </div>
            <div className="mt-0.5 flex h-7 items-center">
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  );
}

// Chart (h-20) + caption (text-xs), capped like the real sparkline
function SparklineSkeleton() {
  return (
    <div className="mt-4 w-full max-w-sm">
      <Skeleton className="h-20 w-full" />
      <div className="mt-1 flex h-4 items-center">
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  );
}

/** Cash flow (income - expenses) per month, as a small area line. */
function NetSparkline({
  trend,
  loading,
  error,
  onRetry,
  positive,
  rangeLabel,
}: {
  trend: BudgetTrendPoint[] | null;
  loading: boolean;
  error?: boolean;
  onRetry: () => void;
  positive: boolean;
  // Interval actually shown, which can differ from the selected period
  rangeLabel: string;
}) {
  const { t, i18n } = useTranslation();
  const { format: fmt } = useCurrency();

  // Same box as the chart + caption, so the card keeps its height
  if (error)
    return (
      <div className="mt-4 flex h-25 w-full max-w-sm items-center justify-center rounded-lg border border-dashed px-3">
        <InlineError
          message={t("dashboard.overview.netBalance.sparklineError")}
          onRetry={onRetry}
          className="justify-center text-center"
        />
      </div>
    );
  if (loading || !trend) return <SparklineSkeleton />;
  if (trend.length < 2) return null;
  // A flat line at 0 looks like a broken chart, so leave it out
  if (trend.every((p) => p.income === 0 && p.expense === 0)) return null;

  const data = trend.map((p) => ({
    month: formatMonth(p.month, i18n.language),
    net: p.income - p.expense,
  }));

  const chartConfig = {
    net: {
      label: t("dashboard.overview.netBalance.cashFlow"),
      color: positive ? "var(--finance-success)" : "var(--finance-danger)",
    },
  } satisfies ChartConfig;

  // Capped at 24rem: a secondary hint, it shouldn't stretch across the whole column
  return (
    <div className="mt-4 w-full max-w-sm">
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-20 w-full"
        role="img"
        aria-label={t("dashboard.overview.netBalance.sparklineLabel", {
          values: data.map((d) => `${d.month} ${fmt(d.net)}`).join(", "),
        })}
      >
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
        >
          <defs>
            <linearGradient id="net-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-net)"
                stopOpacity={0.25}
              />
              <stop
                offset="100%"
                stopColor="var(--color-net)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" hide />
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <ChartTooltip
            cursor={{ stroke: "var(--border)" }}
            content={
              <ChartTooltipContent
                indicator="line"
                formatter={(value) => (
                  <span className="font-medium tabular-nums">
                    {t("dashboard.overview.netBalance.cashFlow")}{" "}
                    {fmt(Number(value))}
                  </span>
                )}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="net"
            stroke="var(--color-net)"
            strokeWidth={2}
            fill="url(#net-sparkline-fill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ChartContainer>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("dashboard.overview.netBalance.sparklineCaption", {
          period: rangeLabel,
        })}
      </p>
    </div>
  );
}

export default function NetBalance({
  period,
  totalBalance,
  onRetryTotal,
}: Props) {
  const { t } = useTranslation();
  const { format: fmt } = useCurrency();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    summary: BudgetSummary | null;
  } | null>(null);
  // Changes on every new request; results from older requests are ignored
  const key = `${period}-${attempt}`;

  useEffect(() => {
    let cancelled = false;
    getBudgetSummary(period)
      .then((res) => res.data)
      .catch(() => null)
      .then((data) => !cancelled && setResult({ key, summary: data }));
    return () => {
      cancelled = true;
    };
  }, [key, period]);

  const loading = result?.key !== key;
  const summary = loading ? null : (result?.summary ?? null);
  const error = !loading && !summary;
  const onRetry = () => setAttempt((n) => n + 1);

  // The sparkline follows the selected period; a one-month trend is a single
  // point, so short periods keep the default trend (last 6 months), as in TrendChart
  const trendPeriod =
    period === "this-month" || period === "last-month" ? undefined : period;
  const [trendAttempt, setTrendAttempt] = useState(0);
  const trendKey = `${trendPeriod ?? "default"}-${trendAttempt}`;
  const [trendResult, setTrendResult] = useState<{
    key: string;
    trend: BudgetTrendPoint[] | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBudgetTrend(trendPeriod)
      .then((res) => res.data)
      .catch(() => null)
      .then(
        (data) => !cancelled && setTrendResult({ key: trendKey, trend: data }),
      );
    return () => {
      cancelled = true;
    };
  }, [trendKey, trendPeriod]);

  const trendLoading = trendResult?.key !== trendKey;
  const trend = trendLoading ? null : (trendResult?.trend ?? null);
  const trendError = !trendLoading && !trend;

  if (!loading && error) {
    return (
      <Card className="@container min-w-0">
        {/* Keeps the title and roughly the real card's height */}
        <CardContent className="flex min-h-64 flex-col">
          <CardDescription>
            {t("dashboard.overview.netBalance.title", {
              period: t(`dashboard.periods.${period}`),
            })}
          </CardDescription>
          <CardError
            message={t("dashboard.overview.netBalance.error")}
            onRetry={onRetry}
          />
        </CardContent>
      </Card>
    );
  }

  if (loading || !summary) {
    return (
      <Card className="@container min-w-0">
        <NetBalanceSkeleton />
      </Card>
    );
  }

  const periodLabel = t(`dashboard.periods.${period}`);
  const positive = summary.net >= 0;
  const TrendIcon = positive ? TrendingUp : TrendingDown;
  const netMargin =
    summary.income > 0 ? Math.round((summary.net / summary.income) * 100) : 0;

  return (
    <Card className="@container min-w-0">
      <CardContent className="grid gap-6 @lg:grid-cols-5">
        <div className="min-w-0 @lg:col-span-3">
          <CardDescription>
            {t("dashboard.overview.netBalance.title", { period: periodLabel })}
          </CardDescription>
          {/* Shrinks to 200K RON only when the full amount doesn't fit */}
          <FitAmount
            value={summary.net}
            className="mt-1 text-3xl font-bold text-foreground @md:text-4xl"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("dashboard.overview.netBalance.definition")}
          </p>
          <p
            className={`mt-3 flex items-center gap-1 text-xs ${
              positive ? "text-finance-success" : "text-finance-danger"
            }`}
          >
            <TrendIcon className="h-4 w-4" aria-hidden="true" />
            {t("dashboard.overview.netBalance.margin", { value: netMargin })}
          </p>
          {/* The all-time balance does not depend on the selected period */}
          {totalBalance === undefined ? (
            <div className="mt-1 flex h-4 items-center">
              <Skeleton className="h-3 w-44" />
            </div>
          ) : totalBalance === null ? (
            <InlineError
              message={t("dashboard.overview.netBalance.allTimeError")}
              onRetry={onRetryTotal}
              className="mt-1 min-h-4"
            />
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("dashboard.overview.netBalance.allTime", {
                amount: fmt(totalBalance),
              })}
            </p>
          )}

          <NetSparkline
            trend={trend}
            loading={trendLoading}
            error={trendError}
            onRetry={() => setTrendAttempt((n) => n + 1)}
            positive={positive}
            rangeLabel={t(`dashboard.periods.${trendPeriod ?? "last-6"}`)}
          />
        </div>

        <div className="flex flex-col gap-3 @lg:col-span-2">
          {TILES.map((tile) => (
            <div
              key={tile.key}
              className="min-w-0 rounded-lg border border-border bg-accent/50 p-3"
            >
              <p className="text-sm">
                {t(tile.label)}{" "}
                <span className="text-muted-foreground">· {periodLabel}</span>
              </p>
              <FitAmount
                value={summary[tile.key]}
                className={`mt-0.5 text-lg font-semibold ${tile.color}`}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
