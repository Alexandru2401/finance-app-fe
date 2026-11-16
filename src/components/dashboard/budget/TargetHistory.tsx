import {
  exportTargetHistory,
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
import { useCurrency } from "@/hooks/useCurrency";
import { Download } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface HistoryRow {
  target: MonthlyBudgetTarget;
  // Actual totals and progress of that month; null if they could not be loaded
  summary: BudgetSummary | null;
}

interface TargetCellProps {
  actual: number | undefined;
  target: number | null;
  pct: number | null | undefined;
}

function TargetCell({ actual, target, pct }: TargetCellProps) {
  const { format: formatMoney } = useCurrency();

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
  const { t } = useTranslation();

  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold">
        {t("dashboard.budget.history.title")}
      </h3>
      {children}
    </div>
  );
}

export default function TargetHistory() {
  const { t, i18n } = useTranslation();
  // undefined while loading, null if the targets could not be loaded
  const [rows, setRows] = useState<HistoryRow[] | null | undefined>(undefined);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await exportTargetHistory(i18n.language);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `target-history-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("dashboard.budget.history.downloadError"));
    } finally {
      setDownloading(false);
    }
  }

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
          {t("dashboard.budget.history.loadError")}
        </p>
      </>
    );
  }

  if (rows.length === 0) {
    return (
      <>
        <HistoryHeader />
        <p className="text-sm text-muted-foreground">
          {t("dashboard.budget.history.empty")}
        </p>
      </>
    );
  }

  return (
    <>
      <HistoryHeader>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="cursor-pointer gap-1.5"
        >
          <Download size={14} aria-hidden="true" />
          {downloading
            ? t("dashboard.budget.history.downloading")
            : t("dashboard.budget.history.download")}
        </Button>
      </HistoryHeader>
      <div className="max-h-80 overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dashboard.budget.history.month")}</TableHead>
              <TableHead>{t("dashboard.common.income")}</TableHead>
              <TableHead>{t("dashboard.common.expenses")}</TableHead>
              <TableHead>{t("dashboard.common.savings")}</TableHead>
              <TableHead>{t("dashboard.budget.history.net")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ target, summary }) => (
              <TableRow key={target.id}>
                <TableCell className="font-medium">
                  {formatMonth(target.month, i18n.language)}
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
