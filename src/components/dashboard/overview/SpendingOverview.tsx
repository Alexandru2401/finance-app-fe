import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import { getTopExpenses, type TopExpense } from "@/api/budget";
import CardError from "@/components/dashboard/shared/CardError";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import { useCurrency } from "@/hooks/useCurrency";
import type { Period } from "@/lib/periods";
import { Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";

// Categorical palette (same as the Budget breakdown, colorblind-checked).
// Not the finance-* colors: green/amber would read as income/warning here
// The backend returns at most 5 categories (fetchTopExpenses(..., 5, ...))
const TOP_COUNT = 5;

const CATEGORY_BAR_COLORS = [
  "[&>*]:bg-breakdown-1",
  "[&>*]:bg-breakdown-2",
  "[&>*]:bg-breakdown-3",
  "[&>*]:bg-breakdown-4",
  "[&>*]:bg-breakdown-5",
];

interface Props {
  period: Period;
}

export default function SpendingOverview({ period }: Props) {
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    items: TopExpense[] | null;
  } | null>(null);
  // Changes on every new request; results from older requests are ignored
  const key = `${period}-${attempt}`;

  useEffect(() => {
    let cancelled = false;
    getTopExpenses(period)
      .then((res) => res.data)
      .catch(() => null)
      .then((data) => !cancelled && setResult({ key, items: data }));
    return () => {
      cancelled = true;
    };
  }, [key, period]);

  const loading = result?.key !== key;
  const items = loading ? null : (result?.items ?? null);
  const error = !loading && !items;
  const onRetry = () => setAttempt((n) => n + 1);

  const topAmount = items?.[0]?.amount ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              {t("dashboard.overview.topSpendings.title")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.overview.topSpendings.description")} ·{" "}
              {t(`dashboard.periods.${period}`)}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="transactions">{t("dashboard.common.seeAll")}</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error and empty keep the height of the full list (5 rows), so the
            card doesn't shrink next to its neighbour */}
        {!loading && error ? (
          <div className="flex min-h-52">
            <CardError
              message={t("dashboard.overview.topSpendings.error")}
              onRetry={onRetry}
            />
          </div>
        ) : loading || !items ? (
          <div className="space-y-3 pt-2">
            {Array.from({ length: TOP_COUNT }, (_, i) => (
              <div key={i} className="space-y-1">
                {/* h-5 = the real text-sm row */}
                <div className="flex h-5 items-center justify-between gap-3">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-52">
            <EmptyState
              icon={Receipt}
              message={t("dashboard.overview.topSpendings.empty")}
            />
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {items.map((item, i) => (
              <div key={item.item_id} className="space-y-1">
                {/* The amount keeps its full width; a long category name is cut instead */}
                <div className="flex justify-between gap-3 text-sm">
                  <span
                    className="min-w-0 truncate text-muted-foreground"
                    title={item.category || undefined}
                  >
                    {item.category || t("dashboard.common.uncategorized")}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <Progress
                  value={topAmount > 0 ? (item.amount / topAmount) * 100 : 0}
                  className={`h-1.5 ${CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length]}`}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
