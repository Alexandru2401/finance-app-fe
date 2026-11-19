import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TargetHistory from "@/components/dashboard/budget/TargetHistory";
import type { BudgetTargetValues } from "@/api/budget";
import { formatMonth } from "@/lib/periods";
import { isValidTargetAmount } from "@/lib/validation";
import { History } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface TargetsPanelProps {
  targets: BudgetTargetValues;
  // YYYY-MM-01, the month the targets apply to
  month: string;
  // Resolves to false if the save failed, so the panel stays open
  onSave: (t: BudgetTargetValues) => Promise<boolean>;
  onClose: () => void;
}

type Field = keyof BudgetTargetValues;

const FIELDS: { key: Field; id: string }[] = [
  { key: "income", id: "t-income" },
  { key: "expense", id: "t-expenses" },
  { key: "savings", id: "t-savings" },
];

// An empty input means "no target" and is saved as null
const toInput = (value: number | null) => (value === null ? "" : String(value));
const fromInput = (value: string) =>
  value.trim() === "" ? null : Number(value);

export default function TargetsPanel({
  targets,
  month,
  onSave,
  onClose,
}: TargetsPanelProps) {
  const { t, i18n } = useTranslation();
  const [values, setValues] = useState({
    income: toInput(targets.income),
    expense: toInput(targets.expense),
    savings: toInput(targets.savings),
  });
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const parsed: BudgetTargetValues = {
    income: fromInput(values.income),
    expense: fromInput(values.expense),
    savings: fromInput(values.savings),
  };
  // Same rule as the backend: >= 0, at most 2 decimals
  const invalid = (field: Field) => {
    const value = parsed[field];
    return value !== null && !isValidTargetAmount(value);
  };
  const hasErrors = FIELDS.some(({ key }) => invalid(key));
  const unchanged = FIELDS.every(({ key }) => parsed[key] === targets[key]);

  const handleSave = async () => {
    setSaving(true);
    const saved = await onSave(parsed);
    setSaving(false);
    if (saved) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-xl ${showHistory ? "max-w-3xl" : "max-w-lg"} border border-muted/30 bg-background p-6 shadow-2xl`}
      >
        <h2 className="mb-4 text-lg font-semibold">
          {t("dashboard.budget.targets.title", {
            month: formatMonth(month, i18n.language),
          })}
        </h2>

        <div className="flex flex-wrap items-start gap-4">
          {FIELDS.map(({ key, id }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <Label htmlFor={id} className="text-xs text-muted-foreground">
                {t(`dashboard.budget.targets.${key}`)}
              </Label>
              <Input
                id={id}
                type="number"
                min={0}
                step="0.01"
                value={values[key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [key]: e.target.value }))
                }
                onKeyDown={(e) =>
                  (e.key === "e" || e.key === "E") && e.preventDefault()
                }
                aria-invalid={invalid(key)}
                aria-describedby={invalid(key) ? `${id}-error` : undefined}
                className="w-32"
              />
              {invalid(key) && (
                <p id={`${id}-error`} className="w-32 text-xs text-destructive">
                  {t("dashboard.budget.targets.invalid")}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("dashboard.budget.targets.emptyHint")}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="link"
            size="sm"
            onClick={() => setShowHistory((prev) => !prev)}
            className="cursor-pointer gap-1.5 px-0"
          >
            <History size={14} />
            {showHistory
              ? t("dashboard.budget.targets.hideHistory")
              : t("dashboard.budget.targets.showHistory")}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="cursor-pointer"
            >
              {t("dashboard.budget.targets.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || hasErrors || unchanged}
              className="cursor-pointer"
            >
              {saving
                ? t("dashboard.budget.targets.saving")
                : t("dashboard.budget.targets.save")}
            </Button>
          </div>
        </div>

        {showHistory && (
          <div className="mt-4 border-t pt-4">
            <TargetHistory />
          </div>
        )}
      </div>
    </div>
  );
}
