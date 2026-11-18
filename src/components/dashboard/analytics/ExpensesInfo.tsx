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
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import CardError from "@/components/dashboard/shared/CardError";
import type { RequestState } from "@/hooks/useRequest";
import { useCurrency } from "@/hooks/useCurrency";
import type { ForecastPoint } from "@/api/budget";
import { shortMonth, type CostRow } from "@/lib/analytics";
import { AlertTriangle, Pin } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis } from "recharts";

interface Props {
  // Active recurring expenses
  fixed: RequestState<CostRow[]>;
  // Biggest non-recurring expense categories in the period
  variable: RequestState<CostRow[]>;
  // Monthly savings + forecast
  savings: RequestState<ForecastPoint[]>;
  periodLabel: string;
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

function CostList({
  rows,
  barClass,
  trackClass,
}: {
  rows: CostRow[];
  barClass: string;
  trackClass: string;
}) {
  const { format } = useCurrency();
  return (
    <ul className="space-y-2.5">
      {rows.map(({ key, label, amount, pct }) => (
        <li key={key} className="space-y-1">
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">{label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {format(amount)}{" "}
              <span className="text-xs text-muted-foreground">({pct}%)</span>
            </span>
          </div>
          <div className={`h-1.5 w-full rounded-full ${trackClass}`}>
            <div
              className={`h-1.5 rounded-full ${barClass}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ExpensesInfo({
  fixed,
  variable,
  savings,
  periodLabel,
}: Props) {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();

  const fixedTotal = (fixed.data ?? []).reduce((s, r) => s + r.amount, 0);
  const variableTotal = (variable.data ?? []).reduce((s, r) => s + r.amount, 0);

  const savingsConfig = {
    savings: {
      label: t("dashboard.common.savings"),
      color: "var(--finance-primary)",
    },
    forecast: {
      label: t("dashboard.analytics.forecast.label"),
      color: "var(--finance-primary)",
    },
  } satisfies ChartConfig;

  const savingsData = (savings.data ?? []).map((p) => ({
    ...p,
    label: shortMonth(p.month, i18n.language),
  }));

  // Loading / error / empty for one card, otherwise its content
  function state<T>(
    request: RequestState<T[]>,
    empty: ReactNode,
    content: ReactNode,
  ) {
    if (request.loading) return <ListSkeleton />;
    if (request.error)
      return (
        <CardError
          message={t("dashboard.analytics.loadError")}
          onRetry={request.retry}
        />
      );
    if (!request.data?.length)
      return <p className="text-sm text-muted-foreground">{empty}</p>;
    return content;
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      {/* Fixed: the recurring expenses, added automatically every month */}
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
              <Pin
                size={14}
                className="text-muted-foreground"
                aria-hidden="true"
              />
            </span>
            <CardTitle className="text-sm">
              {t("dashboard.analytics.fixed.title")}
            </CardTitle>
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t("dashboard.analytics.fixed.badge")}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {state(
            fixed,
            <>
              {t("dashboard.analytics.fixed.empty")}{" "}
              <Link
                to="/dashboard/settings?tab=categories"
                className="underline hover:text-foreground"
              >
                {t("dashboard.analytics.fixed.emptyLink")}
              </Link>
            </>,
            <CostList
              rows={fixed.data ?? []}
              barClass="bg-finance-primary"
              trackClass="bg-muted"
            />,
          )}
        </CardContent>
        {!!fixed.data?.length && (
          <CardFooter className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              {t("dashboard.analytics.fixed.total")}{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {format(fixedTotal)}
              </span>
            </p>
          </CardFooter>
        )}
      </Card>

      {/* Variable: the biggest non-recurring expense categories in the period */}
      <Card className="flex-1 border-finance-warning/30 bg-finance-warning-bg/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-finance-warning-bg">
              <AlertTriangle
                size={14}
                className="text-finance-warning"
                aria-hidden="true"
              />
            </span>
            <CardTitle className="text-sm">
              {t("dashboard.analytics.variable.title")}
            </CardTitle>
            <span className="ml-auto rounded-full bg-finance-warning-bg px-2 py-0.5 text-xs font-medium text-finance-warning">
              {periodLabel}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {state(
            variable,
            t("dashboard.analytics.variable.empty"),
            <CostList
              rows={variable.data ?? []}
              barClass="bg-finance-warning"
              trackClass="bg-finance-warning-bg"
            />,
          )}
        </CardContent>
        {!!variable.data?.length && (
          <CardFooter className="border-t border-finance-warning/30 pt-4">
            <p className="text-xs text-muted-foreground">
              {t("dashboard.analytics.variable.total")}{" "}
              <span className="font-semibold tabular-nums text-finance-warning">
                {format(variableTotal)}
              </span>{" "}
              {t("dashboard.analytics.variable.hint")}
            </p>
          </CardFooter>
        )}
      </Card>

      {/* Monthly savings + a simple forecast (average of the last 3 months) */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-sm">
            {t("dashboard.analytics.forecast.title")}
          </CardTitle>
          <CardDescription>
            {t("dashboard.analytics.forecast.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {savings.loading ? (
            <Skeleton className="h-48 w-full" />
          ) : savings.error ? (
            <CardError
              message={t("dashboard.analytics.loadError")}
              onRetry={savings.retry}
            />
          ) : savingsData.length < 2 || savingsData.every((p) => !p.savings) ? (
            <p className="text-sm text-muted-foreground">
              {t("dashboard.analytics.forecast.empty")}
            </p>
          ) : (
            <ChartContainer config={savingsConfig}>
              <LineChart
                data={savingsData}
                margin={{ top: 8, left: 4, right: 4, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload, label }) => {
                    const entry = payload?.find((p) => p.value != null);
                    if (!active || !entry) return null;
                    const isForecast = entry.dataKey === "forecast";
                    return (
                      <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-md">
                        <p className="mb-1 font-medium text-card-foreground">
                          {label}
                        </p>
                        <p
                          className={
                            isForecast
                              ? "italic text-muted-foreground"
                              : "text-card-foreground"
                          }
                        >
                          {isForecast
                            ? t("dashboard.analytics.forecast.label")
                            : t("dashboard.common.savings")}
                          :{" "}
                          <span className="font-semibold">
                            {format(Number(entry.value))}
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  y={0}
                  stroke="var(--destructive)"
                  strokeDasharray="4 2"
                  strokeWidth={1}
                />
                <Line
                  dataKey="savings"
                  type="monotone"
                  stroke="var(--color-savings)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-savings)", r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
                <Line
                  dataKey="forecast"
                  type="monotone"
                  stroke="var(--color-forecast)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ fill: "var(--color-forecast)", r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
        <CardFooter className="flex-col items-start gap-1 pt-0 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded bg-finance-primary" />
              {t("dashboard.analytics.forecast.history")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-finance-primary" />
              {t("dashboard.analytics.forecast.label")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 border-t border-dashed border-destructive" />
              {t("dashboard.analytics.forecast.zero")}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
