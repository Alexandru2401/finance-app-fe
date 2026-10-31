import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { BudgetTarget } from "@/api/budget";
import { useCurrency } from "@/hooks/useCurrency";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  PiggyBank,
} from "lucide-react";
import { useTranslation } from "react-i18next";

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

function TargetProgress({ target, pct, label, barClassName }: TargetProgressProps) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  // Progress can be negative (net) or above 100, the bar only shows 0-100
  const width = Math.min(Math.max(pct ?? 0, 0), 100);

  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        {target === null ? (
          <span>{t("dashboard.budget.summary.noTarget")}</span>
        ) : (
          <>
            <span>
              {pct === null
                ? "—"
                : t(`dashboard.budget.summary.${label}`, {
                    pct: Math.round(pct),
                  })}
            </span>
            <span>{format(target)}</span>
          </>
        )}
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
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
  const { format } = useCurrency();

  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0">
      <Card className="border min-w-[80%] snap-center shrink-0 md:min-w-0 md:shrink">
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-lg text-foreground">
            <ArrowUpRight className="text-finance-success" />{" "}
            {t("dashboard.common.income")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold text-foreground">
            {format(totalIncome, "auto", true)}
          </p>
          <TargetProgress
            target={target.income}
            pct={progress.income}
            label="ofTarget"
            barClassName="bg-finance-success"
          />
        </CardContent>
      </Card>

      <Card className="border min-w-[80%] snap-center shrink-0 md:min-w-0 md:shrink">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <ArrowDownRight className="text-finance-danger" />
            {t("dashboard.common.expenses")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold text-foreground">
            {format(totalExpenses, "auto", true)}
          </p>
          <TargetProgress
            target={target.expense}
            pct={progress.expense}
            label="ofLimit"
            barClassName="bg-finance-danger"
          />
        </CardContent>
      </Card>

      <Card className="border min-w-[80%] snap-center shrink-0 md:min-w-0 md:shrink">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <PiggyBank className="text-finance-primary" />{" "}
            {t("dashboard.common.savings")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold text-foreground">
            {format(totalSavings, "auto", true)}
          </p>
          <TargetProgress
            target={target.savings}
            pct={progress.savings}
            label="ofGoal"
            barClassName="bg-finance-primary"
          />
        </CardContent>
      </Card>

      <Card className="border min-w-[80%] snap-center shrink-0 md:min-w-0 md:shrink">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <DollarSign className="text-finance-purple" />{" "}
            {t("dashboard.budget.summary.netBalance")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold text-foreground">
            {format(netBalance, "auto", true)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
