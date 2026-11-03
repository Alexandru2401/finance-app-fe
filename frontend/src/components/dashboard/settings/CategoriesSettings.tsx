import {
  ApiRequestError,
  createCategory,
  deleteCategory,
  renameCategory,
  getCategories,
  type Category,
} from "@/api/budget";
import CardError from "@/components/dashboard/shared/CardError";
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
import { Badge } from "@/components/ui/badge";
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
import { Check, Lock, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type CategoryType = Category["type"];
const TYPES: CategoryType[] = ["income", "expenses", "savings"];

// Same limits as the backend (POST /categories)
const NAME_MIN = 2;
const NAME_MAX = 50;

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
}

// Used by the settings page and by the budget page's side panel.
// Adding (POST), renaming (PATCH /:id) and deleting (DELETE /:id) go to /categories
export function CategoriesManager({
  initialType = "expenses",
  onChange,
}: CategoriesManagerProps) {
  const { t } = useTranslation();
  // undefined = loading, null = request failed
  const [categories, setCategories] = useState<Category[] | null | undefined>(
    undefined,
  );
  const [activeType, setActiveType] = useState<CategoryType>(initialType);
  // Bumped by "Try again" to fetch the list again
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    getCategories()
      .then((list) => !ignore && setCategories(list))
      .catch(() => !ignore && setCategories(null));
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

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
    onChange?.();
  }

  return (
        <Tabs
          value={activeType}
          onValueChange={(v) => setActiveType(v as CategoryType)}
        >
          <TabsList>
            {TYPES.map((type) => (
              <TabsTrigger key={type} value={type} className="cursor-pointer">
                {t(`dashboard.common.${type}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {TYPES.map((type) => (
            <TabsContent key={type} value={type} className="mt-4">
              <AddCategoryForm
                type={type}
                existing={categories?.filter((c) => c.type === type) ?? []}
                onCreated={addToList}
              />

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
                  onRenamed={replaceInList}
                  onDeleted={removeFromList}
                />
              )}
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

    if (cleanName.length < NAME_MIN || cleanName.length > NAME_MAX) {
      setError(
        t("dashboard.settings.categories.errors.length", {
          min: NAME_MIN,
          max: NAME_MAX,
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
      setError(
        err instanceof ApiRequestError && err.status === 409
          ? t("dashboard.settings.categories.errors.exists")
          : t("dashboard.settings.categories.errors.add"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mb-4" onSubmit={handleSubmit} noValidate>
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
          maxLength={NAME_MAX}
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
  onRenamed: (category: Category) => void;
  onDeleted: (id: string) => void;
}

function CategoryList({ categories, onRenamed, onDeleted }: CategoryListProps) {
  const { t } = useTranslation();

  // Custom categories first, then the defaults
  const custom = categories
    .filter((c) => c.key === null)
    .sort((a, b) => a.name.localeCompare(b.name));
  const defaults = categories.filter((c) => c.key !== null);

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          {t("dashboard.settings.categories.custom")} ({custom.length})
        </h3>
        {custom.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            {t("dashboard.settings.categories.emptyCustom")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {custom.map((category) => (
              <CustomCategoryRow
                key={category.category_id}
                category={category}
                siblings={categories}
                onRenamed={onRenamed}
                onDeleted={onDeleted}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          {t("dashboard.settings.categories.defaults")} ({defaults.length})
        </h3>
        <ul className="flex flex-wrap gap-2">
          {defaults.map((category) => (
            <li key={category.category_id}>
              <Badge
                variant="secondary"
                className="gap-1.5 px-2.5 py-1 font-normal"
                title={t("dashboard.settings.categories.defaultHint")}
              >
                <Lock className="size-3 opacity-60" />
                {category.name}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

interface CustomCategoryRowProps {
  category: Category;
  // All categories of the same type (custom + default), for the duplicate check
  siblings: Category[];
  onRenamed: (category: Category) => void;
  onDeleted: (id: string) => void;
}

function CustomCategoryRow({
  category,
  siblings,
  onRenamed,
  onDeleted,
}: CustomCategoryRowProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const errorId = `rename-category-error-${category.category_id}`;

  function startEdit() {
    setName(category.name);
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    if (saving) return;
    setName(category.name);
    setError(null);
    setEditing(false);
  }

  async function handleRename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    const cleanName = name.trim();
    // Nothing changed: just close
    if (cleanName === category.name) {
      setEditing(false);
      return;
    }

    if (cleanName.length < NAME_MIN || cleanName.length > NAME_MAX) {
      setError(
        t("dashboard.settings.categories.errors.length", {
          min: NAME_MIN,
          max: NAME_MAX,
        }),
      );
      return;
    }

    // Same check as the backend (409): any other category of this type, any case.
    // Changing only the case of its own name ("sala" -> "Sala") is allowed
    const duplicate = siblings.some(
      (c) =>
        c.category_id !== category.category_id &&
        c.name.toLowerCase() === cleanName.toLowerCase(),
    );
    if (duplicate) {
      setError(t("dashboard.settings.categories.errors.exists"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await renameCategory(category.category_id, cleanName);
      onRenamed(updated);
      setEditing(false);
      toast.success(
        t("dashboard.settings.categories.toasts.renamed", {
          name: updated.name,
        }),
      );
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) {
        // Deleted in the meantime (e.g. in another tab)
        onDeleted(category.category_id);
        toast.error(t("dashboard.settings.categories.errors.rename"));
        return;
      }
      setError(
        err instanceof ApiRequestError && err.status === 409
          ? t("dashboard.settings.categories.errors.exists")
          : t("dashboard.settings.categories.errors.rename"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-1.5">
      <div className="rounded-md bg-muted p-1.5 text-muted-foreground">
        <Tag className="size-4" />
      </div>

      {editing ? (
        <form
          className="flex flex-1 flex-col gap-1"
          onSubmit={handleRename}
          noValidate
        >
          <div className="flex items-center gap-1">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              aria-label={t("dashboard.settings.categories.rename")}
              aria-invalid={error !== null}
              aria-describedby={error ? errorId : undefined}
              className="h-8"
              maxLength={NAME_MAX}
              disabled={saving}
              autoFocus
              onKeyDown={(e) => e.key === "Escape" && cancelEdit()}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="size-8 cursor-pointer"
              aria-label={t("dashboard.settings.categories.save")}
              disabled={saving || name.trim() === ""}
            >
              {saving ? (
                <Spinner />
              ) : (
                <Check className="size-4 text-finance-success" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 cursor-pointer"
              aria-label={t("dashboard.settings.categories.cancel")}
              onClick={cancelEdit}
              disabled={saving}
            >
              <X className="size-4" />
            </Button>
          </div>
          {error && (
            <p id={errorId} role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </form>
      ) : (
        <>
          <span className="flex-1 truncate text-sm font-medium">
            {category.name}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 cursor-pointer"
            aria-label={t("dashboard.settings.categories.rename")}
            title={t("dashboard.settings.categories.rename")}
            onClick={startEdit}
          >
            <Pencil className="size-4" />
          </Button>
          <DeleteCategoryButton category={category} onDeleted={onDeleted} />
        </>
      )}
    </li>
  );
}

function DeleteCategoryButton({
  category,
  onDeleted,
}: Pick<CustomCategoryRowProps, "category" | "onDeleted">) {
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {t("dashboard.settings.categories.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-finance-danger text-white hover:bg-finance-danger/90"
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
