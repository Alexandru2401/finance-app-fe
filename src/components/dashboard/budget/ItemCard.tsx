import {
  getCategories,
  type BudgetItem,
  type Category,
  type UpdateTransactionPayload,
} from "@/api/budget";
import type { Transaction } from "@/api/transactions";
import {
  TransactionEditDialog,
  TransactionNotesDialog,
} from "@/components/dashboard/transactions/TransactionDialogs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Minus, Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useCurrency } from "@/hooks/useCurrency";
import { Link } from "react-router";
import type { Section } from "../../../pages/dashboard/BudgetPage";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";

type BudgetType = "income" | "expenses" | "savings";

const formatDate = (date: string, locale: string) =>
  new Date(date).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// The dialogs from Transactions work with the transaction shape of the API
const toTransaction = (item: BudgetItem): Transaction => ({
  item_id: item.id,
  type: item.type === "expenses" ? "expense" : item.type,
  amount: item.amount,
  // Items from the backend always have a date; the fallback keeps the dialogs safe
  date: item.date ?? new Date().toISOString(),
  category_id: item.categoryId ?? null,
  category_name: item.category || null,
  notes: item.notes ?? null,
});

interface ItemCardProps {
  section: Section;
  onShowForm: () => void;
}

export default function ItemCard({ section, onShowForm }: ItemCardProps) {
  const { t, i18n } = useTranslation();
  const { format: formatMoney } = useCurrency();
  const categoryName = (item: BudgetItem) =>
    item.category || t("dashboard.common.uncategorized");

  // Ids instead of objects, so the dialogs always show the latest data of the item
  const [notesId, setNotesId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<BudgetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const findTx = (id: string | null) => {
    const item = id && section.items.find((i) => i.id === id);
    return item ? toTransaction(item) : null;
  };

  // All the categories: the edit dialog can also change the type
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let ignore = false;
    getCategories()
      .then((data) => {
        if (!ignore) setCategories(data);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const startEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    // Categories can change from the form or the settings on the same page
    getCategories()
      .then(setCategories)
      .catch(() => {});
  };

  // Resolves to false if saving failed, so the dialog stays open
  const saveTx = (tx: Transaction, payload: UpdateTransactionPayload) =>
    section.onEdit(tx.item_id, payload);

  async function confirmDelete() {
    if (!deletingItem) return;
    setIsDeleting(true);
    const deleted = await section.onDelete(deletingItem.id);
    setIsDeleting(false);
    if (deleted) setDeletingItem(null);
  }

  const styles = {
    income: {
      text: "text-finance-success",
      bubble: "bg-finance-success/10 text-finance-success",
      sign: "+",
    },
    expenses: {
      text: "text-finance-danger",
      bubble: "bg-finance-danger/10 text-finance-danger",
      sign: "-",
    },
    savings: {
      text: "text-finance-primary",
      bubble: "bg-finance-primary/10 text-finance-primary",
      sign: "+",
    },
  }[section.section as BudgetType];

  const SectionIcon =
    section.section === "income" ? (
      <Plus size={16} className="shrink-0" />
    ) : section.section === "savings" ? (
      <PiggyBank size={16} className="shrink-0" />
    ) : (
      <Minus size={16} className="shrink-0" />
    );

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* Fills the height it gets from the page; the footer stays at the bottom */}
      <Card className="flex-1">
        <CardHeader className="items-center">
          <div>
            <CardTitle className="flex items-center justify-between gap-2 text-lg text-foreground">
              {section.title}
              <Link to="/dashboard/transactions">
                <Button
                  variant="outline"
                  className="cursor-pointer max-w-34 md:w-auto"
                >
                  {t("dashboard.common.seeAll")}
                </Button>
              </Link>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground font-medium">
              {t("dashboard.budget.items.summary", {
                total: formatMoney(section.total, "auto", true),
                count: section.items.length,
              })}
            </CardDescription>
          </div>
        </CardHeader>

        {section.section && (
          <CardContent className="flex-1 overflow-hidden">
            {section.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.budget.items.empty")}
                </p>
                <Button
                  variant="default"
                  onClick={() => onShowForm()}
                  className="cursor-pointer"
                >
                  <Plus size={16} />
                  {t("dashboard.budget.items.addEntry")}
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {section.items.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-1.5"
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${styles.bubble}`}
                    >
                      {SectionIcon}
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <p className="truncate text-sm font-semibold capitalize text-foreground">
                        {categoryName(item)}
                      </p>
                      {item.date && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.date, i18n.language)}
                        </p>
                      )}
                    </div>

                    <p
                      className={`ml-auto shrink-0 text-sm font-semibold tabular-nums ${styles.text}`}
                    >
                      {styles.sign} {formatMoney(item.amount, "auto", true)}
                    </p>

                    <div className="flex shrink-0">
                      {/* View details */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setNotesId(item.id)}
                        aria-label={t("dashboard.budget.items.viewDetails")}
                        className="cursor-pointer  hover:bg-slate-400/20"
                      >
                        <FileText size={18} className="text-finance-warning" />
                      </Button>
                      {/* Edit */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(item)}
                        aria-label={t("dashboard.budget.items.edit")}
                        className="cursor-pointer  hover:bg-slate-400/20"
                      >
                        <Pencil size={16} className="text-finance-primary" />
                      </Button>
                      {/* Delete */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingItem(item)}
                        aria-label={t("dashboard.budget.items.delete")}
                        className="cursor-pointer  hover:bg-slate-400/20"
                      >
                        <Trash2 size={18} className="text-finance-danger" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}

        {section.items.length > 0 && (
          <CardFooter>
            <Button
              variant="ghost"
              onClick={() => onShowForm()}
              className="cursor-pointer max-w-34 md:w-auto"
            >
              <Plus size={16} />
              {t("dashboard.budget.items.addMore")}
            </Button>
          </CardFooter>
        )}
      </Card>

      <TransactionNotesDialog
        transaction={findTx(notesId)}
        onClose={() => setNotesId(null)}
        onSave={saveTx}
      />

      <TransactionEditDialog
        transaction={findTx(editingId)}
        categories={categories}
        onCategoryCreated={(category) =>
          setCategories((prev) => [...prev, category])
        }
        onClose={() => setEditingId(null)}
        onSave={saveTx}
      />

      <AlertDialog
        open={deletingItem !== null}
        // Closing is blocked while the request runs
        onOpenChange={(open) => !open && !isDeleting && setDeletingItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 size={18} className="text-finance-danger" />
              {t("dashboard.budget.items.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deletingItem && (
                <Trans
                  i18nKey="dashboard.budget.items.deleteConfirm"
                  values={{
                    category: categoryName(deletingItem),
                    amount: formatMoney(deletingItem.amount, "auto", true),
                  }}
                  components={{
                    bold: <span className="font-medium text-foreground" />,
                  }}
                />
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
              {t("dashboard.budget.items.cancel")}
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
                : t("dashboard.budget.items.delete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
