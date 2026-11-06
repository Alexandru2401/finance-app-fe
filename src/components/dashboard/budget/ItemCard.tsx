import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getCategories,
  type BudgetItem,
  type Category,
  type UpdateTransactionPayload,
} from "@/api/budget";
import { format } from "date-fns/format";
import {
  ChevronDownIcon,
  FileText,
  Minus,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import NewCategoryField from "@/components/dashboard/shared/NewCategoryField";
import { useCurrency } from "@/hooks/useCurrency";
import { useDateLocale } from "@/hooks/useDateLocale";
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
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

type BudgetType = "income" | "expenses" | "savings";

const formatDate = (date: string, locale: string) =>
  new Date(date).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

interface ItemCardProps {
  section: Section;
  onShowForm: () => void;
}

export default function ItemCard({ section, onShowForm }: ItemCardProps) {
  const { t, i18n } = useTranslation();
  const { format: formatMoney } = useCurrency();
  const dateLocale = useDateLocale();
  const categoryName = (item: BudgetItem) =>
    item.category || t("dashboard.common.uncategorized");
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<BudgetItem | null>(null);
  const [viewingItem, setViewingItem] = useState<BudgetItem | null>(null);

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [editValues, setEditValues] = useState({
    amount: "",
    category: "",
    date: "",
    notes: "",
  });

  // Real categories for this section; the edit sends their category_id
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let ignore = false;
    getCategories(section.section)
      .then((data) => {
        if (!ignore) setCategories(data);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [section.section]);

  const startEdit = (item: BudgetItem) => {
    setEditingItem(item);
    // Categories can change from the form or the settings on the same page
    getCategories(section.section)
      .then(setCategories)
      .catch(() => {});
    // new Date() keeps local time; splitting the ISO string would show the day before
    setDate(item.date ? new Date(item.date) : undefined);
    setEditValues({
      amount: item.amount.toFixed(2),
      category: item.categoryId ?? "",
      date: item.date ? format(new Date(item.date), "yyyy-MM-dd") : "",
      notes: item.notes ?? "",
    });
  };

  const cancelEdit = () => setEditingItem(null);

  const confirmEdit = () => {
    const original = editingItem!;
    const amount = parseFloat(editValues.amount);
    const newDate = date ? format(date, "yyyy-MM-dd") : "";
    const notes = editValues.notes.trim();

    // PATCH only the fields that changed
    const payload: UpdateTransactionPayload = {};
    if (amount > 0 && amount !== original.amount) payload.amount = amount;
    if (newDate && newDate !== editValues.date) payload.date = newDate;
    if (editValues.category && editValues.category !== original.categoryId)
      payload.category_id = editValues.category;
    // Empty string clears the note on the backend
    if (notes !== (original.notes ?? "").trim()) payload.notes = notes;

    if (Object.keys(payload).length > 0) section.onEdit(original.id, payload);
    setEditingItem(null);
  };

  const startDelete = (item: BudgetItem) => setDeletingItem(item);
  const cancelDelete = () => setDeletingItem(null);
  const confirmDelete = () => {
    section.onDelete(deletingItem!.id);
    setDeletingItem(null);
  };

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
    <div className="w-full">
      <Card>
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
          <CardContent className="overflow-hidden">
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
                        onClick={() => setViewingItem(item)}
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
                        onClick={() => startDelete(item)}
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

      {/* ── VIEW DETAILS MODAL ── */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setViewingItem(null)}
          />
          <div className="relative z-10 flex w-full max-w-sm mx-4 flex-col gap-5 rounded-xl border border-border bg-popover p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {t("dashboard.budget.items.detailsTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.budget.items.entryOf", { type: section.title })}
                </p>
              </div>
              <span
                className={`text-2xl font-bold tabular-nums ${
                  section.section === "expenses"
                    ? "text-finance-danger"
                    : "text-finance-success"
                }`}
              >
                {formatMoney(viewingItem.amount, "auto", true)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="mb-0.5 text-xs text-muted-foreground">
                  {t("dashboard.budget.items.category")}
                </p>
                <p className="font-medium capitalize text-foreground">
                  {categoryName(viewingItem)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="mb-0.5 text-xs text-muted-foreground">
                  {t("dashboard.budget.items.date")}
                </p>
                <p className="font-medium text-foreground">
                  {viewingItem.date
                    ? formatDate(viewingItem.date, i18n.language)
                    : "—"}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3">
              <p className="mb-1 text-xs text-muted-foreground">
                {t("dashboard.budget.items.notes")}
              </p>
              <p className="max-h-32 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-all text-sm text-foreground">
                {viewingItem.notes?.trim() ? (
                  viewingItem.notes
                ) : (
                  <span className="italic text-muted-foreground">
                    {t("dashboard.budget.items.noNotes")}
                  </span>
                )}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setViewingItem(null)}
                className="cursor-pointer"
              >
                {t("dashboard.budget.items.close")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setViewingItem(null);
                  startEdit(viewingItem);
                }}
                className="w-22 cursor-pointer"
              >
                {t("dashboard.budget.items.edit")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelEdit}
          />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-md mx-4 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-popover p-6 shadow-2xl">
            <div>
              <h2 className="flex items-center gap-1 text-lg font-semibold text-foreground">
                <Pencil size={16} className="mr-1 shrink-0" />
                {t("dashboard.budget.items.editTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.budget.items.editSubtitle", {
                  type: section.title.toLowerCase(),
                })}
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>{t("dashboard.budget.items.amount")}</Label>
              <Input
                type="number"
                value={editValues.amount}
                onChange={(e) =>
                  setEditValues((v) => ({ ...v, amount: e.target.value }))
                }
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>{t("dashboard.budget.items.category")}</Label>
              {categories.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.budget.form.noCategories")}
                  </p>
                  <NewCategoryField
                    type={section.section}
                    categories={categories}
                    onCreated={(category) => {
                      setCategories((prev) => [...prev, category]);
                      setEditValues((prev) => ({
                        ...prev,
                        category: category.category_id,
                      }));
                    }}
                  />
                </>
              ) : (
                <Select
                  value={editValues.category}
                  onValueChange={(v) =>
                    setEditValues((prev) => ({ ...prev, category: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("dashboard.budget.items.selectCategory")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.category_id} value={cat.category_id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>{t("dashboard.budget.items.date")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!date}
                    className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                  >
                    {date ? (
                      format(date, "PPP", { locale: dateLocale })
                    ) : (
                      <span>{t("dashboard.budget.items.pickDate")}</span>
                    )}
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    defaultMonth={date}
                    locale={dateLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{t("dashboard.budget.items.notes")}</Label>
              <textarea
                className="min-h-20 w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={editValues.notes}
                onChange={(e) =>
                  setEditValues((v) => ({ ...v, notes: e.target.value }))
                }
                placeholder={t("dashboard.budget.items.notesPlaceholder")}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={cancelEdit}
                className="cursor-pointer"
              >
                {t("dashboard.budget.items.cancel")}
              </Button>
              <Button
                type="button"
                onClick={confirmEdit}
                className="cursor-pointer"
              >
                {t("dashboard.budget.items.saveChanges")}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ── DELETE CONFIRM MODAL ── */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelDelete}
          />
          <div className="relative z-10 flex w-full max-w-sm mx-4 flex-col gap-4 rounded-xl border border-border bg-popover p-4 shadow-2xl">
            <div>
              <h2 className="flex items-center gap-1 text-lg font-semibold text-foreground">
                <Trash2 size={16} className="shrink-0 text-finance-danger" />{" "}
                {t("dashboard.budget.items.deleteTitle")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
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
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={cancelDelete}
                className="cursor-pointer"
              >
                {t("dashboard.budget.items.cancel")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                className="cursor-pointer"
              >
                {t("dashboard.budget.items.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
