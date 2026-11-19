import { addUserInfo } from "@/api/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { USERNAME_MAX, USERNAME_MIN } from "@/lib/validation";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/** Profile → Change name: PATCH /auth/user-info { username }. */
export default function ChangeNamePanel() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.username ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clean = name.trim();
  const unchanged = clean === (user?.username ?? "");

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !user || unchanged) return;

    // Same rule as the backend (2-150 characters after trim)
    if (clean.length < USERNAME_MIN || clean.length > USERNAME_MAX) {
      setError(
        t("dashboard.profile.namePanel.length", {
          min: USERNAME_MIN,
          max: USERNAME_MAX,
        }),
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await addUserInfo({ username: clean });
      if (!res.ok || !res.data?.user) {
        setError(t("dashboard.profile.namePanel.failed"));
        return;
      }
      // The response has only some fields of the user
      setUser({ ...user, ...res.data.user });
      setName(res.data.user.username ?? clean);
      toast.success(t("dashboard.profile.namePanel.success"));
    } catch {
      setError(t("dashboard.profile.namePanel.failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={save} noValidate>
      <div className="space-y-1">
        <Label htmlFor="profile-name" className="text-xs text-muted-foreground">
          {t("dashboard.profile.namePanel.label")}
        </Label>
        <Input
          id="profile-name"
          value={name}
          maxLength={USERNAME_MAX}
          autoComplete="nickname"
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          disabled={saving}
          aria-invalid={!!error}
          aria-describedby={error ? "profile-name-error" : undefined}
        />
      </div>
      {error && (
        <p
          id="profile-name-error"
          role="alert"
          className="text-xs text-finance-danger"
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        size="sm"
        disabled={saving || unchanged || clean === ""}
        className="cursor-pointer bg-finance-success font-semibold text-finance-foreground hover:bg-finance-success/90"
      >
        {saving && <Spinner />}
        {saving
          ? t("dashboard.profile.namePanel.saving")
          : t("dashboard.profile.namePanel.submit")}
      </Button>
    </form>
  );
}
