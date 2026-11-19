import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChartPie } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCurrency } from "@/hooks/useCurrency";
import FitAmount from "@/components/dashboard/shared/FitAmount";
import CardError from "@/components/dashboard/shared/CardError";
import { getCategoryTotals, type CategoryTotal } from "@/api/budget";
import { monthPeriod } from "@/lib/periods";

type Tab = "income" | "expenses" | "savings";

interface ExtraInfoProps {
  activeTab: Tab;
  // "YYYY-MM-01", the month the Budget page shows
  month: string;
  // Bumped by the page after a change, so the data is fetched again
  refreshKey: number;
}

// At most 5 slices: with more categories, the top 4 + "Other" with the rest
const MAX_SLICES = 5;

// Colors from index.css, by position (biggest category first); "Other" is gray
// Donut: the ring is a circle drawn in pieces; pathLength=100 means lengths in %
const RADIUS = 40;
const STROKE = 14;
// Gap between pieces, in % of the ring
const DONUT_GAP = 1;

const color = (index: number, key: string) =>
  key === "other" ? "var(--breakdown-other)" : `var(--breakdown-${index + 1})`;

// "Where the money went": total per category for the active tab and month
export default function ExtraInfo({
  activeTab,
  month,
  refreshKey,
}: ExtraInfoProps) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  // Key of the request the rows belong to, so a new tab / month / retry shows loading
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${activeTab}#${month}#${refreshKey}#${attempt}`;
  const [result, setResult] = useState<{
    key: string;
    rows: CategoryTotal[] | null;
  } | null>(null);

  useEffect(() => {
    let ignore = false;
    getCategoryTotals(activeTab, monthPeriod(month))
      .then((res) => !ignore && setResult({ key: requestKey, rows: res.data }))
      .catch(() => !ignore && setResult({ key: requestKey, rows: null }));
    return () => {
      ignore = true;
    };
  }, [activeTab, month, requestKey]);

  const loading = result?.key !== requestKey;
  const rows = result?.rows ?? [];
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  const visible =
    rows.length > MAX_SLICES ? rows.slice(0, MAX_SLICES - 1) : rows;
  const shown = visible.map((row) => ({
    key: row.category_id ?? "uncategorized",
    name: row.category ?? t("dashboard.common.uncategorized"),
    total: row.total,
  }));
  const rest = rows
    .slice(visible.length)
    .reduce((sum, row) => sum + row.total, 0);
  if (rest > 0) {
    shown.push({
      key: "other",
      name: t("dashboard.budget.extraInfo.other"),
      total: rest,
    });
  }

  const pctOf = (value: number) => Math.round((value / total) * 100);

  const tip = (row: (typeof shown)[number]) =>
    `${row.name}: ${format(row.total)} (${pctOf(row.total)}%)`;

  // Ring split by category, with the total in the middle
  function donut() {
    const gap = shown.length > 1 ? DONUT_GAP : 0;
    let start = 0;
    return (
      <div className="relative mx-auto aspect-square w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          {shown.map((row, i) => {
            const share = (row.total / total) * 100;
            // At least a sliver, so tiny categories stay visible
            const length = Math.max(share - gap, 0.5);
            const offset = start;
            start += share;
            return (
              <Tooltip key={row.key}>
                <TooltipTrigger asChild>
                  <circle
                    cx="50"
                    cy="50"
                    r={RADIUS}
                    fill="none"
                    stroke={color(i, row.key)}
                    strokeWidth={STROKE}
                    pathLength={100}
                    strokeDasharray={`${length} ${100 - length}`}
                    strokeDashoffset={-offset}
                  />
                </TooltipTrigger>
                <TooltipContent>{tip(row)}</TooltipContent>
              </Tooltip>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">
            {t("dashboard.budget.extraInfo.total")}
          </span>
          {/* The hole is ~4.5rem wide: large totals shorten to fit it */}
          <FitAmount
            value={total}
            className="w-18 text-center text-sm font-semibold"
          />
        </div>
      </div>
    );
  }

  function body() {
    if (loading) {
      // Same pieces as the real body: the ring (w-28) and legend rows of
      // dot + name + amount, each as tall as a text-sm line
      return (
        <div className="space-y-4">
          <div className="relative mx-auto aspect-square w-28">
            <Skeleton className="size-full rounded-full" />
            <div className="absolute inset-3.5 rounded-full bg-card" />
          </div>
          <ul className="space-y-2" aria-hidden="true">
            {Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="flex h-5 items-center gap-2">
                <Skeleton className="size-2.5 shrink-0 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="ml-auto h-3.5 w-20" />
              </li>
            ))}
          </ul>
        </div>
      );
    }
    if (result?.rows === null) {
      return (
        <div className="flex h-full">
          <CardError
            message={t("dashboard.budget.extraInfo.loadError")}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        </div>
      );
    }
    if (shown.length === 0) {
      return (
        <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
          {t(`dashboard.budget.extraInfo.${activeTab}.empty`)}
        </p>
      );
    }
    return (
      <div className="space-y-4">
        {donut()}

        {/* Legend with the values, so the colors are never the only label */}
        <ul className="space-y-2">
          {shown.map((row, i) => (
            <li key={row.key} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color(i, row.key) }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {row.name}
              </span>
              <span className="shrink-0 font-medium tabular-nums">
                {format(row.total)}{" "}
                <span className="text-xs text-muted-foreground">
                  ({pctOf(row.total)}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    // Fixed height (fits the donut + 5 legend rows), so the card does not
    // change size between tabs, months, loading and empty states
    <Card className="h-[21rem] w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
            <ChartPie
              size={14}
              className="text-foreground"
              aria-hidden="true"
            />
          </span>
          <CardTitle className="text-sm">
            {t(`dashboard.budget.extraInfo.${activeTab}.title`)}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1">{body()}</CardContent>
    </Card>
  );
}
