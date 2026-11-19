import { useEffect, useState } from "react";
import { getBudgetSummary, type BudgetSummary } from "@/api/budget";
import {
  Card,
  CardContent,
  CardDescription,
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
import CardHeaderSkeleton from "@/components/dashboard/shared/CardHeaderSkeleton";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import { useCurrency } from "@/hooks/useCurrency";
import type { Period } from "@/lib/periods";
import { PieChart as PieChartIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Pie, PieChart } from "recharts";

interface Props {
  period: Period;
}

function BalanceCardHeader({ period }: { period: Period }) {
  const { t } = useTranslation();

  return (
    <CardHeader>
      <div className="min-w-0">
        <CardTitle className="text-base">
          {t("dashboard.overview.breakdown.title")}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {t("dashboard.overview.breakdown.description")} ·{" "}
          {t(`dashboard.periods.${period}`)}
        </CardDescription>
      </div>
    </CardHeader>
  );
}

export default function BalanceOverview({ period }: Props) {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const chartConfig = {
    income: {
      label: t("dashboard.common.income"),
      color: "var(--finance-success)",
    },
    spendings: {
      label: t("dashboard.common.expenses"),
      color: "var(--finance-danger)",
    },
    savings: {
      label: t("dashboard.common.savings"),
      color: "var(--finance-primary)",
    },
  } satisfies ChartConfig;

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

  if (!loading && error) {
    return (
      <Card className="flex flex-col">
        <BalanceCardHeader period={period} />
        {/* Same height as the chart (max-h-62.5), so the card doesn't shrink */}
        <CardContent className="flex min-h-62.5 flex-1">
          <CardError
            message={t("dashboard.overview.breakdown.error")}
            onRetry={onRetry}
          />
        </CardContent>
      </Card>
    );
  }

  if (loading || !summary) {
    return (
      <Card className="flex flex-col">
        <CardHeaderSkeleton titleWidth="w-40" descriptionWidth="w-56" />
        {/* Same box as the chart: 250px tall, a ~176px pie and the legend under it */}
        <CardContent className="flex flex-1 pb-0">
          <div className="mx-auto flex h-62.5 w-full flex-col items-center justify-center gap-4">
            <Skeleton className="size-44 rounded-full" />
            <div className="flex flex-wrap justify-center gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-3 w-16" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (summary.income === 0 && summary.expense === 0 && summary.savings === 0) {
    return (
      <Card className="flex flex-col">
        <BalanceCardHeader period={period} />
        <CardContent className="flex min-h-62.5 flex-1">
          <EmptyState
            icon={PieChartIcon}
            message={t("dashboard.overview.breakdown.empty")}
          />
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    {
      budgetType: "income",
      money: summary.income,
      fill: "var(--finance-success)",
    },
    {
      budgetType: "spendings",
      money: summary.expense,
      fill: "var(--finance-danger)",
    },
    {
      budgetType: "savings",
      money: summary.savings,
      fill: "var(--finance-primary)",
    },
  ];

  return (
    <Card className="flex flex-col">
      <BalanceCardHeader period={period} />
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-62.5"
          role="img"
          aria-label={t("dashboard.overview.breakdown.chartLabel")}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  // The default shows a bare number (200,000); add the currency
                  formatter={(value, name) => {
                    const entry =
                      chartConfig[String(name) as keyof typeof chartConfig];
                    return (
                      <div className="flex w-full items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-xs"
                          style={{ backgroundColor: entry?.color }}
                          aria-hidden="true"
                        />
                        <span className="text-muted-foreground">
                          {entry?.label ?? name}
                        </span>
                        <span className="ml-auto font-medium tabular-nums text-foreground">
                          {format(Number(value))}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie data={chartData} dataKey="money" nameKey="budgetType" />
            <ChartLegend
              content={<ChartLegendContent nameKey="budgetType" />}
              className="flex-wrap gap-2"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
