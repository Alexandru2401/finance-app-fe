import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import { getBudgetTrend, type BudgetTrendPoint } from "@/api/budget";
import CardError from "@/components/dashboard/shared/CardError";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import { useCurrency } from "@/hooks/useCurrency";
import type { Period } from "@/lib/periods";
import { LineChart } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  period: Period;
}

function formatMonth(month: string, locale: string) {
  return new Date(`${month}-01`).toLocaleDateString(locale, {
    month: "short",
  });
}

export default function SpendingTrendingChart({ period }: Props) {
  const { t, i18n } = useTranslation();
  const { format: formatCurrency } = useCurrency();

  // A one-month trend is a single point, so short periods keep the
  // default trend (last 6 months) instead
  const trendPeriod =
    period === "this-month" || period === "last-month" ? undefined : period;
  const periodLabel = t(`dashboard.periods.${trendPeriod ?? "last-6"}`);

  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    trend: BudgetTrendPoint[] | null;
  } | null>(null);
  // Changes on every new request; results from older requests are ignored
  const key = `${trendPeriod ?? "default"}-${attempt}`;

  useEffect(() => {
    let cancelled = false;
    getBudgetTrend(trendPeriod)
      .then((res) => res.data)
      .catch(() => null)
      .then((data) => !cancelled && setResult({ key, trend: data }));
    return () => {
      cancelled = true;
    };
  }, [key, trendPeriod]);

  const loading = result?.key !== key;
  const trend = loading ? null : (result?.trend ?? null);
  const error = !loading && !trend;
  const onRetry = () => setAttempt((n) => n + 1);

  if (!loading && error) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-base">
            {t("dashboard.overview.trend.title")}
          </CardTitle>
        </CardHeader>
        <CardError
          message={t("dashboard.overview.trend.error")}
          onRetry={onRetry}
        />
      </Card>
    );
  }

  if (loading || !trend) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-3 w-44" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <Skeleton className="h-65 w-full" />
        </CardContent>
      </Card>
    );
  }

  const spendingTrend = trend.map((point) => ({
    month: formatMonth(point.month, i18n.language),
    income: point.income,
    expenses: point.expense,
  }));

  const header = (
    <CardHeader>
      <div className="flex items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">
            {t("dashboard.overview.trend.title")}
          </CardTitle>
          <CardDescription>
            {t("dashboard.overview.trend.description")} · {periodLabel}
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="analytics">{t("dashboard.common.seeDetails")}</Link>
        </Button>
      </div>
    </CardHeader>
  );

  // No transactions in the whole range: a flat line at 0 looks like a broken chart
  if (trend.every((p) => p.income === 0 && p.expense === 0)) {
    return (
      <Card className="flex flex-col">
        {header}
        <CardContent className="flex flex-1">
          <EmptyState
            icon={LineChart}
            message={t("dashboard.overview.trend.empty")}
          />
        </CardContent>
      </Card>
    );
  }

  // Points are monthly, so a one-month period has nothing to draw a line with
  if (spendingTrend.length < 2) {
    return (
      <Card className="flex flex-col">
        {header}
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-center text-sm text-muted-foreground">
            {t("dashboard.overview.trend.notEnoughData")}
            <br />
            {t("dashboard.overview.trend.pickLongerPeriod")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      {header}

      <CardContent className="flex-1">
        <div
          role="img"
          aria-label={t("dashboard.overview.trend.chartLabel", {
            period: periodLabel.toLowerCase(),
          })}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={spendingTrend}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--finance-success)"
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--finance-success)"
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--finance-danger)"
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--finance-danger)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrency(Number(v))}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name,
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  fontSize: "13px",
                }}
              />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px" }}
              />

              <Area
                type="monotone"
                dataKey="income"
                name={t("dashboard.common.income")}
                stroke="var(--finance-success)"
                strokeWidth={2}
                fill="url(#income)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name={t("dashboard.common.expenses")}
                stroke="var(--finance-danger)"
                strokeWidth={2}
                fill="url(#expenses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
