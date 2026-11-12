import UserAvatar from "@/components/dashboard/shared/UserAvatar";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  ShieldCheck,
  Star,
  Trash2,
  UserRoundCog,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { logoutUser, getUserInfo, updatePassword } from "@/api/user";
import { isValidPassword } from "@/lib/password";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/context/AuthContext";

const PLANS = ["free", "pro", "business"] as const;
type Plan = (typeof PLANS)[number];
const isPlan = (value: unknown): value is Plan => PLANS.includes(value as Plan);

type ActionId = "plan" | "email" | "password" | "reset" | "delete" | null;

const actions = [
  {
    id: "plan",
    // Label and description: dashboard.profile.actions.<key>
    key: "plan",
    icon: Star,
    danger: false,
    // No payments yet (Stripe postponed)
    comingSoon: true,
  },
  {
    id: "email",
    // Label and description: dashboard.profile.actions.<key>
    key: "email",
    icon: Mail,
    danger: false,
    // No backend route yet: shown greyed out with a "Coming soon" badge
    comingSoon: true,
  },
  {
    id: "password",
    // Label and description: dashboard.profile.actions.<key>
    key: "password",
    icon: Lock,
    danger: false,
  },
  {
    id: "reset",
    // Label and description: dashboard.profile.actions.<key>
    key: "reset",
    icon: RefreshCw,
    danger: true,
    comingSoon: true,
  },
  {
    id: "delete",
    // Label and description: dashboard.profile.actions.<key>
    key: "delete",
    icon: Trash2,
    danger: true,
    comingSoon: true,
  },
] as const;

interface profileBtnProps extends ComponentProps<typeof Button> {
  label: string;
}

function ProfileBtn({ label, ...props }: profileBtnProps) {
  return (
    <Button
      size="sm"
      className="bg-finance-success hover:bg-finance-success/90 text-white font-semibold cursor-pointer"
      {...props}
    >
      {label}
    </Button>
  );
}

function formatMemberSince(createdAt?: string, locale?: string) {
  if (!createdAt) return "—";
  return new Date(createdAt).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const [openSection, setOpenSection] = useState<ActionId>(null);
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggle = (id: ActionId) =>
    setOpenSection((prev) => (prev === id ? null : id));

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await getUserInfo();
        if (active && res.ok) {
          setUser(res.data.user ?? null);
        }
      } catch {
        // daca cererea esueaza, ramane userul din context
      }
    })();

    return () => {
      active = false;
    };
  }, [setUser]);

  async function handleLogout() {
    try {
      const res = await logoutUser();
      if (!res.ok) return;
      setUser(null);
      navigate("/login", { replace: true });
    } catch {
      // eroare de retea: userul ramane logat
    }
  }

  if (loading) {
    return (
      <section className="relative py-4 px-4 max-w-7xl mx-auto">
        <div className="mx-auto p-10 max-w-4xl text-center text-sm text-muted-foreground">
          {t("dashboard.profile.loading")}
        </div>
      </section>
    );
  }

  if (!user) {
    return null;
  }

  const plan = user.plan_type?.toLowerCase();
  const planLabel = isPlan(plan)
    ? t(`dashboard.profileBadge.plans.${plan}`)
    : (user.plan_type ?? t("dashboard.profileBadge.plans.free"));

  return (
    <section className="relative py-4 px-4 max-w-7xl mx-auto">
      <div className="mx-auto p-3 md:p-10 max-w-4xl border border-border rounded-2xl bg-background shadow-sm flex flex-col gap-4">
        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <UserAvatar className="h-16 w-16 shadow-sm" />
              <span className="absolute bottom-2 right-3 bg-card border border-border rounded-full p-0.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-finance-success" />
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {user.username || user.email.split("@")[0]}
              </p>
              <Badge
                variant="outline"
                className="border-finance-warning/40 text-finance-warning bg-finance-warning-bg text-xs mt-1"
              >
                ⭐ {t("dashboard.profile.planBadge", { plan: planLabel })}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground cursor-pointer hover:text-finance-danger hover:bg-finance-danger-bg"
            onClick={handleLogout}
            aria-label={t("dashboard.profile.logout")}
            title={t("dashboard.profile.logout")}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* ── Account Info ── */}
        <Card className="bg-card border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex gap-1 items-center">
              <UserRoundCog size={14} className="shrink" />{" "}
              {t("dashboard.profile.accountInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: t("dashboard.profile.fields.email"), value: user.email },
              {
                label: t("dashboard.profile.fields.plan"),
                value: planLabel,
                highlight: true,
              },
              {
                label: t("dashboard.profile.fields.memberSince"),
                value: formatMemberSince(user.created_at, i18n.language),
              },
              {
                label: t("dashboard.profile.fields.currency"),
                value: user.currency || "—",
              },
            ].map(({ label, value, highlight }, i, arr) => (
              <div key={label}>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm">{label}</span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      highlight ? "text-finance-warning" : "text-foreground",
                    )}
                  >
                    {value}
                  </span>
                </div>
                {i < arr.length - 1 && <Separator className="bg-border" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Settings ── */}
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex gap-1 items-center">
            <Settings size={14} className="shrink" />{" "}
            {t("dashboard.profile.settings")}
          </p>
          <div className="space-y-2">
            {/* Currency, language, theme and categories live on the settings page */}
            <Link
              to="/dashboard/settings"
              className="w-full flex items-center justify-between px-2 py-3 rounded-xl border text-left bg-card border-border hover:border-finance-warning/60 hover:bg-finance-warning-bg/50"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-background text-muted-foreground">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("dashboard.profile.preferencesLink.label")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("dashboard.profile.preferencesLink.description")}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            {actions.map(({ id, key, icon: Icon, danger, ...action }) =>
              "comingSoon" in action && action.comingSoon ? (
                // Not clickable yet; the panel code below stays for later
                <div
                  key={id}
                  aria-disabled="true"
                  className="w-full flex items-center justify-between px-2 py-3 rounded-xl border border-border bg-card text-left opacity-60 cursor-not-allowed select-none"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t(`dashboard.profile.actions.${key}.label`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`dashboard.profile.actions.${key}.description`)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {t("dashboard.profile.comingSoon")}
                  </Badge>
                </div>
              ) : (
                <Collapsible
                  key={id}
                  open={openSection === id}
                  onOpenChange={() => toggle(id as ActionId)}
                >
                  <CollapsibleTrigger asChild className="cursor-pointer">
                    <button
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-3 rounded-xl border text-left",
                        "bg-card border-border",
                        danger
                          ? "hover:border-finance-danger/50 hover:bg-finance-danger-bg"
                          : "hover:border-finance-warning/60 hover:bg-finance-warning-bg/50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            danger
                              ? "bg-finance-danger-bg text-finance-danger"
                              : "bg-background text-muted-foreground",
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p
                            className={cn(
                              "text-sm font-medium",
                              danger
                                ? "text-finance-danger"
                                : "text-foreground",
                            )}
                          >
                            {t(`dashboard.profile.actions.${key}.label`)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t(`dashboard.profile.actions.${key}.description`)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform duration-200",
                          openSection === id && "rotate-90",
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-1 ml-4 border-l-2 border-border pl-4 py-3 pr-2">
                      <ActionPanel id={id as ActionId} user={user} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ),
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-2">
          {t("dashboard.profile.version", { version: "2.1.0" })}
        </p>
      </div>
    </section>
  );
}

function ActionPanel({ id, user }: { id: ActionId; user: User }) {
  const { t } = useTranslation();

  if (id === "plan")
    return (
      <div className="grid grid-cols-3 gap-2">
        {PLANS.map((p) => (
          <button
            key={p}
            className={cn(
              "py-2 px-3 rounded-lg border text-sm font-medium",
              p === user.plan_type?.toLowerCase()
                ? "border-finance-warning bg-finance-warning-bg text-finance-warning"
                : "border-border bg-card text-foreground hover:border-muted-foreground/30 hover:bg-muted/50",
            )}
          >
            {t(`dashboard.profileBadge.plans.${p}`)}
          </button>
        ))}
      </div>
    );

  if (id === "email")
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">
            {t("dashboard.profile.emailPanel.newEmail")}
          </Label>
          <Input type="email" placeholder={user.email} />
        </div>
        <ProfileBtn label={t("dashboard.profile.emailPanel.submit")} />
      </div>
    );

  if (id === "password") return <ChangePasswordPanel />;

  if (id === "reset")
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {t("dashboard.profile.resetPanel.textBefore")}
          <span className="text-foreground font-medium">
            {t("dashboard.profile.resetPanel.textHighlight")}
          </span>
          {t("dashboard.profile.resetPanel.textAfter")}
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="border-finance-danger/40 text-finance-danger hover:bg-finance-danger-bg hover:text-finance-danger hover:border-finance-danger/60"
            >
              {t("dashboard.profile.resetPanel.button")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("dashboard.profile.resetPanel.title")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("dashboard.profile.resetPanel.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("dashboard.profile.resetPanel.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                className="bg-finance-danger hover:bg-finance-danger/90 text-white border-0"
              >
                {t("dashboard.profile.resetPanel.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );

  if (id === "delete")
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {t("dashboard.profile.deletePanel.textBefore")}
          <span className="text-foreground font-medium">
            {t("dashboard.profile.deletePanel.textHighlight")}
          </span>
          {t("dashboard.profile.deletePanel.textAfter")}
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="border-finance-danger/40 text-finance-danger hover:bg-finance-danger-bg hover:text-finance-danger hover:border-finance-danger/60"
            >
              {t("dashboard.profile.deletePanel.button")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("dashboard.profile.deletePanel.title")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("dashboard.profile.deletePanel.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("dashboard.profile.deletePanel.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                className="bg-finance-danger hover:bg-finance-danger/90 text-white border-0"
              >
                {t("dashboard.profile.deletePanel.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );

  return null;
}

type PasswordError =
  "required" | "length" | "mismatch" | "same" | "currentIncorrect" | "failed";

const EMPTY_PASSWORDS = { current: "", next: "", confirm: "" };

function ChangePasswordPanel() {
  const { t } = useTranslation();
  const [values, setValues] = useState(EMPTY_PASSWORDS);
  const [error, setError] = useState<PasswordError | null>(null);
  // Message from the backend for errors without a translation (e.g. rate limit)
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const change = (field: keyof typeof EMPTY_PASSWORDS, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setServerMessage(null);
  };

  // Same rules as the backend, checked first so most mistakes need no request
  function validate(): PasswordError | null {
    if (!values.current || !values.next || !values.confirm) return "required";
    if (!isValidPassword(values.next)) return "length";
    if (values.next !== values.confirm) return "mismatch";
    if (values.next === values.current) return "same";
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }

    setSaving(true);
    try {
      const res = await updatePassword(values.current, values.next);
      if (res.ok) {
        toast.success(t("dashboard.profile.passwordPanel.success"));
        setValues(EMPTY_PASSWORDS);
        return;
      }
      const message = res.data?.message;
      if (message === "Current password is incorrect") {
        setError("currentIncorrect");
      } else {
        setError("failed");
        // 5xx only says "Server error", which does not help the user
        if (res.status < 500 && message) setServerMessage(message);
      }
    } catch {
      setError("failed");
    } finally {
      setSaving(false);
    }
  }

  // Which field the error belongs to, for aria-invalid
  const invalidCurrent = error === "currentIncorrect";
  const invalidNext = error === "length" || error === "same";
  const invalidConfirm = error === "mismatch";

  return (
    <form className="space-y-3" onSubmit={handleSubmit} noValidate>
      <div className="space-y-1">
        <Label
          htmlFor="current-password"
          className="text-muted-foreground text-xs"
        >
          {t("dashboard.profile.passwordPanel.current")}
        </Label>
        <PasswordInput
          id="current-password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={values.current}
          onChange={(e) => change("current", e.target.value)}
          aria-invalid={invalidCurrent}
          aria-describedby={error ? "password-panel-error" : undefined}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="new-password" className="text-muted-foreground text-xs">
          {t("dashboard.profile.passwordPanel.new")}
        </Label>
        <PasswordInput
          id="new-password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={values.next}
          onChange={(e) => change("next", e.target.value)}
          aria-invalid={invalidNext}
          aria-describedby={error ? "password-panel-error" : undefined}
        />
      </div>
      <div className="space-y-1">
        <Label
          htmlFor="confirm-new-password"
          className="text-muted-foreground text-xs"
        >
          {t("dashboard.profile.passwordPanel.confirm")}
        </Label>
        <PasswordInput
          id="confirm-new-password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={values.confirm}
          onChange={(e) => change("confirm", e.target.value)}
          aria-invalid={invalidConfirm}
          aria-describedby={error ? "password-panel-error" : undefined}
        />
      </div>
      {error && (
        <p
          id="password-panel-error"
          role="alert"
          className="text-xs text-finance-danger"
        >
          {serverMessage ?? t(`dashboard.profile.passwordPanel.${error}`)}
        </p>
      )}
      <ProfileBtn
        type="submit"
        disabled={saving}
        label={
          saving
            ? t("dashboard.profile.passwordPanel.submitting")
            : t("dashboard.profile.passwordPanel.submit")
        }
      />
    </form>
  );
}
