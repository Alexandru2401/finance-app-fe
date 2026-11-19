import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TargetHistory from "@/components/dashboard/budget/TargetHistory";
import { ResponsiveSheet } from "@/components/dashboard/shared/ResponsiveSheet";
import type { BudgetTargetValues } from "@/api/budget";
import { formatMonth } from "@/lib/periods";
import { isValidTargetAmount } from "@/lib/validation";
import { History } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface TargetsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: BudgetTargetValues;
  // YYYY-MM-01, the month the targets apply to
  month: string;
  // Resolves to false if the save failed, so the panel stays open
  onSave: (t: BudgetTargetValues) => Promise<boolean>;
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

/**
 * Targets of the month (+ the history): bottom drawer on mobile, side sheet
 * from md (ResponsiveSheet). Stays mounted, so it can animate in and out.
 */
export default function TargetsPanel({
  open,
  onOpenChange,
  targets,
  month,
  onSave,
}: TargetsPanelProps) {
  const { t, i18n } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("dashboard.budget.targets.title", {
        month: formatMonth(month, i18n.language),
      })}
      description={t("dashboard.budget.targets.emptyHint")}
      // Wider on desktop while the history table is shown
      className={showHistory ? "sm:max-w-3xl" : "sm:max-w-lg"}
    >
      {/* Remounted on every open: the fields start from the saved targets,
          not from what was typed and cancelled last time */}
      <TargetsForm
        key={String(open)}
        targets={targets}
        onSave={onSave}
        onClose={() => onOpenChange(false)}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory((prev) => !prev)}
      />
    </ResponsiveSheet>
  );
}

function TargetsForm({
  targets,
  onSave,
  onClose,
  showHistory,
  onToggleHistory,
}: {
  targets: BudgetTargetValues;
  onSave: (t: BudgetTargetValues) => Promise<boolean>;
  onClose: () => void;
  showHistory: boolean;
  onToggleHistory: () => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState({
    income: toInput(targets.income),
    expense: toInput(targets.expense),
    savings: toInput(targets.savings),
  });
  const [saving, setSaving] = useState(false);

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
    <>
      {/* One field per row on phones, three side by side from sm */}
      <div className="grid gap-4 sm:grid-cols-3">
        {FIELDS.map(({ key, id }) => (
          <div key={key} className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor={id} className="text-xs text-muted-foreground">
              {t(`dashboard.budget.targets.${key}`)}
            </Label>
            <Input
              id={id}
              type="number"
              inputMode="decimal"
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
              className="w-full"
            />
            {invalid(key) && (
              <p id={`${id}-error`} className="text-xs text-destructive">
                {t("dashboard.budget.targets.invalid")}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="link"
          size="sm"
          onClick={onToggleHistory}
          className="cursor-pointer gap-1.5 px-0"
        >
          <History size={14} />
          {showHistory
            ? t("dashboard.budget.targets.hideHistory")
            : t("dashboard.budget.targets.showHistory")}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="cursor-pointer">
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
    </>
  );
}
