import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { BudgetTarget } from "@/api/budget";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  PiggyBank,
} from "lucide-react";

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
  label: string;
  barClassName: string;
}

function TargetProgress({ target, pct, label, barClassName }: TargetProgressProps) {
  // Progress can be negative (net) or above 100, the bar only shows 0-100
  const width = Math.min(Math.max(pct ?? 0, 0), 100);

  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        {target === null ? (
          <span>No target set</span>
        ) : (
          <>
            <span>{pct === null ? "—" : `${Math.round(pct)}% ${label}`}</span>
            <span>${target.toLocaleString()}</span>
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
  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0">
      <Card className="border min-w-[80%] snap-center shrink-0 md:min-w-0 md:shrink">
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-lg text-foreground">
            <ArrowUpRight className="text-finance-success" /> Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold text-foreground">
            ${totalIncome.toFixed(2)}
          </p>
          <TargetProgress
            target={target.income}
            pct={progress.income}
            label="of target"
            barClassName="bg-finance-success"
          />
        </CardContent>
      </Card>

      <Card className="border min-w-[80%] snap-center shrink-0 md:min-w-0 md:shrink">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <ArrowDownRight className="text-finance-danger" />
            Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold text-foreground">
            ${totalExpenses.toFixed(2)}
          </p>
          <TargetProgress
            target={target.expense}
            pct={progress.expense}
            label="of limit"
            barClassName="bg-finance-danger"
          />
        </CardContent>
      </Card>

      <Card className="border min-w-[80%] snap-center shrink-0 md:min-w-0 md:shrink">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <PiggyBank className="text-finance-primary" /> Savings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold text-foreground">
            ${totalSavings.toFixed(2)}
          </p>
          <TargetProgress
            target={target.savings}
            pct={progress.savings}
            label="of goal"
            barClassName="bg-finance-primary"
          />
        </CardContent>
      </Card>

      <Card className="border min-w-[80%] snap-center shrink-0 md:min-w-0 md:shrink">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <DollarSign className="text-finance-purple" /> Net balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold text-foreground">
            ${netBalance.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
