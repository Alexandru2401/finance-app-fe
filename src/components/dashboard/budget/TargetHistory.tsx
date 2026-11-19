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
import CompactAmount from "@/components/dashboard/shared/CompactAmount";
import InlineError from "@/components/dashboard/shared/InlineError";
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
  if (target === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col">
      <span>
        {/* 4 money columns: short form (200K) until the table has 48rem */}
        {actual === undefined ? (
          "—"
        ) : (
          <CompactAmount value={actual} fullFrom="3xl" />
        )}
        <span className="text-muted-foreground">
          {" / "}
          <CompactAmount value={target} fullFrom="3xl" />
        </span>
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
  const [attempt, setAttempt] = useState(0);
  const retry = () => {
    setRows(undefined);
    setAttempt((n) => n + 1);
  };
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
  }, [attempt]);

  if (rows === undefined) {
    return (
      <>
        {/* The export button only appears with data; same box, table and
            two-line cells (amounts + %) as the real history */}
        <HistoryHeader>
          <Skeleton className="h-8 w-28 rounded-md" />
        </HistoryHeader>
        <div className="rounded-md border" aria-hidden="true">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {[0, 1, 2, 3, 4].map((i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-3.5 w-14" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[0, 1, 2].map((row) => (
                <TableRow key={row} className="hover:bg-transparent">
                  <TableCell>
                    <Skeleton className="h-3.5 w-16" />
                  </TableCell>
                  {[0, 1, 2, 3].map((i) => (
                    <TableCell key={i}>
                      <div className="flex h-5 items-center">
                        <Skeleton className="h-3.5 w-20" />
                      </div>
                      <div className="flex h-4 items-center">
                        <Skeleton className="h-3 w-8" />
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  if (rows === null) {
    return (
      <>
        <HistoryHeader />
        <InlineError
          message={t("dashboard.budget.history.loadError")}
          onRetry={retry}
          className="rounded-md border border-dashed px-3 py-6 justify-center text-sm"
        />
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
      <div className="@container max-h-80 overflow-y-auto rounded-md border">
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
              <TableRow key={target.month}>
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
