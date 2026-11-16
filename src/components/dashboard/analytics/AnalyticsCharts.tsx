import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import CardError from "@/components/dashboard/shared/CardError";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import type { BudgetTrendPoint } from "@/api/budget";
import type { RequestState } from "@/hooks/useRequest";
import { useCurrency } from "@/hooks/useCurrency";
import { shortMonth } from "@/lib/analytics";
import { ChartColumn, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { useTranslation } from "react-i18next";

type Metric = "income" | "expense" | "savings" | "net";
const METRICS: Metric[] = ["income", "expense", "savings", "net"];

interface Props {
  trend: RequestState<BudgetTrendPoint[]>;
  // e.g. "Ultimele 6 luni"
  periodLabel: string;
}

export default function AnalyticsChart({ trend, periodLabel }: Props) {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  const [metric, setMetric] = useState<Metric>("expense");

  const barConfig = {
    income: {
      label: t("dashboard.common.income"),
      color: "var(--finance-success)",
    },
    expense: {
      label: t("dashboard.common.expenses"),
      color: "var(--finance-danger)",
    },
  } satisfies ChartConfig;

  const lineConfig = {
    ...barConfig,
    savings: {
      label: t("dashboard.common.savings"),
      color: "var(--finance-primary)",
    },
    net: {
      label: t("dashboard.analytics.charts.net"),
      color: "var(--finance-warning)",
    },
  } satisfies ChartConfig;

  const data = (trend.data ?? []).map((p) => ({
    month: shortMonth(p.month, i18n.language),
    income: p.income,
    expense: p.expense,
    savings: p.savings,
    net: p.income - p.expense,
  }));
  const empty = data.every(
    (p) => p.income === 0 && p.expense === 0 && p.savings === 0,
  );

  // Footer of the bars: the balance of the whole period
  const totalNet = data.reduce((sum, p) => sum + p.net, 0);
  const NetIcon = totalNet >= 0 ? TrendingUp : TrendingDown;

  function body(chart: React.ReactNode) {
    if (trend.loading) return <Skeleton className="h-64 w-full" />;
    if (trend.error)
      return (
        <CardError
          message={t("dashboard.analytics.loadError")}
          onRetry={trend.retry}
        />
      );
    if (empty)
      return (
        <EmptyState
          icon={ChartColumn}
          message={t("dashboard.analytics.charts.empty")}
        />
      );
    return chart;
  }

  return (
    <div className="flex flex-col-reverse gap-6 lg:flex-row lg:gap-10">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-base">
            {t("dashboard.analytics.charts.incomeVsExpenses")}
          </CardTitle>
          <CardDescription>{periodLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          {body(
            <ChartContainer config={barConfig} className="max-h-70 w-full">
              <BarChart accessibilityLayer data={data}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dashed"
                      formatter={(value, name) => (
                        <span className="flex w-full justify-between gap-3">
                          <span className="text-muted-foreground">
                            {barConfig[name as keyof typeof barConfig]?.label}
                          </span>
                          <span className="font-medium tabular-nums">
                            {format(Number(value))}
                          </span>
                        </span>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
              </BarChart>
            </ChartContainer>,
          )}
        </CardContent>
        {!trend.loading && !trend.error && !empty && (
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <p
              className={`flex items-center gap-2 font-medium ${
                totalNet >= 0 ? "text-finance-success" : "text-finance-danger"
              }`}
            >
              {t("dashboard.analytics.charts.periodNet", {
                amount: format(totalNet),
              })}
              <NetIcon className="h-4 w-4" aria-hidden="true" />
            </p>
            <p className="text-muted-foreground">
              {t("dashboard.analytics.charts.netHint")}
            </p>
          </CardFooter>
        )}
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                {t("dashboard.analytics.charts.trend")}
              </CardTitle>
              <CardDescription>{periodLabel}</CardDescription>
            </div>
            <div
              role="group"
              aria-label={t("dashboard.analytics.charts.metric")}
              className="flex rounded-lg border p-0.5"
            >
              {METRICS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={metric === m}
                  onClick={() => setMetric(m)}
                  className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    metric === m
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lineConfig[m].label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {body(
            <ChartContainer config={lineConfig} className="max-h-70 w-full">
              <LineChart
                accessibilityLayer
                data={data}
                margin={{ top: 8, left: 8, right: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      formatter={(value) => (
                        <span className="font-medium tabular-nums">
                          {lineConfig[metric].label} {format(Number(value))}
                        </span>
                      )}
                    />
                  }
                />
                <Line
                  dataKey={metric}
                  type="monotone"
                  stroke={`var(--color-${metric})`}
                  strokeWidth={2}
                  dot={{ fill: `var(--color-${metric})`, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>,
          )}
        </CardContent>
      </Card>
    </div>
  );
}
