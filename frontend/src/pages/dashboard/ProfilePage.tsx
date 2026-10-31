import ProfileBadge from "@/components/dashboard/budget/ProfileBadge";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Coins,
  Lock,
  LogOut,
  Mail,
  PlusCircle,
  RefreshCw,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  UserRoundCog
} from "lucide-react";
import { useEffect, useState, type ComponentProps } from "react";
import { useNavigate } from "react-router-dom";

import { logoutUser, getUserInfo, addUserInfo } from "@/api/user";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/context/AuthContext";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  isCurrency,
  type Currency,
} from "@/lib/format";
import { toast } from "sonner";

type ActionId =
  | "currency"
  | "plan"
  | "email"
  | "password"
  | "add-account"
  | "reset"
  | "delete"
  | null;

const actions = [
  {
    id: "currency",
    label: "Change Currency",
    icon: Coins,
    danger: false,
    description: "Update your preferred display currency",
  },
  {
    id: "plan",
    label: "Change Plan",
    icon: Star,
    danger: false,
    description: "Upgrade or downgrade your subscription",
  },
  {
    id: "email",
    label: "Change Email",
    icon: Mail,
    danger: false,
    description: "Update your login email address",
  },
  {
    id: "password",
    label: "Change Password",
    icon: Lock,
    danger: false,
    description: "Keep your account secure",
  },
  {
    id: "add-account",
    label: "Add an Account",
    icon: PlusCircle,
    danger: false,
    description: "Link a new bank or wallet account",
  },
  {
    id: "reset",
    label: "Reset Data",
    icon: RefreshCw,
    danger: true,
    description: "Permanently delete all your transactions",
  },
  {
    id: "delete",
    label: "Delete Account",
    icon: Trash2,
    danger: true,
    description: "Permanently remove your account",
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

function formatMemberSince(createdAt?: string) {
  if (!createdAt) return "—";
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const [openSection, setOpenSection] = useState<ActionId>(null);
  const { user, setUser, loading } = useAuth();
  const navigate = useNavigate();

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
      } catch (err) {
        console.log(err);
      }
    })();

    return () => {
      active = false;
    };
  }, [setUser]);

  async function handleLogout() {
    try {
      const res = await logoutUser();
      if (!res.ok) {
        console.error("Logout failed:", res.data?.message);
        return;
      }
      setUser(null);
      navigate("/login", { replace: true });
    } catch (err) {
      console.log(err);
    }
  }

  if (loading) {
    return (
      <section className="relative py-4 px-4 max-w-7xl mx-auto">
        <div className="mx-auto p-10 max-w-4xl text-center text-sm text-muted-foreground">
          Loading profile...
        </div>
      </section>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="relative py-4 px-4 max-w-7xl mx-auto">
      <div className="mx-auto p-3 md:p-10 max-w-4xl border border-border rounded-2xl bg-background shadow-sm flex flex-col gap-4">
        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full shadow-sm">
                <ProfileBadge />
              </div>
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
                ⭐ {user.plan_type ? user.plan_type : "Basic"} Plan
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground cursor-pointer hover:text-finance-danger hover:bg-finance-danger-bg"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* ── Account Info ── */}
        <Card className="bg-card border-border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground flex gap-1 items-center">
              <UserRoundCog size={14} className="shrink" /> Account Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Email", value: user.email },
              { label: "Current Plan", value: user.plan_type ? user.plan_type : "Basic", highlight: true },
              { label: "Member Since", value: formatMemberSince(user.created_at) },
              { label: "Currency", value: user.currency || "—" },
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
            <Settings size={14} className="shrink" />  Settings
          </p>
          <div className="space-y-2">
            {actions.map(({ id, label, description, icon: Icon, danger }) => (
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
                            danger ? "text-finance-danger" : "text-foreground",
                          )}
                        >
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground">{description}</p>
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
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-2">
          Budget Tracker · v2.1.0
        </p>
      </div>
    </section>
  );
}

function ActionPanel({ id, user }: { id: ActionId; user: User }) {
  if (id === "currency") return <CurrencyPanel user={user} />;

  if (id === "plan")
    return (
      <div className="grid grid-cols-3 gap-2">
        {["Free", "Pro", "Business"].map((p) => (
          <button
            key={p}
            className={cn(
              "py-2 px-3 rounded-lg border text-sm font-medium",
              p.toLowerCase() === user.plan_type?.toLowerCase()
                ? "border-finance-warning bg-finance-warning-bg text-finance-warning"
                : "border-border bg-card text-foreground hover:border-muted-foreground/30 hover:bg-muted/50",
            )}
          >
            {p}
          </button>
        ))}
      </div>
    );

  if (id === "email")
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">New Email Address</Label>
          <Input type="email" placeholder={user.email} />
        </div>
        <ProfileBtn label="Update mail" />
      </div>
    );

  if (id === "password")
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Current Password</Label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">New Password</Label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Confirm New Password</Label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <ProfileBtn label="Change Password" />
      </div>
    );

  if (id === "add-account")
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Account Name</Label>
          <Input placeholder="e.g. Savings, Revolut, ING" />
        </div>
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">
            Initial Balance (optional)
          </Label>
          <Input type="number" placeholder="0.00" />
        </div>
        <ProfileBtn label="Add Account" />
      </div>
    );

  if (id === "reset")
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          This will permanently delete{" "}
          <span className="text-foreground font-medium">
            all your transactions, budgets, and categories
          </span>
          . Your account will remain active.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="border-finance-danger/40 text-finance-danger hover:bg-finance-danger-bg hover:text-finance-danger hover:border-finance-danger/60"
            >
              Reset All Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset all data?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All your transactions, budgets and
                categories will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" className="bg-finance-danger hover:bg-finance-danger/90 text-white border-0">
                Yes, Reset Everything
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
          Your account and{" "}
          <span className="text-foreground font-medium">all associated data</span>{" "}
          will be permanently removed. This cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="border-finance-danger/40 text-finance-danger hover:bg-finance-danger-bg hover:text-finance-danger hover:border-finance-danger/60"
            >
              Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This is permanent. Your profile, data and subscription will be
                immediately and irreversibly deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" className="bg-finance-danger hover:bg-finance-danger/90 text-white border-0">
                Yes, Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );

  return null;
}
function CurrencyPanel({ user }: { user: User }) {
  const { setUser } = useAuth();
  const current = isCurrency(user.currency) ? user.currency : null;
  const [currency, setCurrency] = useState<Currency>(current ?? DEFAULT_CURRENCY);
  const [saving, setSaving] = useState(false);
  // The backend converts the saved amounts only when a currency was already set
  const converts = current !== null && currency !== current;

  async function saveCurrency() {
    setSaving(true);
    try {
      // The backend requires the username too, so the displayed one is sent
      const res = await addUserInfo(
        user.username || user.email.split("@")[0],
        currency,
      );
      if (!res.ok || !res.data?.user) {
        // 503 = BNR rate unavailable, nothing was saved
        toast.error(
          res.status === 503
            ? "Could not change the currency, try again later."
            : (res.data?.error ?? "Could not change the currency."),
        );
        return;
      }
      // The response only has user_id, username and currency. The other pages
      // fetch their data on mount, so they show the converted amounts
      setUser({ ...user, ...res.data.user });
      toast.success(`Currency changed to ${currency}.`);
    } catch {
      toast.error("Could not change the currency.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-muted-foreground text-xs">Select Currency</Label>
      <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
        <SelectTrigger className="cursor-pointer">
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
            <ProfileBtn label="Save currency" disabled={saving} />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change currency to {currency}?</AlertDialogTitle>
              <AlertDialogDescription>
                All your amounts (transactions and targets) will be converted
                from {current} to {currency} at today's BNR exchange rate.
                Because of rounding, converting back later may not give the
                exact original amounts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={saveCurrency}>Convert</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <ProfileBtn
          label={saving ? "Saving..." : "Save currency"}
          disabled={saving || currency === current}
          onClick={saveCurrency}
        />
      )}
    </div>
  );
}
