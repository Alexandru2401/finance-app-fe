import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePeriodLabel } from "@/hooks/usePeriodLabel";
import {
  ANALYTICS_PRESETS,
  MAX_CUSTOM_MONTHS,
  addMonths,
  currentMonth,
  isCustomPeriod,
  monthsBetween,
} from "@/lib/analytics";
import { CalendarRange } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const CUSTOM = "custom";

interface Props {
  value: string;
  onChange: (period: string) => void;
}

export default function AnalyticsPeriodPicker({ value, onChange }: Props) {
  const { t } = useTranslation();
  const label = usePeriodLabel();
  const custom = isCustomPeriod(value);

  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openCustom() {
    // Starts on the current range, or on the last 3 months
    const [f, tt] = custom
      ? value.split(":")
      : [addMonths(currentMonth(), -2), currentMonth()];
    setFrom(f);
    setTo(tt);
    setError(null);
    setOpen(true);
  }

  function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!from || !to || monthsBetween(from, to) < 0) {
      setError(t("dashboard.analytics.customRange.invalid"));
      return;
    }
    if (monthsBetween(from, to) >= MAX_CUSTOM_MONTHS) {
      setError(t("dashboard.analytics.customRange.tooLong"));
      return;
    }
    onChange(`${from}:${to}`);
    setOpen(false);
  }

  return (
    <>
      <Select
        value={custom ? CUSTOM : value}
        onValueChange={(v) => (v === CUSTOM ? openCustom() : onChange(v))}
      >
        <SelectTrigger
          className="w-52"
          aria-label={t("dashboard.overview.selectPeriod")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ANALYTICS_PRESETS.map((p) => (
            <SelectItem key={p} value={p}>
              {t(`dashboard.periods.${p}`)}
            </SelectItem>
          ))}
          <SelectSeparator />
          {/* While a custom range is active, the item shows it */}
          <SelectItem value={CUSTOM}>
            {custom ? label(value) : t("dashboard.periods.custom")}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Picking the custom item again (to change the range) does not fire
          onValueChange, so the range can also be edited from here */}
      {custom && (
        <Button
          variant="ghost"
          size="icon"
          onClick={openCustom}
          className="cursor-pointer"
          aria-label={t("dashboard.analytics.customRange.title")}
          title={t("dashboard.analytics.customRange.title")}
        >
          <CalendarRange className="size-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("dashboard.analytics.customRange.title")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("dashboard.analytics.customRange.title")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={apply} noValidate className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="range-from">
                  {t("dashboard.analytics.customRange.from")}
                </Label>
                <Input
                  id="range-from"
                  type="month"
                  value={from}
                  max={currentMonth()}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setError(null);
                  }}
                  aria-invalid={!!error}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="range-to">
                  {t("dashboard.analytics.customRange.to")}
                </Label>
                <Input
                  id="range-to"
                  type="month"
                  value={to}
                  max={currentMonth()}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setError(null);
                  }}
                  aria-invalid={!!error}
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="cursor-pointer"
              >
                {t("dashboard.settings.categories.cancel")}
              </Button>
              <Button type="submit" className="cursor-pointer">
                {t("dashboard.analytics.customRange.apply")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
