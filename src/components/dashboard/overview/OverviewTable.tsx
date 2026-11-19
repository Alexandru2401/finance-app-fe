import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router";
import { useEffect, useState } from "react";
import { getTransactions, type Transaction } from "@/api/transactions";
import CardError from "@/components/dashboard/shared/CardError";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import RecurringBadge from "@/components/dashboard/shared/RecurringBadge";
import { useCurrency } from "@/hooks/useCurrency";
import { ArrowLeftRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDay } from "@/lib/date";

const TYPE_STYLES: Record<Transaction["type"], string> = {
  income: "bg-finance-success-bg text-finance-success",
  expenses: "bg-finance-danger-bg text-finance-danger",
  savings: "bg-finance-primary-bg text-finance-primary",
};

const AMOUNT_COLORS: Record<Transaction["type"], string> = {
  income: "text-finance-success",
  expenses: "text-finance-danger",
  savings: "text-finance-primary",
};

// Rows requested from the API (limit), also the number of skeleton rows
const ROWS = 5;

// From this amount up, narrow cards show the short form (10.000 -> 10K)
const COMPACT_FROM = 10_000;

const fmtDate = (date: string, locale: string) =>
  formatDay(date, locale, { month: "short", day: "numeric" });

export default function OverviewTable() {
  const { t, i18n } = useTranslation();
  const { format, formatCompact } = useCurrency();
  const sign = (type: Transaction["type"]) => (type === "expenses" ? "-" : "+");
  const fmt = (n: number, type: Transaction["type"]) => format(n, sign(type));
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // A late answer from an older request (e.g. a double retry) is ignored
    let cancelled = false;
    getTransactions({ limit: ROWS, sort: "newest" })
      .then((res) => (res.ok ? res.data.transactions : null))
      .catch(() => null)
      .then((data) => {
        if (cancelled) return;
        setTransactions(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const error = !loading && !transactions;
  const onRetry = () => {
    setLoading(true);
    setAttempt((n) => n + 1);
  };

  return (
    // @container: the table adapts to the card's width, not the viewport's
    <Card className="@container flex min-w-0 flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">
              {t("dashboard.overview.recentTransactions.title")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.overview.recentTransactions.description")}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to="transactions">{t("dashboard.common.seeAll")}</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Error and empty keep the table's height (header + 5 rows) */}
        {!loading && error ? (
          <div className="flex min-h-60">
            <CardError
              message={t("dashboard.overview.recentTransactions.error")}
              onRetry={onRetry}
            />
          </div>
        ) : loading || !transactions ? (
          // Same table, columns and row height as the real one; the Type column
          // hides on narrow cards here too
          <Table aria-hidden="true">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="hidden @md:table-cell">
                  <Skeleton className="h-3.5 w-10" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-3.5 w-16" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-3.5 w-10" />
                </TableHead>
                <TableHead>
                  <Skeleton className="ml-auto h-3.5 w-12" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: ROWS }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell className="hidden @md:table-cell">
                    {/* h-6 = the type pill (text-xs + py-1) */}
                    <Skeleton className="h-6 w-18 rounded-full" />
                  </TableCell>
                  {/* h-5 boxes = the real text-sm line, so rows keep their height
                      even when the Type pill is hidden */}
                  <TableCell>
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3.5 w-12" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex h-5 items-center justify-end">
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : transactions.length === 0 ? (
          <div className="flex min-h-60">
            <EmptyState
              icon={ArrowLeftRight}
              message={t("dashboard.overview.recentTransactions.empty")}
            />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden @md:table-cell">
                    {t("dashboard.overview.recentTransactions.type")}
                  </TableHead>
                  <TableHead>
                    {t("dashboard.overview.recentTransactions.category")}
                  </TableHead>
                  <TableHead>
                    {t("dashboard.overview.recentTransactions.date")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("dashboard.overview.recentTransactions.amount")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.item_id}>
                    <TableCell className="hidden @md:table-cell">
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_STYLES[tx.type]}`}
                      >
                        {t(
                          `dashboard.overview.recentTransactions.types.${tx.type}`,
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal font-medium">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        {tx.category_name ??
                          t("dashboard.common.uncategorized")}
                        {tx.recurring_id && <RecurringBadge compact />}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {fmtDate(tx.date, i18n.language)}
                    </TableCell>
                    <TableCell
                      className={`whitespace-nowrap text-right font-medium tabular-nums ${AMOUNT_COLORS[tx.type]}`}
                    >
                      {/* A cell grows with its text, so large amounts get the short
                          form (200K RON) on narrow cards; full value in the tooltip */}
                      {Math.abs(tx.amount) >= COMPACT_FROM ? (
                        <span title={fmt(tx.amount, tx.type)}>
                          <span className="@md:hidden">
                            {formatCompact(tx.amount, sign(tx.type))}
                          </span>
                          <span className="hidden @md:inline">
                            {fmt(tx.amount, tx.type)}
                          </span>
                        </span>
                      ) : (
                        fmt(tx.amount, tx.type)
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
