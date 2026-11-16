import { deleteAccount, resetUserData } from "@/api/user";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { refreshUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type Kind = "reset" | "delete";

// Translation keys: dashboard.profile.resetPanel / deletePanel. Literal types,
// so the typed t() checks that every key exists in both panels
const PANEL = {
  reset: "dashboard.profile.resetPanel",
  delete: "dashboard.profile.deletePanel",
} as const;

/**
 * Reset Data / Delete Account: the warning, a red button and a confirmation
 * dialog that asks for the password before anything is deleted.
 */
export default function DangerActionPanel({ kind }: { kind: Kind }) {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const key = PANEL[kind];

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function changeOpen(next: boolean) {
    if (saving) return;
    setOpen(next);
    // Never keep the password once the dialog is closed
    if (!next) {
      setPassword("");
      setError(null);
    }
  }

  async function confirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    if (!password) {
      setError(t("dashboard.profile.danger.passwordRequired"));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res =
        kind === "reset"
          ? await resetUserData(password)
          : await deleteAccount(password);

      if (!res.ok) {
        setError(
          res.data?.message === "Password is incorrect"
            ? t("dashboard.profile.danger.passwordIncorrect")
            : t(`${key}.failed`),
        );
        return;
      }

      setOpen(false);
      setPassword("");

      if (kind === "delete") {
        // The cookies are cleared by the backend; the user is gone
        setUser(null);
        toast.success(t(`${key}.success`));
        navigate("/", { replace: true });
        return;
      }

      // The other pages fetch their data again when opened
      refreshUnreadNotifications();
      toast.success(t(`${key}.success`));
    } catch {
      setError(t(`${key}.failed`));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {t(`${key}.textBefore`)}
        <span className="font-medium text-foreground">
          {t(`${key}.textHighlight`)}
        </span>
        {t(`${key}.textAfter`)}
      </p>

      <AlertDialog open={open} onOpenChange={changeOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer border-finance-danger/40 text-finance-danger hover:border-finance-danger/60 hover:bg-finance-danger-bg hover:text-finance-danger"
          >
            {t(`${key}.button`)}
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <form onSubmit={confirm} noValidate className="grid gap-4">
            <AlertDialogHeader>
              <AlertDialogTitle>{t(`${key}.title`)}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(`${key}.description`)}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor={`${kind}-password`} className="text-xs">
                {t("dashboard.profile.danger.passwordLabel")}
              </Label>
              <PasswordInput
                id={`${kind}-password`}
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                disabled={saving}
                aria-invalid={!!error}
                aria-describedby={error ? `${kind}-password-error` : undefined}
              />
              {error && (
                <p
                  id={`${kind}-password-error`}
                  role="alert"
                  className="text-xs text-finance-danger"
                >
                  {error}
                </p>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={saving}>
                {t(`${key}.cancel`)}
              </AlertDialogCancel>
              {/* A plain submit button: AlertDialogAction would close the
                  dialog before the request finishes */}
              <Button
                type="submit"
                disabled={saving || !password}
                className="cursor-pointer border-0 bg-finance-danger text-white hover:bg-finance-danger/90"
              >
                {saving && <Spinner />}
                {t(`${key}.confirm`)}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
