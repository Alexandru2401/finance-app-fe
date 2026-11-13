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
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/api/transactions";
import type { Category, UpdateTransactionPayload } from "@/api/budget";
import {
  TransactionEditDialog,
  TransactionNotesDialog,
} from "@/components/dashboard/transactions/TransactionDialogs";
import {
  AMOUNT_SIGNS,
  AMOUNT_STYLES,
  TYPE_STYLES,
} from "@/components/dashboard/transactions/styles";
import type { PaginationInfo } from "@/pages/dashboard/TransactionsPage";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FileText,
  Pencil,
  RotateCw,
  Trash2,
} from "lucide-react";
import { useState, type MouseEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCurrency } from "@/hooks/useCurrency";

const fmtDate = (date: string, locale: string) =>
  new Date(date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// The backend allows at most 15 per page

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

// Shorter rows than the default table cell (p-2)
const COMPACT = "[&>td]:py-1";

const BOLD = { bold: <span className="font-medium text-foreground" /> };

// Sortable columns: a click sorts descending, a second click ascending
type SortColumn = "date" | "amount";
type Sort = `${SortColumn}-${"desc" | "asc"}`;

const nextSort = (column: SortColumn, current: string): Sort =>
  current === `${column}-desc` ? `${column}-asc` : `${column}-desc`;

interface Props {
  transactions: Transaction[] | null;
  loading: boolean;
  // The last request failed; shows a message with a retry button
  error: boolean;
  onRetry: () => void;
  // null until the first page is loaded
  pagination: PaginationInfo | null;
  onPageChange: (page: number) => void;
  // Resolves to false if the delete failed, so the dialog stays open
  onDelete: (id: string) => Promise<boolean>;
  // For the edit dialog (only the categories of the transaction's type are shown)
  categories: Category[];
  onCategoryCreated: (category: Category) => void;
  // Resolves to false if the update failed, so the dialog stays open
  onUpdate: (
    tx: Transaction,
    payload: UpdateTransactionPayload,
  ) => Promise<boolean>;
  // e.g. "date-desc"; changed from the Date and Amount headers
  sort: string;
  onSortChange: (sort: Sort) => void;
}

export default function TransactionsTable({
  transactions,
  loading,
  error,
  onRetry,
  pagination,
  onPageChange,
  onDelete,
  categories,
  onCategoryCreated,
  onUpdate,
  sort,
  onSortChange,
}: Props) {
  const { t, i18n } = useTranslation();

  // Header button with an arrow for the current direction
  function sortHeader(column: SortColumn, label: string) {
    const active = sort.startsWith(`${column}-`);
    const Icon = !active
      ? ArrowUpDown
      : sort.endsWith("-asc")
        ? ArrowUp
        : ArrowDown;
    const next = nextSort(column, sort);
    return (
      <button
        type="button"
        onClick={() => onSortChange(next)}
        title={t(`dashboard.transactions.filters.sorts.${next}`)}
        className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 -mx-1.5 hover:bg-accent ${active ? "text-foreground" : "text-muted-foreground"}`}
      >
        {label}
        <Icon
          className={`h-3.5 w-3.5 ${active ? "" : "opacity-50"}`}
          aria-hidden="true"
        />
      </button>
    );
  }

  const ariaSort = (column: SortColumn) =>
    !sort.startsWith(`${column}-`)
      ? "none"
      : sort.endsWith("-asc")
        ? "ascending"
        : "descending";
  const { format } = useCurrency();
  const fmtAmount = (amount: number, type: Transaction["type"]) =>
    `${AMOUNT_SIGNS[type]}${format(Math.abs(amount))}`;
  const categoryName = (tx: Transaction) =>
    tx.category_name ?? t("dashboard.common.uncategorized");

  // Transaction waiting for confirmation in the dialog
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ids instead of objects, so the dialogs always show the latest data of the row
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notesId, setNotesId] = useState<string | null>(null);
  const findTx = (id: string | null | undefined) =>
    (id && transactions?.find((tx) => tx.item_id === id)) || null;
  const editingTx = findTx(editingId);
  const notesTx = findTx(notesId);

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
              <TableHead className="min-w-40" aria-sort={ariaSort("date")}>
                {sortHeader("date", t("dashboard.transactions.table.date"))}
              </TableHead>
              <TableHead
                className="min-w-40 text-right"
                aria-sort={ariaSort("amount")}
              >
                {sortHeader("amount", t("dashboard.transactions.table.amount"))}
              </TableHead>
              <TableHead className="w-32 text-right">
                {t("dashboard.transactions.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {error ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-32 text-center">
                  <div
                    role="alert"
                    className="flex flex-col items-center gap-1"
                  >
                    <AlertCircle
                      size={20}
                      className="text-finance-danger"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium">
                      {t("dashboard.transactions.table.errorTitle")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.transactions.table.errorHint")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      className="mt-2 cursor-pointer gap-1.5"
                    >
                      <RotateCw size={14} aria-hidden="true" />
                      {t("dashboard.transactions.table.retry")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : loading || !transactions ? (
              [0, 1, 2, 3, 4].map((i) => (
                <TableRow key={i} className={COMPACT}>
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
                    <Skeleton className="ml-auto h-7 w-22 rounded-md" />
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
                <TableRow key={tx.item_id} className={COMPACT}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {offset + index + 1}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_STYLES[tx.type]}`}
                    >
                      {t(
                        `dashboard.overview.recentTransactions.types.${tx.type}`,
                      )}
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
                    <div className="flex justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 cursor-pointer text-muted-foreground hover:bg-finance-warning-bg hover:text-finance-warning"
                        aria-label={t("dashboard.transactions.table.notes")}
                        title={t("dashboard.transactions.table.notes")}
                        onClick={() => setNotesId(tx.item_id)}
                      >
                        <FileText size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 cursor-pointer text-muted-foreground hover:bg-finance-primary-bg hover:text-finance-primary"
                        aria-label={t("dashboard.transactions.table.edit")}
                        title={t("dashboard.transactions.table.edit")}
                        onClick={() => setEditingId(tx.item_id)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={t("dashboard.transactions.table.delete")}
                        title={t("dashboard.transactions.table.delete")}
                        onClick={() => setDeleting(tx)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
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
                {loading || error || !transactions
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
          <p
            className={`text-sm text-muted-foreground ${error ? "invisible" : ""}`}
          >
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
        </div>

        {totalPages > 1 && !error && (
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

      <TransactionNotesDialog
        transaction={notesTx}
        onClose={() => setNotesId(null)}
        onSave={onUpdate}
      />

      <TransactionEditDialog
        transaction={editingTx}
        categories={categories}
        onCategoryCreated={onCategoryCreated}
        onClose={() => setEditingId(null)}
        onSave={onUpdate}
      />

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
