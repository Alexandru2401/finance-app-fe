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
import { formatCurrency } from "@/lib/format";
import { ArrowLeftRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const TYPE_STYLES: Record<Transaction["type"], string> = {
  income: "bg-finance-success-bg text-finance-success",
  expense: "bg-finance-danger-bg text-finance-danger",
  savings: "bg-finance-primary-bg text-finance-primary",
};

const fmt = (n: number, type: Transaction["type"]) =>
  formatCurrency(n, type === "expense" ? "-" : "+");

const AMOUNT_COLORS: Record<Transaction["type"], string> = {
  income: "text-finance-success",
  expense: "text-finance-danger",
  savings: "text-finance-primary",
};

const fmtDate = (date: string, locale: string) =>
  new Date(date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });

export default function OverviewTable() {
  const { t, i18n } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    getTransactions({ limit: 5, sort: "newest" })
      .then((res) => setTransactions(res.ok ? res.data.transactions : null))
      .catch(() => setTransactions(null))
      .finally(() => setLoading(false));
  }, [attempt]);

  const error = !loading && !transactions;
  const onRetry = () => {
    setLoading(true);
    setAttempt((n) => n + 1);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {t("dashboard.overview.recentTransactions.title")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.overview.recentTransactions.description")}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="transactions">{t("dashboard.common.seeAll")}</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {!loading && error ? (
          <CardError
            message={t("dashboard.overview.recentTransactions.error")}
            onRetry={onRetry}
          />
        ) : loading || !transactions ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            message={t("dashboard.overview.recentTransactions.empty")}
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-25">
                    {t("dashboard.overview.recentTransactions.type")}
                  </TableHead>
                  <TableHead className="min-w-35">
                    {t("dashboard.overview.recentTransactions.category")}
                  </TableHead>
                  <TableHead className="min-w-22.5">
                    {t("dashboard.overview.recentTransactions.date")}
                  </TableHead>
                  <TableHead className="min-w-25 text-right">
                    {t("dashboard.overview.recentTransactions.amount")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.item_id}>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_STYLES[tx.type]}`}
                      >
                        {t(`dashboard.overview.recentTransactions.types.${tx.type}`)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {tx.category_name ?? t("dashboard.common.uncategorized")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {fmtDate(tx.date, i18n.language)}
                    </TableCell>
                    <TableCell
                      className={`whitespace-nowrap text-right font-medium tabular-nums ${AMOUNT_COLORS[tx.type]}`}
                    >
                      {fmt(tx.amount, tx.type)}
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
