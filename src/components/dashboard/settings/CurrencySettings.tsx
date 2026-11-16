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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addUserInfo } from "@/api/user";
import type { User } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  isCurrency,
  type Currency,
} from "@/lib/format";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

// Moved from the profile page; changing the currency converts all saved
// amounts on the backend at the BNR rate
export default function CurrencySettings({ user }: { user: User }) {
  const { setUser } = useAuth();
  const { t } = useTranslation();
  const current = isCurrency(user.currency) ? user.currency : null;
  const [currency, setCurrency] = useState<Currency>(
    current ?? DEFAULT_CURRENCY,
  );
  const [saving, setSaving] = useState(false);
  // Any other currency converts the saved amounts on the backend
  const converts = current !== null && currency !== current;

  async function saveCurrency() {
    setSaving(true);
    try {
      const res = await addUserInfo({ currency });
      if (!res.ok || !res.data?.user) {
        // 503 = BNR rate unavailable, nothing was saved
        toast.error(
          res.status === 503
            ? t("dashboard.settings.currency.unavailable")
            : (res.data?.message ?? t("dashboard.settings.currency.error")),
        );
        return;
      }
      // The response only has user_id, username, currency and language. The
      // other pages fetch their data on mount, so they show the converted amounts
      setUser({ ...user, ...res.data.user });
      toast.success(t("dashboard.settings.currency.success", { currency }));
    } catch {
      toast.error(t("dashboard.settings.currency.error"));
    } finally {
      setSaving(false);
    }
  }

  const saveLabel = saving
    ? t("dashboard.settings.currency.saving")
    : t("dashboard.settings.currency.save");

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={currency}
        onValueChange={(v) => setCurrency(v as Currency)}
      >
        <SelectTrigger
          className="w-full cursor-pointer sm:w-64"
          aria-label={t("dashboard.settings.currency.select")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map(({ value, label }) => (
            <SelectItem key={value} value={value} className="cursor-pointer">
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {converts ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" className="cursor-pointer" disabled={saving}>
              {saveLabel}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("dashboard.settings.currency.confirmTitle", { currency })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("dashboard.settings.currency.confirmDescription", {
                  from: current,
                  to: currency,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("dashboard.settings.currency.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction onClick={saveCurrency}>
                {t("dashboard.settings.currency.convert")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          size="sm"
          className="cursor-pointer"
          // Without the saved currency there is no way to tell what converts
          disabled={saving || current === null || currency === current}
          onClick={saveCurrency}
        >
          {saveLabel}
        </Button>
      )}
    </div>
  );
}
