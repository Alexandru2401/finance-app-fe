import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Moon,
  Sun,
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  User,
  Settings,
  Crown,
  Languages,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";

import { logoutUser } from "@/api/user";
import { useAuth } from "@/hooks/useAuth";
import { useChangeLanguage } from "@/hooks/useChangeLanguage";
import { toast } from "sonner";

const PLANS = ["free", "pro", "business"] as const;
type Plan = (typeof PLANS)[number];
const isPlan = (value: unknown): value is Plan =>
  PLANS.includes(value as Plan);

export default function ProfileBadge() {
  const [openProfile, setOpenProfile] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const { dark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const changeLanguage = useChangeLanguage();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenProfile(false);
      }
    }

    if (openProfile) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openProfile]);

  async function handleLogout() {
    try {
      const res = await logoutUser();

      if (!res.ok) {
        toast.error(t("dashboard.profileBadge.logoutError"));
        return;
      }
      setUser(null); // curata userul din context, altfel ramai "logat" in frontend
      navigate("/login", { replace: true });
    } catch {
      toast.error(t("dashboard.profileBadge.logoutError"));
    }
  }

  const plan = user?.plan_type?.toLowerCase();
  const planLabel = isPlan(plan)
    ? t(`dashboard.profileBadge.plans.${plan}`)
    : (user?.plan_type ?? t("dashboard.profileBadge.plans.free"));

  return (
    <div className="flex justify-end px-2 md:px-5 relative" ref={dropdownRef}>
      <Avatar
        className="cursor-pointer ring-2 ring-offset-2 ring-transparent hover:ring-primary transition-all h-8 w-8 md:w-12 md:h-12"
        onClick={() => setOpenProfile(!openProfile)}
        role="button"
        aria-label={t("dashboard.profileBadge.openMenu")}
      >
        <AvatarImage src="https://github.com/shadcn.png" alt={t("dashboard.profileBadge.avatarAlt")} />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>

      {openProfile && (
        <Card className="absolute top-0 right-0 mt-10 md:mt-16 w-80 shadow-xl border-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="md:pb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 md:w-12 md:h-12">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt={t("dashboard.profileBadge.avatarAlt")}
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-base">
                  {user?.username || t("dashboard.profileBadge.defaultName")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            <div className="p-2 md:p-4 space-y-2 md:space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2 px-3">
                  <Settings className="h-4 w-4" />
                  {t("dashboard.profileBadge.settings")}
                </h4>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  {dark ? (
                    <Moon className="h-4 w-4 text-primary" />
                  ) : (
                    <Sun className="h-4 w-4 text-primary" />
                  )}
                  <Label
                    htmlFor="dark-mode"
                    className="cursor-pointer font-normal"
                  >
                    {t("dashboard.profileBadge.darkMode")}
                  </Label>
                </div>
                <Switch
                  id="dark-mode"
                  checked={dark}
                  onCheckedChange={toggleTheme}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
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

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-primary" />
                  <Label
                    htmlFor="notifications"
                    className="cursor-pointer font-normal"
                  >
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

            <div className="p-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Crown className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">
                      {t("dashboard.profileBadge.currentPlan")}
                    </p>
                    <p className="text-xs text-muted-foreground">{planLabel}</p>
                  </div>
                </div>
                <Link
                  to="/dashboard/upgrade-plans"
                  onClick={() => setOpenProfile(false)}
                >
                  <Button variant="outline" size="sm" className="text-xs">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {t("dashboard.profileBadge.upgrade")}
                  </Button>
                </Link>
              </div>
            </div>

            <Separator />

            <div className="p-2">
              <Link to="/dashboard/profile">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 hover:bg-muted"
                  onClick={() => setOpenProfile(false)}
                >
                  <User className="h-4 w-4" />
                  {t("dashboard.profileBadge.viewProfile")}
                </Button>
              </Link>

              <Link to="/help">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 hover:bg-muted"
                  onClick={() => setOpenProfile(false)}
                >
                  <HelpCircle className="h-4 w-4" />
                  {t("dashboard.profileBadge.help")}
                </Button>
              </Link>

              <Separator className="my-2" />

              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                {t("dashboard.profileBadge.logout")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
