import { Info, Lightbulb, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CardError from "@/components/dashboard/shared/CardError";
import type { RequestState } from "@/hooks/useRequest";
import { useCurrency } from "@/hooks/useCurrency";
import type { SpendingTip } from "@/lib/analytics";
import { useTranslation } from "react-i18next";

interface Props {
  // Expenses of the last complete month vs the average of the 3 months before
  change: RequestState<{
    last: number;
    average: number;
    changePct: number;
  } | null>;
  // Categories that grew the most last month
  tips: RequestState<SpendingTip[]>;
}

export default function AnalyticsInsight({ change, tips }: Props) {
  const { t } = useTranslation();
  const { format } = useCurrency();

  const totalSaving = (tips.data ?? []).reduce((s, tip) => s + tip.saving, 0);

  function summary() {
    if (change.loading) return <Skeleton className="h-4 w-3/4" />;
    if (change.error) return t("dashboard.analytics.loadError");
    if (!change.data) return t("dashboard.analytics.insight.notEnoughData");

    const { last, average, changePct } = change.data;
    const key =
      changePct > 0
        ? "dashboard.analytics.insight.up"
        : changePct < 0
          ? "dashboard.analytics.insight.down"
          : "dashboard.analytics.insight.same";
    return t(key, {
      last: format(last),
      average: format(average),
      pct: Math.abs(changePct),
    });
  }

  const ChangeIcon =
    change.data && change.data.changePct > 0 ? TrendingUp : TrendingDown;

  return (
    <Card className="flex-1">
      <CardContent className="p-5">
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-finance-primary/10 p-4">
          {change.data ? (
            <ChangeIcon
              size={16}
              className={`mt-0.5 shrink-0 ${
                change.data.changePct > 0
                  ? "text-finance-danger"
                  : "text-finance-success"
              }`}
              aria-hidden="true"
            />
          ) : (
            <Info
              size={16}
              className="mt-0.5 shrink-0 text-finance-primary"
              aria-hidden="true"
            />
          )}
          <div className="flex-1 text-sm leading-relaxed text-foreground">
            {summary()}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
            <Lightbulb
              size={14}
              className="text-finance-warning"
              aria-hidden="true"
            />
          </span>
          <h3 className="text-sm font-semibold text-card-foreground">
            {t("dashboard.analytics.insight.title")}
          </h3>
          <span className="ml-auto rounded-full bg-finance-warning-bg px-2 py-0.5 text-xs font-medium text-finance-warning">
            {t("dashboard.analytics.insight.badge")}
          </span>
        </div>

        {tips.loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : tips.error ? (
          <CardError
            message={t("dashboard.analytics.loadError")}
            onRetry={tips.retry}
          />
        ) : !tips.data?.length ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            {t("dashboard.analytics.insight.noTips")}
          </p>
        ) : (
          <>
            <ul className="space-y-2.5">
              {tips.data.map((tip) => (
                <li
                  key={tip.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-finance-warning-bg/50 px-3 py-2.5"
                >
                  <span className="text-sm text-card-foreground">
                    {t("dashboard.analytics.insight.tip", {
                      category: tip.category,
                      pct: tip.increasePct,
                      average: format(tip.average),
                    })}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-finance-success">
                    {t("dashboard.analytics.insight.saving", {
                      amount: format(tip.saving),
                    })}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("dashboard.analytics.insight.totalSaving")}{" "}
              <span className="font-semibold text-finance-success">
                {t("dashboard.analytics.insight.saving", {
                  amount: format(totalSaving),
                })}
              </span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
