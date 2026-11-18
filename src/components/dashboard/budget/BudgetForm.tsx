import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { ChevronDownIcon, Loader2, Plus, Repeat } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import type ro from "@/i18n/locales/ro.json";
import { useDateLocale } from "@/hooks/useDateLocale";
import BudgetItemSchema, {
  NOTES_MAX_LENGTH,
  type BudgetItemInput,
  type BudgetItemPayload,
} from "@/schemas/budget-item.schema";
import { addNewTransaction, getCategories, type Category } from "@/api/budget";
import {
  createRecurring,
  getRecurring,
  RecurringRequestError,
} from "@/api/recurring";
import NewCategoryField from "@/components/dashboard/shared/NewCategoryField";
import { FEATURES } from "@/lib/features";
import { firstRunDate, todayInRomania } from "@/lib/recurring";

type BudgetType = BudgetItemInput["type"];

// The schema messages are keys under dashboard.budget.form.errors
type SchemaErrorKey =
  `dashboard.budget.form.errors.${keyof (typeof ro)["dashboard"]["budget"]["form"]["errors"]}`;

type FormErrors = {
  category?: SchemaErrorKey;
  amount?: SchemaErrorKey;
  notes?: SchemaErrorKey;
  dayOfMonth?: SchemaErrorKey;
};

// The recurring fields as they are when the form opens / after a save
const emptyRecurring = (recurring: boolean) => ({ recurring, dayOfMonth: "" });

// 1-31 typed in the "day of the month" input, otherwise null (= the 1st)
const parseDay = (value: string) => {
  const day = Number(value);
  return value.trim() !== "" && Number.isInteger(day) && day >= 1 && day <= 31
    ? day
    : null;
};

const NOTES_WARNING_THRESHOLD = 100;

// yyyy-MM-dd in local time (toISOString would shift the day in UTC+ timezones)
const toDateString = (d: Date) => format(d, "yyyy-MM-dd");

interface BudgetFormProps {
  onCreated?: (type: BudgetItemPayload["type"]) => void;
  onCategoryCreated?: (category: Category) => void;
  // "Recurring" switched on when the form opens (and after each save), e.g.
  // when adding from Settings → Recurring
  defaultRecurring?: boolean;
}

export default function BudgetForm({
  onCreated,
  onCategoryCreated,
  defaultRecurring = false,
}: BudgetFormProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [formData, setFormData] = useState<BudgetItemInput>({
    type: "income",
    category: "",
    amount: "",
    notes: "",
    date: toDateString(new Date()),
    ...emptyRecurring(defaultRecurring),
  });

  const amountRef = useRef<HTMLInputElement>(null);

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  // Categories of the type they were loaded for; while that differs from the
  // selected type, the new list is still loading
  const [categoriesResult, setCategoriesResult] = useState<{
    type: BudgetType;
    categories: Category[];
  } | null>(null);
  const categoriesLoading = categoriesResult?.type !== formData.type;
  const categories = categoriesLoading
    ? []
    : (categoriesResult?.categories ?? []);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);

  // Refetch categories whenever the type changes
  useEffect(() => {
    let cancelled = false;
    const type = formData.type;

    getCategories(type)
      .then((data) => {
        if (cancelled) return;
        setCategoriesResult({ type, categories: data });
        setFormData((prev) => ({
          ...prev,
          category: data[0]?.category_id ?? "",
        }));
      })
      .catch(() => {
        if (cancelled) return;
        toast.error(t("dashboard.budget.form.toasts.categoriesError"));
        setCategoriesResult({ type, categories: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [formData.type, t]);

  // Categories that already have a recurring rule (at most one per category);
  // their recurrence is changed from Settings → Categories, not from here.
  // Fetched again after each save, since a save can add one
  const [recurringCategoryIds, setRecurringCategoryIds] = useState<Set<string>>(
    new Set(),
  );
  const [recurringReloadKey, setRecurringReloadKey] = useState(0);

  useEffect(() => {
    if (!FEATURES.recurring) return;
    let cancelled = false;
    getRecurring()
      .then(
        (list) =>
          !cancelled &&
          setRecurringCategoryIds(new Set(list.map((r) => r.category_id))),
      )
      // Without the list the switch stays enabled; the backend answers 409
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [recurringReloadKey]);

  const categoryHasRecurring = recurringCategoryIds.has(formData.category);
  // A category that already recurs cannot get a second rule
  const recurringOn = formData.recurring && !categoryHasRecurring;

  const notesRemaining = NOTES_MAX_LENGTH - formData.notes.length;
  const notesNearLimit = notesRemaining <= NOTES_WARNING_THRESHOLD;
  const selectedDate = formData.date ? parseISO(formData.date) : undefined;
  // Shown under the recurring fields, so the user knows when it starts.
  // Same as the backend: after today (in Romania) and after this transaction's
  // date, so the same day is never added twice
  const today = todayInRomania();
  const firstRun = parseISO(
    firstRunDate(
      parseDay(formData.dayOfMonth),
      formData.date > today ? formData.date : today,
    ),
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleTypeChange(value: BudgetType) {
    setFormData((prev) => ({ ...prev, type: value, category: "" }));
  }

  function handleCategoryCreated(category: Category) {
    setCategoriesResult((prev) =>
      prev ? { ...prev, categories: [...prev.categories, category] } : prev,
    );
    setFormData((prev) => ({ ...prev, category: category.category_id }));
    setFormErrors((prev) => ({ ...prev, category: undefined }));
    setNewCategoryOpen(false);
    onCategoryCreated?.(category);
  }

  function handleDateSelect(d: Date | undefined) {
    if (!d) return;
    setFormData((prev) => ({ ...prev, date: toDateString(d) }));
    setDateOpen(false);
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    // A category that already recurs is saved as a normal transaction
    const result = BudgetItemSchema.safeParse({
      ...formData,
      recurring: recurringOn,
    });

    if (!result.success) {
      const fieldErrors = z.flattenError(result.error).fieldErrors;
      setFormErrors({
        category: fieldErrors.category?.[0] as SchemaErrorKey | undefined,
        amount: fieldErrors.amount?.[0] as SchemaErrorKey | undefined,
        notes: fieldErrors.notes?.[0] as SchemaErrorKey | undefined,
        dayOfMonth: fieldErrors.dayOfMonth?.[0] as SchemaErrorKey | undefined,
      });
      if (fieldErrors.amount) amountRef.current?.focus();
      return;
    }

    setFormErrors({});

    const item = result.data;
    const isRecurring = FEATURES.recurring && item.recurring;

    // Recurring: one request saves the rule and this transaction together
    // (linked, so it shows the recurring badge); otherwise a normal transaction
    let recurringStart: string | null = null;
    setSubmitting(true);
    try {
      if (isRecurring) {
        const { recurring } = await createRecurring({
          type: item.type,
          category_id: item.category,
          amount: item.amount,
          notes: item.notes || undefined,
          day_of_month: item.dayOfMonth,
          date: item.date,
        });
        recurringStart = recurring.next_run;
        setRecurringReloadKey((k) => k + 1);
      } else {
        await addNewTransaction(item);
      }
    } catch (err) {
      // 409 = the category got a recurring rule meanwhile (e.g. another tab)
      const taken = err instanceof RecurringRequestError && err.status === 409;
      toast.error(
        t(
          taken
            ? "dashboard.budget.form.recurring.alreadyRecurring"
            : "dashboard.budget.form.toasts.addError",
        ),
      );
      if (taken) setRecurringReloadKey((k) => k + 1);
      setSubmitting(false);
      return;
    }

    toast.success(t("dashboard.budget.form.toasts.added"), {
      description: recurringStart
        ? t("dashboard.budget.form.toasts.recurringAdded", {
            date: format(parseISO(recurringStart), "PPP", {
              locale: dateLocale,
            }),
          })
        : undefined,
    });
    onCreated?.(item.type);

    setFormData((prev) => ({
      ...prev,
      category: categories[0]?.category_id ?? "",
      amount: "",
      notes: "",
      date: toDateString(new Date()),
      ...emptyRecurring(defaultRecurring),
    }));
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <fieldset disabled={submitting} className="grid min-w-0 gap-4">
        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">{t("dashboard.budget.form.type")}</Label>
          <Select
            value={formData.type}
            onValueChange={(v) => handleTypeChange(v as BudgetType)}
          >
            <SelectTrigger id="type" className="w-full">
              <SelectValue
                placeholder={t("dashboard.budget.form.selectType")}
              />
            </SelectTrigger>
            <SelectContent>
              {(["income", "expenses", "savings"] as const).map((type) => (
                <SelectItem key={type} value={type}>
                  {t(`dashboard.budget.form.types.${type}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div data-tour="formCategory" className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="category">
              {t("dashboard.budget.form.category")}
            </Label>
            {categories.length > 0 && (
              <Popover open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 cursor-pointer gap-1 px-2 text-xs text-muted-foreground"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                    {t("dashboard.budget.form.addCategory")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <NewCategoryField
                    autoFocus
                    type={formData.type}
                    categories={categories}
                    onCreated={handleCategoryCreated}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
          {!categoriesLoading && categories.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.budget.form.noCategories")}
              </p>
              <NewCategoryField
                type={formData.type}
                categories={categories}
                onCreated={handleCategoryCreated}
              />
            </>
          ) : (
            <Select
              value={formData.category}
              onValueChange={(v) => {
                setFormData((prev) => ({ ...prev, category: v }));
                setFormErrors((prev) => ({ ...prev, category: undefined }));
              }}
            >
              <SelectTrigger
                id="category"
                className="w-full"
                disabled={categoriesLoading}
                aria-invalid={!!formErrors.category}
                aria-describedby={
                  formErrors.category ? "category-error" : undefined
                }
              >
                <SelectValue
                  placeholder={
                    categoriesLoading
                      ? t("dashboard.budget.form.loadingCategories")
                      : t("dashboard.budget.form.selectCategory")
                  }
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
          {formErrors.category && (
            <p
              id="category-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {t(formErrors.category)}
            </p>
          )}
        </div>

        {/* Amount + Date */}
        <div className="flex justify-between gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t("dashboard.budget.form.amount")}</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              ref={amountRef}
              aria-invalid={!!formErrors.amount}
              aria-describedby={formErrors.amount ? "amount-error" : undefined}
            />
            {formErrors.amount && (
              <p
                id="amount-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {t(formErrors.amount)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">{t("dashboard.budget.form.date")}</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  type="button"
                  variant="outline"
                  data-empty={!formData.date}
                  className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
                >
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: dateLocale })
                  ) : (
                    <span>{t("dashboard.budget.form.pickDate")}</span>
                  )}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  required
                  locale={dateLocale}
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  defaultMonth={selectedDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Recurring: added again automatically every month */}
        {FEATURES.recurring && (
          <div
            data-tour="formRecurring"
            className="space-y-4 rounded-lg border p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label
                  htmlFor="recurring"
                  className="flex items-center gap-1.5"
                >
                  <Repeat className="h-4 w-4" aria-hidden="true" />
                  {t("dashboard.budget.form.recurring.label")}
                </Label>
                <p
                  id="recurring-description"
                  className="text-xs text-muted-foreground"
                >
                  {categoryHasRecurring
                    ? t("dashboard.budget.form.recurring.alreadyRecurring")
                    : t("dashboard.budget.form.recurring.description")}
                </p>
              </div>
              <Switch
                id="recurring"
                checked={recurringOn}
                disabled={categoryHasRecurring}
                onCheckedChange={(checked) => {
                  // Turned off: the day is cleared, nothing recurring is sent
                  setFormData((prev) => ({
                    ...prev,
                    recurring: checked,
                    dayOfMonth: checked ? prev.dayOfMonth : "",
                  }));
                  setFormErrors((prev) => ({ ...prev, dayOfMonth: undefined }));
                }}
                aria-describedby="recurring-description"
                className="cursor-pointer"
              />
            </div>

            {recurringOn && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dayOfMonth">
                    {t("dashboard.budget.form.recurring.dayOfMonth")}
                  </Label>
                  <Input
                    id="dayOfMonth"
                    name="dayOfMonth"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="31"
                    step="1"
                    value={formData.dayOfMonth}
                    onChange={handleChange}
                    onKeyDown={(e) =>
                      [".", ",", "e", "E", "-", "+"].includes(e.key) &&
                      e.preventDefault()
                    }
                    placeholder={t(
                      "dashboard.budget.form.recurring.dayOfMonthPlaceholder",
                    )}
                    aria-invalid={!!formErrors.dayOfMonth}
                    aria-describedby={
                      formErrors.dayOfMonth
                        ? "dayOfMonth-error dayOfMonth-hint"
                        : "dayOfMonth-hint"
                    }
                  />
                  <p
                    id="dayOfMonth-hint"
                    className="text-xs text-muted-foreground"
                  >
                    {t("dashboard.budget.form.recurring.dayOfMonthHint")}
                  </p>
                  {formErrors.dayOfMonth && (
                    <p
                      id="dayOfMonth-error"
                      role="alert"
                      className="text-sm text-destructive"
                    >
                      {t(formErrors.dayOfMonth)}
                    </p>
                  )}
                </div>

                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {t("dashboard.budget.form.recurring.firstRun", {
                    date: format(firstRun, "PPP", { locale: dateLocale }),
                  })}
                </p>
              </>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">{t("dashboard.budget.form.notes")}</Label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            maxLength={NOTES_MAX_LENGTH}
            aria-invalid={!!formErrors.notes}
            aria-describedby={
              formErrors.notes ? "notes-error notes-counter" : "notes-counter"
            }
            placeholder={t("dashboard.budget.form.notesPlaceholder")}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none min-h-40 resize-none transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
          <p
            id="notes-counter"
            aria-live={notesNearLimit ? "polite" : "off"}
            className={`text-right text-xs tabular-nums ${
              notesNearLimit ? "text-finance-danger" : "text-muted-foreground"
            }`}
          >
            {formData.notes.length}/{NOTES_MAX_LENGTH}
          </p>
          {formErrors.notes && (
            <p
              id="notes-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {t(formErrors.notes, { max: NOTES_MAX_LENGTH })}
            </p>
          )}
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="cursor-pointer"
        >
          {submitting && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {submitting
            ? t("dashboard.budget.form.saving")
            : t("dashboard.budget.form.save")}
        </Button>
      </div>
    </form>
  );
}
