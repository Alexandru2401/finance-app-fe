import SettingsRow from "@/components/dashboard/settings/SettingsRow";
import CurrencySettings from "@/components/dashboard/settings/CurrencySettings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useChangeLanguage } from "@/hooks/useChangeLanguage";
import { useTheme } from "@/hooks/useTheme";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";
import { Bell, Coins, Languages, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Language and theme are also in the profile badge, for quick access
export default function PreferencesSettings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const changeLanguage = useChangeLanguage();
  // UI only for now: nothing is saved
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("dashboard.settings.appearance.title")}</CardTitle>
          <CardDescription>
            {t("dashboard.settings.appearance.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-0">
          <SettingsRow
            icon={Languages}
            title={t("language.label")}
            description={t("dashboard.settings.appearance.languageHint")}
          >
            <div
              role="group"
              aria-label={t("language.label")}
              className="flex rounded-full bg-muted p-0.5"
            >
              {SUPPORTED_LANGUAGES.map((lng) => {
                const active = i18n.resolvedLanguage === lng;
                return (
                  <button
                    key={lng}
                    type="button"
                    aria-pressed={active}
                    onClick={() => changeLanguage(lng)}
                    className={cn(
                      "cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t(`language.${lng}`)}
                  </button>
                );
              })}
            </div>
          </SettingsRow>

          <Separator />

          <SettingsRow
            icon={dark ? Moon : Sun}
            title={t("dashboard.profileBadge.darkMode")}
            description={t("dashboard.settings.appearance.darkModeHint")}
            htmlFor="settings-dark-mode"
          >
            <Switch
              id="settings-dark-mode"
              checked={dark}
              onCheckedChange={toggleTheme}
              className="cursor-pointer"
            />
          </SettingsRow>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("dashboard.settings.general.title")}</CardTitle>
          <CardDescription>
            {t("dashboard.settings.general.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-0">
          <SettingsRow
            icon={Coins}
            title={t("dashboard.settings.currency.title")}
            description={t("dashboard.settings.currency.description")}
          >
            {user && <CurrencySettings user={user} />}
          </SettingsRow>

          <Separator />

          <SettingsRow
            icon={Bell}
            title={t("dashboard.profileBadge.notifications")}
            description={t("dashboard.settings.general.notificationsHint")}
            htmlFor="settings-notifications"
          >
            <Switch
              id="settings-notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
              className="cursor-pointer"
            />
          </SettingsRow>
        </CardContent>
      </Card>
    </div>
  );
}
