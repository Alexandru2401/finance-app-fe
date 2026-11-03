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

const CATEGORY_BAR_COLORS = [
  "[&>*]:bg-finance-primary",
  "[&>*]:bg-finance-purple",
  "[&>*]:bg-finance-warning",
  "[&>*]:bg-finance-success",
  "[&>*]:bg-muted-foreground",
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
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {t("dashboard.overview.topSpendings.title")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.overview.topSpendings.description")} ·{" "}
              {t(`dashboard.periods.${period}`)}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="transactions">{t("dashboard.common.seeAll")}</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!loading && error ? (
          <CardError
            message={t("dashboard.overview.topSpendings.error")}
            onRetry={onRetry}
          />
        ) : loading || !items ? (
          <div className="space-y-3 pt-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3.5 w-12" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Receipt}
            message={t("dashboard.overview.topSpendings.empty")}
          />
        ) : (
          <div className="space-y-3 pt-2">
            {items.map((item, i) => (
              <div key={item.item_id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.category || t("dashboard.common.uncategorized")}
                  </span>
                  <span className="font-medium tabular-nums">
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
