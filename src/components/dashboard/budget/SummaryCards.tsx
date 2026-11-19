import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { BudgetTarget } from "@/api/budget";
import FitAmount from "@/components/dashboard/shared/FitAmount";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  PiggyBank,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Shared with the loading skeleton (BudgetPage), so both lay out the same.
// By the column's width (@container), not the viewport's: a horizontal
// carousel below 32rem, 2 columns from 32rem, 4 columns from 48rem
export const SUMMARY_GRID =
  "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 @lg:grid @lg:grid-cols-2 @lg:overflow-visible @lg:pb-0 @3xl:grid-cols-4";
export const SUMMARY_CARD =
  "min-w-4/5 shrink-0 snap-center @lg:min-w-0 @lg:shrink";

interface SummaryProps {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  netBalance: number;
  target: BudgetTarget;
  progress: BudgetTarget;
}

interface TargetProgressProps {
  target: number | null;
  pct: number | null;
  // Key under dashboard.budget.summary, e.g. "42% of target"
  label: "ofTarget" | "ofLimit" | "ofGoal";
  barClassName: string;
}

function TargetProgress({
  target,
  pct,
  label,
  barClassName,
}: TargetProgressProps) {
  const { t } = useTranslation();
  // Progress can be negative (net) or above 100, the bar only shows 0-100
  const width = Math.min(Math.max(pct ?? 0, 0), 100);

  return (
    <div className="mt-3 space-y-1">
      {/* The % label keeps its width; the target amount shortens if needed */}
      <div className="flex justify-between gap-2 text-xs text-muted-foreground">
        {target === null ? (
          <span>{t("dashboard.budget.summary.noTarget")}</span>
        ) : (
          <>
            <span className="shrink-0">
              {pct === null
                ? "—"
                : t(`dashboard.budget.summary.${label}`, {
                    pct: Math.round(pct),
                  })}
            </span>
            <FitAmount value={target} className="flex-1 text-right" />
          </>
        )}
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full transition-all ${barClassName}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function SummaryCards({
  totalIncome,
  totalExpenses,
  totalSavings,
  netBalance,
  target,
  progress,
}: SummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="@container">
      <div className={SUMMARY_GRID}>
        <Card className={SUMMARY_CARD}>
          <CardHeader>
            <CardTitle className="flex items-center gap-1 text-lg text-foreground">
              <ArrowUpRight className="text-finance-success" />{" "}
              {t("dashboard.common.income")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FitAmount
              value={totalIncome}
              fixed
              className="text-xl font-semibold text-foreground"
            />
            <TargetProgress
              target={target.income}
              pct={progress.income}
              label="ofTarget"
              barClassName="bg-finance-success"
            />
          </CardContent>
        </Card>

        <Card className={SUMMARY_CARD}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <ArrowDownRight className="text-finance-danger" />
              {t("dashboard.common.expenses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FitAmount
              value={totalExpenses}
              fixed
              className="text-xl font-semibold text-foreground"
            />
            <TargetProgress
              target={target.expense}
              pct={progress.expense}
              label="ofLimit"
              barClassName="bg-finance-danger"
            />
          </CardContent>
        </Card>

        <Card className={SUMMARY_CARD}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <PiggyBank className="text-finance-primary" />{" "}
              {t("dashboard.common.savings")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FitAmount
              value={totalSavings}
              fixed
              className="text-xl font-semibold text-foreground"
            />
            <TargetProgress
              target={target.savings}
              pct={progress.savings}
              label="ofGoal"
              barClassName="bg-finance-primary"
            />
          </CardContent>
        </Card>

        <Card className={SUMMARY_CARD}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <DollarSign className="text-finance-purple" />{" "}
              {t("dashboard.budget.summary.netBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FitAmount
              value={netBalance}
              fixed
              className="text-xl font-semibold text-foreground"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
