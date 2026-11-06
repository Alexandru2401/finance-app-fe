import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiRequestError, createCategory, type Category } from "@/api/budget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORY_NAME_MAX_LENGTH = 40;

interface NewCategoryFieldProps {
  type: Category["type"];
  // Categories of the same type, for the duplicate check
  categories: Category[];
  onCreated: (category: Category) => void;
  autoFocus?: boolean;
}

/** Not a <form>: it is rendered inside other forms, which cannot be nested. */
export default function NewCategoryField({
  type,
  categories,
  onCreated,
  autoFocus,
}: NewCategoryFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const errorId = `${id}-error`;

  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [creating, setCreating] = useState(false);

  async function handleAdd() {
    if (creating) return;

    const cleanName = name.trim();

    if (!cleanName) {
      setError(t("dashboard.budget.form.errors.categoryNameRequired"));
      return;
    }

    const exists = categories.some(
      (category) => category.name.toLowerCase() === cleanName.toLowerCase(),
    );
    if (exists) {
      setError(t("dashboard.budget.form.errors.categoryExists"));
      return;
    }

    setCreating(true);
    try {
      const category = await createCategory({ type, name: cleanName });

      setName("");
      onCreated(category);
      toast.success(
        t("dashboard.budget.form.toasts.categoryAdded", {
          name: category.name,
        }),
      );
    } catch (err) {
      setError(
        err instanceof ApiRequestError && err.status === 409
          ? t("dashboard.budget.form.errors.categoryExists")
          : t("dashboard.budget.form.toasts.categoryError"),
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t("dashboard.budget.form.newCategory")}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          autoFocus={autoFocus}
          value={name}
          disabled={creating}
          maxLength={CATEGORY_NAME_MAX_LENGTH}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={t("dashboard.budget.form.newCategoryPlaceholder")}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
        <Button
          type="button"
          size="sm"
          className="h-9 cursor-pointer"
          onClick={handleAdd}
          disabled={creating}
          aria-busy={creating}
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            t("dashboard.budget.form.add")
          )}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
