import {
  getAllBudgetTargets,
  getBudgetSummary,
  type BudgetSummary,
  type MonthlyBudgetTarget,
} from "@/api/budget";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMonth, monthPeriod } from "@/lib/periods";
import { Download } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

interface HistoryRow {
  target: MonthlyBudgetTarget;
  // Actual totals and progress of that month; null if they could not be loaded
  summary: BudgetSummary | null;
}

const formatMoney = (value: number) => `$${value.toLocaleString()}`;

interface TargetCellProps {
  actual: number | undefined;
  target: number | null;
  pct: number | null | undefined;
}

function TargetCell({ actual, target, pct }: TargetCellProps) {
  if (target === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col">
      <span>
        {actual === undefined ? "—" : formatMoney(actual)}
        <span className="text-muted-foreground"> / {formatMoney(target)}</span>
      </span>
      <span className="text-xs text-muted-foreground">
        {pct === null || pct === undefined ? "—" : `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

function HistoryHeader({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold">Target history</h3>
      {children}
    </div>
  );
}

export default function TargetHistory() {
  // undefined while loading, null if the targets could not be loaded
  const [rows, setRows] = useState<HistoryRow[] | null | undefined>(undefined);

  useEffect(() => {
    let ignore = false;

    async function fetchHistory() {
      const res = await getAllBudgetTargets();
      if (!res.ok || !res.data) {
        if (!ignore) setRows(null);
        return;
      }

      // /target/all has only the targets, the summary of each month adds
      // the actual totals and the progress
      const history = await Promise.all(
        res.data.map(async (target) => {
          const summary = await getBudgetSummary(monthPeriod(target.month));
          return { target, summary: summary.ok ? summary.data : null };
        }),
      );
      if (!ignore) setRows(history);
    }

    fetchHistory();
    return () => {
      ignore = true;
    };
  }, []);

  if (rows === undefined) {
    return (
      <>
        <HistoryHeader />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </>
    );
  }

  if (rows === null) {
    return (
      <>
        <HistoryHeader />
        <p className="text-sm text-destructive">
          Could not load target history.
        </p>
      </>
    );
  }

  if (rows.length === 0) {
    return (
      <>
        <HistoryHeader />
        <p className="text-sm text-muted-foreground">No targets saved yet.</p>
      </>
    );
  }

  return (
    <>
      <HistoryHeader>
        <Button
          variant="outline"
          size="sm"
          // TODO: download comes from the backend
          className="cursor-pointer gap-1.5"
        >
          <Download size={14} />
          Download
        </Button>
      </HistoryHeader>
      <div className="max-h-80 overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Income</TableHead>
              <TableHead>Expenses</TableHead>
              <TableHead>Savings</TableHead>
              <TableHead>Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ target, summary }) => (
              <TableRow key={target.id}>
                <TableCell className="font-medium">
                  {formatMonth(target.month)}
                </TableCell>
                <TableCell>
                  <TargetCell
                    actual={summary?.income}
                    target={target.income}
                    pct={summary?.progress.income}
                  />
                </TableCell>
                <TableCell>
                  <TargetCell
                    actual={summary?.expense}
                    target={target.expense}
                    pct={summary?.progress.expense}
                  />
                </TableCell>
                <TableCell>
                  <TargetCell
                    actual={summary?.savings}
                    target={target.savings}
                    pct={summary?.progress.savings}
                  />
                </TableCell>
                <TableCell>
                  <TargetCell
                    actual={summary?.net}
                    target={target.net}
                    pct={summary?.progress.net}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
