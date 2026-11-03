import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Bell,
  ChevronsUpDown,
  CreditCard,
  Crown,
  HelpCircle,
  Languages,
  LogOut,
  Moon,
  Settings,
  Sun,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import UserAvatar from "@/components/dashboard/shared/UserAvatar";
import { logoutUser } from "@/api/user";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useChangeLanguage } from "@/hooks/useChangeLanguage";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";

const PLANS = ["free", "pro", "business"] as const;
type Plan = (typeof PLANS)[number];
const isPlan = (value: unknown): value is Plan =>
  PLANS.includes(value as Plan);

interface SidebarUserMenuProps {
  /** false = collapsed sidebar: only the avatar, with a tooltip */
  showLabels: boolean;
  /** Rendered in the mobile drawer: the menu opens upward, as wide as the drawer */
  mobile?: boolean;
  /** Called after a link is chosen (closes the mobile drawer) */
  onNavigate?: () => void;
}

export default function SidebarUserMenu({
  showLabels,
  mobile = false,
  onNavigate,
}: SidebarUserMenuProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const changeLanguage = useChangeLanguage();

  const name = user?.username || t("dashboard.profileBadge.defaultName");

  const plan = user?.plan_type?.toLowerCase();
  const planLabel = isPlan(plan)
    ? t(`dashboard.profileBadge.plans.${plan}`)
    : (user?.plan_type ?? t("dashboard.profileBadge.plans.free"));

  function close() {
    setOpen(false);
    onNavigate?.();
  }

  async function handleLogout() {
    try {
      const res = await logoutUser();

      if (!res.ok) {
        toast.error(t("dashboard.profileBadge.logoutError"));
        return;
      }
      close();
      setUser(null); // curata userul din context, altfel ramai "logat" in frontend
      navigate("/login", { replace: true });
    } catch {
      toast.error(t("dashboard.profileBadge.logoutError"));
    }
  }

  const trigger = (
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label={t("dashboard.profileBadge.openMenu")}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-finance-warning/40 data-[state=open]:bg-card",
          !showLabels && "justify-center p-1.5",
        )}
      >
        <UserAvatar className="h-9 w-9 shrink-0" />
        {showLabels && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </button>
    </PopoverTrigger>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {showLabels ? (
        trigger
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {name}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Desktop: to the right of the sidebar, aligned to the bottom of the avatar.
          Mobile drawer: above the avatar, exactly as wide as the drawer (w-64);
          alignOffset -12 cancels the p-3 around the row */}
      <PopoverContent
        side={mobile ? "top" : "right"}
        align={mobile ? "start" : "end"}
        alignOffset={mobile ? -12 : 0}
        sideOffset={12}
        className={cn(
          "max-w-[calc(100vw-2rem)] p-0",
          mobile ? "w-64" : "w-72",
        )}
      >
        {/* ===== HEADER ===== */}
        <div className="flex items-center gap-2.5 p-3">
          <UserAvatar className="h-9 w-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{name}</h3>
            <p className="truncate text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>

        <Separator />

        {/* ===== PREFERINTE ===== */}
        <div className="space-y-1 p-2">
          <h4 className="flex items-center gap-2 px-2 py-1 text-sm font-semibold">
            <Settings className="h-4 w-4" />
            {t("dashboard.profileBadge.settings")}
          </h4>

          <div className="flex items-center justify-between rounded-lg px-2 py-2">
            <div className="flex items-center gap-2">
              {dark ? (
                <Moon className="h-4 w-4 text-primary" />
              ) : (
                <Sun className="h-4 w-4 text-primary" />
              )}
              <Label htmlFor="dark-mode" className="cursor-pointer font-normal">
                {t("dashboard.profileBadge.darkMode")}
              </Label>
            </div>
            <Switch id="dark-mode" checked={dark} onCheckedChange={toggleTheme} />
          </div>

          <div className="flex items-center justify-between rounded-lg px-2 py-2">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-primary" />
              <span id="language-label" className="text-sm">
                {t("language.label")}
              </span>
            </div>
            <div
              role="group"
              aria-labelledby="language-label"
              className="flex rounded-full bg-muted p-0.5"
            >
              {SUPPORTED_LANGUAGES.map((lng) => {
                const active = i18n.resolvedLanguage === lng;

                return (
                  <button
                    key={lng}
                    type="button"
                    aria-pressed={active}
                    aria-label={t(`language.${lng}`)}
                    onClick={() => changeLanguage(lng)}
                    className={cn(
                      "cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {lng}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-2 py-2 transition-colors hover:bg-muted">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <Label htmlFor="notifications" className="cursor-pointer font-normal">
                {t("dashboard.profileBadge.notifications")}
              </Label>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
        </div>

        <Separator />

        {/* ===== PLAN ===== */}
        <div className="p-2">
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-linear-to-r from-primary/10 to-primary/5 gap-2 p-2.5">
            <div className="flex items-start gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {t("dashboard.profileBadge.currentPlan")}
                </p>
                <p className="text-xs text-muted-foreground">{planLabel}</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/dashboard/upgrade-plans" onClick={close}>
                <CreditCard className="mr-1 h-3 w-3" />
                {t("dashboard.profileBadge.upgrade")}
              </Link>
            </Button>
          </div>
        </div>

        <Separator />

        {/* ===== LINK-URI ===== */}
        <div className="p-2">
          {[
            { to: "/dashboard/profile", icon: User, label: t("dashboard.profileBadge.viewProfile") },
            { to: "/dashboard/settings", icon: Settings, label: t("dashboard.profileBadge.allSettings") },
            { to: "/help", icon: HelpCircle, label: t("dashboard.profileBadge.help") },
          ].map(({ to, icon: Icon, label }) => (
            <Button
              key={to}
              asChild
              variant="ghost"
              className="w-full justify-start gap-3 hover:bg-muted"
            >
              <Link to={to} onClick={close}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </Button>
          ))}

          <Separator className="my-2" />

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {t("dashboard.profileBadge.logout")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
