import { getCategories, type Category } from "@/api/budget";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Lock, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type CategoryType = Category["type"];
const TYPES: CategoryType[] = ["income", "expenses", "savings"];

// UI only: the list is loaded from GET /budget/categories, but adding,
// renaming and deleting are not wired yet (the backend routes do not exist)
export default function CategoriesSettings() {
  const { t } = useTranslation();
  // undefined = loading, null = request failed
  const [categories, setCategories] = useState<Category[] | null | undefined>(
    undefined,
  );
  const [activeType, setActiveType] = useState<CategoryType>("expenses");

  useEffect(() => {
    let ignore = false;
    getCategories()
      .then((list) => !ignore && setCategories(list))
      .catch(() => !ignore && setCategories(null));
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{t("dashboard.settings.categories.title")}</CardTitle>
        <CardDescription>
          {t("dashboard.settings.categories.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              <AddCategoryForm />

              {categories === undefined ? (
                <CategoryListSkeleton />
              ) : categories === null ? (
                <CardError message={t("dashboard.settings.categories.loadError")} />
              ) : (
                <CategoryList
                  categories={categories.filter((c) => c.type === type)}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

function AddCategoryForm() {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  return (
    <form
      className="mb-4 flex gap-2"
      // Not wired yet: POST /budget/categories does not exist
      onSubmit={(e) => e.preventDefault()}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("dashboard.settings.categories.newPlaceholder")}
        aria-label={t("dashboard.settings.categories.newPlaceholder")}
        maxLength={50}
      />
      <Button
        type="submit"
        size="sm"
        className="h-9 cursor-pointer gap-1.5"
        disabled={name.trim() === ""}
      >
        <Plus size={16} />
        {t("dashboard.settings.categories.add")}
      </Button>
    </form>
  );
}

function CategoryList({ categories }: { categories: Category[] }) {
  const { t } = useTranslation();

  // Custom categories first, then the defaults
  const custom = categories.filter((c) => c.key === null);
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

function CustomCategoryRow({ category }: { category: Category }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  function cancelEdit() {
    setName(category.name);
    setEditing(false);
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-1.5">
      <div className="rounded-md bg-muted p-1.5 text-muted-foreground">
        <Tag className="size-4" />
      </div>

      {editing ? (
        <form
          className="flex flex-1 items-center gap-1"
          // Not wired yet: PATCH /budget/categories/:id does not exist
          onSubmit={(e) => {
            e.preventDefault();
            setEditing(false);
          }}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={t("dashboard.settings.categories.rename")}
            className="h-8"
            maxLength={50}
            autoFocus
            onKeyDown={(e) => e.key === "Escape" && cancelEdit()}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="size-8 cursor-pointer"
            aria-label={t("dashboard.settings.categories.save")}
            disabled={name.trim() === ""}
          >
            <Check className="size-4 text-finance-success" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 cursor-pointer"
            aria-label={t("dashboard.settings.categories.cancel")}
            onClick={cancelEdit}
          >
            <X className="size-4" />
          </Button>
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
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4" />
          </Button>
          <DeleteCategoryButton name={category.name} />
        </>
      )}
    </li>
  );
}

function DeleteCategoryButton({ name }: { name: string }) {
  const { t } = useTranslation();

  return (
    <AlertDialog>
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
            {t("dashboard.settings.categories.deleteTitle", { name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("dashboard.settings.categories.deleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("dashboard.settings.categories.cancel")}
          </AlertDialogCancel>
          {/* Not wired yet: DELETE /budget/categories/:id does not exist */}
          <AlertDialogAction className="bg-finance-danger text-white hover:bg-finance-danger/90">
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
