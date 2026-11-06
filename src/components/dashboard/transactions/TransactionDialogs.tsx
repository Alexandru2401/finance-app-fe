import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns/format";
import { ChevronDownIcon, Pencil, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Transaction } from "@/api/transactions";
import type { Category, UpdateTransactionPayload } from "@/api/budget";
import NewCategoryField from "@/components/dashboard/shared/NewCategoryField";
import { useDateLocale } from "@/hooks/useDateLocale";
import { cn } from "@/lib/utils";
import { TYPE_STYLES } from "./styles";

type TxType = Transaction["type"];

const TYPES: TxType[] = ["income", "expense", "savings"];

// Categories use "expenses" (frontend), transactions use "expense" (backend)
const sameType = (category: Category, type: TxType) =>
  (category.type === "expenses" ? "expense" : category.type) === type;

// The backend sends a timestamp; new Date() keeps the local day
const toDayString = (date: string) => format(new Date(date), "yyyy-MM-dd");

const textareaClass =
  "min-h-24 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Resolves to false when saving failed, so the dialog stays open. */
type SaveFn = (
  tx: Transaction,
  payload: UpdateTransactionPayload,
) => Promise<boolean>;

function NotesText({ notes }: { notes: string | null }) {
  const { t } = useTranslation();

  return (
    <p className="max-h-60 overflow-y-auto whitespace-pre-wrap wrap-break-word text-sm">
      {notes?.trim() ? (
        notes
      ) : (
        <span className="italic text-muted-foreground">
          {t("dashboard.transactions.details.noNotes")}
        </span>
      )}
    </p>
  );
}

/* ────────────────────────────── NOTES ────────────────────────────── */

interface NotesProps {
  transaction: Transaction | null;
  /** Opens straight in edit mode ("+ Add note" in the table) */
  startEditing?: boolean;
  onClose: () => void;
  onSave: SaveFn;
}

/** Only the note of a transaction: read it, edit it, save it. */
export function TransactionNotesDialog({
  transaction,
  startEditing = false,
  onClose,
  onSave,
}: NotesProps) {
  const [saving, setSaving] = useState(false);

  return (
    <Dialog
      open={transaction !== null}
      // Closing is blocked while the request runs
      onOpenChange={(open) => !open && !saving && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        {/* key: the editor resets for every transaction */}
        {transaction && (
          <NotesBody
            key={transaction.item_id}
            tx={transaction}
            startEditing={startEditing}
            saving={saving}
            setSaving={setSaving}
            onClose={onClose}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NotesBody({
  tx,
  startEditing,
  saving,
  setSaving,
  onClose,
  onSave,
}: {
  tx: Transaction;
  startEditing: boolean;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  onClose: () => void;
  onSave: SaveFn;
}) {
  const { t, i18n } = useTranslation();

  const uncategorized = !tx.category_id;
  const hasNotes = Boolean(tx.notes?.trim());

  const [editing, setEditing] = useState(startEditing);
  const [notes, setNotes] = useState(tx.notes ?? "");

  async function save() {
    if (notes.trim() === (tx.notes ?? "").trim()) {
      setEditing(false);
      return;
    }
    setSaving(true);
    // An empty string clears the note on the backend
    const saved = await onSave(tx, { notes: notes.trim() });
    setSaving(false);
    if (saved) setEditing(false);
  }

  return (
    <>
      {/* Only the transaction title (category) and its date */}
      <DialogHeader>
        <DialogTitle>
          {tx.category_name ?? t("dashboard.common.uncategorized")}
        </DialogTitle>
        <DialogDescription>
          {new Date(tx.date).toLocaleDateString(i18n.language, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </DialogDescription>
      </DialogHeader>

      {editing ? (
        <textarea
          autoFocus
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("dashboard.transactions.edit.notesPlaceholder")}
          aria-label={t("dashboard.transactions.table.notes")}
          className={cn(textareaClass, "min-h-32")}
          maxLength={500}
        />
      ) : (
        <div className="rounded-lg bg-muted/40 p-3">
          <NotesText notes={tx.notes} />
        </div>
      )}

      {uncategorized && (
        <p className="text-xs text-finance-warning">
          {t("dashboard.transactions.details.uncategorizedHint")}
        </p>
      )}

      <DialogFooter>
        {editing ? (
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setNotes(tx.notes ?? "");
                // Opened with "+ Add note": cancel closes the dialog
                if (!hasNotes) onClose();
                else setEditing(false);
              }}
              className="cursor-pointer"
            >
              {t("dashboard.transactions.edit.cancel")}
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={save}
              className="cursor-pointer"
            >
              {saving
                ? t("dashboard.transactions.edit.saving")
                : t("dashboard.transactions.details.saveNotes")}
            </Button>
          </>
        ) : (
          // Only one button; the dialog closes from the X / Esc / outside click
          <Button
            type="button"
            onClick={() => setEditing(true)}
            className="cursor-pointer gap-1.5"
          >
            {hasNotes ? <Pencil size={14} /> : <Plus size={14} />}
            {hasNotes
              ? t("dashboard.transactions.details.editNotes")
              : t("dashboard.transactions.details.addNotes")}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

/* ────────────────────────────── EDIT ────────────────────────────── */

interface EditProps {
  transaction: Transaction | null;
  categories: Category[];
  onCategoryCreated: (category: Category) => void;
  onClose: () => void;
  onSave: SaveFn;
}

export function TransactionEditDialog({
  transaction,
  categories,
  onCategoryCreated,
  onClose,
  onSave,
}: EditProps) {
  const [saving, setSaving] = useState(false);

  return (
    <Dialog
      open={transaction !== null}
      // Closing is blocked while the request runs
      onOpenChange={(open) => !open && !saving && onClose()}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {transaction && (
          <EditForm
            key={transaction.item_id}
            tx={transaction}
            categories={categories}
            onCategoryCreated={onCategoryCreated}
            saving={saving}
            setSaving={setSaving}
            onClose={onClose}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  tx,
  categories,
  onCategoryCreated,
  saving,
  setSaving,
  onClose,
  onSave,
}: {
  tx: Transaction;
  categories: Category[];
  onCategoryCreated: (category: Category) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  onClose: () => void;
  onSave: SaveFn;
}) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const [type, setType] = useState<TxType>(tx.type);
  const [amount, setAmount] = useState(tx.amount.toFixed(2));
  const [categoryId, setCategoryId] = useState(tx.category_id ?? "");
  const [date, setDate] = useState<Date | undefined>(new Date(tx.date));
  const [notes, setNotes] = useState(tx.notes ?? "");
  const [submitted, setSubmitted] = useState(false);

  const typeCategories = categories.filter((c) => sameType(c, type));
  const numericAmount = Number(amount);
  const amountError = !Number.isFinite(numericAmount) || numericAmount <= 0;
  const categoryError = !categoryId;
  const dateError = !date;

  function changeType(next: TxType) {
    setType(next);
    // A category belongs to one type, so it has to be picked again
    const current = categories.find((c) => c.category_id === categoryId);
    if (!current || !sameType(current, next)) setCategoryId("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (amountError || categoryError || dateError) return;

    // PATCH only the fields that changed
    const payload: UpdateTransactionPayload = {};
    if (type !== tx.type) payload.type = type;
    if (numericAmount !== tx.amount) payload.amount = numericAmount;
    if (categoryId !== tx.category_id) payload.category_id = categoryId;
    const day = format(date, "yyyy-MM-dd");
    if (day !== toDayString(tx.date)) payload.date = day;
    if (notes.trim() !== (tx.notes ?? "").trim()) payload.notes = notes.trim();

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    const saved = await onSave(tx, payload);
    setSaving(false);
    if (saved) onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Pencil size={16} />
          {t("dashboard.transactions.edit.title")}
        </DialogTitle>
        <DialogDescription>
          {t("dashboard.transactions.edit.subtitle")}
        </DialogDescription>
      </DialogHeader>

      {/* Type */}
      <div className="space-y-2">
        <Label>{t("dashboard.transactions.table.type")}</Label>
        <div role="radiogroup" className="grid grid-cols-3 gap-2">
          {TYPES.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={type === value}
              onClick={() => changeType(value)}
              className={cn(
                "cursor-pointer rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                type === value
                  ? cn(TYPE_STYLES[value], "border-current")
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {t(`dashboard.overview.recentTransactions.types.${value}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="edit-amount">
          {t("dashboard.transactions.table.amount")}
        </Label>
        <Input
          id="edit-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={submitted && amountError}
        />
        {submitted && amountError && (
          <p className="text-xs text-destructive">
            {t("dashboard.transactions.edit.invalidAmount")}
          </p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>{t("dashboard.transactions.table.category")}</Label>
        {typeCategories.length === 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.budget.form.noCategories")}
            </p>
            <NewCategoryField
              type={type === "expense" ? "expenses" : type}
              categories={typeCategories}
              onCreated={(category) => {
                onCategoryCreated(category);
                setCategoryId(category.category_id);
              }}
            />
          </>
        ) : (
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger
              className="w-full"
              aria-invalid={submitted && categoryError}
            >
              <SelectValue
                placeholder={t("dashboard.transactions.edit.selectCategory")}
              />
            </SelectTrigger>
            <SelectContent>
              {typeCategories.map((cat) => (
                <SelectItem key={cat.category_id} value={cat.category_id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {submitted && categoryError && (
          <p className="text-xs text-destructive">
            {t("dashboard.transactions.edit.categoryRequired")}
          </p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label>{t("dashboard.transactions.table.date")}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              data-empty={!date}
              aria-invalid={submitted && dateError}
              className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
            >
              {date
                ? format(date, "PPP", { locale: dateLocale })
                : t("dashboard.transactions.edit.pickDate")}
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
        <Label htmlFor="edit-notes">
          {t("dashboard.transactions.table.notes")}
        </Label>
        <textarea
          id="edit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("dashboard.transactions.edit.notesPlaceholder")}
          className={textareaClass}
          maxLength={500}
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          disabled={saving}
          onClick={onClose}
          className="cursor-pointer"
        >
          {t("dashboard.transactions.edit.cancel")}
        </Button>
        <Button type="submit" disabled={saving} className="cursor-pointer">
          {saving
            ? t("dashboard.transactions.edit.saving")
            : t("dashboard.transactions.edit.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
