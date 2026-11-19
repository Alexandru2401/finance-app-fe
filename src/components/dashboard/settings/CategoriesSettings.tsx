import { cn } from "@/lib/utils";
import {
  ApiRequestError,
  createCategory,
  deleteCategory,
  renameCategory,
  getCategories,
  type Category,
} from "@/api/budget";
import {
  RecurringRequestError,
  createRecurring,
  getRecurring,
  updateRecurring,
  type RecurringItem,
} from "@/api/recurring";
import CardError from "@/components/dashboard/shared/CardError";
import RecurringBadge from "@/components/dashboard/shared/RecurringBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCurrency } from "@/hooks/useCurrency";
import { useDateLocale } from "@/hooks/useDateLocale";
import { FEATURES } from "@/lib/features";
import { firstRunDate } from "@/lib/recurring";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CATEGORY_NAME_MAX,
  CATEGORY_NAME_MIN,
  isValidAmount,
} from "@/lib/validation";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type CategoryType = Category["type"];
const TYPES: CategoryType[] = ["income", "expenses", "savings"];

// The recurring rule of each category (at most one per category), by category_id
type RecurringByCategory = Record<string, RecurringItem>;

// Settings page tab: the manager inside a card
export default function CategoriesSettings() {
  const { t } = useTranslation();

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{t("dashboard.settings.categories.title")}</CardTitle>
        <CardDescription>
          {t("dashboard.settings.categories.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CategoriesManager />
      </CardContent>
    </Card>
  );
}

interface CategoriesManagerProps {
  // Tab shown first, e.g. the budget page's active tab
  initialType?: CategoryType;
  // Called after a category is added, renamed or deleted
  onChange?: () => void;
  // Fill the parent's height (a fixed-height drawer / sheet): the tabs and
  // the add field stay on top, only the list scrolls
  fillHeight?: boolean;
}

// Used by the settings page and by the budget page's side panel.
// Adding (POST), renaming (PATCH /:id) and deleting (DELETE /:id) go to /categories
export function CategoriesManager({
  initialType = "expenses",
  onChange,
  fillHeight = false,
}: CategoriesManagerProps) {
  const { t } = useTranslation();
  // undefined = loading, null = request failed
  const [categories, setCategories] = useState<Category[] | null | undefined>(
    undefined,
  );
  const [activeType, setActiveType] = useState<CategoryType>(initialType);
  // Bumped by "Try again" to fetch the list again
  const [reloadKey, setReloadKey] = useState(0);
  const [recurring, setRecurring] = useState<RecurringByCategory>({});

  useEffect(() => {
    let ignore = false;
    getCategories()
      .then((list) => !ignore && setCategories(list))
      .catch(() => !ignore && setCategories(null));
    // The categories still show if this fails, just without the badges
    if (FEATURES.recurring) {
      getRecurring()
        .then(
          (list) =>
            !ignore &&
            setRecurring(
              Object.fromEntries(list.map((item) => [item.category_id, item])),
            ),
        )
        .catch(() => {});
    }
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  function setRecurringOf(categoryId: string, item: RecurringItem) {
    setRecurring((prev) => ({ ...prev, [categoryId]: item }));
    onChange?.();
  }

  function retry() {
    setCategories(undefined);
    setReloadKey((k) => k + 1);
  }

  function addToList(category: Category) {
    setCategories((prev) => (prev ? [...prev, category] : [category]));
    onChange?.();
  }

  function replaceInList(category: Category) {
    setCategories(
      (prev) =>
        prev?.map((c) =>
          c.category_id === category.category_id ? category : c,
        ) ?? prev,
    );
    onChange?.();
  }

  function removeFromList(id: string) {
    setCategories((prev) => prev?.filter((c) => c.category_id !== id) ?? prev);
    // Deleting the category deletes its recurring rule too (backend cascade)
    setRecurring((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    onChange?.();
  }

  return (
    <Tabs
      value={activeType}
      onValueChange={(v) => setActiveType(v as CategoryType)}
      className={cn(fillHeight && "min-h-0 flex-1")}
    >
      <TabsList>
        {TYPES.map((type) => (
          <TabsTrigger key={type} value={type} className="cursor-pointer">
            {t(`dashboard.common.${type}`)}
          </TabsTrigger>
        ))}
      </TabsList>

      {TYPES.map((type) => (
        <TabsContent
          key={type}
          value={type}
          className={cn("mt-4", fillHeight && "flex min-h-0 flex-col")}
        >
          <AddCategoryForm
            type={type}
            existing={categories?.filter((c) => c.type === type) ?? []}
            onCreated={addToList}
          />

          {/* With fillHeight, the only scrolling part */}
          <div
            className={cn(
              fillHeight && "-mr-2 min-h-0 flex-1 overflow-y-auto pr-2",
            )}
          >
            {categories === undefined ? (
              <CategoryListSkeleton />
            ) : categories === null ? (
              <CardError
                message={t("dashboard.settings.categories.loadError")}
                onRetry={retry}
              />
            ) : (
              <CategoryList
                categories={categories.filter((c) => c.type === type)}
                recurring={recurring}
                onRenamed={replaceInList}
                onRecurringChanged={setRecurringOf}
                onDeleted={removeFromList}
              />
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

interface AddCategoryFormProps {
  type: CategoryType;
  // Categories of this type, to catch duplicates before calling the backend
  existing: Category[];
  onCreated: (category: Category) => void;
}

function AddCategoryForm({ type, existing, onCreated }: AddCategoryFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cleanName = name.trim();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    if (
      cleanName.length < CATEGORY_NAME_MIN ||
      cleanName.length > CATEGORY_NAME_MAX
    ) {
      setError(
        t("dashboard.settings.categories.errors.length", {
          min: CATEGORY_NAME_MIN,
          max: CATEGORY_NAME_MAX,
        }),
      );
      return;
    }

    // The backend checks this too (409), but this avoids a request
    const duplicate = existing.some(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase(),
    );
    if (duplicate) {
      setError(t("dashboard.settings.categories.errors.exists"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const category = await createCategory({ type, name: cleanName });
      onCreated(category);
      setName("");
      toast.success(
        t("dashboard.settings.categories.toasts.added", {
          name: category.name,
        }),
      );
    } catch (err) {
      const status = err instanceof ApiRequestError ? err.status : null;
      setError(
        status === 409
          ? t("dashboard.settings.categories.errors.exists")
          : status === 422
            ? t("dashboard.settings.categories.errors.limit")
            : t("dashboard.settings.categories.errors.add"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      data-tour="categoryAdd"
      className="mb-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          placeholder={t("dashboard.settings.categories.newPlaceholder")}
          aria-label={t("dashboard.settings.categories.newPlaceholder")}
          aria-invalid={error !== null}
          aria-describedby={error ? `new-category-error-${type}` : undefined}
          maxLength={CATEGORY_NAME_MAX}
          disabled={saving}
        />
        <Button
          type="submit"
          size="sm"
          className="h-9 cursor-pointer gap-1.5"
          disabled={saving || cleanName === ""}
        >
          {saving ? <Spinner /> : <Plus size={16} />}
          {t("dashboard.settings.categories.add")}
        </Button>
      </div>
      {error && (
        <p
          id={`new-category-error-${type}`}
          role="alert"
          className="mt-1.5 text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </form>
  );
}

interface CategoryListProps {
  categories: Category[];
  recurring: RecurringByCategory;
  onRenamed: (category: Category) => void;
  onRecurringChanged: (categoryId: string, item: RecurringItem) => void;
  onDeleted: (id: string) => void;
}

function CategoryList({
  categories,
  recurring,
  onRenamed,
  onRecurringChanged,
  onDeleted,
}: CategoryListProps) {
  const { t } = useTranslation();

  const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        {t("dashboard.settings.categories.custom")} ({sorted.length})
      </h3>
      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
          {t("dashboard.settings.categories.emptyCustom")}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sorted.map((category) => (
            <CategoryRow
              key={category.category_id}
              category={category}
              recurring={recurring[category.category_id]}
              siblings={categories}
              onRenamed={onRenamed}
              onRecurringChanged={onRecurringChanged}
              onDeleted={onDeleted}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface CategoryRowProps {
  category: Category;
  // The category's recurring rule, if it has one (active or stopped)
  recurring?: RecurringItem;
  // All categories of the same type, for the duplicate check
  siblings: Category[];
  onRenamed: (category: Category) => void;
  onRecurringChanged: (categoryId: string, item: RecurringItem) => void;
  onDeleted: (id: string) => void;
}

function CategoryRow({
  category,
  recurring,
  siblings,
  onRenamed,
  onRecurringChanged,
  onDeleted,
}: CategoryRowProps) {
  const { t } = useTranslation();
  const { format: formatMoney } = useCurrency();
  const [editing, setEditing] = useState(false);
  const active = recurring?.is_active === true;

  return (
    <li
      data-tour="categoryRow"
      className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-1.5"
    >
      <div className="rounded-md bg-muted p-1.5 text-muted-foreground">
        <Tag className="size-4" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium">{category.name}</span>
          {active && <RecurringBadge />}
        </div>
        {/* Amount and day of the rule, only while it is on */}
        {active && recurring && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatMoney(recurring.amount, "auto", true)}
            {" · "}
            {t("dashboard.settings.categories.recurring.day", {
              day: recurring.day_of_month ?? 1,
            })}
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-8 cursor-pointer"
        aria-label={t("dashboard.settings.categories.edit")}
        title={t("dashboard.settings.categories.edit")}
        onClick={() => setEditing(true)}
      >
        <Pencil className="size-4" />
      </Button>
      <DeleteCategoryButton
        category={category}
        hasRecurring={!!recurring}
        onDeleted={onDeleted}
      />

      {editing && (
        <EditCategoryDialog
          category={category}
          recurring={recurring}
          siblings={siblings}
          onRenamed={onRenamed}
          onRecurringChanged={onRecurringChanged}
          onDeleted={onDeleted}
          onClose={() => setEditing(false)}
        />
      )}
    </li>
  );
}

type EditCategoryDialogProps = Omit<CategoryRowProps, "recurring"> & {
  recurring?: RecurringItem;
  onClose: () => void;
};

type EditErrors = { name?: string; amount?: string; day?: string };

// One dialog for the name and the recurrence of the category:
// - the name can always be changed
// - "Recurring" on: amount + day of the month (added automatically every month)
// - "Recurring" off: nothing is added anymore (the rule is kept, stopped)
// Recurring changes apply only to future transactions
function EditCategoryDialog({
  category,
  recurring,
  siblings,
  onRenamed,
  onRecurringChanged,
  onDeleted,
  onClose,
}: EditCategoryDialogProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [name, setName] = useState(category.name);
  const [isRecurring, setIsRecurring] = useState(recurring?.is_active === true);
  const [amount, setAmount] = useState(
    recurring ? String(recurring.amount) : "",
  );
  const [day, setDay] = useState(
    recurring?.day_of_month == null ? "" : String(recurring.day_of_month),
  );
  const [errors, setErrors] = useState<EditErrors>({});
  const [saving, setSaving] = useState(false);

  function validate(): EditErrors {
    const cleanName = name.trim();
    const result: EditErrors = {};

    if (
      cleanName.length < CATEGORY_NAME_MIN ||
      cleanName.length > CATEGORY_NAME_MAX
    ) {
      result.name = t("dashboard.settings.categories.errors.length", {
        min: CATEGORY_NAME_MIN,
        max: CATEGORY_NAME_MAX,
      });
    } else if (
      // Same check as the backend (409): any other category of this type, any
      // case. Changing only the case of its own name ("sala" -> "Sala") is allowed
      siblings.some(
        (c) =>
          c.category_id !== category.category_id &&
          c.name.toLowerCase() === cleanName.toLowerCase(),
      )
    ) {
      result.name = t("dashboard.settings.categories.errors.exists");
    }

    if (isRecurring) {
      if (!isValidAmount(Number(amount))) {
        result.amount = t(
          "dashboard.settings.categories.recurring.amountError",
        );
      }
      const parsedDay = Number(day);
      if (
        day.trim() !== "" &&
        !(Number.isInteger(parsedDay) && parsedDay >= 1 && parsedDay <= 31)
      ) {
        result.day = t("dashboard.budget.form.errors.dayOfMonthInvalid");
      }
    }
    return result;
  }

  // The recurring request needed for what is in the form, or null if nothing changed
  function recurringRequest(): (() => Promise<RecurringItem>) | null {
    const parsedAmount = Number(amount);
    const parsedDay = day.trim() === "" ? null : Number(day);

    if (!isRecurring) {
      // Off: stop the rule if it is running
      return recurring?.is_active
        ? () => updateRecurring(recurring.id, { is_active: false })
        : null;
    }

    if (!recurring) {
      // On, no rule yet: create it (no transaction now; the first one is added
      // on the next date)
      return () =>
        createRecurring({
          type: category.type,
          category_id: category.category_id,
          amount: parsedAmount,
          day_of_month: parsedDay,
        }).then((res) => res.recurring);
    }

    const changed =
      !recurring.is_active ||
      recurring.amount !== parsedAmount ||
      recurring.day_of_month !== parsedDay;
    return changed
      ? () =>
          updateRecurring(recurring.id, {
            amount: parsedAmount,
            day_of_month: parsedDay,
            is_active: true,
          })
      : null;
  }

  async function save() {
    if (saving) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    const cleanName = name.trim();
    let renamed = false;

    // 1. The name
    if (cleanName !== category.name) {
      try {
        onRenamed(await renameCategory(category.category_id, cleanName));
        renamed = true;
      } catch (err) {
        setSaving(false);
        if (err instanceof ApiRequestError && err.status === 404) {
          // Deleted in the meantime (e.g. in another tab)
          onDeleted(category.category_id);
          toast.error(t("dashboard.settings.categories.errors.rename"));
          onClose();
          return;
        }
        setErrors({
          name:
            err instanceof ApiRequestError && err.status === 409
              ? t("dashboard.settings.categories.errors.exists")
              : t("dashboard.settings.categories.errors.rename"),
        });
        return;
      }
    }

    // 2. The recurrence; if only this fails, the new name stays saved
    const request = recurringRequest();
    if (request) {
      try {
        onRecurringChanged(category.category_id, await request());
      } catch (err) {
        setSaving(false);
        // 422 = the limit of 50 recurring rules
        toast.error(
          t(
            err instanceof RecurringRequestError && err.status === 422
              ? "dashboard.settings.categories.recurring.limit"
              : "dashboard.settings.categories.recurring.saveError",
          ),
        );
        return;
      }
    }

    setSaving(false);
    if (renamed || request) {
      toast.success(
        t("dashboard.settings.categories.toasts.updated", { name: cleanName }),
      );
    }
    onClose();
  }

  // Next automatic date for what is in the form: the saved one while the rule
  // runs on the same day, otherwise computed like the backend (from today)
  const formDay =
    day.trim() !== "" && Number.isInteger(Number(day)) ? Number(day) : null;
  const dayValid = formDay === null || (formDay >= 1 && formDay <= 31);
  const nextRunPreview = !dayValid
    ? null
    : recurring?.is_active && recurring.day_of_month === formDay
      ? recurring.next_run
      : firstRunDate(formDay);

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("dashboard.settings.categories.editTitle", {
              name: category.name,
            })}
          </DialogTitle>
          <DialogDescription>
            {t("dashboard.settings.categories.editDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="grid gap-4"
        >
          <fieldset disabled={saving} className="grid min-w-0 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor={`category-name-${category.category_id}`}>
                {t("dashboard.settings.categories.name")}
              </Label>
              <Input
                id={`category-name-${category.category_id}`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                maxLength={CATEGORY_NAME_MAX}
                autoFocus
                aria-invalid={!!errors.name}
                aria-describedby={
                  errors.name
                    ? `category-name-error-${category.category_id}`
                    : undefined
                }
              />
              {errors.name && (
                <p
                  id={`category-name-error-${category.category_id}`}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Recurrence */}
            {FEATURES.recurring && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor={`category-recurring-${category.category_id}`}
                    >
                      {t("dashboard.budget.form.recurring.label")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.settings.categories.recurring.hint")}
                    </p>
                  </div>
                  <Switch
                    id={`category-recurring-${category.category_id}`}
                    checked={isRecurring}
                    onCheckedChange={(checked) => {
                      setIsRecurring(checked);
                      setErrors((prev) => ({
                        ...prev,
                        amount: undefined,
                        day: undefined,
                      }));
                    }}
                    className="cursor-pointer"
                  />
                </div>

                {isRecurring && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor={`category-amount-${category.category_id}`}
                      >
                        {t("dashboard.budget.form.amount")}
                      </Label>
                      <Input
                        id={`category-amount-${category.category_id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          setErrors((prev) => ({ ...prev, amount: undefined }));
                        }}
                        aria-invalid={!!errors.amount}
                        aria-describedby={
                          errors.amount
                            ? `category-amount-error-${category.category_id}`
                            : undefined
                        }
                      />
                      {errors.amount && (
                        <p
                          id={`category-amount-error-${category.category_id}`}
                          role="alert"
                          className="text-sm text-destructive"
                        >
                          {errors.amount}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`category-day-${category.category_id}`}>
                        {t("dashboard.budget.form.recurring.dayOfMonth")}
                      </Label>
                      <Input
                        id={`category-day-${category.category_id}`}
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="31"
                        step="1"
                        placeholder="1"
                        value={day}
                        onChange={(e) => {
                          setDay(e.target.value);
                          setErrors((prev) => ({ ...prev, day: undefined }));
                        }}
                        onKeyDown={(e) =>
                          [".", ",", "e", "E", "-", "+"].includes(e.key) &&
                          e.preventDefault()
                        }
                        aria-invalid={!!errors.day}
                        aria-describedby={`category-day-hint-${category.category_id}${
                          errors.day
                            ? ` category-day-error-${category.category_id}`
                            : ""
                        }`}
                      />
                      {errors.day && (
                        <p
                          id={`category-day-error-${category.category_id}`}
                          role="alert"
                          className="text-sm text-destructive"
                        >
                          {errors.day}
                        </p>
                      )}
                    </div>

                    <p
                      id={`category-day-hint-${category.category_id}`}
                      className="text-xs text-muted-foreground sm:col-span-2"
                    >
                      {t("dashboard.budget.form.recurring.dayOfMonthHint")}
                      {nextRunPreview &&
                        ` ${t(
                          "dashboard.settings.categories.recurring.nextRun",
                          {
                            date: format(parseISO(nextRunPreview), "PPP", {
                              locale: dateLocale,
                            }),
                          },
                        )}`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={onClose}
              className="cursor-pointer"
            >
              {t("dashboard.settings.categories.cancel")}
            </Button>
            <Button type="submit" disabled={saving} className="cursor-pointer">
              {saving && <Spinner />}
              {t("dashboard.settings.categories.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryButton({
  category,
  hasRecurring,
  onDeleted,
}: Pick<CategoryRowProps, "category" | "onDeleted"> & {
  // Deleting the category deletes its recurring rule too
  hasRecurring: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteCategory(category.category_id);
      setOpen(false);
      onDeleted(category.category_id);
      toast.success(
        t("dashboard.settings.categories.toasts.deleted", {
          name: category.name,
        }),
      );
    } catch (err) {
      // 404 = already deleted (e.g. in another tab): drop it from the list too
      if (err instanceof ApiRequestError && err.status === 404) {
        setOpen(false);
        onDeleted(category.category_id);
      }
      toast.error(t("dashboard.settings.categories.errors.delete"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !deleting && setOpen(v)}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 cursor-pointer text-finance-danger hover:bg-finance-danger-bg hover:text-finance-danger"
          aria-label={t("dashboard.settings.categories.delete")}
          title={t("dashboard.settings.categories.delete")}
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("dashboard.settings.categories.deleteTitle", {
              name: category.name,
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("dashboard.settings.categories.deleteDescription")}
            {hasRecurring &&
              ` ${t("dashboard.settings.categories.recurring.deleteHint")}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {t("dashboard.settings.categories.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-finance-danger text-finance-foreground hover:bg-finance-danger/90"
            disabled={deleting}
            onClick={(e) => {
              // Keep the dialog open until the request finishes
              e.preventDefault();
              handleDelete();
            }}
          >
            {deleting && <Spinner />}
            {t("dashboard.settings.categories.deleteConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CategoryListSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}
