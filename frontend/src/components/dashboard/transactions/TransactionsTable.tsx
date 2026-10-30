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

const TYPE_STYLES: Record<Transaction["type"], string> = {
  income: "bg-finance-success-bg text-finance-success",
  expense: "bg-finance-danger-bg text-finance-danger",
  savings: "bg-finance-primary-bg text-finance-primary",
};

const TYPE_LABELS: Record<Transaction["type"], string> = {
  income: "Income",
  expense: "Expense",
  savings: "Savings",
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

const fmtAmount = (amount: number, type: Transaction["type"]) =>
  `${AMOUNT_SIGNS[type]}$${Math.abs(amount).toLocaleString()}`;

const fmtDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
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
            A list of your recent transactions.
          </TableCaption>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead className="w-12 text-muted-foreground">#</TableHead>
              <TableHead className="min-w-40">Type</TableHead>
              <TableHead className="min-w-40">Category</TableHead>
              <TableHead className="min-w-40">Date</TableHead>
              <TableHead className="min-w-40 text-right">Amount</TableHead>
              <TableHead className="w-16 text-right">Actions</TableHead>
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
                  <p className="text-sm font-medium">No transactions found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try adjusting your filters or search term.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t, index) => (
                <TableRow key={t.item_id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {offset + index + 1}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_STYLES[t.type]}`}
                    >
                      {TYPE_LABELS[t.type]}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {t.category_name ?? "Uncategorized"}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {fmtDate(t.date)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium whitespace-nowrap ${AMOUNT_STYLES[t.type]}`}
                  >
                    {fmtAmount(t.amount, t.type)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 cursor-pointer text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Delete transaction"
                      onClick={() => setDeleting(t)}
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
                Net total
              </TableCell>
              <TableCell
                className={`text-right font-semibold whitespace-nowrap ${
                  netTotal >= 0 ? "text-finance-success" : "text-finance-danger"
                }`}
              >
                {loading || !transactions
                  ? "—"
                  : `${netTotal >= 0 ? "+" : "-"}$${Math.abs(netTotal).toLocaleString()}`}
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
            Showing{" "}
            <span className="font-medium text-foreground">
              {total === 0 ? 0 : offset + 1}–{Math.min(offset + limit, total)}
            </span>{" "}
            of <span className="font-medium text-foreground">{total}</span>{" "}
            transactions
          </p>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="page-size"
              className="text-xs text-muted-foreground"
            >
              Per page
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
              Delete transaction
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && (
                <>
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-foreground">
                    {deleting.category_name ?? "Uncategorized"}
                  </span>{" "}
                  ({fmtAmount(deleting.amount, deleting.type)},{" "}
                  {fmtDate(deleting.date)})? This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            {/* A plain button, so the dialog stays open until the delete finishes */}
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
