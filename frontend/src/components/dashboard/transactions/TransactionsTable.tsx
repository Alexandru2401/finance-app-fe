import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/api/transactions";
import type { PaginationInfo } from "@/pages/dashboard/TransactionsPage";
import { Trash2 } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCurrency } from "@/hooks/useCurrency";

const TYPE_STYLES: Record<Transaction["type"], string> = {
  income: "bg-finance-success-bg text-finance-success",
  expense: "bg-finance-danger-bg text-finance-danger",
  savings: "bg-finance-primary-bg text-finance-primary",
};

// Savings are money kept, not spent, so they get no sign
const AMOUNT_SIGNS: Record<Transaction["type"], string> = {
  income: "+",
  expense: "-",
  savings: "",
};

const AMOUNT_STYLES: Record<Transaction["type"], string> = {
  income: "text-finance-success",
  expense: "text-finance-danger",
  savings: "text-finance-primary",
};

const fmtDate = (date: string, locale: string) =>
  new Date(date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// The backend allows at most 15 per page
const PAGE_SIZES = [5, 10, 15];

// First, last and the pages around the current one; gaps become an ellipsis
function getPageItems(page: number, totalPages: number) {
  const items: (number | "ellipsis")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      items.push(p);
    } else if (items[items.length - 1] !== "ellipsis") {
      items.push("ellipsis");
    }
  }
  return items;
}

const BOLD = { bold: <span className="font-medium text-foreground" /> };

interface Props {
  transactions: Transaction[] | null;
  loading: boolean;
  // null until the first page is loaded
  pagination: PaginationInfo | null;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  // Resolves to false if the delete failed, so the dialog stays open
  onDelete: (id: string) => Promise<boolean>;
}

export default function TransactionsTable({
  transactions,
  loading,
  pagination,
  onPageChange,
  onLimitChange,
  onDelete,
}: Props) {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  const fmtAmount = (amount: number, type: Transaction["type"]) =>
    `${AMOUNT_SIGNS[type]}${format(Math.abs(amount))}`;
  const categoryName = (tx: Transaction) =>
    tx.category_name ?? t("dashboard.common.uncategorized");

  // Transaction waiting for confirmation in the dialog
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const deleted = await onDelete(deleting.item_id);
    setIsDeleting(false);
    if (deleted) setDeleting(null);
  }

  // From the backend: all filtered transactions, not just this page
  const netTotal = pagination?.net ?? 0;
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 15;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  // Index of the first row of this page, for the # column and "Showing x-y"
  const offset = (page - 1) * limit;
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  // The links are anchors, so stop them from jumping to "#"
  const goTo = (target: number) => (e: MouseEvent) => {
    e.preventDefault();
    if (target >= 1 && target <= totalPages && target !== page) {
      onPageChange(target);
    }
  };

  return (
    <>
      <div className="w-full overflow-x-auto rounded-md border bg-card">
        <Table>
          <TableCaption className="sr-only">
            {t("dashboard.transactions.table.caption")}
          </TableCaption>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-12 text-muted-foreground">#</TableHead>
              <TableHead className="min-w-40">
                {t("dashboard.transactions.table.type")}
              </TableHead>
              <TableHead className="min-w-40">
                {t("dashboard.transactions.table.category")}
              </TableHead>
              <TableHead className="min-w-40">
                {t("dashboard.transactions.table.date")}
              </TableHead>
              <TableHead className="min-w-40 text-right">
                {t("dashboard.transactions.table.amount")}
              </TableHead>
              <TableHead className="w-16 text-right">
                {t("dashboard.transactions.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading || !transactions ? (
              [0, 1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-5" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto size-8 rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-sm font-medium">
                    {t("dashboard.transactions.table.emptyTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("dashboard.transactions.table.emptyHint")}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx, index) => (
                <TableRow key={tx.item_id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {offset + index + 1}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_STYLES[tx.type]}`}
                    >
                      {t(`dashboard.overview.recentTransactions.types.${tx.type}`)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {categoryName(tx)}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {fmtDate(tx.date, i18n.language)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium whitespace-nowrap ${AMOUNT_STYLES[tx.type]}`}
                  >
                    {fmtAmount(tx.amount, tx.type)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t("dashboard.transactions.table.delete")}
                      onClick={() => setDeleting(tx)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="font-medium">
                {t("dashboard.transactions.table.netTotal")}
              </TableCell>
              <TableCell
                className={`text-right font-semibold whitespace-nowrap ${
                  netTotal >= 0 ? "text-finance-success" : "text-finance-danger"
                }`}
              >
                {loading || !transactions
                  ? "—"
                  : format(netTotal, netTotal >= 0 ? "+" : "-")}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* PAGINATIE */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            <Trans
              i18nKey="dashboard.transactions.table.showing"
              values={{
                from: total === 0 ? 0 : offset + 1,
                to: Math.min(offset + limit, total),
                total,
              }}
              components={BOLD}
            />
          </p>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="page-size"
              className="text-xs text-muted-foreground"
            >
              {t("dashboard.transactions.table.perPage")}
            </Label>
            <Select
              value={String(limit)}
              onValueChange={(value) => onLimitChange(Number(value))}
            >
              <SelectTrigger id="page-size" className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {totalPages > 1 && (
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  text={t("dashboard.transactions.table.previous")}
                  aria-label={t("dashboard.transactions.table.previousPage")}
                  onClick={goTo(page - 1)}
                  aria-disabled={isFirst}
                  className={
                    isFirst
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {getPageItems(page, totalPages).map((item, i) =>
                item === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      isActive={item === page}
                      onClick={goTo(item)}
                      className="cursor-pointer"
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  text={t("dashboard.transactions.table.next")}
                  aria-label={t("dashboard.transactions.table.nextPage")}
                  onClick={goTo(page + 1)}
                  aria-disabled={isLast}
                  className={
                    isLast ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <AlertDialog
        open={deleting !== null}
        // Closing is blocked while the request runs
        onOpenChange={(open) => !open && !isDeleting && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 size={18} className="text-finance-danger" />
              {t("dashboard.transactions.table.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (
                <Trans
                  i18nKey="dashboard.transactions.table.deleteConfirm"
                  values={{
                    category: categoryName(deleting),
                    amount: fmtAmount(deleting.amount, deleting.type),
                    date: fmtDate(deleting.date, i18n.language),
                  }}
                  components={BOLD}
                />
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
              {t("dashboard.transactions.table.cancel")}
            </AlertDialogCancel>
            {/* A plain button, so the dialog stays open until the delete finishes */}
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              {isDeleting
                ? t("dashboard.transactions.table.deleting")
                : t("dashboard.transactions.table.confirmDelete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
